import type { Database } from "bun:sqlite";

export function beginTransaction(db: Database): void {
    try {
        db.run("BEGIN;");
    } catch (e) {
        console.error("[transaction] Failed to BEGIN:", e);
    }
}

export function commitAndContinue(db: Database): void {
    try {
        db.run("COMMIT;");
        db.run("BEGIN;");
    } catch (e) {
        console.error("[transaction] Failed to COMMIT and continue:", e);
    }
}

export function rollbackTransaction(db: Database): void {
    try {
        db.run("ROLLBACK;");
    } catch (e) {
        // Safe to ignore if no transaction is active
    }
}

export function commitOnly(db: Database): void {
    try {
        db.run("COMMIT;");
    } catch (e) {
        console.error("[transaction] Failed to COMMIT:", e);
    }
}

export function withTransaction<T>(db: Database, fn: () => T): T {
    try {
        db.run("BEGIN;");
        const result = fn();
        db.run("COMMIT;");
        return result;
    } catch (e) {
        db.run("ROLLBACK;");
        throw e;
    }
}
