import { deleteProjectCommand, getProjectConfig } from './database';

interface DeleteCommandOptions {
    cwd?: string;
    commandName?: string; // Name of the command (defaults to "default")
}

export interface DeleteCommandOutput {
    success: boolean;
    commandName: string;
    directory: string;
    deletedCommand?: string;
    message?: string;
}

export async function handleDeleteCommand(options: DeleteCommandOptions): Promise<DeleteCommandOutput> {
    const { cwd = process.cwd(), commandName = 'default' } = options;
    
    // Check if the command exists first
    const existingCommand = getProjectConfig(cwd, commandName);
    
    if (!existingCommand) {
        return {
            success: false,
            commandName,
            directory: cwd,
            message: `No saved command found with name '${commandName}' in directory '${cwd}'`
        };
    }
    
    // Delete the command
    const deleted = deleteProjectCommand(cwd, commandName);
    
    if (deleted) {
        return {
            success: true,
            commandName,
            directory: cwd,
            deletedCommand: existingCommand.command_str
        };
    } else {
        return {
            success: false,
            commandName,
            directory: cwd,
            message: `Failed to delete command '${commandName}'`
        };
    }
}

export function printDeleteCommandOutput(deleteOutput: DeleteCommandOutput): void {
    if (deleteOutput.success) {
        console.log(`Deleted command '${deleteOutput.commandName}' from ${deleteOutput.directory}:`);
        console.log(`  ${deleteOutput.deletedCommand}`);
    } else {
        console.log(deleteOutput.message);
    }
}