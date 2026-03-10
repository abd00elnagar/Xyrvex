import { Utils } from "electrobun/bun";
import { openDatabase, getCurrentDbPath, isValidDatabase } from "../db/connection";
import { getTableNames } from "../db/queries";
import type { AppRPC, OpenResult, OpResult } from "../../shared/types";
import { basename } from "node:path";

export const dbHandlers = {
    dbOpen: async (): Promise<OpenResult> => {
        const filePaths = await Utils.openFileDialog({
            canChooseFiles: true,
            canChooseDirectory: false,
            allowsMultipleSelection: false,
            allowedFileTypes: "db,sqlite,sqlite3"
        });

        if (!filePaths || filePaths.length === 0 || filePaths[0] === "") {
            return { ok: false, error: "No file selected", dbName: "", dbPath: null, tables: [] };
        }

        const path = filePaths[0];

        try {
            openDatabase(path);
            const tables = getTableNames();
            return {
                ok: true,
                dbName: basename(path),
                dbPath: path,
                tables
            };
        } catch (e) {
            return { ok: false, error: String(e), dbName: "", dbPath: null, tables: [] };
        }
    },

    dbCreate: async (): Promise<OpenResult> => {
        // Electrobun doesn't have a saveFileDialog yet based on Utils.ts, 
        // but we can use openFileDialog for a folder or just ask for a path.
        // For now, let's use a message box to explain or a simplified approach.
        // Actually, many SQLite editors just open an existing one or create at a known path.
        // Let's assume for now creating is just opening a new file path.

        const { response } = await Utils.showMessageBox({
            type: "question",
            title: "Create Database",
            message: "Select a location for the new SQLite database file.",
            buttons: ["Select Location", "Cancel"]
        });

        if (response !== 0) {
            return { ok: false, error: "Cancelled", dbName: "", dbPath: null, tables: [] };
        }

        const filePaths = await Utils.openFileDialog({
            canChooseFiles: false, // Let them choose folder
            canChooseDirectory: true,
            allowsMultipleSelection: false
        });

        if (!filePaths || filePaths.length === 0 || filePaths[0] === "") {
            return { ok: false, error: "No location selected", dbName: "", dbPath: null, tables: [] };
        }

        const path = `${filePaths[0]}/new_database.db`; // Simplified for now

        try {
            openDatabase(path);
            return {
                ok: true,
                dbName: basename(path),
                dbPath: path,
                tables: []
            };
        } catch (e) {
            return { ok: false, error: String(e), dbName: "", dbPath: null, tables: [] };
        }
    },

    tableList: async (): Promise<{ tables: string[] }> => {
        try {
            return { tables: getTableNames() };
        } catch (e) {
            return { tables: [] };
        }
    }
};
