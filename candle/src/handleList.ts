import * as Db from './database';
import { findSetupFile, getAllServiceNames, getServiceCwd } from './setupFile';
import * as path from 'path';

export interface ListOutput {
    processes: {
        command: string;
        workingDir: string;
        uptime: string;
        pid: number;
        status: string;
        serviceName: string;
    }[];
    showAll?: boolean;
    message?: string;
}

export async function handleList(options?: { showAll?: boolean }): Promise<ListOutput> {
    if (options?.showAll) {
        // For showAll, display all running processes from any setup config
        const runningServers = Db.getRunningProcesses();
        
        const processes = runningServers.map(server => {
            const uptime = Math.floor((Date.now() - server.start_time * 1000) / 1000);
            const uptimeString = formatUptime(uptime);
            
            return {
                serviceName: server.command_name,
                command: server.command_str,
                workingDir: server.working_directory,
                uptime: uptimeString,
                pid: server.pid,
                status: 'RUNNING'
            };
        });
        
        return { processes, showAll: true };
    }
    
    // For regular list, show services from current directory's setup config
    const setupResult = findSetupFile(process.cwd());
    
    if (!setupResult) {
        return { 
            processes: [], 
            message: 'No .candle-setup.json file found. Please create one to define your services.' 
        };
    }
    
    const { config, configPath } = setupResult;
    const setupJsonDir = path.dirname(configPath);
    
    // Get running processes filtered by project_dir
    const runningServers = Db.getRunningProcessesByProjectDir(setupJsonDir);
    
    // Create a mapping of running processes by command name and working directory
    const runningProcessMap = new Map<string, Db.ProcessRow>();
    for (const server of runningServers) {
        const key = `${server.command_name}:${server.working_directory}`;
        runningProcessMap.set(key, server);
    }
    
    // Build list showing all services from config
    const processes = config.services.map(service => {
        const serviceCwd = getServiceCwd(service, configPath);
        const key = `${service.name}:${serviceCwd}`;
        const runningProcess = runningProcessMap.get(key);
        
        if (runningProcess) {
            // Service is running
            const uptime = Math.floor((Date.now() - runningProcess.start_time * 1000) / 1000);
            const uptimeString = formatUptime(uptime);
            
            return {
                serviceName: service.name,
                command: service.shell,
                workingDir: serviceCwd,
                uptime: uptimeString,
                pid: runningProcess.pid,
                status: 'RUNNING'
            };
        } else {
            // Service is not running                
            return {
                serviceName: service.name,
                command: service.shell,
                workingDir: serviceCwd,
                uptime: '-',
                pid: 0,
                status: 'STOPPED'
            };
        }
    });
    
    return { processes, showAll: false };
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

