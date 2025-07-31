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
    projectDir?: string;
    commandName?: string;
    
    // Legacy parameters (deprecated)
    workingDirectory?: string;
    launchId?: number;
    
    // Filtering parameters
    limit?: number;
    sinceTimestamp?: number;
    afterLogId?: number;
}

export function getProcessLogs(options: LogSearchOptions): ProcessLog[] {
    const db = getDatabase();
    
    const { projectDir, commandName, limit, sinceTimestamp, afterLogId } = options;
    
    // Build SQL query dynamically
    let sql: string;
    let params: any[] = [];

    // Prioritize projectDir + commandName approach
    if (projectDir !== undefined && commandName !== undefined) {
        // Primary approach: lookup by project directory and command name
        sql = `select po.* from process_output po 
               where po.project_dir = ? and po.command_name = ?`;
        params = [projectDir, commandName];
    } else if (projectDir !== undefined) {
        // Fallback: lookup by project directory only (use default command)
        sql = `select po.* from process_output po 
               where po.project_dir = ? and po.command_name = 'default'`;
        params = [projectDir];
    } else if (commandName !== undefined) {
        // Lookup by command name only (any project directory)
        sql = `select po.* from process_output po 
               where po.command_name = ?`;
        params = [commandName];
    } else if (options.workingDirectory !== undefined && options.commandName !== undefined) {
        // Legacy approach: lookup by working directory and command name
        sql = `select po.* from process_output po 
               join processes p on po.command_name = p.command_name and po.project_dir = p.project_dir 
               where p.working_directory = ? and p.command_name = ?`;
        params = [options.workingDirectory, options.commandName];
    } else if (options.workingDirectory !== undefined) {
        // Legacy fallback: lookup by working directory only (use default command)
        sql = `select po.* from process_output po 
               join processes p on po.command_name = p.command_name and po.project_dir = p.project_dir 
               where p.working_directory = ? and p.command_name = 'default'`;
        params = [options.workingDirectory];
    } else if (options.launchId !== undefined) {
        // Legacy approach: direct lookup by launch_id - need to join with processes
        sql = `select po.* from process_output po 
               join processes p on po.command_name = p.command_name and po.project_dir = p.project_dir 
               where p.launch_id = ?`;
        params = [options.launchId];
    } else {
        throw new Error('Must provide either (projectDir and/or commandName) or legacy parameters');
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
    
    // Order by 'desc' so that we get the most recent logs first.
    sql += ' order by po.timestamp desc, po.line_number desc';
    
    if (limit !== undefined) {
        sql += ' limit ?';
        params.push(limit);
    }

    const found = db.list(sql, params);

    // Return list in chronological order
    return found.reverse();
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
            break;
        case LogType.process_has_started:
            consoleLogSystemMessage(format, row.content);
            break;
    }
}

