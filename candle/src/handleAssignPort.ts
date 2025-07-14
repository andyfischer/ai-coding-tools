import { setProjectAssignedPort, getProjectAssignedPort, deleteProjectAssignedPort, getAllProjectAssignedPorts } from './database';
import { isPortAvailable } from './allocatePort';

export interface AssignPortOptions {
    port?: number;
    commandName?: string;
}

export interface AssignPortResult {
    success: boolean;
    message: string;
    assignedPort?: number;
    projectDir?: string;
    commandName?: string;
}

export async function handleAssignPort(options: AssignPortOptions): Promise<AssignPortResult> {
    const cwd = process.cwd();
    const commandName = options.commandName || 'default';
    
    // Handle assign port
    if (!options.port) {
        return {
            success: false,
            message: 'Port number is required. Usage: assign-port <port> or assign-port <name> <port>'
        };
    }
    
    const port = options.port;
    
    // Validate port range
    if (port < 1 || port > 65535) {
        return {
            success: false,
            message: 'Port must be between 1 and 65535'
        };
    }
    
    // Check if port is available
    const available = await isPortAvailable(port);
    if (!available) {
        return {
            success: false,
            message: `Port ${port} is already in use`
        };
    }
    
    // For now, we'll store the port assignment per project directory
    // In the future, we could extend this to be per command name
    setProjectAssignedPort(cwd, port);
    
    const message = commandName === 'default' 
        ? `Assigned port ${port} to project`
        : `Assigned port ${port} to project (command: ${commandName})`;
    
    return {
        success: true,
        message,
        assignedPort: port,
        projectDir: cwd,
        commandName
    };
}

export function printAssignPortOutput(result: AssignPortResult): void {
    console.log(result.message);
}