import * as fs from 'fs';
import * as path from 'path';
import { getDatabase, ProcessLog } from './database';
import { LogType, RunningStatus } from './database';

let isLoggingEnabled: boolean | null = null;

function checkLoggingEnabled(): boolean {
    if (isLoggingEnabled === null) {
        isLoggingEnabled = process.env.CANDLE_ENABLE_LOGS === 'true' || process.env.CANDLE_ENABLE_LOGS === '1';
    }
    return isLoggingEnabled;
}

export function infoLog(...args: any[]): void {
    if (!checkLoggingEnabled()) {
        return;
    }
    
    const argsStr = args.map(arg => {
        if (typeof arg === 'string')
            return arg;
        return JSON.stringify(arg);
    });

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${argsStr.join(' ')}\n`;
    const logPath = path.join(process.cwd(), 'candle.log');

    try {
        fs.appendFileSync(logPath, logEntry);
    } catch (error) {
        // Silently fail if we can't write to log file
        console.error('Failed to write to log file:', error);
    }
}

export interface LogSearchOptions {
    // Primary search parameters (preferred)
    workingDirectory?: string;
    commandName?: string;
    
    // Legacy/specific search parameters
    launchId?: number;
    
    // Filtering parameters
    limit?: number;
    sinceTimestamp?: number;
    afterLogId?: number;
}

export function getProcessLogs(options: LogSearchOptions): ProcessLog[] {
    const db = getDatabase();
    
    const { launchId, commandName, workingDirectory, limit, sinceTimestamp, afterLogId } = options;
    
    // Build SQL query dynamically
    let sql: string;
    let params: any[] = [];
    
    // Prioritize workingDirectory + commandName approach
    if (workingDirectory !== undefined && commandName !== undefined) {
        // Primary approach: lookup by working directory and command name
        sql = `select po.* from process_output po 
               join processes p on po.launch_id = p.launch_id 
               where p.working_directory = ? and p.command_name = ?`;
        params = [workingDirectory, commandName];
    } else if (workingDirectory !== undefined) {
        // Fallback: lookup by working directory only (use default command)
        sql = `select po.* from process_output po 
               join processes p on po.launch_id = p.launch_id 
               where p.working_directory = ? and p.command_name = 'default'`;
        params = [workingDirectory];
    } else if (commandName !== undefined) {
        // Lookup by command name only (any working directory)
        sql = `select po.* from process_output po 
               join processes p on po.launch_id = p.launch_id 
               where p.command_name = ?`;
        params = [commandName];
    } else if (launchId !== undefined) {
        // Legacy approach: direct lookup by launch_id
        sql = 'select po.* from process_output po where po.launch_id = ?';
        params = [launchId];
    } else {
        throw new Error('Must provide either (workingDirectory and/or commandName) or launchId');
    }
    
    // Add timestamp filtering
    if (sinceTimestamp !== undefined) {
        sql += ' and po.timestamp > ?';
        params.push(sinceTimestamp);
    }
    
    if (afterLogId !== undefined) {
        sql += ' and po.id > ?';
        params.push(afterLogId);
    }
    
    // Add ordering - for joined queries, order by process creation date first, then log order
    if (launchId !== undefined) {
        sql += ' order by line_number';
    } else {
        sql += ' order by p.created_at , po.line_number ';
    }
    
    if (limit !== undefined) {
        sql += ' limit ?';
        params.push(limit);
    }

    return db.list(sql, params);
}

function consoleLogStdout(format: 'pretty' | 'json', msg: string) {
    if (format === 'json') {
        console.log(JSON.stringify({ stdout: msg }));
    } else {
        console.log(msg);
    }
}

function consoleLogStderr(format: 'pretty' | 'json', msg: string) {
    if (format === 'json')
        console.log(JSON.stringify({ stderr: msg }));
    else
        console.error(msg);
}

export function consoleLogSystemMessage(format: 'pretty' | 'json', msg: string) {
    if (format === 'json')
        console.log(JSON.stringify({ message: msg }));
    else
        console.log(`[${msg}]`);
}

export function consoleLogRow(format: 'pretty' | 'json', row: any) {
    switch (row.log_type) {
        case LogType.stdout:
            consoleLogStdout(format, row.content);
            break;
        case LogType.stderr:
            consoleLogStderr(format, row.content);
            break;
        case LogType.process_has_exited:
            consoleLogSystemMessage(format, row.content);
    }
}

