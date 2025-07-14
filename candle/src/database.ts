import { DatabaseLoader, SqliteDatabase } from '@andyfischer/sqlite-wrapper';
import * as Path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export enum LogType {
    stdout = 1,
    stderr = 2,
    process_has_exited = 3,
};

export enum RunningStatus {
    running = 1,
    stopped = 0,
};

const MAX_LOGS_PER_PROCESS = 10000;


const schema = {
    name: 'CandleDatabase',
    statements: [
        `create table processes(
            launch_id integer primary key autoincrement,
            pid integer not null,
            wrapper_pid integer,
            command_name text not null,
            command_str text not null,
            working_directory text not null,
            assigned_port integer,
            start_time integer not null,
            end_time integer,
            is_running integer not null default 1,
            exit_code integer,
            created_at integer not null default (strftime('%s', 'now'))
        )`,
        `create table process_output(
            id integer primary key,
            launch_id integer not null,
            line_number integer not null,
            content text not null,
            log_type integer not null,
            timestamp integer not null default (strftime('%s', 'now'))
        )`,
        `create table project_start_commands(
            project_dir text not null,
            command_name text not null,
            command_str text not null,
            created_at integer not null default (strftime('%s', 'now')),
            updated_at integer not null default (strftime('%s', 'now'))
        )`,
        `create table project_assigned_ports(
            project_dir text not null,
            assigned_port integer not null,
            created_at integer not null default (strftime('%s', 'now')),
            updated_at integer not null default (strftime('%s', 'now')),
            primary key(project_dir, assigned_port)
        )`,
        `create index idx_process_output_launch_id on process_output(launch_id)`,
        `create index idx_processes_is_running on processes(is_running)`,
        `create index idx_processes_pid on processes(pid)`
    ]
};

let _db: SqliteDatabase;

function getStateDirectory(): string {
    // Check for environment variable first
    if (process.env.CANDLE_DATABASE_DIR) {
        return process.env.CANDLE_DATABASE_DIR;
    }
    
    // Default to ~/.candle/
    return Path.join(os.homedir(), '.candle');
}

export function getDatabase({overrideDirectory}: {overrideDirectory?: string} = {}): SqliteDatabase {
    if (!_db) {
        const stateDir = overrideDirectory ?? getStateDirectory();
        
        // Ensure the directory exists
        if (!fs.existsSync(stateDir)) {
            fs.mkdirSync(stateDir, { recursive: true });
        }
        
        const dbPath = Path.join(stateDir, 'candle.db');
        const loader = new DatabaseLoader({
            filename: dbPath,
            schema
        });
        _db = loader.load();
        
        // Set WAL mode and busy timeout for multi-process support
        _db.run('PRAGMA journal_mode=WAL');
        _db.run('PRAGMA busy_timeout=30000');
    }
    return _db;
}

export interface ProcessRow {
    launch_id: number;
    command_name: string;
    command_str: string;
    working_directory: string;
    assigned_port?: number;
    pid: number;
    wrapper_pid?: number;
    start_time: number;
    end_time?: number;
    is_running: RunningStatus;
    exit_code?: number;
    created_at: number;
}

export interface ProcessLog {
    id: number;
    launch_id: number;
    line_number: number;
    content: string;
    log_type: LogType;
    timestamp: number;
}

export function saveNewProcess(command: string, cwd: string, pid: number, port?: number): number {
    const db = getDatabase();

    const result = db.run(
        'insert into processes(command, working_directory, pid, start_time, assigned_port) values(?, ?, ?, ?, ?)',
        [command, cwd, pid, Math.floor(Date.now() / 1000), port || null]
    );
    return result.lastInsertRowid as number;
}

export function createProcessEntry(commandName: string, commandStr: string, cwd: string, assignedPort: number): number {
    const db = getDatabase();

    const result = db.run(
        'insert into processes(command_name, command_str, working_directory, assigned_port, start_time, pid) values(?, ?, ?, ?, ?, ?)',
        [commandName, commandStr, cwd, assignedPort, Math.floor(Date.now() / 1000), 0]
    );
    return result.lastInsertRowid as number;
}

export function updateProcessWithPid(launchId: number, pid: number): void {
    const db = getDatabase();
    db.run(
        'update processes set pid = ? where launch_id = ?',
        [pid, launchId]
    );
}

export function updateProcessWithWrapperPid(launchId: number, wrapperPid: number): void {
    const db = getDatabase();
    db.run(
        'update processes set wrapper_pid = ? where launch_id = ?',
        [wrapperPid, launchId]
    );
}

export function updateProcessWithPids(launchId: number, pid: number, wrapperPid: number): void {
    const db = getDatabase();
    db.run(
        'update processes set pid = ?, wrapper_pid = ? where launch_id = ?',
        [pid, wrapperPid, launchId]
    );
}

export function setProcessExited(launchId: number, exitCode: number): void {
    const db = getDatabase();
    db.run(
        'update processes set end_time = ?, is_running = ?, exit_code = ? where launch_id = ?',
        [Math.floor(Date.now() / 1000), RunningStatus.stopped, exitCode, launchId]
    );
}


export function logLine(launchId: number, lineNumber: number, content: string, logType: LogType): void {
    const db = getDatabase();
    db.run(
        'insert into process_output(launch_id, line_number, content, log_type) values(?, ?, ?, ?)',
        [launchId, lineNumber, content, logType]
    );
}

export function checkForDeadProcesses(): void {
    const db = getDatabase();
    const runningProcesses = db.list('select launch_id, pid from processes where is_running = ?', [RunningStatus.running]);
    
    // Check each running process and mark dead ones as failed
    for (const process of runningProcesses) {
        if (!isProcessRunning(process.pid)) {
            setProcessExited(process.launch_id, -1); // -1 indicates abnormal termination
        }
    }
}

export function getRunningProcesses(): ProcessRow[] {
    // First, clean up any dead processes in the database
    checkForDeadProcesses();
    
    // Periodically clean up old logs and processes
    databaseCleanup();
    
    const db = getDatabase();
    return db.list('select * from processes where is_running = ?', [RunningStatus.running]);
}

export function getAllProcesses(): ProcessRow[] {
    const db = getDatabase();
    return db.list('select * from processes order by created_at desc');
}

export function getFailedProcesses(limit?: number): ProcessRow[] {
    const db = getDatabase();
    const sql = limit 
        ? 'select * from processes where is_running = ? and exit_code != 0 order by created_at desc limit ?'
        : 'select * from processes where is_running = ? and exit_code != 0 order by created_at desc';
    const params = limit ? [RunningStatus.stopped, limit] : [RunningStatus.stopped];
    return db.list(sql, params);
}

export function getRecentFailedProcesses(workingDirectory?: string, limit: number = 10): ProcessRow[] {
    const db = getDatabase();
    let sql = 'select * from processes where is_running = ? and exit_code != 0';
    let params: any[] = [RunningStatus.stopped];
    
    if (workingDirectory) {
        sql += ' and working_directory = ?';
        params.push(workingDirectory);
    }
    
    sql += ' order by created_at desc limit ?';
    params.push(limit);
    
    return db.list(sql, params);
}

export function getProcessByLaunchId(launchId: number): ProcessRow | undefined {
    const db = getDatabase();
    return db.get('select * from processes where launch_id = ?', [launchId]);
}

export function getProcessByWorkingDirectory(workingDirectory: string): ProcessRow | undefined {
    const db = getDatabase();
    return db.get('select * from processes where working_directory = ? and is_running = ? order by created_at desc limit 1', [workingDirectory, RunningStatus.running]);
}

export function databaseCleanup(): void {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    
    // Keep failed processes for 24 hours so users can view failure logs
    const failedProcessCutoff = now - (24 * 60 * 60); // 24 hours
    
    // Keep completed processes for 4 hours
    const completedProcessCutoff = now - (4 * 60 * 60); // 4 hours
    
    // Keep process output logs for 24 hours (for both failed and completed processes)
    const logCutoff = now - (24 * 60 * 60); // 24 hours
    
    // Enforce max logs per process by keeping only the most recent logs
    db.run(`delete from process_output where id not in (
        select id from process_output po1 
        where (
            select count(*) from process_output po2 
            where po2.launch_id = po1.launch_id and po2.id >= po1.id
        ) <= ?
    )`, [MAX_LOGS_PER_PROCESS]);
    
    // Delete old process output logs
    db.run('delete from process_output where timestamp < ?', [logCutoff]);
    
    // Delete old failed processes (after 24 hours)
    db.run('delete from processes where is_running = ? and exit_code != 0 and created_at < ?', [RunningStatus.stopped, failedProcessCutoff]);
    
    // Delete old completed processes (after 4 hours)  
    db.run('delete from processes where is_running = ? and exit_code = 0 and created_at < ?', [RunningStatus.stopped, completedProcessCutoff]);
    
    // Note: Running processes are never deleted by cleanup
    
    // Clean up orphaned logs (logs without corresponding processes)
    db.run(`delete from process_output 
            where launch_id not in (select launch_id from processes)`);
    
    db.run('vacuum');
}

export function findExistingProcess(commandStr: string, cwd: string): ProcessRow | undefined {
    const db = getDatabase();
    return db.get(
        'select * from processes where command_str = ? and working_directory = ? and is_running = ?',
        [commandStr, cwd, RunningStatus.running]
    );
}

export function findProcessLaunchIdByWorkingDirectory(workingDirectory: string): number | undefined {
    const db = getDatabase();
    const process = db.get('select launch_id from processes where working_directory = ? and is_running = ? order by created_at desc limit 1', [workingDirectory, RunningStatus.running]);
    return process?.launch_id;
}

export function isProcessRunning(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        return false;
    }
}

export function getProcessPort(launchId: number): number | undefined {
    const db = getDatabase();
    const result = db.get('select port from processes where launch_id = ?', [launchId]);
    return result?.port;
}

export interface ProjectConfig {
    project_dir: string;
    command_name: string;
    command_str: string;
    created_at: number;
    updated_at: number;
}

export interface ProjectAssignedPort {
    project_dir: string;
    assigned_port: number;
    created_at: number;
    updated_at: number;
}

export function getProjectConfig(projectDir: string, commandName: string = 'default'): ProjectConfig | undefined {
    const db = getDatabase();
    return db.get('select * from project_start_commands where project_dir = ? and command_name = ?', [projectDir, commandName]);
}

export function getSavedCommands(projectDir: string): ProjectConfig[] {
    const db = getDatabase();
    return db.list('select * from project_start_commands where project_dir = ? order by command_name', [projectDir]);
}

export function deleteProjectCommand(projectDir: string, commandName: string = 'default'): boolean {
    const db = getDatabase();
    const result = db.run('delete from project_start_commands where project_dir = ? and command_name = ?', [projectDir, commandName]);
    return result.changes > 0;
}

export function getProjectAssignedPort(projectDir: string): number | undefined {
    const db = getDatabase();
    const result = db.get('select assigned_port from project_assigned_ports where project_dir = ?', [projectDir]);
    return result?.assigned_port;
}

export function setProjectAssignedPort(projectDir: string, port: number): void {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    db.run(
        'insert or replace into project_assigned_ports(project_dir, assigned_port, created_at, updated_at) values(?, ?, ?, ?)',
        [projectDir, port, now, now]
    );
}

export function deleteProjectAssignedPort(projectDir: string): boolean {
    const db = getDatabase();
    const result = db.run('delete from project_assigned_ports where project_dir = ?', [projectDir]);
    return result.changes > 0;
}

export function getAllProjectAssignedPorts(): ProjectAssignedPort[] {
    const db = getDatabase();
    return db.list('select * from project_assigned_ports order by project_dir');
}

