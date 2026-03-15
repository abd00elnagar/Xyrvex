import { Utils } from "electrobun/bun";
import { openDatabase, getCurrentDbPath, getDatabase, closeDatabase } from "../db/connection";
import { getTableNames, executeRawQuery, getTableData, insertDefaultRow } from "../db/queries";
import { beginTransaction, commitAndContinue, commitOnly, rollbackTransaction } from "../db/transaction";
import { loadSession, saveSession } from "../session";
import type { AppRPC, OpenResult, OpResult, TerminalResult, SessionData, ColumnDef, TableData, SqlSnippet } from "../../shared/types";
import { basename, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

// We'll pass the RPC instance from index.ts to enable push messages
// Keep track of internal state for dirty tracking and auto-save
let isAutoSave = false;
let isDirty = false;

function markDirty(rpc: AppRPC, dirty: boolean) {
    if (isDirty !== dirty) {
        isDirty = dirty;
        rpc.send.dbDirtyChanged({ isDirty });
    }
}

export const getIsDirty = () => isDirty;

export const createDbHandlers = (rpc: AppRPC) => ({
    dbOpen: async (): Promise<OpenResult> => {
        if (isDirty) {
            const { response } = await Utils.showMessageBox({
                type: "warning",
                title: "Unsaved Changes",
                message: "You have unsaved changes.",
                detail: "Opening a new database will discard your current unsaved changes. Do you want to proceed?",
                buttons: ["Proceed and Discard", "Cancel"],
                defaultId: 1,
                cancelId: 1
            });
            if (response === 1) {
                return { ok: false, error: "Aborted by user", dbName: "", dbPath: null, tables: [] };
            }
        }

        console.log("[dbHandlers] dbOpen: Opening file dialog...");

        const filePaths = await Utils.openFileDialog({
            startingFolder: Utils.paths.home,
            canChooseFiles: true,
            canChooseDirectory: false,
            allowsMultipleSelection: false,
            allowedFileTypes: "db;sqlite;sqlite3"
        });

        if (!filePaths || filePaths.length === 0 || filePaths[0] === "" || filePaths[0] === "undefined") {
            return { ok: false, error: "No file selected", dbName: "", dbPath: null, tables: [] };
        }

        const path = filePaths[0].trim();

        try {
            const db = openDatabase(path);
            beginTransaction(db);
            
            const tables = getTableNames();
            markDirty(rpc, false); // New DB, not dirty

            // Update session
            await saveSession({ lastOpenedPath: path });

            const response = {
                ok: true,
                dbName: basename(path),
                dbPath: path,
                tables
            };

            rpc.send.dbOpened(response);
            return response;
        } catch (e) {
            console.error(`[dbHandlers] dbOpen Error: ${e}`);
            return { ok: false, error: String(e), dbName: "", dbPath: null, tables: [] };
        }
    },

    dbOpenByPath: async (params: { path: string }): Promise<OpenResult> => {
        if (isDirty) {
            const { response } = await Utils.showMessageBox({
                type: "warning",
                title: "Unsaved Changes",
                message: "You have unsaved changes.",
                detail: "Opening a new database will discard your current unsaved changes. Do you want to proceed?",
                buttons: ["Proceed and Discard", "Cancel"],
                defaultId: 1,
                cancelId: 1
            });
            if (response === 1) {
                return { ok: false, error: "Aborted by user", dbName: "", dbPath: null, tables: [] };
            }
        }
        try {
            const db = openDatabase(params.path);
            beginTransaction(db);
            const tables = getTableNames();
            markDirty(rpc, false);

            const response = {
                ok: true,
                dbName: basename(params.path),
                dbPath: params.path,
                tables
            };
            rpc.send.dbOpened(response);
            return response;
        } catch (e) {
            return { ok: false, error: String(e), dbName: "", dbPath: null, tables: [] };
        }
    },

    dbCreate: async (params: { filename: string }): Promise<OpenResult> => {
        const { filename } = params;

        if (!filename) {
            return { ok: false, error: "No filename provided", dbName: "", dbPath: null, tables: [] };
        }

        const finalFilename = filename.toLowerCase().endsWith(".db") ? filename : `${filename}.db`;

        const filePaths = await Utils.openFileDialog({
            startingFolder: Utils.paths.home,
            canChooseFiles: false,
            canChooseDirectory: true,
            allowsMultipleSelection: false
        });

        if (!filePaths || filePaths.length === 0 || filePaths[0] === "" || filePaths[0] === "undefined") {
            return { ok: false, error: "No location selected", dbName: "", dbPath: null, tables: [] };
        }

        const folderPath = filePaths[0].trim();
        const path = join(folderPath, finalFilename);

        if (existsSync(path)) {
            const { response } = await Utils.showMessageBox({
                type: "warning",
                title: "File Exists",
                message: `A file named "${finalFilename}" already exists.`,
                detail: "Do you want to replace it?",
                buttons: ["Replace", "Cancel"],
                defaultId: 1,
                cancelId: 1
            });
            if (response === 1) {
                return { ok: false, error: "Aborted by user", dbName: "", dbPath: null, tables: [] };
            }
        }

        try {
            const db = openDatabase(path);
            beginTransaction(db);
            markDirty(rpc, false);

            await saveSession({ lastOpenedPath: path });

            const response = {
                ok: true,
                dbName: basename(path),
                dbPath: path,
                tables: []
            };

            rpc.send.dbOpened(response);
            return response;
        } catch (e) {
            console.error(`[dbHandlers] dbCreate Error: ${e}`);
            return { ok: false, error: String(e), dbName: "", dbPath: null, tables: [] };
        }
    },

    dbSave: async (): Promise<OpResult> => {
        try {
            const db = getDatabase();
            commitAndContinue(db);
            markDirty(rpc, false);
            const path = getCurrentDbPath();
            rpc.send.dbSaved({ dbPath: path, dbName: path ? basename(path) : "" });
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    dbSaveAs: async (params: { suggestedName: string }): Promise<OpResult> => {
        try {
            const currentPath = getCurrentDbPath();
            if (!currentPath) return { ok: false, error: "No database open" };

            const filePaths = await Utils.openFileDialog({
                startingFolder: Utils.paths.home,
                canChooseFiles: false,
                canChooseDirectory: true,
                allowsMultipleSelection: false
            });

            if (!filePaths || filePaths.length === 0) return { ok: false, error: "No location selected" };

            const destPath = join(filePaths[0], params.suggestedName.endsWith(".db") ? params.suggestedName : `${params.suggestedName}.db`);
            
            if (existsSync(destPath)) {
                const { response } = await Utils.showMessageBox({
                    type: "warning",
                    title: "File Exists",
                    message: `A file named "${basename(destPath)}" already exists.`,
                    detail: "Do you want to replace it?",
                    buttons: ["Replace", "Cancel"],
                    defaultId: 1,
                    cancelId: 1
                });
                if (response === 1) {
                    return { ok: false, error: "Aborted by user" };
                }
            }

            const db = getDatabase();
            commitOnly(db); // Flush to disk

            await copyFile(currentPath, destPath);
            
            // Re-open at new path
            openDatabase(destPath);
            beginTransaction(getDatabase());
            markDirty(rpc, false);

            await saveSession({ lastOpenedPath: destPath });

            const newName = basename(destPath);
            rpc.send.dbSaved({ dbPath: destPath, dbName: newName });
            
            // Also notify that a new DB effectively "opened" (though it's a save-as)
            rpc.send.dbOpened({
                ok: true,
                dbName: newName,
                dbPath: destPath,
                tables: getTableNames()
            });

            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    dbClose: async (): Promise<OpResult> => {
        try {
            const db = getDatabase();
            rollbackTransaction(db); // Discard uncommitted
            closeDatabase();
            markDirty(rpc, false);
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    autosaveSet: async (params: { enabled: boolean }): Promise<OpResult> => {
        isAutoSave = params.enabled;
        if (isAutoSave && isDirty) {
            try {
                commitAndContinue(getDatabase());
                markDirty(rpc, false);
            } catch (e) {}
        }
        await saveSession({ autoSave: isAutoSave });
        return { ok: true };
    },

    sessionGet: async (): Promise<SessionData> => {
        const session = await loadSession();
        isAutoSave = session.autoSave;
        return session;
    },

    snippetsGet: async (params: { dbPath: string | null }): Promise<{ snippets: SqlSnippet[] }> => {
        const session = await loadSession();
        if (!params.dbPath || !session.snippets) return { snippets: [] };
        return { snippets: session.snippets[params.dbPath] || [] };
    },

    snippetsSave: async (params: { dbPath: string | null; snippets: SqlSnippet[] }): Promise<OpResult> => {
        if (!params.dbPath) return { ok: false, error: "No database open" };
        const session = await loadSession();
        const currentSnippets = session.snippets || {};
        currentSnippets[params.dbPath] = params.snippets;
        await saveSession({ snippets: currentSnippets });
        return { ok: true };
    },

    snippetExport: async (params: { snippet: any }): Promise<OpResult> => {
        console.log("[dbHandlers] snippetExport triggered with:", params.snippet?.name);
        try {
            const { snippet } = params;
            if (!snippet || !snippet.code) return { ok: false, error: "Invalid snippet" };

            const finalFilename = snippet.name.endsWith('.sql') ? snippet.name : `${snippet.name}.sql`;

            console.log("[dbHandlers] Opening directory dialog for export...");
            const filePaths = await Utils.openFileDialog({
                startingFolder: Utils.paths.home,
                canChooseFiles: false,
                canChooseDirectory: true,
                allowsMultipleSelection: false
            });

            if (!filePaths || filePaths.length === 0 || !filePaths[0]) {
                return { ok: false, error: "No location selected" };
            }

            const folderPath = filePaths[0].trim();
            const destPath = join(folderPath, finalFilename);

            if (existsSync(destPath)) {
                const { response } = await Utils.showMessageBox({
                    type: "warning",
                    title: "File Exists",
                    message: `A file named "${finalFilename}" already exists.`,
                    detail: "Do you want to replace it?",
                    buttons: ["Replace", "Cancel"],
                    defaultId: 1,
                    cancelId: 1
                });
                if (response === 1) {
                    return { ok: false, error: "Aborted by user" };
                }
            }

            await Bun.write(destPath, snippet.code);
            return { ok: true };
        } catch (e) {
            console.error(`[dbHandlers] snippetExport Error: ${e}`);
            return { ok: false, error: String(e) };
        }
    },

    tableList: async (): Promise<{ tables: string[] }> => {
        try {
            return { tables: getTableNames() };
        } catch (e) {
            return { tables: [] };
        }
    },

    tableFetchAll: async (params: { tableName: string }): Promise<TableData> => {
        try {
            return getTableData(params.tableName);
        } catch (e) {
            return { columns: [], rows: [] };
        }
    },

    cellUpdate: async (params: { tableName: string; columnName: string; rowId: number; value: any }): Promise<OpResult> => {
        try {
            const sql = `UPDATE "${params.tableName}" SET "${params.columnName}" = ? WHERE rowid = ?`;
            const db = getDatabase();
            db.prepare(sql).run(params.value, params.rowId);
            
            if (isAutoSave) {
                commitAndContinue(db);
            } else {
                markDirty(rpc, true);
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    cellExec: async (params: { sql: string; params: (string | number | null)[] }): Promise<OpResult> => {
        try {
            const db = getDatabase();
            db.prepare(params.sql).run(...params.params);
            if (isAutoSave) {
                commitAndContinue(db);
            } else {
                markDirty(rpc, true);
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    rowInsert: async (params: { tableName: string }): Promise<OpResult> => {
        // This will be expanded in Phase 2.1 with default value resolution
        try {
            insertDefaultRow(params.tableName);
            if (isAutoSave) {
                commitAndContinue(getDatabase());
            } else {
                markDirty(rpc, true);
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    rowDelete: async (params: { tableName: string; rowId: number }): Promise<OpResult> => {
        try {
            const sql = `DELETE FROM "${params.tableName}" WHERE rowid = ?`;
            const db = getDatabase();
            db.prepare(sql).run(params.rowId);
            if (isAutoSave) {
                commitAndContinue(db);
            } else {
                markDirty(rpc, true);
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    terminalExec: async (params: { sql: string }): Promise<TerminalResult> => {
        try {
            const result = executeRawQuery(params.sql);
            if (!result.error && isAutoSave) {
                // If it was a mutation, commit it
                commitAndContinue(getDatabase());
            } else if (!result.error) {
                markDirty(rpc, true);
            }
            return result;
        } catch (e) {
            return { sql: params.sql, error: String(e) };
        }
    },

    tableCreate: async (params: { tableName: string; columns: ColumnDef[] }): Promise<OpResult> => {
        try {
            const { createTable } = await import("../db/queries");
            createTable(params.tableName, params.columns);
            if (isAutoSave) {
                commitAndContinue(getDatabase());
            } else {
                markDirty(rpc, true);
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    tableDrop: async (params: { tableName: string }): Promise<OpResult> => {
        try {
            const { dropTable } = await import("../db/queries");
            dropTable(params.tableName);
            if (isAutoSave) {
                commitAndContinue(getDatabase());
            } else {
                markDirty(rpc, true);
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    columnAdd: async (params: { tableName: string; column: ColumnDef }): Promise<OpResult> => {
        try {
            const { addColumn } = await import("../db/queries");
            addColumn(params.tableName, params.column);
            if (isAutoSave) {
                commitAndContinue(getDatabase());
            } else {
                markDirty(rpc, true);
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    columnDrop: async (params: { tableName: string; columnName: string }): Promise<OpResult> => {
        try {
            const { dropColumn } = await import("../db/queries");
            dropColumn(params.tableName, params.columnName);
            if (isAutoSave) {
                commitAndContinue(getDatabase());
            } else {
                markDirty(rpc, true);
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }
});
