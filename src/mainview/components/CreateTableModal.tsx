import { useState } from 'react';
import { Modal } from './Modal';
import { ValidatedInput } from './ValidatedInput';
import type { ColumnDef } from '../../shared/types';

interface CreateTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (tableName: string, columns: ColumnDef[]) => Promise<boolean>;
    existingTables: string[];
}

const COLUMN_TYPES = [
    "INTEGER", "TEXT", "REAL", "BLOB", "NUMERIC", "BOOLEAN", "DATETIME"
];

export function CreateTableModal({ isOpen, onClose, onCreate, existingTables }: CreateTableModalProps) {
    const [tableName, setTableName] = useState('');
    const [isTableValid, setIsTableValid] = useState(false);
    const [columns, setColumns] = useState<ColumnDef[]>([
        { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true }
    ]);

    const handleAddColumn = () => {
        setColumns([...columns, { name: `col_${columns.length}`, type: 'TEXT' }]);
    };

    const handleRemoveColumn = (index: number) => {
        setColumns(columns.filter((_, i) => i !== index));
    };

    const handleColumnChange = (index: number, field: keyof ColumnDef, value: any) => {
        const newCols = [...columns];
        newCols[index] = { ...newCols[index], [field]: value };
        
        // Ensure only INTEGER can be AUTOINCREMENT
        if (field === 'type' && value !== 'INTEGER') {
            newCols[index].autoIncrement = false;
        }

        setColumns(newCols);
    };

    const handleSubmit = async () => {
        console.log("[CreateTableModal] handleSubmit called", { tableName, isTableValid, columnsCount: columns.length });
        if (isTableValid && columns.length > 0) {
            console.log("[CreateTableModal] Calling onCreate...");
            const success = await onCreate(tableName, columns);
            console.log("[CreateTableModal] onCreate result:", success);
            if (success) {
                setTableName('');
                setColumns([{ name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true }]);
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Table">
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Table Name</label>
                    <ValidatedInput
                        value={tableName}
                        onChange={(val, valid) => {
                            setTableName(val);
                            setIsTableValid(valid);
                        }}
                        existingNames={existingTables}
                        placeholder="e.g. users, products..."
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Columns</label>
                        <button
                            onClick={handleAddColumn}
                            className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wider flex items-center space-x-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            <span>Add Column</span>
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {columns.map((col, idx) => (
                            <div key={idx} className="p-3 bg-neutral-950/50 border border-neutral-800 rounded-lg space-y-3 relative group">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-1">
                                        <ValidatedInput
                                            value={col.name}
                                            onChange={(val) => handleColumnChange(idx, 'name', val)}
                                            placeholder="Column name"
                                            existingNames={columns.filter((_, i) => i !== idx).map(c => c.name)}
                                            className="!bg-transparent !border-0 !border-b !rounded-none !px-0"
                                        />
                                    </div>
                                    <select
                                        value={col.type}
                                        onChange={(e) => handleColumnChange(idx, 'type', e.target.value)}
                                        className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs font-mono text-neutral-400 outline-none focus:border-emerald-500/30"
                                    >
                                        {COLUMN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <button
                                        onClick={() => handleRemoveColumn(idx)}
                                        className="p-1 text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-4 pt-1">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={col.primaryKey}
                                            onChange={(e) => handleColumnChange(idx, 'primaryKey', e.target.checked)}
                                            className="w-3 h-3 rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500/20"
                                        />
                                        <span className="text-[10px] text-neutral-500 font-medium pb-0.5">PK</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={col.notNull}
                                            onChange={(e) => handleColumnChange(idx, 'notNull', e.target.checked)}
                                            className="w-3 h-3 rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500/20"
                                        />
                                        <span className="text-[10px] text-neutral-500 font-medium pb-0.5">NOT NULL</span>
                                    </label>
                                    {col.type === 'INTEGER' && (
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={col.autoIncrement}
                                                onChange={(e) => handleColumnChange(idx, 'autoIncrement', e.target.checked)}
                                                className="w-3 h-3 rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500/20"
                                            />
                                            <span className="text-[10px] text-neutral-500 font-medium pb-0.5">AI</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex space-x-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 rounded-lg text-xs font-bold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isTableValid || columns.length === 0}
                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-900/10"
                    >
                        Create Table
                    </button>
                </div>
            </div>
        </Modal>
    );
}
