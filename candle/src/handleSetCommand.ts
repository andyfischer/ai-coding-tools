import { getDatabase, getProjectConfig } from './database';
interface SetRunCommandOptions {
    commandString: string | undefined;
    cwd?: string;
    commandName?: string; // Name of the command (defaults to "default")
}
export function saveProjectCommand(projectDir: string, commandName: string, commandStr: string): void {
    const db = getDatabase();
    db.upsert('project_start_commands', { project_dir: projectDir, command_name: commandName }, { command_str: commandStr, updated_at: Math.floor(Date.now() / 1000) });
}
export async function handleSetCommand(options: SetRunCommandOptions): Promise<void> {
    const { commandString, cwd = process.cwd(), commandName = 'default' } = options;
    if (!commandString) {
        console.error('Error: No command specified.');
        console.error('Usage: candle set-run-command -- <your command>');
        process.exit(1);
    }
    saveProjectCommand(cwd, commandName, commandString);
    console.log(`Saved command '${commandName}' for ${cwd}:`);
    console.log(`  ${commandString}`);
}
