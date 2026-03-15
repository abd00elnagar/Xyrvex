import { useState } from 'react';
import { Modal } from './Modal';
import { ValidatedInput } from './ValidatedInput';
import type { ColumnDef } from '../../shared/types';

interface AddColumnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (column: ColumnDef) => Promise<boolean>;
    existingColumns: string[];
}

const COLUMN_TYPES = [
    "INTEGER", "TEXT", "REAL", "BLOB", "NUMERIC", "BOOLEAN", "DATETIME"
];

export function AddColumnModal({ isOpen, onClose, onAdd, existingColumns }: AddColumnModalProps) {
    const [colName, setColName] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [type, setType] = useState('TEXT');
    const [notNull, setNotNull] = useState(false);
    const [defaultValue, setDefaultValue] = useState('');

    const handleSubmit = async () => {
        console.log("[AddColumnModal] handleSubmit called", { colName, isValid });
        if (isValid) {
            console.log("[AddColumnModal] Calling onAdd...");
            const success = await onAdd({
                name: colName,
                type: type,
                notNull: notNull,
                defaultValue: defaultValue || undefined
            });
            console.log("[AddColumnModal] onAdd result:", success);
            if (success) {
                setColName('');
                setIsValid(false);
                setType('TEXT');
                setNotNull(false);
                setDefaultValue('');
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Column">
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Column Name</label>
                    <ValidatedInput
                        value={colName}
                        onChange={(val, valid) => {
                            setColName(val);
                            setIsValid(valid);
                        }}
                        existingNames={existingColumns}
                        placeholder="e.g. email, created_at..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm font-mono text-neutral-200 outline-none focus:border-emerald-500/50"
                        >
                            {COLUMN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Settings</label>
                        <label className="flex items-center space-x-2 h-9 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notNull}
                                onChange={(e) => setNotNull(e.target.checked)}
                                className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-emerald-500/20"
                            />
                            <span className="text-xs text-neutral-400 font-medium">NOT NULL</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Default Value (Optional)</label>
                    <input
                        type="text"
                        value={defaultValue}
                        onChange={(e) => setDefaultValue(e.target.value)}
                        placeholder="e.g. 0, 'active', CURRENT_TIMESTAMP"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm font-mono text-neutral-200 outline-none focus:border-emerald-500/50"
                    />
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
                        disabled={!isValid}
                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-900/10"
                    >
                        Add Column
                    </button>
                </div>
            </div>
        </Modal>
    );
}
