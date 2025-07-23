import { getDatabase } from './database';
import { getProcessLogs } from './logs';

interface ClearLogsCommandOptions {
    projectDir: string;
    commandName: string;
}

export async function handleClearLogsCommand(options: ClearLogsCommandOptions): Promise<void> {
    const { projectDir, commandName } = options;
    const db = getDatabase();
    
    console.log(`Clearing logs for project: ${projectDir}`);
    if (commandName !== 'default') {
        console.log(`Command: ${commandName}`);
    }
    
    try {
        // Get logs before clearing to count them
        const beforeLogs = getProcessLogs({ projectDir, commandName });
        const beforeCount = beforeLogs.length;
        
        // Clear logs for this specific project directory and command
        const result = db.run(`
            DELETE FROM process_output 
            WHERE command_name = ? AND project_dir = ?
        `, [commandName, projectDir]);
        
        const clearedCount = result.changes || 0;
        
        if (clearedCount > 0) {
            console.log(`✓ Cleared ${clearedCount} log entries`);
        } else {
            console.log('- No logs found to clear');
        }
        
        // Clean up orphaned logs and optimize database
        db.run(`DELETE FROM process_output WHERE (command_name, project_dir) NOT IN (SELECT command_name, project_dir FROM processes)`);
        db.run('VACUUM');
        
        console.log('\nLogs cleared successfully!');
    } catch (error) {
        console.error('Error clearing logs:', error);
        process.exit(1);
    }
}