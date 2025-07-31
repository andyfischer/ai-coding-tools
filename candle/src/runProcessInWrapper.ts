import 'source-map-support/register';
import { startShellCommand } from '@andyfischer/subprocess-wrapper';
import * as Db from './database';
import { LogType } from './database';
import { infoLog } from './logs';

export interface WrapperInput {
    command: string;
    args: string[];
    cwd: string;
    launchId: number;
    env?: Record<string, string>;
}

interface ProcessState {
    subprocess: any | null;
    nextLineNumber: number;
    shouldRestart: boolean;
    isShuttingDown: boolean;
    isKilling: boolean;
    activityTimeout: any;
}

interface ProcessInfo {
    commandName: string;
    projectDir: string;
    launchId: number;
}

interface ProcessContext {
    input: WrapperInput;
    processInfo: ProcessInfo;
    state: ProcessState;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Removes clear screen terminal codes while preserving other formatting codes
 */
function removeClearScreenCodes(text: string): string {
    // Remove clear screen codes:
    // - \x1b[2J (clear entire screen)
    // - \x1b[H (move cursor to home position)
    // - \x1b[3J (clear entire screen and scrollback)
    // - \x1b[J (clear from cursor to end of screen)
    // - \x1b[1J (clear from cursor to beginning of screen)
    // - \x1b[0J (clear from cursor to end of screen, same as \x1b[J)
    // - \x1bc (full reset)
    return text.replace(/\x1b\[([0-3]?J|2J|H|c)/g, '');
}

// ============================================================================
// PROCESS LIFECYCLE FUNCTIONS
// ============================================================================

async function startProcess(context: ProcessContext): Promise<any> {
    const { input, processInfo, state } = context;
    const { launchId } = processInfo;
    
    infoLog('startProcess called', { launchId, shouldRestart: state.shouldRestart, isShuttingDown: state.isShuttingDown });
    
    if (state.isShuttingDown) {
        infoLog('startProcess aborted - shutting down', { launchId });
        return;
    }
    
    // Set up environment with service-specific env vars
    const env = {
        ...process.env,
        ...(input.env || {})
    };
    
    const commandArray = [input.command, ...input.args];
    infoLog('Starting subprocess', { launchId, command: commandArray, cwd: input.cwd });
    
    state.subprocess = startShellCommand(commandArray, {
        cwd: input.cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: env
    });

    if (!state.subprocess.proc?.pid) {
        const error = 'Failed to start process';
        infoLog('startProcess failed', { launchId, error });
        throw new Error(error);
    }

    infoLog('Process started successfully', { launchId, pid: state.subprocess.proc.pid });
    
    // Update the database entry with the actual PID
    Db.updateProcessWithPid(launchId, state.subprocess.proc.pid);
    
    // Log process start event
    Db.logLine(processInfo.commandName, processInfo.projectDir, ++state.nextLineNumber, 'Process started', LogType.process_has_started);
    
    // Log restart event
    if (state.shouldRestart) {
        infoLog('Process restarted', { launchId, pid: state.subprocess.proc.pid });
        Db.logLine(processInfo.commandName, processInfo.projectDir, ++state.nextLineNumber, 'Process restarted', LogType.stdout);
        console.log('[Process restarted]');
    }

    state.subprocess.onStdout((line: string) => {
        const cleanedLine = removeClearScreenCodes(line);
        state.activityTimeout?.reset();
        if (launchId != null) 
            Db.logLine(processInfo.commandName, processInfo.projectDir, ++state.nextLineNumber, cleanedLine, LogType.stdout);
        console.log(cleanedLine);
    });

    state.subprocess.onStderr((line: string) => {
        state.activityTimeout?.reset();
        if (launchId != null) 
            Db.logLine(processInfo.commandName, processInfo.projectDir, ++state.nextLineNumber, line, LogType.stderr);
        console.error(line);
    });

    state.activityTimeout?.reset();
    return state.subprocess;
}

async function handleRestart(context: ProcessContext): Promise<void> {
    const { processInfo, state } = context;
    const { launchId } = processInfo;
    
    infoLog('handleRestart called', { launchId, isShuttingDown: state.isShuttingDown, isKilling: state.isKilling, hasSubprocess: !!state.subprocess, hasExited: state.subprocess?.hasExited });
    
    if (state.isShuttingDown) {
        infoLog('handleRestart aborted - shutting down', { launchId });
        return;
    }
    
    if (state.isKilling) {
        infoLog('handleRestart aborted - already killing process', { launchId });
        return;
    }
    
    console.log('[Restart signal received]');
    Db.logLine(processInfo.commandName, processInfo.projectDir, ++state.nextLineNumber, 'Restart signal received', LogType.stdout);
    
    // Set shouldRestart BEFORE killing the process
    state.shouldRestart = true;
    
    // Stop the current process
    if (state.subprocess && !state.subprocess.hasExited) {
        infoLog('Killing subprocess for restart', { launchId, pid: state.subprocess.proc?.pid });
        console.log('[Stopping current process for restart]');
        state.isKilling = true;
        
        try {
            state.subprocess.kill();
            infoLog('Kill signal sent, waiting for exit', { launchId, pid: state.subprocess.proc?.pid });
            await state.subprocess.waitForExit();
            infoLog('Subprocess exited after kill', { launchId, exitCode: state.subprocess.exitCode });
        } catch (error) {
            infoLog('Error killing subprocess for restart', { launchId, error: error.message });
        } finally {
            state.isKilling = false;
        }
    }
    
    if (state.isShuttingDown) {
        infoLog('Restart aborted - shutdown during kill', { launchId });
        return;
    }
    
    // Wait a brief moment before restarting
    await new Promise(resolve => setTimeout(resolve, 500));
    
    infoLog('Starting new process after restart delay', { launchId });
    console.log('[Restarting process]');
    
    // Start the new process
    try {
        await startProcess(context);
        infoLog('Restart completed successfully', { launchId });
    } catch (error) {
        infoLog('Failed to start new process during restart', { launchId, error: error.message });
        state.shouldRestart = false;
        throw error;
    }
}

function handleShutdown(context: ProcessContext, signal: NodeJS.Signals): void {
    const { processInfo, state } = context;
    const { launchId } = processInfo;
    
    infoLog('handleShutdown called', { launchId, signal, isShuttingDown: state.isShuttingDown, isKilling: state.isKilling, hasSubprocess: !!state.subprocess, hasExited: state.subprocess?.hasExited });
    
    if (state.isShuttingDown) {
        infoLog('handleShutdown ignored - already shutting down', { launchId, signal });
        return;
    }
    
    state.isShuttingDown = true;
    
    state.activityTimeout?.clear();
    
    console.log(`[Received ${signal}, shutting down]`);
    infoLog('Shutdown initiated', { launchId, signal });
    
    if (state.subprocess && !state.subprocess.hasExited) {
        infoLog('Killing subprocess during shutdown', { launchId, pid: state.subprocess.proc?.pid, signal });
        state.isKilling = true;
        
        try {
            state.subprocess.kill();
            infoLog('Kill signal sent during shutdown', { launchId, pid: state.subprocess.proc?.pid });
        } catch (error) {
            infoLog('Error killing subprocess during shutdown', { launchId, error: error.message });
        }
    } else {
        infoLog('No subprocess to kill during shutdown', { launchId, hasSubprocess: !!state.subprocess, hasExited: state.subprocess?.hasExited });
    }
}

// ============================================================================
// MAIN SUBPROCESS MANAGEMENT
// ============================================================================

async function runSubprocess(input: WrapperInput): Promise<void> {
    const launchId = input.launchId;
    
    // Get process info for logging
    const dbProcessInfo = Db.getProcessByLaunchId(launchId);
    if (!dbProcessInfo) {
        throw new Error(`Process not found for launch ID: ${launchId}`);
    }
    
    // Create process context
    const processInfo: ProcessInfo = {
        commandName: dbProcessInfo.command_name,
        projectDir: dbProcessInfo.project_dir,
        launchId
    };
    
    const state: ProcessState = {
        subprocess: null,
        nextLineNumber: 0,
        shouldRestart: false,
        isShuttingDown: false,
        isKilling: false,
        activityTimeout: null
    };
    
    const context: ProcessContext = {
        input,
        processInfo,
        state
    };
    
    infoLog('runSubprocess started', { launchId, command: input.command, cwd: input.cwd });
    
    // Set up signal handlers
    infoLog('Setting up signal handlers', { launchId });
    process.on('SIGINT', () => handleShutdown(context, 'SIGINT'));
    process.on('SIGTERM', () => handleShutdown(context, 'SIGTERM'));
    process.on('SIGUSR1', () => {
        infoLog('SIGUSR1 received - restart signal', { launchId });
        handleRestart(context).catch(error => {
            infoLog('Error in handleRestart', { launchId, error: error.message });
            console.error('Error during restart:', error);
        });
    });

    // Start the initial process
    infoLog('Starting initial process', { launchId });
    await startProcess(context);

    // Take this chance to cleanup the DB
    Db.databaseCleanup();

    // Main loop to handle restarts
    infoLog('Entering main loop', { launchId });
    while (!state.isShuttingDown) {
        infoLog('Waiting for subprocess exit', { launchId, pid: state.subprocess?.proc?.pid, hasExited: state.subprocess?.hasExited });
        await state.subprocess.waitForExit();
        
        const exitCode = state.subprocess?.exitCode ?? 1;
        infoLog('Subprocess exited', { launchId, exitCode, shouldRestart: state.shouldRestart, isShuttingDown: state.isShuttingDown, isKilling: state.isKilling });
        
        state.activityTimeout?.clear();
        state.isKilling = false; // Reset killing flag
        
        if (state.shouldRestart && !state.isShuttingDown) {
            infoLog('Restart flag set, continuing main loop', { launchId });
            state.shouldRestart = false;
            // handleRestart already started a new process, continue with the new one
            continue;
        } else {
            // Normal exit or shutdown - log that the process has exited
            infoLog('Process finished normally or shutting down', { launchId, exitCode, shouldRestart: state.shouldRestart, isShuttingDown: state.isShuttingDown });
            Db.logLine(processInfo.commandName, processInfo.projectDir, ++state.nextLineNumber, `Process exited with code ${exitCode}`, LogType.process_has_exited);
            break;
        }
    }
    
    const finalExitCode = state.subprocess?.exitCode ?? 1;
    infoLog('runSubprocess ending', { launchId, shouldRestart: state.shouldRestart, exitCode: finalExitCode });
    
    if (launchId != null && !state.shouldRestart) {
        infoLog('Setting process exited in database', { launchId, exitCode: finalExitCode });
        Db.setProcessExited(launchId, finalExitCode);
    }

    // Exit with the same code as the child process, unless we're restarting
    if (!state.shouldRestart) {
        infoLog('Exiting wrapper process', { launchId, exitCode: finalExitCode });
        process.exit(finalExitCode);
    } else {
        infoLog('Not exiting - restart in progress', { launchId });
    }
}

async function readStdinAsJson(): Promise<WrapperInput> {
    return new Promise((resolve, reject) => {
        let input = '';
        
        process.stdin.setEncoding('utf8');
        
        process.stdin.on('data', (chunk) => {
            input += chunk;
        });
        
        process.stdin.on('end', () => {
            try {
                const parsed = JSON.parse(input);
                resolve(parsed);
            } catch (error) {
                reject(new Error(`Failed to parse JSON input: ${error}`));
            }
        });
        
        process.stdin.on('error', (error) => {
            reject(new Error(`Failed to read stdin: ${error}`));
        });
    });
}

// ============================================================================
// ENTRY POINT
// ============================================================================

export async function main(): Promise<void> {
    try {
        infoLog('Wrapper main() started', { pid: process.pid });
        const input = await readStdinAsJson();
        
        if (!input.command || !Array.isArray(input.args) || !input.cwd) {
            const error = 'Invalid input: must have command, args (array), and cwd';
            infoLog('Invalid input error', { error, input });
            throw new Error(error);
        }
        
        infoLog('Starting subprocess with input', input);
        await runSubprocess(input);
        infoLog('runSubprocess completed');
        
    } catch (error) {
        infoLog('Wrapper process error', { error: error.message, stack: error.stack });
        console.error('Wrapper process error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error(error);
        process.exit(1);
    });
}
