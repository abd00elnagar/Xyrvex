const RESERVED = new Set([
    "NOTNULL", "SELECT", "INSERT", "UPDATE", "DELETE", "FROM", "WHERE", "JOIN", 
    "INNER", "OUTER", "LEFT", "RIGHT", "GROUP", "ORDER", "BY", "AND", "OR", "NOT", 
    "AS", "ON", "DISTINCT", "COUNT", "SUM", "MAX", "MIN", "AVG", "ALL", "ANY", "IN",
    "LIKE", "IS", "NULL", "TRUE", "FALSE", "BETWEEN", "CASE", "WHEN", "THEN", "ELSE", 
    "END", "ASC", "DESC", "LIMIT", "OFFSET", "DATABASE", "TABLE", "COLUMN", "ROWID", 
    "PRAGMA", "WITH"
]);

const FORBIDDEN_CHARS = new Set([
    '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=', '{', '}', 
    '[', ']', ';', ':', '\'', '"', ',', '<', '>', '/', '?', '\\', '|', '`', ' '
]);

export function validateIdentifier(name: string, existingNames: string[] = []): string | null {
    const trimmed = name.trim();
    if (!trimmed) return "Name cannot be empty";
    if (/^\d/.test(trimmed)) return "Must not start with a digit";
    if (RESERVED.has(trimmed.toUpperCase())) return "Reserved keyword";
    if (existingNames.includes(trimmed)) return "Name already exists";
    
    for (const char of trimmed) {
        if (FORBIDDEN_CHARS.has(char)) return `Forbidden character: "${char}"`;
        if (char.charCodeAt(0) > 127) return "Non-ASCII characters not allowed";
    }
    
    return null;
}
