import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as Db from './database';
import { ProjectRootDir } from './dirs';
import type { WrapperInput } from './runProcessInWrapper';
import { NeedRunCommandError } from './errors';
import { watchExistingProcess } from './watchExistingProcess';
import { allocatePort } from './allocatePort';
import { saveProjectCommand } from './handleSetCommand';
import { handleKill, printKillOutput } from './handleKill';
interface RunOptions {
    setCommandString?: string; // if provided, save this as the command first
    cwd?: string; // current working directory to run the command in
    commandName?: string; // name of the command (defaults to "default")
    exitAfterMs?: number; // optional timeout to exit watching after a certain period
    consoleOutputFormat: 'pretty' | 'json';
}
export function findProjectStartCommand(cwd: string, commandName: string = 'default'): string | null {
    // Look up the start command from project config
    const projectConfig = Db.getProjectConfig(cwd, commandName);
    if (!projectConfig || !projectConfig.command_str) {
        return null;
    }
    return projectConfig.command_str;
}
export function startDetachedWrappedProcess(wrapperInput: WrapperInput): ChildProcess {
    const wrapperPath = path.join(ProjectRootDir, 'dist', 'runProcessInWrapper.js');
    const wrapperProcess = spawn(process.argv[0], [wrapperPath], {
        cwd: wrapperInput.cwd,
        stdio: ['pipe', 'ignore', 'ignore'],
        detached: true // Create subprocess in detached mode
    });
    // Send JSON input to wrapper process
    wrapperProcess.stdin.write(JSON.stringify(wrapperInput));
    wrapperProcess.stdin.end();
    if (!wrapperProcess.pid) {
        throw new Error('Failed to start wrapper process');
    }
    // Unref the process so the parent can exit
    wrapperProcess.unref();
    return wrapperProcess;
}
export async function handleRun(req: RunOptions): Promise<void> {
    const cwd = req.cwd || process.cwd();
    const commandName = req.commandName || 'default';
    const exitAfterMs = req.exitAfterMs;
    const consoleOutputFormat = req.consoleOutputFormat;
    // If setCommandString is provided, save it first
    if (req.setCommandString) {
        saveProjectCommand(cwd, commandName, req.setCommandString);
    }
    // Get the command to run
    let fullCommand: string;
    if (req.setCommandString) {
        fullCommand = req.setCommandString;
    }
    else {
        const foundCommand = findProjectStartCommand(cwd, commandName);
        if (!foundCommand) {
            throw new NeedRunCommandError(cwd, commandName);
        }
        fullCommand = foundCommand;
    }
    // Check if there's already an existing process
    Db.checkForDeadProcesses();
    const existingProcess = Db.findExistingProcess(fullCommand, cwd);
    if (existingProcess) {
        const killOutput = await handleKill({ cwd, commandName });
        if (killOutput.killedProcesses) {
            printKillOutput(killOutput);
        }
    }
    // Allocate port and create database entry
    const assignedPort = await allocatePort();
    const launchId = Db.createProcessEntry(commandName, fullCommand, cwd, assignedPort);
    // Launch the process using candle-process-wrapper in detached mode
    const commandParts = fullCommand.split(' ');
    const command = commandParts[0];
    const args = commandParts.slice(1);
    const wrapperInput: WrapperInput = {
        command: command,
        args: args,
        cwd: cwd,
        launchId: launchId,
        assignedPort: assignedPort
    };
    let wrapperProcess: ChildProcess;
    try {
        wrapperProcess = startDetachedWrappedProcess(wrapperInput);
        // Store the wrapper PID in the database
        if (wrapperProcess.pid) {
            Db.updateProcessWithWrapperPid(launchId, wrapperProcess.pid);
        }
    }
    catch (error) {
        console.error('Failed to start wrapper process:', error);
        process.exit(1);
    }
    console.log(`[Started '${fullCommand}', with assigned PORT: ${assignedPort}. Press Ctrl+C to exit.]`);
    await watchExistingProcess({ launchId, exitAfterMs, consoleOutputFormat });
}
