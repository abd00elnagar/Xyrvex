import { getDatabase } from "./connection";
import type { ColumnInfo, TableData, ColumnDef, ForeignKeyInfo, TableSchema, FullSchema } from "../../shared/types";

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

export function getForeignKeys(tableName: string): ForeignKeyInfo[] {
    const db = getDatabase();
    const rows = db.query<any, [string]>(`PRAGMA foreign_key_list("${tableName}")`).all(tableName);

    return rows.map(row => ({
        id: row.id,
        seq: row.seq,
        table: row.table,
        from: row.from,
        to: row.to,
        onUpdate: row.on_update,
        onDelete: row.on_delete,
        match: row.match
    }));
}

export function getFullSchema(): FullSchema {
    const tableNames = getTableNames();
    const tables: TableSchema[] = tableNames.map(name => ({
        name,
        columns: getTableInfo(name),
        foreignKeys: getForeignKeys(name)
    }));

    return { tables };
}

export function executeRawQuery(sql: string): any {
    const db = getDatabase();
    try {
        // Naive split by semicolon that ignores semicolons inside single quotes
        const statements = sql
            .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (statements.length === 0) {
            return { sql, columns: [], rows: [], changes: 0 };
        }

        let lastResult: any = null;
        for (const stmt of statements) {
            // Check if it's a SELECT or PRAGMA (query returns data)
            const isQuery = /^\s*(SELECT|PRAGMA|WITH|SHOW|DESCRIBE|EXPLAIN)/i.test(stmt);
            
            if (isQuery) {
                const query = db.query(stmt);
                lastResult = {
                    sql: stmt,
                    columns: query.columnNames,
                    rows: query.values() as any[][]
                };
            } else {
                // For DDL/DML, use .run() which is the correct way in bun:sqlite to execute changes
                db.run(stmt);
                lastResult = {
                    sql: stmt,
                    columns: [],
                    rows: []
                };
            }
        }

        return {
            ...lastResult,
            fullSql: sql,
            changes: (db.query("SELECT total_changes() as total").get() as any)?.total || 0
        };
    } catch (e) {
        console.error(`[queries] executeRawQuery Error: ${e}`);
        return { sql, error: String(e) };
    }
}

export function getTableData(tableName: string): TableData {
    const db = getDatabase();
    const columns = getTableInfo(tableName);

    try {
        // We explicitly include rowid for editing/deletion
        // Using .values() guarantees that column order matches SELECT clause
        // SELECT rowid, * results in [rowid, col1, col2, ...]
        const rows = db.query(`SELECT rowid, * FROM "${tableName}"`).values() as any[][];

        return {
            // Prepend rowid column metadata
            columns: [
                { cid: -1, name: 'rowid', type: 'INTEGER', notNull: true, primaryKey: false, defaultValue: null },
                ...columns
            ],
            rows
        };
    } catch (e) {
        console.error(`Error fetching data for ${tableName}:`, e);
        return { columns, rows: [] };
    }
}
export function insertDefaultRow(tableName: string): void {
    const db = getDatabase();
    const columns = getTableInfo(tableName);
    
    // Filter out rowid and any columns that are auto-increment (which have no default in PRAGMA but handle themselves)
    // Actually, SQLite's INSERT INTO ... DEFAULT VALUES handles most cases, 
    // but the original plan wanted explicit default resolution for NOT NULL columns.
    
    // Let's try explicit INSERT to control defaults
    const colsToInsert: string[] = [];
    const values: any[] = [];
    const placeholders: string[] = [];

    for (const col of columns) {
        if (col.primaryKey && col.type.toUpperCase() === 'INTEGER') continue; // Skip autoincrement PKs
        
        colsToInsert.push(`"${col.name}"`);
        placeholders.push('?');

        if (col.defaultValue !== null) {
            // Strip quotes if any (e.g. 'val' -> val)
            let val = col.defaultValue;
            if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
                val = val.substring(1, val.length -1);
            }
            values.push(val);
        } else if (col.notNull) {
            // Provide sensible defaults for NOT NULL columns
            const type = col.type.toUpperCase();
            if (type.includes("INT") || type.includes("FLOAT") || type.includes("DOUBLE") || type.includes("DECIMAL") || type.includes("NUMERIC")) {
                values.push(0);
            } else {
                values.push("");
            }
        } else {
            values.push(null);
        }
    }

    if (colsToInsert.length === 0) {
        db.run(`INSERT INTO "${tableName}" DEFAULT VALUES;`);
    } else {
        const sql = `INSERT INTO "${tableName}" (${colsToInsert.join(', ')}) VALUES (${placeholders.join(', ')});`;
        db.prepare(sql).run(...values);
    }
}

export function createTable(tableName: string, columns: ColumnDef[]): void {
    const db = getDatabase();
    const colStrings = columns.map(col => {
        let s = `"${col.name}" ${col.type}`;
        if (col.primaryKey) s += " PRIMARY KEY";
        if (col.autoIncrement) s += " AUTOINCREMENT";
        if (col.notNull) s += " NOT NULL";
        if (col.defaultValue !== undefined && col.defaultValue !== null) {
            s += ` DEFAULT '${col.defaultValue}'`;
        }
        return s;
    });

    const sql = `CREATE TABLE "${tableName}" (${colStrings.join(", ")});`;
    db.run(sql);
}

export function dropTable(tableName: string): void {
    const db = getDatabase();
    db.run(`DROP TABLE "${tableName}";`);
}

export function addColumn(tableName: string, column: ColumnDef): void {
    const db = getDatabase();
    let s = `"${column.name}" ${column.type}`;
    if (column.notNull) s += " NOT NULL";
    if (column.defaultValue !== undefined && column.defaultValue !== null) {
        s += ` DEFAULT '${column.defaultValue}'`;
    }
    
    db.run(`ALTER TABLE "${tableName}" ADD COLUMN ${s};`);
}

export function dropColumn(tableName: string, columnName: string): void {
    const db = getDatabase();
    // SQLite 3.35.0+ supports DROP COLUMN
    db.run(`ALTER TABLE "${tableName}" DROP COLUMN "${columnName}";`);
}
