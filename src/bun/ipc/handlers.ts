import { Utils } from "electrobun/bun";
import { openDatabase, getCurrentDbPath, isValidDatabase } from "../db/connection";
import { getTableNames, executeRawQuery, getTableData } from "../db/queries";
import type { AppRPC, OpenResult, OpResult, TerminalResult } from "../../shared/types";
import { basename, join } from "node:path";

// We'll pass the RPC instance from index.ts to enable push messages
export const createDbHandlers = (rpc: AppRPC) => ({
    dbOpen: async (): Promise<OpenResult> => {
        console.log("[dbHandlers] dbOpen: Opening file dialog...");

        const filePaths = await Utils.openFileDialog({
            canChooseFiles: true,
            canChooseDirectory: false,
            allowsMultipleSelection: false,
            allowedFileTypes: "db;sqlite;sqlite3"
        });

        console.log(`[dbHandlers] dbOpen: result = ${JSON.stringify(filePaths)}`);

        if (!filePaths || filePaths.length === 0 || filePaths[0] === "" || filePaths[0] === "undefined") {
            console.log("[dbHandlers] dbOpen: No file selected or user cancelled.");
            return { ok: false, error: "No file selected", dbName: "", dbPath: null, tables: [] };
        }

        const path = filePaths[0].trim();
        console.log(`[dbHandlers] dbOpen: Path selected: "${path}"`);

        try {
            console.log(`[dbHandlers] dbOpen: Calling openDatabase("${path}")`);
            openDatabase(path);
            console.log(`[dbHandlers] dbOpen: Database opened. Fetching tables...`);
            const tables = getTableNames();
            console.log(`[dbHandlers] dbOpen: Tables fetched: ${JSON.stringify(tables)}`);
            const response = {
                ok: true,
                dbName: basename(path),
                dbPath: path,
                tables
            };

            // Push the update to the webview immediately
            console.log(`[dbHandlers] dbOpen: Pushing dbOpened message to webview...`);
            rpc.send.dbOpened(response);

            console.log(`[dbHandlers] dbOpen: Returning response: ${JSON.stringify(response)}`);
            return response;
        } catch (e) {
            console.error(`[dbHandlers] dbOpen Error: ${e}`);
            return { ok: false, error: String(e), dbName: "", dbPath: null, tables: [] };
        }
    },

    dbCreate: async (params: { filename: string }): Promise<OpenResult> => {
        const { filename } = params;
        console.log(`[dbHandlers] dbCreate: Starting process with filename: "${filename}"`);

        if (!filename) {
            return { ok: false, error: "No filename provided", dbName: "", dbPath: null, tables: [] };
        }

        const finalFilename = filename.toLowerCase().endsWith(".db") ? filename : `${filename}.db`;
        console.log(`[dbHandlers] dbCreate: Final filename will be: "${finalFilename}"`);

        console.log("[dbHandlers] dbCreate: Prompting for folder selection...");
        const filePaths = await Utils.openFileDialog({
            canChooseFiles: false,
            canChooseDirectory: true,
            allowsMultipleSelection: false
        });

        console.log(`[dbHandlers] dbCreate: Folder selection result = ${JSON.stringify(filePaths)}`);

        if (!filePaths || filePaths.length === 0 || filePaths[0] === "" || filePaths[0] === "undefined") {
            console.log("[dbHandlers] dbCreate: No folder selected or user cancelled.");
            return { ok: false, error: "No location selected", dbName: "", dbPath: null, tables: [] };
        }

        const folderPath = filePaths[0].trim();
        const path = join(folderPath, finalFilename);
        console.log(`[dbHandlers] dbCreate: Full target path: "${path}"`);

        try {
            console.log(`[dbHandlers] dbCreate: Initializing database at "${path}"...`);
            openDatabase(path);
            const response = {
                ok: true,
                dbName: basename(path),
                dbPath: path,
                tables: []
            };

            // Push the update to the webview immediately
            console.log(`[dbHandlers] dbCreate: Pushing dbOpened message to webview...`);
            rpc.send.dbOpened(response);

            console.log("[dbHandlers] dbCreate: Success!");
            return response;
        } catch (e) {
            console.error(`[dbHandlers] dbCreate Error: ${e}`);
            return { ok: false, error: String(e), dbName: "", dbPath: null, tables: [] };
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

    cellUpdate: async (params: { tableName: string; column: string; value: any; rowId: number }): Promise<OpResult> => {
        try {
            const sql = `UPDATE "${params.tableName}" SET "${params.column}" = ? WHERE rowid = ?`;
            const db = openDatabase(getCurrentDbPath() || ""); // Ensure connection
            db.query(sql).run(params.value, params.rowId);
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    rowDelete: async (params: { tableName: string; rowId: number }): Promise<OpResult> => {
        try {
            const sql = `DELETE FROM "${params.tableName}" WHERE rowid = ?`;
            const db = openDatabase(getCurrentDbPath() || "");
            db.query(sql).run(params.rowId);
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    },

    terminalExec: async (params: { sql: string }): Promise<TerminalResult> => {
        try {
            return executeRawQuery(params.sql);
        } catch (e) {
            return { sql: params.sql, error: String(e) };
        }
    }
});
