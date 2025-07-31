
import { getProcessLogs, LogSearchOptions } from "./logs";
import { ProcessLog } from "./database";

export class LogIterator {
    hasDoneInitialSearch = false;
    lastSeenLogId = 0;
    options: LogSearchOptions;

    constructor(options: LogSearchOptions) {
        this.options = options;
    }

    getNextLogs(options: Partial<LogSearchOptions> = {}): ProcessLog[] {
        if (!this.hasDoneInitialSearch) {
            const initialLogs = getProcessLogs({ ...this.options, ...options });
            this.hasDoneInitialSearch = true;
            if (initialLogs.length > 0) {
                this.lastSeenLogId = initialLogs[initialLogs.length - 1].id;
            }
            return initialLogs;
        }

        const logs = getProcessLogs({ ...this.options, afterLogId: this.lastSeenLogId, ...options });
        if (logs.length > 0) {
            this.lastSeenLogId = logs[logs.length - 1].id;
        }
        return logs;
    }
}