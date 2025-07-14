import { getDatabase } from './database';
import { getProcessLogs } from './logs';

export async function handleClearLogsCommand(options: { commandName?: string } = {}): Promise<void> {
    const { commandName = 'default' } = options;
    const workingDirectory = process.cwd();
    const db = getDatabase();
    
    console.log(`Clearing logs for directory: ${workingDirectory}`);
    if (commandName !== 'default') {
        console.log(`Command: ${commandName}`);
    }
    
    try {
        // Get logs before clearing to count them
        const beforeLogs = getProcessLogs({ workingDirectory, commandName });
        const beforeCount = beforeLogs.length;
        
        // Clear logs for this specific directory and command
        const result = db.run(`
            DELETE FROM process_output 
            WHERE launch_id IN (
                SELECT launch_id FROM processes 
                WHERE working_directory = ? AND command_name = ?
            )
        `, [workingDirectory, commandName]);
        
        const clearedCount = result.changes || 0;
        
        if (clearedCount > 0) {
            console.log(`✓ Cleared ${clearedCount} log entries`);
        } else {
            console.log('- No logs found to clear');
        }
        
        // Clean up orphaned logs and optimize database
        db.run(`DELETE FROM process_output WHERE launch_id NOT IN (SELECT launch_id FROM processes)`);
        db.run('VACUUM');
        
        console.log('\nLogs cleared successfully!');
    } catch (error) {
        console.error('Error clearing logs:', error);
        process.exit(1);
    }
}