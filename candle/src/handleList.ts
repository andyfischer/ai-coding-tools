import * as Db from './database';

export interface ListOutput {
    processes: {
        command: string;
        workingDir: string;
        uptime: string;
        pid: number;
        port: string;
        status: string;
    }[];
    showAll?: boolean;
    message?: string;
}

export async function handleList(options?: { showAll?: boolean }): Promise<ListOutput> {
    const runningServers = Db.getRunningProcesses();
    
    // Filter by current directory unless showAll is true
    const filteredServers = options?.showAll 
        ? runningServers
        : runningServers.filter(server => server.working_directory === process.cwd());
    
    if (filteredServers.length === 0) {
        const message = options?.showAll 
            ? 'No active processes found.'
            : 'No active processes found in current directory.';
        return { processes: [], message };
    }

    // Prepare data for JSON output
    const processes = filteredServers.map(server => {
        const uptime = Math.floor((Date.now() - server.start_time * 1000) / 1000);
        const uptimeString = formatUptime(uptime);
        
        // Since getRunningProcesses() already filters out dead processes, we know these are running
        const status = 'RUNNING';
        
        // Don't truncate command - show full command
        const command = server.command_name;
        // Still truncate directory if too long for display
        const workingDir = server.working_directory.length > 40 
            ? '...' + server.working_directory.substring(server.working_directory.length - 37) 
            : server.working_directory;
        
        return {
            command,
            workingDir,
            uptime: uptimeString,
            pid: server.pid,
            port: server.assigned_port ? server.assigned_port.toString() : '-',
            status
        };
    });

    return { processes, showAll: options?.showAll };
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
}

export function printListOutput(listOutput: ListOutput): void {
    if (listOutput.message) {
        console.log(listOutput.message);
        return;
    }

    if (listOutput.processes.length === 0) {
        console.log('No active processes found.');
        return;
    }

    // Determine which columns to show based on showAll mode
    const showDirectory = listOutput.showAll;
    
    // Convert processes back to rows for table printing
    const rows = listOutput.processes.map(process => {
        const row = [
            process.command,
            process.uptime,
            process.pid.toString(),
            process.port,
            process.status
        ];
        
        // Insert directory column if in showAll mode
        if (showDirectory) {
            row.splice(1, 0, process.workingDir);
        }
        
        return row;
    });

    const headers = showDirectory 
        ? ['COMMAND', 'DIRECTORY', 'UPTIME', 'PID', 'PORT', 'STATUS']
        : ['COMMAND', 'UPTIME', 'PID', 'PORT', 'STATUS'];
    
    printTable(headers, rows);
}

function printTable(headers: string[], rows: string[][]): void {
    // Calculate column widths with max limits for some columns
    const columnWidths = headers.map((header, index) => {
        const maxDataWidth = Math.max(...rows.map(row => row[index]?.length || 0));
        let width = Math.max(header.length, maxDataWidth);
        
        // Set reasonable max widths for specific columns to save space
        if (header === 'COMMAND') width = Math.min(width, 20);
        if (header === 'DIRECTORY') width = Math.min(width, 60);
        if (header === 'UPTIME') width = Math.min(width, 12);
        if (header === 'PID') width = Math.min(width, 8);
        if (header === 'PORT') width = Math.min(width, 6);
        if (header === 'STATUS') width = Math.min(width, 8);
        
        return width;
    });

    // Print header
    const headerRow = headers.map((header, index) => 
        header.padEnd(columnWidths[index])
    ).join('  ');
    console.log(headerRow);
    
    // Print separator
    const separator = columnWidths.map(width => '-'.repeat(width)).join('  ');
    console.log(separator);
    
    // Print data rows
    rows.forEach(row => {
        const formattedRow = row.map((cell, index) => 
            (cell || '').padEnd(columnWidths[index])
        ).join('  ');
        console.log(formattedRow);
    });
}
