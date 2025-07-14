export class NeedRunCommandError extends Error {
    constructor(public cwd: string, commandName: string) {
        super(`No '${commandName}' configured for directory: ${cwd}`);
        this.name = 'NeedRunCommandError';
    }
}