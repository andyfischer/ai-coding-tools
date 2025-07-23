// Error subclasses for specific error types

export class NeedRunCommandError extends Error {
    constructor(public cwd: string, public commandName: string) {
        super(`No service '${commandName}' configured for directory: ${cwd}`);
        this.name = 'NeedRunCommandError';
    }
}