import { getDatabase } from "./connection";
import type { ColumnInfo, TableData } from "../../shared/types";

export function getTableNames(): string[] {
    const db = getDatabase();
    const query = db.query<{ name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    return query.all().map(row => row.name);
}

export function getTableInfo(tableName: string): ColumnInfo[] {
    const db = getDatabase();
    // pragma_table_info is useful for column details
    const rows = db.query<any, [string]>(`PRAGMA table_info("${tableName}")`).all(tableName);

    return rows.map(row => ({
        cid: row.cid,
        name: row.name,
        type: row.type,
        notNull: row.notnull === 1,
        defaultValue: row.dflt_value,
        primaryKey: row.pk === 1
    }));
}

export function executeRawQuery(sql: string): any {
    const db = getDatabase();
    try {
        const query = db.query(sql);
        const rows = query.all() as any[];
        return {
            sql,
            columns: rows.length > 0 ? Object.keys(rows[0]) : [],
            rows: rows.map(r => Object.values(r)) as any[][],
            changes: (db.query("SELECT total_changes() as total").get() as any)?.total || 0
        };
    } catch (e) {
        return { sql, error: String(e) };
    }
}

export function getTableData(tableName: string): TableData {
    const db = getDatabase();
    const columns = getTableInfo(tableName);

    try {
        // We explicitly include rowid for editing/deletion
        const rows = db.query(`SELECT rowid, * FROM "${tableName}"`).all() as any[];

        return {
            // Prepend rowid column metadata
            columns: [
                { cid: -1, name: 'rowid', type: 'INTEGER', notNull: true, primaryKey: false, defaultValue: null },
                ...columns
            ],
            rows: rows.map(r => Object.values(r))
        };
    } catch (e) {
        console.error(`Error fetching data for ${tableName}:`, e);
        return { columns, rows: [] };
    }
}
