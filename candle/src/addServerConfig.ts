import * as fs from 'fs';
import * as path from 'path';
import { ServiceConfig, CandleSetupConfig, findSetupFile, validateConfig } from './setupFile';

export interface AddServerConfigArgs {
    name: string;
    shell: string;
    root?: string;
    env?: Record<string, string>;
    default?: boolean;
}

export function addServerConfig(args: AddServerConfigArgs, startDir: string = process.cwd()): void {
    const configPath = findOrCreateSetupFile(startDir);
    
    // Read existing config
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content) as CandleSetupConfig;
    
    // Check if service name already exists
    if (config.services.some(service => service.name === args.name)) {
        throw new Error(`Service '${args.name}' already exists in configuration`);
    }
    
    // If this service is being marked as default, unmark any existing default
    if (args.default) {
        config.services.forEach(service => {
            if (service.default) {
                service.default = false;
            }
        });
    }
    
    // Create new service config
    const newService: ServiceConfig = {
        name: args.name,
        shell: args.shell,
        ...(args.root && { root: args.root }),
        ...(args.env && { env: args.env }),
        ...(args.default && { default: args.default })
    };
    
    // Add new service to config
    config.services.push(newService);
    
    // Validate the updated config
    validateConfig(config);
    
    // Write back to file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function findOrCreateSetupFile(startDir: string): string {
    const setupResult = findSetupFile(startDir);
    
    if (setupResult) {
        return setupResult.configPath;
    }
    
    // Create new .candle-setup.json file in the current directory
    const configPath = path.join(startDir, '.candle-setup.json');
    const initialConfig: CandleSetupConfig = {
        services: []
    };
    
    fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));
    return configPath;
}