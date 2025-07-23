#! /usr/bin/env node

import 'source-map-support/register';
import * as yargs from 'yargs';
import { Argv } from 'yargs';
import { handleRun, handleStart } from './handleRun';
import { handleList } from './handleList';
import { handleKill } from './handleKill';
import { handleKillAll } from './handleKillAll';
import { handleRestart } from './handleRestart';
import { handleClearDatabaseCommand } from './handleClearDatabase';
import { handleClearLogsCommand } from './handleClearLogs';
import { handleLogs } from './handleLogs';
import { handleWatch } from './handleWatch';
import { NeedRunCommandError } from './errors';
import { serveMCP } from './mcp';
import { findProjectDir } from './setupFile';
import { addServerConfig } from './addServerConfig';

function parseArgs(): { command: string, commandName: string, commandNames: string[], mcp: boolean, shell?: string, root?: string, env?: Record<string, string>, default?: boolean } {
    const args = process.argv.slice(2);

    const argv = yargs
        .option('mcp', {
            type: 'boolean',
            describe: 'Enter MCP server mode',
            default: false
        })
        .command('run [name]', 'Launch process', (yargs: Argv) => { })
        .command('start [name...]', 'Start process(es) in background and exit', (yargs: Argv) => { })
        .command('restart [name]', 'Restart a process service', () => {})
        .command(['kill [name]', 'stop [name]'], 'Kill processes started in the current working directory', (yargs: Argv) => { })
        .command('kill-all', 'Kill all running processes that are tracked by Candle', (yargs: Argv) => {})
        .command(['list', 'ls'], 'List active processes for current directory', (yargs: Argv) => { })
        .command('list-all', 'List all active processes', (yargs: Argv) => { })
        .command('logs [name]', 'Show recent logs for a process', () => {})
        .command('watch [name]', 'Watch live output from a running process', () => {})
        .command('clear-logs [name]', 'Clear logs for commands in the current directory', () => {})
        .command('erase-database', 'Erase the database stored at ~/.candle', () => {})
        .command('add-service <name> <shell>', 'Add a new service to .candle-setup.json', (yargs: Argv) => {
            yargs
                .positional('name', {
                    describe: 'Name of the service',
                    type: 'string'
                })
                .positional('shell', {
                    describe: 'Shell command to run the service',
                    type: 'string'
                })
                .option('root', {
                    describe: 'Root directory for the service',
                    type: 'string'
                })
                .option('env', {
                    describe: 'Environment variables as JSON string',
                    type: 'string'
                })
                .option('default', {
                    describe: 'Mark this service as default',
                    type: 'boolean',
                    default: false
                });
        })
        .demandCommand(0, 'You need to specify a command')
        .help()
        .parseSync(args);

    const command = argv._[0] as string;
    const commandName = (argv.name as string);
    const commandNames = Array.isArray(argv.name) ? argv.name as string[] : (argv.name ? [argv.name as string] : []);
    const mcp = argv.mcp as boolean;
    const shell = argv.shell as string;
    const root = argv.root as string;
    const env = argv.env ? JSON.parse(argv.env as string) : undefined;
    const defaultFlag = argv.default as boolean;
    
    return { command, commandName, commandNames, mcp, shell, root, env, default: defaultFlag };
}

export async function main(): Promise<void> {
    const { command, commandName, commandNames, mcp, shell, root, env, default: defaultFlag } = parseArgs();

    // Check if no arguments - print help
    if (process.argv.length === 2) {
        yargs.showHelp();
        return;
    }

    // Check if --mcp flag is set - enter MCP mode
    if (mcp) {
        await serveMCP();
        return;
    }


    try {
        switch (command) {
            case 'run': {
                const projectDir = findProjectDir();
                const output = await handleRun({ projectDir, commandName, watchLogs: true, consoleOutputFormat: 'pretty' });
                if (output.killedProcesses && output.killedProcesses.length > 0) {
                    for (const process of output.killedProcesses) {
                        console.log(`Killed '${process.command}' process with PID: ${process.pid}`);
                    }
                }
                console.log(output.message);
                break;
            }
            case 'start': {
                const output = await handleStart({ commandNames, consoleOutputFormat: 'pretty' });
                for (const service of output.services) {
                    if (service.success) {
                        console.log(`Started '${service.name}' (${service.command}) in ${service.directory} (PID: ${service.wrapperPid})`);
                    } else {
                        console.error(`Failed to start service '${service.name}': ${service.error}`);
                    }
                }
                
                if (output.summary.failureCount > 0) {
                    console.error(`\nFailed to start ${output.summary.failureCount} service(s)`);
                    if (output.summary.successCount > 0) {
                        const successNames = output.services.filter(s => s.success).map(s => s.name);
                        console.log(`Successfully started ${output.summary.successCount} service(s): ${successNames.join(', ')}`);
                    }
                }
                break;
            }
            case 'list':
            case 'ls': {
                const output = await handleList({ });
                if (output.message) {
                    console.log(output.message);
                } else if (output.processes.length === 0) {
                    console.log('No active processes found.');
                } else {
                    for (const process of output.processes) {
                        console.log(`${process.serviceName} (${process.command}) - ${process.status} - PID: ${process.pid > 0 ? process.pid : '-'} - Directory: ${process.workingDir}`);
                    }
                }
                break;
            }
            case 'list-all': {
                const output = await handleList({ showAll: true });
                if (output.message) {
                    console.log(output.message);
                } else if (output.processes.length === 0) {
                    console.log('No active processes found.');
                } else {
                    for (const process of output.processes) {
                        console.log(`${process.serviceName} (${process.command}) - ${process.status} - PID: ${process.pid > 0 ? process.pid : '-'} - Directory: ${process.workingDir}`);
                    }
                }
                break;
            }
            case 'kill':
            case 'stop': {
                const projectDir = findProjectDir();
                const output = await handleKill({ projectDir, commandName });
                if (output.message) {
                    console.log(output.message);
                } else {
                    for (const process of output.killedProcesses) {
                        console.log(`Killed '${process.command}' process with PID: ${process.pid}`);
                    }
                }
                break;
            }
            case 'kill-all': {
                const output = await handleKillAll();
                if (output.killedProcesses.length === 0) {
                    console.log('No running processes found to kill');
                } else {
                    for (const process of output.killedProcesses) {
                        console.log(`Killed '${process.command}' process with PID: ${process.pid}`);
                    }
                }
                break;
            }
            case 'restart': {
                const projectDir = findProjectDir();
                const output = await handleRestart({ 
                    projectDir,
                    commandName, 
                    consoleOutputFormat: 'pretty',
                    watchLogs: true
                });
                if (output.success) {
                    console.log(`Service '${commandName}' restarted successfully`);
                } else {
                    console.error(output.message);
                }
                break;
            }
            case 'logs': {
                const projectDir = findProjectDir();
                await handleLogs({ projectDir, commandName });
                break;
            }
            case 'watch': {
                const projectDir = findProjectDir();
                await handleWatch({ projectDir, commandName });
                break;
            }
            case 'clear-logs': {
                const projectDir = findProjectDir();
                await handleClearLogsCommand({ projectDir, commandName });
                break;
            }
            case 'clear-database':
                await handleClearDatabaseCommand();
                break;
            case 'add-service': {
                try {
                    addServerConfig({
                        name: commandName,
                        shell: shell,
                        root: root,
                        env: env,
                        default: defaultFlag
                    });
                    console.log(`Service '${commandName}' added successfully to .candle-setup.json`);
                } catch (error) {
                    console.error(`Error adding service: ${error.message}`);
                    process.exit(1);
                }
                break;
            }
            default:
                console.error(`Error: Unrecognized command '${command}'`);
                console.error('Available commands: run, start, list, ls, list-all, stop, kill, kill-all, restart, logs, watch, clear-logs, clear-database, add-service');
                process.exit(1);
        }
    } catch (error) {
        if (error instanceof NeedRunCommandError) {
            console.error('No .candle-setup.json file found or service not configured.');
            if (commandName) {
                console.error(`Service '${commandName}' not found in .candle-setup.json`);
            } else {
                console.error('Please create a .candle-setup.json file to define your services.');
            }
            process.exit(1);
        }
        throw error;
    }
}

// Run main function when called as CLI script
if (require.main === module) {
    main().catch(error => {
        console.error(error);
        process.exit(1);
    });
}
