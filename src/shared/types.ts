// shared/types.ts
export interface AppSchema {
    bun: {
        requests: {
            dbOpen: { params: {}; response: OpenResult };
            dbOpenByPath: { params: { path: string }; response: OpenResult };
            dbCreate: { params: { filename: string }; response: OpenResult };
            autosaveSet: { params: { enabled: boolean }; response: OpResult };
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
            sessionGet: { params: {}; response: SessionData };
            dialogResponse: { params: { id: string; choice: number }; response: { ok: boolean } };
            snippetExport: { params: { snippet: SqlSnippet }; response: OpResult };
            objectsList: { params: {}; response: { objects: DbObject[] } };
            objectDrop: { params: { type: string; name: string }; response: OpResult };
            snippetsGet: { params: { dbPath: string | null }; response: { snippets: SqlSnippet[] } };
            snippetsSave: { params: { dbPath: string | null; snippets: SqlSnippet[] }; response: OpResult };
            settingsGet: { params: {}; response: AppSettings };
            settingsSave: { params: { settings: Partial<AppSettings> }; response: OpResult };
            schemaGet: { params: {}; response: FullSchema };
            positionsSave: { params: { dbPath: string; positions: Record<string, { x: number; y: number }> }; response: OpResult };
            positionsGet: { params: { dbPath: string }; response: { positions: Record<string, { x: number; y: number }> } };
        };
        messages: {};
    };
    webview: {
        requests: {};
        messages: {
            dbOpened: OpenResult;
            dbDirtyChanged: { isDirty: boolean };
            dialogRequest: {
                id: string;
                type: 'info' | 'warning' | 'error' | 'confirm' | 'success';
                title: string;
                message: string;
                detail?: string;
                buttons: string[];
                defaultId?: number;
                cancelId?: number;
            };
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

export interface ForeignKeyInfo {
    id: number;
    seq: number;
    table: string;
    from: string;
    to: string;
    onUpdate: string;
    onDelete: string;
    match: string;
}

export interface TableSchema {
    name: string;
    columns: ColumnInfo[];
    foreignKeys: ForeignKeyInfo[];
}

export interface FullSchema {
    tables: TableSchema[];
}

export interface TerminalResult {
    sql: string;
    columns?: string[];
    rows?: Row[];
    changes?: number;
    error?: string;
}

export interface AppSettings {
    theme: 'dark' | 'black' | 'light';
    accentColor: 'emerald' | 'blue' | 'purple';
    fontSizeSql: number;
    fontSizeTable: number;
    fontSizeUI: number;
    confirmDrop: boolean;
    autoRefresh: boolean;
}

export interface SessionData {
    lastOpenedPath: string | null;
    windowMaximized: boolean;
    autoSave: boolean;
    snippets?: Record<string, SqlSnippet[]>;
    schemaPositions?: Record<string, Record<string, { x: number; y: number }>>; // dbPath -> { tableName -> position }
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

export interface DbObject {
    type: 'trigger' | 'index' | 'view';
    name: string;
    tbl_name: string;
    sql: string;
}
