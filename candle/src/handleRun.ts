import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as Db from './database';
import { ProjectRootDir } from './dirs';
import type { WrapperInput } from './runProcessInWrapper';
import { NeedRunCommandError } from './errors';
import { watchExistingProcess } from './watchExistingProcess';
import { handleKill } from './handleKill';
import { findSetupFile, findServiceByName, getServiceCwd, findProjectDir } from './setupFile';

interface RunOptions {
    projectDir: string
    commandName: string 
    consoleOutputFormat: 'pretty' | 'json'
    watchLogs: boolean
}

interface StartOptions {
    cwd?: string // current working directory to look for .candle-setup.json
    commandNames?: string[] // names of the services to start
    consoleOutputFormat: 'pretty' | 'json'
}

export interface RunOutput {
    service: {
        name: string;
        command: string;
        directory: string;
        pid?: number;
        wrapperPid?: number;
    };
    message: string;
    killedProcesses?: {
        command: string;
        pid: number;
        wrapperPid?: number;
        directory: string;
    }[];
}

export interface StartOutput {
    services: Array<{
        name: string;
        command: string;
        directory: string;
        pid?: number;
        wrapperPid?: number;
        success: boolean;
        error?: string;
    }>;
    summary: {
        totalServices: number;
        successCount: number;
        failureCount: number;
    };
}

export function findProjectStartCommand(commandName?: string): { command: string; serviceCwd: string; env: Record<string, string>; setupJsonDir: string } | null {
    const setupResult = findSetupFile();
    if (!setupResult) {
        return null;
    }
    
    const service = findServiceByName(setupResult.config, commandName);
    if (!service) {
        return null;
    }
    
    const serviceCwd = getServiceCwd(service, setupResult.configPath);
    const env = service.env || {};
    const setupJsonDir = path.dirname(setupResult.configPath);
    
    return {
        command: service.shell,
        serviceCwd,
        env,
        setupJsonDir
    };
}

export function startDetachedWrappedProcess(wrapperInput: WrapperInput): ChildProcess {
    const wrapperPath = path.join(ProjectRootDir, 'dist', 'runProcessInWrapper.js');
    
    const wrapperProcess = spawn(process.argv[0], [wrapperPath], {
        cwd: wrapperInput.cwd,
        stdio: ['pipe', 'ignore', 'ignore'],
        detached: true   // Create subprocess in detached mode
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

export async function handleRun(req: RunOptions): Promise<RunOutput> {
    const { projectDir, commandName, consoleOutputFormat } = req;
    
    // Get the command to run from setup config
    const serviceInfo = findProjectStartCommand(commandName);
    if (!serviceInfo) {
        throw new NeedRunCommandError(projectDir, commandName || 'default');
    }
    
    const { command: fullCommand, serviceCwd, env, setupJsonDir } = serviceInfo;

    // Check if there's already an existing process for this service
    Db.checkForDeadProcesses();
    const existingProcess = Db.findExistingProcess(fullCommand, serviceCwd);
    
    let killedProcesses;
    if (existingProcess) {
        const killOutput = await handleKill({ projectDir, commandName });
        killedProcesses = killOutput.killedProcesses;
    }

    // Create database entry
    const launchId = Db.createProcessEntry(commandName, fullCommand, serviceCwd, setupJsonDir);
    
    // Launch the process using candle-process-wrapper in detached mode
    const commandParts = fullCommand.split(' ');
    const command = commandParts[0];
    const args = commandParts.slice(1);
    
    // Set up environment with any service-specific env vars
    const processEnv = {
        ...process.env,
        ...env
    };
    
    const wrapperInput: WrapperInput = {
        command: command,
        args: args,
        cwd: serviceCwd,
        launchId: launchId,
        env: processEnv
    };
    
    let wrapperProcess: ChildProcess;
    try {
        wrapperProcess = startDetachedWrappedProcess(wrapperInput);
        
        // Store the wrapper PID in the database
        if (wrapperProcess.pid) {
            Db.updateProcessWithWrapperPid(launchId, wrapperProcess.pid);
        }
    } catch (error) {
        throw new Error(`Failed to start wrapper process: ${error instanceof Error ? error.message : String(error)}`);
    }

    const result: RunOutput = {
        service: {
            name: commandName,
            command: fullCommand,
            directory: serviceCwd,
            pid: undefined, // Will be set by wrapper
            wrapperPid: wrapperProcess.pid
        },
        message: req.watchLogs 
            ? `Started '${fullCommand}' in ${serviceCwd}. Press Ctrl+C to exit.`
            : `Started '${fullCommand}' in ${serviceCwd}.`,
        killedProcesses
    };

    if (req.watchLogs) {
        await watchExistingProcess({ projectDir: setupJsonDir, commandName, consoleOutputFormat });
    }

    return result;
}

async function startSingleService(cwd: string, commandName: string): Promise<{ name: string; command: string; directory: string; pid?: number; wrapperPid?: number; success: boolean; error?: string; }> {
    try {
        // Get the command to run from setup config
        const serviceInfo = findProjectStartCommand(commandName);
        if (!serviceInfo) {
            const projectDir = findProjectDir(cwd);
            throw new NeedRunCommandError(projectDir, commandName);
        }
        
        const { command: fullCommand, serviceCwd, env, setupJsonDir } = serviceInfo;

        // Check if there's already an existing process for this service
        Db.checkForDeadProcesses();
        const existingProcess = Db.findExistingProcess(fullCommand, serviceCwd);
        
        if (existingProcess) {
            const projectDir = findProjectDir(cwd);
            const killOutput = await handleKill({ projectDir, commandName });
        }

        // Create database entry
        const launchId = Db.createProcessEntry(commandName, fullCommand, serviceCwd, setupJsonDir);
        
        // Launch the process using candle-process-wrapper in detached mode
        const commandParts = fullCommand.split(' ');
        const command = commandParts[0];
        const args = commandParts.slice(1);
        
        // Set up environment with any service-specific env vars
        const processEnv = {
            ...process.env,
            ...env
        };
        
        const wrapperInput: WrapperInput = {
            command: command,
            args: args,
            cwd: serviceCwd,
            launchId: launchId,
            env: processEnv
        };
        
        const wrapperProcess = startDetachedWrappedProcess(wrapperInput);
        
        // Store the wrapper PID in the database
        if (wrapperProcess.pid) {
            Db.updateProcessWithWrapperPid(launchId, wrapperProcess.pid);
        }

        return {
            name: commandName,
            command: fullCommand,
            directory: serviceCwd,
            pid: undefined, // Will be set by wrapper
            wrapperPid: wrapperProcess.pid,
            success: true
        };
    } catch (error) {
        return {
            name: commandName,
            command: '',
            directory: cwd,
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

export async function handleStart(req: StartOptions): Promise<StartOutput> {
    const cwd = req.cwd || process.cwd();
    const commandNames = req.commandNames || [];
    
    // If no service names provided, start the default service
    if (commandNames.length === 0) {
        const result = await startSingleService(cwd, '');
        return {
            services: [result],
            summary: {
                totalServices: 1,
                successCount: result.success ? 1 : 0,
                failureCount: result.success ? 0 : 1
            }
        };
    }
    
    // Start each service
    const services = [];
    
    for (const commandName of commandNames) {
        const result = await startSingleService(cwd, commandName);
        services.push(result);
    }
    
    const successCount = services.filter(s => s.success).length;
    const failureCount = services.filter(s => !s.success).length;
    
    return {
        services,
        summary: {
            totalServices: services.length,
            successCount,
            failureCount
        }
    };
}

