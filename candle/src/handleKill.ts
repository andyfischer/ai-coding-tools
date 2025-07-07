import * as Db from './database';
import treeKill from 'tree-kill';
interface KillCommandOptions {
    cwd?: string; // Current working directory
    commandName?: string; // Name of the command to kill (defaults to "default")
}
export interface KillOutput {
    killedProcesses: {
        command: string;
        pid: number;
        wrapperPid?: number;
        directory: string;
    }[];
    directory: string;
    commandName: string;
    message?: string;
}
async function tryKillProcessTree(pid: number): Promise<boolean> {
    return new Promise((resolve) => {
        treeKill(pid, 'SIGTERM', (error: any) => {
            if (error && error.code === 'ESRCH') {
                // Process does not exist
                resolve(false);
            }
            else if (error) {
                console.warn(`Warning: Could not kill process tree for PID ${pid}:`, error.message);
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    });
}
export async function handleKill(options: KillCommandOptions): Promise<KillOutput> {
    const cwd = options.cwd || process.cwd();
    const commandName = options.commandName || 'default';
    const killedProcesses = [];
    for (const process of Db.getRunningProcesses()) {
        if (process.working_directory !== cwd) {
            continue;
        }
        if (process.command_name !== commandName) {
            continue;
        }
        // Kill the main process and its entire process tree
        await tryKillProcessTree(process.pid);
        // Also kill the wrapper process tree if it exists
        if (process.wrapper_pid) {
            await tryKillProcessTree(process.wrapper_pid);
        }
        killedProcesses.push({
            command: process.command_name,
            pid: process.pid,
            wrapperPid: process.wrapper_pid || undefined,
            directory: process.working_directory
        });
    }
    if (killedProcesses.length === 0) {
        return {
            killedProcesses: [],
            directory: cwd,
            commandName,
            message: `No running processes found for command '${commandName}' in directory '${cwd}'`
        };
    }
    return {
        killedProcesses,
        directory: cwd,
        commandName
    };
}
export function printKillOutput(killOutput: KillOutput): void {
    if (killOutput.message) {
        console.log(`[${killOutput.message}]`);
        return;
    }
    for (const process of killOutput.killedProcesses) {
        console.log(`[Killed '${process.command}' process with PID: ${process.pid}]`);
    }
}
