import * as net from 'net';
import { getAllAssignedPorts } from './database';

const STARTING_PORT = 3001;

/**
 * Assigns a new unused port for a process
 * @returns Promise<number> - The assigned port number
 */
export async function assignPort(): Promise<number> {
    const assignedPorts = getAllAssignedPorts();
    const assignedPortSet = new Set(assignedPorts);
    
    let portToTry = STARTING_PORT;
    
    // Find the next available port number that's not in the database
    while (assignedPortSet.has(portToTry)) {
        portToTry++;
    }
    
    // Now verify the port is actually available by trying to bind to it
    while (true) {
        const isAvailable = await isPortAvailable(portToTry);
        if (isAvailable) {
            return portToTry;
        }
        portToTry++;
    }
}

/**
 * Checks if a port is available by attempting to bind to it
 * @param port - The port number to check
 * @returns Promise<boolean> - True if the port is available
 */
function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, () => {
            server.close(() => {
                resolve(true);
            });
        });
        
        server.on('error', () => {
            resolve(false);
        });
    });
}