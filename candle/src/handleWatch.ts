import * as Db from './database';
import { watchExistingProcess } from './watchExistingProcess';

interface WatchCommandOptions {
    cwd?: string; // Current working directory
    commandName?: string; // Name of the command to watch (defaults to "default")
}

export async function handleWatch(options: WatchCommandOptions = {}): Promise<void> {
    const cwd = options.cwd || process.cwd();
    const commandName = options.commandName || 'default';
    
    // Find the running process to watch
    const runningProcesses = Db.getRunningProcesses();
    const processToWatch = runningProcesses.find(process => 
        process.working_directory === cwd && process.command_name === commandName
    );
    
    if (!processToWatch) {
        console.log(`No running process found for command '${commandName}' in directory '${cwd}'.`);
        console.log('');
        console.log('Available running processes:');
        
        if (runningProcesses.length === 0) {
            console.log('  (none)');
        } else {
            for (const process of runningProcesses) {
                console.log(`  ${process.command_name} (${process.working_directory})`);
            }
        }
        
        console.log('');
        console.log('To start a process:');
        if (commandName === 'default') {
            console.log('  candle run -- <your command>');
        } else {
            console.log(`  candle run ${commandName} -- <your command>`);
        }
        return;
    }
    
    console.log(`Watching process '${commandName}' (PID: ${processToWatch.pid}, Launch ID: ${processToWatch.launch_id})`);
    console.log('Press Ctrl+C to stop watching.');
    console.log('');
    
    // Start watching the process
    await watchExistingProcess({
        launchId: processToWatch.launch_id,
        consoleOutputFormat: 'pretty'
    });
}