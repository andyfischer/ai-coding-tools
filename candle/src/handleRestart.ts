import { handleKill } from './handleKill';
import { handleRun } from './handleRun';
import * as Db from './database';
import { NeedRunCommandError } from './errors';
import type { WrapperInput } from './runProcessInWrapper';

interface RestartOptions {
    projectDir: string;
    commandName: string;
    consoleOutputFormat: 'pretty' | 'json';
    watchLogs: boolean;
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
    const { projectDir, commandName, consoleOutputFormat, watchLogs } = options;

    try {
        // First kill the existing process
        const killResult = await handleKill({ projectDir, commandName });
        
        // Then start it again
        const runOutput = await handleRun({ 
            projectDir,
            commandName, 
            consoleOutputFormat,
            watchLogs,
        });
        
        return {
            success: true,
            commandName: commandName,
            directory: projectDir,
            killResult,
            runResult: runOutput
        };
    } catch (error) {
        return {
            success: false,
            commandName: commandName,
            directory: projectDir,
            killResult: null,
            message: `Failed to restart: ${error.message}`
        };
    }
}

