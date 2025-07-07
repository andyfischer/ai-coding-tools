import { handleKill } from './handleKill';
import { handleRun } from './handleRun';
interface RestartOptions {
    commandName?: string;
    setCommandString?: string;
    cwd?: string;
    consoleOutputFormat: 'pretty' | 'json';
}
export interface RestartOutput {
    success: boolean;
    commandName: string;
    directory: string;
    killResult: any;
    runResult?: any;
    message?: string;
}
export async function handleRestart(options: RestartOptions): Promise<RestartOutput> {
    const { commandName = 'default', setCommandString, cwd = process.cwd(), consoleOutputFormat } = options;
    try {
        // First kill the existing process
        const killResult = await handleKill({ commandName, cwd });
        // Then start it again
        await handleRun({
            commandName,
            setCommandString,
            cwd,
            consoleOutputFormat
        });
        return {
            success: true,
            commandName,
            directory: cwd,
            killResult
        };
    }
    catch (error) {
        return {
            success: false,
            commandName,
            directory: cwd,
            killResult: null,
            message: `Failed to restart: ${error.message}`
        };
    }
}
export function printRestartOutput(restartOutput: RestartOutput): void {
    if (restartOutput.success) {
        // The individual kill and run commands will handle their own output
        // No additional output needed for restart
    }
    else {
        console.error(restartOutput.message);
    }
}
