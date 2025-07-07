import * as net from 'net';
import { getDatabase, RunningStatus } from './database';
export async function allocatePort(): Promise<number> {
    const db = getDatabase();
    const PORT_START = 3001;
    const PORT_END = 4000;
    // Get all currently used ports from database
    const usedPorts = db.list('select assigned_port from processes where is_running = ? and assigned_port is not null', [RunningStatus.running])
        .map(row => row.assigned_port);
    // Find the first available port by actually trying to bind to it
    for (let port = PORT_START; port <= PORT_END; port++) {
        if (!usedPorts.includes(port)) {
            if (await isPortAvailable(port)) {
                return port;
            }
        }
    }
    // If no ports available, throw error
    throw new Error('No available ports in range 3001-4000');
}
export async function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err: any) => {
            // Port is not available (likely in use)
            resolve(false);
        });
        server.once('listening', () => {
            // Port is available, close the server and resolve true
            server.close(() => {
                // console.log('Port is confirmed available: ' + port);
                resolve(true);
            });
        });
        // Try to listen on the port
        server.listen(port);
    });
}
