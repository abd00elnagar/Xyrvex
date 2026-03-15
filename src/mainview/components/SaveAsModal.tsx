import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';

interface SaveAsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (filename: string) => void;
    currentDbName: string;
}

export function SaveAsModal({ isOpen, onClose, onSave, currentDbName }: SaveAsModalProps) {
    const [filename, setFilename] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Suggest a copy name based on the current db
            if (!currentDbName || currentDbName === "No database open") {
                setFilename('new-database');
            } else {
                const baseName = currentDbName.replace(/\.sqlite3$|\.sqlite$|\.db$/i, '');
                setFilename(baseName ? `${baseName}-copy` : 'new-database');
            }
        }
    }, [isOpen, currentDbName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (filename.trim()) {
            onSave(filename.trim());
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Save Database As">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">New Database Name</label>
                    <input
                        autoFocus
                        type="text"
                        placeholder="e.g. users-copy, backup_01"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2.5 px-4 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-neutral-700 font-medium"
                    />
                </div>
                <div className="flex space-x-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold transition-all border border-neutral-700 ring-offset-neutral-900 focus:ring-2 focus:ring-neutral-500/20"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!filename.trim()}
                        className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-emerald-900/10 ring-offset-neutral-900 focus:ring-2 focus:ring-emerald-500/40"
                    >
                        Choose Location
                    </button>
                </div>
            </form>
        </Modal>
    );
}
