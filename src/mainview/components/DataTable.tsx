import { useState, useEffect, useRef } from 'react';
import type { TableData } from '../../shared/types';

interface DataTableProps {
    tableName: string;
    data: TableData;
    onCellUpdate?: (column: string, value: any, rowId: number) => void;
    onRowDelete?: (rowId: number) => void;
}

export function DataTable({ tableName, data, onCellUpdate, onRowDelete }: DataTableProps) {
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
                <thead className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur-md shadow-sm">
                    <tr>
                        {data.columns.map((col, i) => (
                            <th
                                key={i}
                                className={`px-4 py-3 border-b border-neutral-800 text-[10px] uppercase tracking-wider font-bold whitespace-nowrap ${col.name === 'rowid' ? 'text-neutral-500 w-16' : 'text-neutral-500'
                                    }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <span>{col.name}</span>
                                    {col.name !== 'rowid' && (
                                        <span className="text-[8px] opacity-30 font-mono lower">{col.type}</span>
                                    )}
                                    {col.primaryKey && (
                                        <span className="text-emerald-500/50" title="Primary Key">🔑</span>
                                    )}
                                </div>
                            </th>
                        ))}
                        <th className="px-4 py-3 border-b border-neutral-800 w-10"></th>
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
                            <tr key={rowIndex} className="group hover:bg-white/5 transition-colors">
                                {row.map((cell, colIndex) => {
                                    const isRowId = data.columns[colIndex].name === 'rowid';
                                    return (
                                        <td
                                            key={colIndex}
                                            className={`px-4 py-2 text-sm border-r border-neutral-800/30 font-mono relative ${isRowId ? 'text-neutral-700 bg-neutral-950/20' : 'text-neutral-300'
                                                } ${editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex
                                                    ? 'bg-emerald-500/5' : ''
                                                }`}
                                            onDoubleClick={() => handleDoubleClick(rowIndex, colIndex, cell)}
                                        >
                                            {editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex ? (
                                                <input
                                                    ref={inputRef}
                                                    className="absolute inset-0 w-full h-full bg-emerald-500/10 text-emerald-400 outline-none px-4 font-mono z-20"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={handleBlur}
                                                    onKeyDown={handleKeyDown}
                                                />
                                            ) : (
                                                <div className="truncate max-w-[300px]" title={String(cell)}>
                                                    {cell === null ? (
                                                        <span className="text-neutral-700 italic opacity-50">NULL</span>
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
        </div>
    );
}
