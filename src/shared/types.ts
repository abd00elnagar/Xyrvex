// shared/types.ts
import type { ElectrobunRPC } from "electrobun/shared";
export type AppRPC = ElectrobunRPC<AppSchema, any>;

export interface AppSchema {
    bun: {
        requests: {
            dbOpen: { params: {}; response: OpenResult };
            dbCreate: { params: { filename: string }; response: OpenResult };
            dbSave: { params: {}; response: OpResult };
            dbSaveAs: { params: { suggestedName: string }; response: OpResult };
            dbClose: { params: {}; response: OpResult };
            tableList: { params: {}; response: { tables: string[] } };
            tableFetchAll: { params: { tableName: string }; response: TableData };
            tableCreate: { params: { tableName: string; columns: ColumnDef[] }; response: OpResult };
            tableDrop: { params: { tableName: string }; response: OpResult };
            columnAdd: { params: { tableName: string; column: ColumnDef }; response: OpResult };
            columnDrop: { params: { tableName: string; columnName: string }; response: OpResult };
            rowInsert: { params: { tableName: string }; response: OpResult };
            rowDelete: { params: { tableName: string; rowId: number }; response: OpResult };
            cellUpdate: { params: { tableName: string; columnName: string; rowId: number; value: string | number | null }; response: OpResult };
            cellExec: { params: { sql: string; params: (string | number | null)[] }; response: OpResult };
            terminalExec: { params: { sql: string }; response: TerminalResult };
            dbOpenByPath: { params: { path: string }; response: OpenResult };
            autosaveSet: { params: { enabled: boolean }; response: OpResult };
            sessionGet: { params: {}; response: SessionData };
            snippetExport: { params: { snippet: SqlSnippet }; response: OpResult };
            snippetsGet: { params: { dbPath: string | null }; response: { snippets: SqlSnippet[] } };
            snippetsSave: { params: { dbPath: string | null; snippets: SqlSnippet[] }; response: OpResult };
        };
        messages: {};
    };
    webview: {
        requests: {};
        messages: {
            dbOpened: OpenResult;
            dbDirtyChanged: { isDirty: boolean };
            dbSaved: { dbPath: string | null; dbName: string };
            dbError: { message: string };
            menuAction: { action: string };
        };
    };
}

export interface OpResult {
    ok: boolean;
    error?: string;
}

export interface OpenResult extends OpResult {
    dbName: string;
    dbPath: string | null;
    tables: string[];
}

export interface ColumnInfo {
    cid: number;
    name: string;
    type: string;
    notNull: boolean;
    defaultValue: string | null;
    primaryKey: boolean;
}

export interface ColumnDef {
    name: string;
    type: string;
    primaryKey?: boolean;
    autoIncrement?: boolean;
    notNull?: boolean;
    defaultValue?: string;
}

export type Row = (string | number | null)[];
export type TableData = { columns: ColumnInfo[]; rows: Row[] };

export interface TerminalResult {
    sql: string;
    columns?: string[];
    rows?: Row[];
    changes?: number;
    error?: string;
}

export interface SessionData {
    lastOpenedPath: string | null;
    windowMaximized: boolean;
    autoSave: boolean;
    snippets?: Record<string, SqlSnippet[]>;
}

export interface CellEditRecord {
    tableName: string;
    columnName: string;
    rowId: number;
    oldValue: any;
    newValue: any;
    undoSql: string;
    undoParams: (string | number | null)[];
    redoSql: string;
    redoParams: (string | number | null)[];
}

export interface SqlSnippet {
    id: string;
    name: string;
    code: string;
}
