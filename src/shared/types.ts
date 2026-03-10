export type AppRPC = {
    requests: {
        dbOpen: (params: {}) => Promise<OpenResult>;
        dbCreate: (params: {}) => Promise<OpenResult>;
        dbSave: (params: {}) => Promise<OpResult>;
        dbSaveAs: (params: { suggestedName: string }) => Promise<OpResult>;
        dbClose: (params: {}) => Promise<OpResult>;
        tableList: (params: {}) => Promise<{ tables: string[] }>;
        tableFetchAll: (params: { tableName: string }) => Promise<TableData>;
        tableCreate: (params: { tableName: string; columns: ColumnDef[] }) => Promise<OpResult>;
        tableDrop: (params: { tableName: string }) => Promise<OpResult>;
        columnAdd: (params: { tableName: string; column: ColumnDef }) => Promise<OpResult>;
        columnDrop: (params: { tableName: string; columnName: string }) => Promise<OpResult>;
        rowInsert: (params: { tableName: string }) => Promise<OpResult>;
        rowDelete: (params: { tableName: string; rowId: number }) => Promise<OpResult>;
        cellUpdate: (params: { tableName: string; columnName: string; rowId: number; value: string | number | null }) => Promise<OpResult>;
        cellExec: (params: { sql: string; params: (string | number | null)[] }) => Promise<OpResult>;
        terminalExec: (params: { sql: string }) => Promise<TerminalResult>;
        autosaveSet: (params: { enabled: boolean }) => Promise<OpResult>;
        sessionGet: (params: {}) => Promise<SessionData>;
    };
    messages: {
        dbDirtyChanged: { isDirty: boolean };
        dbSaved: { dbPath: string | null; dbName: string };
        dbError: { message: string };
    };
};

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
}
