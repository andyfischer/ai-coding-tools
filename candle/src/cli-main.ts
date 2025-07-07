#! /usr/bin/env node
import 'source-map-support/register';
import * as yargs from 'yargs';
import { Argv } from 'yargs';
import { handleRun } from './handleRun';
import { handleList, printListOutput } from './handleList';
import { handleKill, printKillOutput } from './handleKill';
import { handleKillAll, printKillAllOutput } from './handleKillAll';
import { handleSetCommand } from './handleSetCommand';
import { handleDeleteCommand, printDeleteCommandOutput } from './handleDeleteCommand';
import { handleRestart, printRestartOutput } from './handleRestart';
import { handleClearDatabaseCommand } from './handleClearDatabase';
import { handleLogs } from './handleLogs';
import { handleConfig, printConfigOutput } from './handleConfig';
import { handleWatch } from './handleWatch';
import { NeedRunCommandError } from './errors';
import { serveMCP } from './mcp';
function parseArgs(): {
    command: string;
    commandName: string;
    sectionAfterDash: string | undefined;
    json: boolean;
    mcp: boolean;
} {
    // Check for '--' and extract the command after it
    const args = process.argv.slice(2);
    const dashIndex = args.indexOf('--');
    let sectionAfterDash: string | undefined;
    let yargsArgs = args;
    if (dashIndex !== -1) {
        // Everything after '--' becomes the run command
        const afterDash = args.slice(dashIndex + 1);
        if (afterDash.length > 0) {
            sectionAfterDash = afterDash.join(' ');
        }
        yargsArgs = [...args.slice(0, dashIndex)];
    }
    const argv = yargs
        .option('json', {
        type: 'boolean',
        describe: 'Output raw JSON data',
        default: false
    })
        .option('mcp', {
        type: 'boolean',
        describe: 'Enter MCP server mode',
        default: false
    })
        .command('set-command [name]', 'Set the default run command for the current directory', () => { })
        .command('delete-command [name]', 'Delete a saved run command for the current directory', () => { })
        .command('run [name]', 'Launch process', (yargs: Argv) => { })
        .command('restart [name]', 'Restart a process service', () => { })
        .command(['kill [name]', 'stop [name]'], 'Kill processes started in the current working directory', (yargs: Argv) => { })
        .command('kill-all', 'Kill all running processes that are tracked by Candle', (yargs: Argv) => { })
        .command(['list', 'ls'], 'List active processes for current directory', (yargs: Argv) => { })
        .command('list-all', 'List all active processes', (yargs: Argv) => { })
        .command('logs [name]', 'Show recent logs for a process', () => { })
        .command('watch [name]', 'Watch live output from a running process', () => { })
        .command('config', 'Show configured commands for the current directory', (yargs: Argv) => { })
        .command('erase-database', 'Erase the database stored at ~/.candle', () => { })
        .demandCommand(0, 'You need to specify a command')
        .help()
        .parseSync(yargsArgs);
    const command = argv._[0] as string;
    const commandName = (argv.name as string) || 'default';
    const json = argv.json as boolean;
    const mcp = argv.mcp as boolean;
    return { command, commandName, sectionAfterDash, json, mcp };
}
function isStdinActive(): boolean {
    return process.stdin.isTTY === false;
}
export async function main(): Promise<void> {
    // Check if no arguments and stdin is active (piped) - enter MCP mode
    /* Disabled for now
    if (process.argv.length === 2 && isStdinActive()) {
        await serveMCP();
        return;
    }
    */
    const { command, commandName, sectionAfterDash, json, mcp } = parseArgs();
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
    function printOutput(prettyPrintFn: (data: any) => void, data: any) {
        if (json) {
            console.log(JSON.stringify(data, null, 2));
        }
        else {
            prettyPrintFn(data);
        }
    }
    try {
        switch (command) {
            case 'run':
                await handleRun({ commandName, setCommandString: sectionAfterDash, consoleOutputFormat: json ? 'json' : 'pretty' });
                break;
            case 'list':
            case 'ls': {
                const output = await handleList({});
                printOutput(printListOutput, output);
                break;
            }
            case 'list-all': {
                const output = await handleList({ showAll: true });
                printOutput(printListOutput, output);
                break;
            }
            case 'kill':
            case 'stop': {
                const output = await handleKill({ commandName });
                printOutput(printKillOutput, output);
                break;
            }
            case 'kill-all': {
                const output = await handleKillAll();
                printOutput(printKillAllOutput, output);
                break;
            }
            case 'restart': {
                const output = await handleRestart({
                    commandName,
                    setCommandString: sectionAfterDash,
                    consoleOutputFormat: json ? 'json' : 'pretty'
                });
                printOutput(printRestartOutput, output);
                break;
            }
            case 'logs':
                await handleLogs({ commandName });
                break;
            case 'watch':
                await handleWatch({ commandName });
                break;
            case 'config': {
                const output = await handleConfig();
                printOutput(printConfigOutput, output);
                break;
            }
            case 'set-command':
                await handleSetCommand({ commandName, commandString: sectionAfterDash });
                break;
            case 'delete-command': {
                const output = await handleDeleteCommand({ commandName });
                printOutput(printDeleteCommandOutput, output);
                break;
            }
            case 'clear-database':
                await handleClearDatabaseCommand();
                break;
            default:
                console.error(`Error: Unrecognized command '${command}'`);
                console.error('Available commands: run, start, list, ls, list-all, stop, kill, kill-all, restart, logs, watch, config, set-command, delete-command, clear-database');
                process.exit(1);
        }
    }
    catch (error) {
        if (error instanceof NeedRunCommandError) {
            console.error('No start command configured for this directory.');
            if (commandName === 'default') {
                console.error('Please set one using: candle run -- <your command>');
            }
            else {
                console.error(`Please set one using: candle run ${commandName} -- <your command>`);
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
