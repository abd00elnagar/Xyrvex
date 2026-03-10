import { getDatabase } from "./connection";
import type { ColumnInfo } from "../../shared/types";

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
