import * as Db from './database';
import { watchExistingProcess } from './watchExistingProcess';

interface WatchCommandOptions {
    projectDir: string; // Current working directory
    commandName: string; // Name of the command to watch
}

export async function handleWatch(options: WatchCommandOptions): Promise<void> {
    const { projectDir, commandName } = options;

    // Find the running process to watch using projectDir and commandName
    const runningProcesses = Db.getRunningProcessesByProjectDir(projectDir);
    const processToWatch = runningProcesses.find(process => 
        process.command_name === commandName
    );
    
    if (!processToWatch) {
        console.log(`No running process found for command '${commandName}' in project '${projectDir}'.`);
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
    
    console.log(`Watching process '${commandName}' (PID: ${processToWatch.pid})`);
    console.log('Press Ctrl+C to stop watching.');
    console.log('');
    
    // Start watching the process
    await watchExistingProcess({
        projectDir,
        commandName,
        consoleOutputFormat: 'pretty'
    });
}