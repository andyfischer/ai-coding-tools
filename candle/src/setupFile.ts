import * as fs from 'fs';
import * as path from 'path';

export interface ServiceConfig {
    name: string;
    shell: string;
    root?: string;
    env?: Record<string, string>;
    default?: boolean;
}

export interface CandleSetupConfig {
    services: ServiceConfig[];
}

/*
  findProjectDir

  Finds the location of the nearest .candle-setup.json file.
*/
export function findProjectDir(startDir: string = process.cwd()): string {
    const setupResult = findSetupFile(startDir);
    if (setupResult) {
        return path.dirname(setupResult.configPath);
    }

    throw new Error('No .candle-setup.json found');
}

export function findSetupFile(startDir: string = process.cwd()): { config: CandleSetupConfig, configPath: string } | null {
    let currentDir = path.resolve(startDir);
    
    while (true) {
        const configPath = path.join(currentDir, '.candle-setup.json');
        
        if (fs.existsSync(configPath)) {
            try {
                const content = fs.readFileSync(configPath, 'utf8');
                const config = JSON.parse(content) as CandleSetupConfig;
                validateConfig(config);
                return { config, configPath };
            } catch (error) {
                throw new Error(`Invalid .candle-setup.json at ${configPath}: ${error.message}`);
            }
        }
        
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            // Reached root directory
            break;
        }
        currentDir = parentDir;
    }
    
    return null;
}

export function validateConfig(config: CandleSetupConfig): void {
    if (!config.services || !Array.isArray(config.services)) {
        throw new Error('Config must have a "services" array');
    }
    
    if (config.services.length === 0) {
        throw new Error('Config must have at least one service');
    }
    
    const names = new Set<string>();
    let defaultCount = 0;
    
    for (const service of config.services) {
        if (!service.name || typeof service.name !== 'string') {
            throw new Error('Each service must have a "name" string');
        }
        
        if (!service.shell || typeof service.shell !== 'string') {
            throw new Error(`Service "${service.name}" must have a "shell" string`);
        }
        
        if (names.has(service.name)) {
            throw new Error(`Duplicate service name: "${service.name}"`);
        }
        names.add(service.name);
        
        if (service.default) {
            defaultCount++;
        }
        
        if (service.root && !isValidRelativePath(service.root)) {
            throw new Error(`Service "${service.name}" has invalid root path: "${service.root}"`);
        }
        
        if (service.env && typeof service.env !== 'object') {
            throw new Error(`Service "${service.name}" env must be an object`);
        }
    }
    
    if (defaultCount > 1) {
        throw new Error('Only one service can be marked as default');
    }
}

function isValidRelativePath(p: string): boolean {
    // Don't allow absolute paths or paths that escape the config directory
    if (path.isAbsolute(p)) {
        return false;
    }
    
    const normalized = path.normalize(p);
    if (normalized.startsWith('..')) {
        return false;
    }
    
    return true;
}

export function getServiceCwd(service: ServiceConfig, configPath: string): string {
    const configDir = path.dirname(configPath);
    if (service.root) {
        return path.resolve(configDir, service.root);
    }
    return configDir;
}

export function findServiceByName(config: CandleSetupConfig, name?: string): ServiceConfig | null {
    if (!name) {
        // Find default service
        const defaultService = config.services.find(s => s.default);
        if (defaultService) {
            return defaultService;
        }
        
        // If no default is marked, return null to indicate we need a service name
        return null;
    }
    
    return config.services.find(s => s.name === name) || null;
}

export function getAllServiceNames(config: CandleSetupConfig): string[] {
    return config.services.map(s => s.name);
}