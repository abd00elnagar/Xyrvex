import { Database } from "bun:sqlite";
import { existsSync } from "fs";

let currentDb: Database | null = null;
let currentDbPath: string | null = null;

export function openDatabase(path: string): Database {
    console.log(`[connection] openDatabase: Attempting to open "${path}"`);
    if (currentDb) {
        console.log(`[connection] openDatabase: Closing existing database...`);
        currentDb.close();
    }

    try {
        console.log(`[connection] openDatabase: Calling new Database("${path}")`);
        currentDb = new Database(path);
        currentDbPath = path;
        console.log(`[connection] openDatabase: Database instance created.`);

        // Enable foreign keys
        console.log(`[connection] openDatabase: Running PRAGMA foreign_keys = ON...`);
        currentDb.run("PRAGMA foreign_keys = ON;");
        console.log(`[connection] openDatabase: PRAGMA finished.`);

        return currentDb;
    } catch (e) {
        console.error(`[connection] openDatabase: ERROR: ${e}`);
        throw e;
    }
}

export function closeDatabase() {
    if (currentDb) {
        currentDb.close();
        currentDb = null;
        currentDbPath = null;
    }
}

export function getDatabase(): Database {
    if (!currentDb) {
        throw new Error("No database currently open");
    }
    return currentDb;
}

export function getCurrentDbPath(): string | null {
    return currentDbPath;
}

export function isValidDatabase(path: string): boolean {
    if (!existsSync(path)) return false;

    try {
        const db = new Database(path, { readonly: true });
        // Try a simple query to verify it's a valid SQLite file
        db.query("SELECT 1").get();
        db.close();
        return true;
    } catch (e) {
        return false;
    }
}
