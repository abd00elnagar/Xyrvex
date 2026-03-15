import { useState, useEffect, useRef } from 'react';
import type { TableData } from '../../shared/types';

interface DataTableProps {
    data: TableData;
    onCellUpdate?: (column: string, value: any, rowId: number) => void;
    onRowDelete?: (rowId: number) => void;
    onRowInsert?: () => void;
    onAddColumn?: () => void;
    onDropColumn?: (columnName: string) => void;
    fontSize?: number;
}

export function DataTable({ data, onCellUpdate, onRowDelete, onRowInsert, onAddColumn, onDropColumn, fontSize }: DataTableProps) {
    const [editingCell, setEditingCell] = useState<{ rowIndex: number, colIndex: number } | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingCell]);

    const handleDoubleClick = (rowIndex: number, colIndex: number, value: any) => {
        // Don't allow editing the rowid column itself
        if (data.columns[colIndex].name === 'rowid') return;

        setEditingCell({ rowIndex, colIndex });
        setEditValue(String(value ?? ''));
    };

    const handleBlur = () => {
        if (editingCell) {
            const oldValue = data.rows[editingCell.rowIndex][editingCell.colIndex];
            if (String(oldValue) !== editValue) {
                const column = data.columns[editingCell.colIndex].name;
                // rowid is the first column (index 0)
                const rowId = data.rows[editingCell.rowIndex][0] as number;
                onCellUpdate?.(column, editValue, rowId);
            }
            setEditingCell(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    const getTypeColor = (type: string) => {
        const t = type.toUpperCase();
        if (t.includes('INT')) return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
        if (t.includes('CHAR') || t.includes('TEXT')) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
        if (t.includes('REAL') || t.includes('DOUBLE') || t.includes('FLOAT') || t.includes('NUM')) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
        if (t.includes('BLOB')) return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
        return 'text-neutral-300 bg-neutral-800/20 border-neutral-700/50';
    };

    if (!data.columns.length) {
        return (
            <div className="flex-1 flex items-center justify-center text-neutral-500 italic text-sm">
                Select a table to view data
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-neutral-900/30 custom-scrollbar relative">
            <table className="w-full text-left border-collapse min-w-max">
                <thead className="sticky top-0 z-10 bg-neutral-900/90 backdrop-blur-md shadow-sm border-b border-neutral-800">
                    <tr>
                        {data.columns.map((col, i) => (
                            <th
                                key={i}
                                className={`px-4 py-3 border-b border-neutral-800 text-xs uppercase tracking-wider font-bold whitespace-nowrap ${col.name === 'rowid' ? 'text-neutral-200 w-16' : 'text-neutral-100'
                                    }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <span>{col.name}</span>
                                    {col.name !== 'rowid' && (
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${getTypeColor(col.type)} shadow-sm shadow-black/20`}>
                                                {col.type || 'RAW'}
                                            </span>
                                            {onDropColumn && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDropColumn(col.name); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-red-400 transition-all"
                                                    title="Drop Column"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {col.primaryKey && (
                                        <span className="text-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" title="Primary Key">🔑</span>
                                    )}
                                </div>
                            </th>
                        ))}
                        <th className="px-4 py-3 border-b border-neutral-800 w-10">
                            <button
                                onClick={onAddColumn}
                                className="p-1 hover:bg-emerald-500/20 text-neutral-500 hover:text-emerald-500 rounded transition-colors"
                                title="Add Column"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                    {data.rows.length === 0 ? (
                        <tr>
                            <td colSpan={data.columns.length + 1} className="px-4 py-8 text-center text-neutral-600 italic text-sm">
                                Table is empty
                            </td>
                        </tr>
                    ) : (
                        data.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="group hover:bg-neutral-800/10 transition-colors">
                                {row.map((cell, colIndex) => {
                                    const isRowId = data.columns[colIndex].name === 'rowid';
                                    return (
                                        <td
                                            key={colIndex}
                                            className={`px-4 py-2 text-sm border-r border-neutral-800/30 font-mono relative ${isRowId ? 'text-neutral-300 bg-neutral-700/10' : 'text-neutral-100'
                                                } ${editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex
                                                    ? 'bg-emerald-500/10' : ''
                                                }`}
                                            style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
                                            onDoubleClick={() => handleDoubleClick(rowIndex, colIndex, cell)}
                                        >
                                            {editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex ? (
                                                <input
                                                    ref={inputRef}
                                                    className="absolute inset-0 w-full h-full bg-emerald-500/20 text-emerald-400 outline-none px-4 font-mono z-20 border-2 border-emerald-500/50 shadow-[inset_0_0_12px_rgba(16,185,129,0.2)]"
                                                    style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={handleBlur}
                                                    onKeyDown={handleKeyDown}
                                                />
                                            ) : (
                                                <div className="truncate max-w-[300px]" title={String(cell)}>
                                                    {cell === null ? (
                                                        <span className="text-amber-500/80 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px] select-none border border-amber-500/20 tracking-widest">NULL</span>
                                                    ) : (
                                                        String(cell)
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="px-2 py-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onRowDelete?.(row[0] as number)}
                                        className="p-1 hover:bg-red-500/20 text-neutral-600 hover:text-red-500 rounded transition-colors"
                                        title="Delete Row"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            
            {/* Add Row Button at the bottom */}
            <div className="p-4 flex justify-center border-t border-neutral-800/30 bg-neutral-900/10">
                <button
                    onClick={onRowInsert}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-neutral-800/10 hover:bg-emerald-500/10 text-neutral-400 hover:text-emerald-500 rounded-xl text-xs font-bold transition-all border border-neutral-800/50 hover:border-emerald-500/30 group shadow-sm active:scale-95"
                >
                    <svg className="w-4 h-4 text-neutral-500 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="tracking-wide">Add New Row</span>
                </button>
            </div>
        </div>
    );
}
