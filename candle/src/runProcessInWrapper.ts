import 'source-map-support/register';
import { startShellCommand } from '@andyfischer/subprocess-wrapper';
import * as Db from './database';
import { LogType } from './database';
import { isPortAvailable } from './allocatePort';
import { infoLog } from './logs';

export interface WrapperInput {
    command: string;
    args: string[];
    cwd: string;
    launchId: number;
    assignedPort: number;
}

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

class ActivityTimeout {
    private timeoutId: NodeJS.Timeout | null = null;
    private readonly timeoutMs: number;
    private readonly onTimeout: () => void;

    constructor(timeoutMs: number, onTimeout: () => void) {
        this.timeoutMs = timeoutMs;
        this.onTimeout = onTimeout;
    }

    reset(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(this.onTimeout, this.timeoutMs);
    }

    clear(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
}


async function runSubprocess(input: WrapperInput): Promise<void> {
    const commandArray = [input.command, ...input.args];
    const assignedPort = input.assignedPort;
    const launchId = input.launchId;
    
    let subprocess: any = null;
    let nextLineNumber = 0;
    let shouldRestart = false;
    let isShuttingDown = false;
    let isKilling = false;
    
    infoLog('runSubprocess started', { launchId, command: input.command, cwd: input.cwd, port: assignedPort });
    
    // Activity timeout: 30 minutes (1800000 ms)
    /*
     * Disable activity timeout for now
    const ACTIVITY_TIMEOUT = 30 * 60 * 1000;
    
    const activityTimeout = new ActivityTimeout(ACTIVITY_TIMEOUT, () => {
        if (subprocess && !subprocess.hasExited && !isShuttingDown) {
            console.log(`[Server shutting down due to inactivity after 30 minutes]`);
            if (launchId != null) {
                Db.logLine(launchId, ++nextLineNumber, 'Server shutdown due to inactivity timeout', LogType.stdout);
                Db.setProcessExited(launchId, 0);
            }
            isShuttingDown = true;
            subprocess.kill();
        }
    });
    */
    const activityTimeout: any = null;

    const startProcess = async () => {
        infoLog('startProcess called', { launchId, shouldRestart, isShuttingDown });
        
        if (isShuttingDown) {
            infoLog('startProcess aborted - shutting down', { launchId });
            return;
        }
        
        // Set up environment with assigned port
        const env = {
            ...process.env,
            PORT: assignedPort.toString()
        };
        
        infoLog('Starting subprocess', { launchId, command: commandArray, cwd: input.cwd, port: assignedPort });
        
        subprocess = startShellCommand(commandArray, {
            cwd: input.cwd,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: env
        });

        if (!subprocess.proc?.pid) {
            const error = 'Failed to start process';
            infoLog('startProcess failed', { launchId, error });
            throw new Error(error);
        }

        infoLog('Process started successfully', { launchId, pid: subprocess.proc.pid });
        
        // Update the database entry with the actual PID
        Db.updateProcessWithPid(launchId, subprocess.proc.pid);
        
        // Log restart event
        if (shouldRestart) {
            infoLog('Process restarted', { launchId, pid: subprocess.proc.pid });
            Db.logLine(launchId, ++nextLineNumber, 'Process restarted', LogType.stdout);
            console.log('[Process restarted]');
        }

        subprocess.onStdout((line: string) => {
            const cleanedLine = removeClearScreenCodes(line);
            activityTimeout?.reset();
            if (launchId != null) 
                Db.logLine(launchId, ++nextLineNumber, cleanedLine, LogType.stdout);
            console.log(cleanedLine);
        });

        subprocess.onStderr((line: string) => {
            activityTimeout?.reset();
            if (launchId != null) 
                Db.logLine(launchId, ++nextLineNumber, line, LogType.stderr);
            console.error(line);
        });

        activityTimeout?.reset();
        return subprocess;
    };

    const handleRestart = async () => {
        infoLog('handleRestart called', { launchId, isShuttingDown, isKilling, hasSubprocess: !!subprocess, hasExited: subprocess?.hasExited });
        
        if (isShuttingDown) {
            infoLog('handleRestart aborted - shutting down', { launchId });
            return;
        }
        
        if (isKilling) {
            infoLog('handleRestart aborted - already killing process', { launchId });
            return;
        }
        
        console.log('[Restart signal received]');
        Db.logLine(launchId, ++nextLineNumber, 'Restart signal received', LogType.stdout);
        
        // Set shouldRestart BEFORE killing the process
        shouldRestart = true;
        
        // Stop the current process
        if (subprocess && !subprocess.hasExited) {
            infoLog('Killing subprocess for restart', { launchId, pid: subprocess.proc?.pid });
            console.log('[Stopping current process for restart]');
            isKilling = true;
            
            try {
                subprocess.kill();
                infoLog('Kill signal sent, waiting for exit', { launchId, pid: subprocess.proc?.pid });
                await subprocess.waitForExit();
                infoLog('Subprocess exited after kill', { launchId, exitCode: subprocess.exitCode });
            } catch (error) {
                infoLog('Error killing subprocess for restart', { launchId, error: error.message });
            } finally {
                isKilling = false;
            }
        }
        
        if (isShuttingDown) {
            infoLog('Restart aborted - shutdown during kill', { launchId });
            return;
        }
        
        // Wait for port to become available
        infoLog('Waiting for port to become available', { launchId, port: assignedPort });
        console.log(`[Waiting for port ${assignedPort} to become available]`);
        const portWaitStart = Date.now();
        const PORT_WAIT_TIMEOUT = 5000; // 5 seconds
        
        while (!(await isPortAvailable(assignedPort))) {
            if (Date.now() - portWaitStart > PORT_WAIT_TIMEOUT) {
                const errorMsg = `Port ${assignedPort} failed to become available after 5 seconds during restart`;
                infoLog('Port wait timeout during restart', { launchId, port: assignedPort, timeoutMs: PORT_WAIT_TIMEOUT });
                console.error(`[ERROR] ${errorMsg}`);
                Db.logLine(launchId, ++nextLineNumber, errorMsg, LogType.stderr);
                shouldRestart = false;
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        infoLog('Port available, starting new process', { launchId, port: assignedPort });
        console.log(`[Port ${assignedPort} is now available, restarting process]`);
        
        // Start the new process
        try {
            await startProcess();
            infoLog('Restart completed successfully', { launchId });
        } catch (error) {
            infoLog('Failed to start new process during restart', { launchId, error: error.message });
            shouldRestart = false;
            throw error;
        }
    };

    // Handle shutdown signals
    const handleShutdown = (signal: NodeJS.Signals) => {
        infoLog('handleShutdown called', { launchId, signal, isShuttingDown, isKilling, hasSubprocess: !!subprocess, hasExited: subprocess?.hasExited });
        
        if (isShuttingDown) {
            infoLog('handleShutdown ignored - already shutting down', { launchId, signal });
            return;
        }
        
        isShuttingDown = true;
        
        activityTimeout?.clear();
        
        console.log(`[Received ${signal}, shutting down]`);
        infoLog('Shutdown initiated', { launchId, signal });
        
        if (subprocess && !subprocess.hasExited) {
            infoLog('Killing subprocess during shutdown', { launchId, pid: subprocess.proc?.pid, signal });
            isKilling = true;
            
            try {
                subprocess.kill();
                infoLog('Kill signal sent during shutdown', { launchId, pid: subprocess.proc?.pid });
            } catch (error) {
                infoLog('Error killing subprocess during shutdown', { launchId, error: error.message });
            }
        } else {
            infoLog('No subprocess to kill during shutdown', { launchId, hasSubprocess: !!subprocess, hasExited: subprocess?.hasExited });
        }
    };
    
    // Set up signal handlers
    infoLog('Setting up signal handlers', { launchId });
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGUSR1', () => {
        infoLog('SIGUSR1 received - restart signal', { launchId });
        handleRestart().catch(error => {
            infoLog('Error in handleRestart', { launchId, error: error.message });
            console.error('Error during restart:', error);
        });
    });

    // Start the initial process
    infoLog('Starting initial process', { launchId });
    await startProcess();

    // Take this chance to cleanup the DB
    Db.databaseCleanup();

    // Main loop to handle restarts
    infoLog('Entering main loop', { launchId });
    while (!isShuttingDown) {
        infoLog('Waiting for subprocess exit', { launchId, pid: subprocess?.proc?.pid, hasExited: subprocess?.hasExited });
        await subprocess.waitForExit();
        
        const exitCode = subprocess?.exitCode ?? 1;
        infoLog('Subprocess exited', { launchId, exitCode, shouldRestart, isShuttingDown, isKilling });
        
        activityTimeout?.clear();
        isKilling = false; // Reset killing flag
        
        if (shouldRestart && !isShuttingDown) {
            infoLog('Restart flag set, continuing main loop', { launchId });
            shouldRestart = false;
            // handleRestart already started a new process, continue with the new one
            continue;
        } else {
            // Normal exit or shutdown - log that the process has exited
            infoLog('Process finished normally or shutting down', { launchId, exitCode, shouldRestart, isShuttingDown });
            Db.logLine(launchId, ++nextLineNumber, `Process exited with code ${exitCode}`, LogType.process_has_exited);
            break;
        }
    }
    
    const finalExitCode = subprocess?.exitCode ?? 1;
    infoLog('runSubprocess ending', { launchId, shouldRestart, exitCode: finalExitCode });
    
    if (launchId != null && !shouldRestart) {
        infoLog('Setting process exited in database', { launchId, exitCode: finalExitCode });
        Db.setProcessExited(launchId, finalExitCode);
    }

    // Exit with the same code as the child process, unless we're restarting
    if (!shouldRestart) {
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
