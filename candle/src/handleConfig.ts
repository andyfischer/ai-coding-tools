import * as Db from './database';

interface ConfigCommandOptions {
    cwd?: string; // Current working directory
}

export interface ConfigOutput {
    commands: {
        name: string;
        command: string;
        lastUpdated: string;
        lastUpdatedTimestamp: number;
    }[];
    directory: string;
    assignedPort?: number;
    message?: string;
}

export async function handleConfig(options: ConfigCommandOptions = {}): Promise<ConfigOutput> {
    const cwd = options.cwd || process.cwd();
    
    // Get all saved commands for this directory
    const savedCommands = Db.getSavedCommands(cwd);
    
    // Get assigned port for this directory
    const assignedPort = Db.getProjectAssignedPort(cwd);
    
    if (savedCommands.length === 0) {
        return {
            commands: [],
            directory: cwd,
            assignedPort,
            message: 'No configured commands found for this directory.'
        };
    }
    
    const commands = savedCommands.map(command => ({
        name: command.command_name === 'default' ? 'default' : command.command_name,
        command: command.command_str,
        lastUpdated: new Date(command.updated_at * 1000).toLocaleString(),
        lastUpdatedTimestamp: command.updated_at
    }));
    
    return {
        commands,
        directory: cwd,
        assignedPort
    };
}

export function printConfigOutput(configOutput: ConfigOutput): void {
    if (configOutput.message) {
        console.log(`No configured commands found for directory: ${configOutput.directory}`);
        console.log('');
        
        // Show assigned port even if no commands are configured
        if (configOutput.assignedPort) {
            console.log(`Assigned port: ${configOutput.assignedPort}`);
            console.log('');
        }
        
        console.log('To configure a command, run:');
        console.log('  candle run <command-name> -- <your command>');
        console.log('  candle set-command -- <your command>  (for default command)');
        return;
    }
    
    console.log(`Configured commands for: ${configOutput.directory}`);
    console.log('');
    
    // Show assigned port if it exists
    if (configOutput.assignedPort) {
        console.log(`Assigned port: ${configOutput.assignedPort}`);
        console.log('');
    }
    
    // Print commands in a simple format
    for (const command of configOutput.commands) {
        console.log(`  ${command.name}: ${command.command}`);
        console.log(`    Last updated: ${command.lastUpdated}`);
        console.log('');
    }
    
    console.log('To run a configured command:');
    console.log('  candle run [command-name]');
    console.log('');
    console.log('To update a command:');
    console.log('  candle run <command-name> -- <new command>');
}