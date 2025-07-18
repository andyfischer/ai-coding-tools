import { app } from 'electron'
import path from 'path'
import { DatabaseLoader } from '@andyfischer/sqlite-wrapper'
import { Stream } from '@andyfischer/streams'

const databaseSchema = {
    name: 'claude-history-tool',
    statements: [
        `create table dismissed_upgrade_notifications (
            id integer primary key autoincrement,
            content_code text not null unique,
            dismissed_at datetime default current_timestamp
        )`
    ]
}

let databaseLoader: DatabaseLoader | null = null

export function initializeDatabase() {
    if (databaseLoader) {
        return databaseLoader.load()
    }

    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'claude-history-tool.db')

    databaseLoader = new DatabaseLoader({
        filename: dbPath,
        schema: databaseSchema,
        logs: (new Stream()).logToConsole(),
    })

    return databaseLoader.load()
}

export function getDatabase() {
    if (!databaseLoader) {
        return initializeDatabase()
    }
    return databaseLoader.load()
}

export function isDismissed(contentCode: string): boolean {
    const db = getDatabase()
    const result = db.get(
        'select 1 from dismissed_upgrade_notifications where content_code = ?',
        [contentCode]
    )
    return !!result
}

export function dismissNotification(contentCode: string): void {
    const db = getDatabase()
    db.run(
        'insert or ignore into dismissed_upgrade_notifications (content_code) values (?)',
        [contentCode]
    )
}