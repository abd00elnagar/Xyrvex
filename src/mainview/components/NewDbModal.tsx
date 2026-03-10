import React, { useState } from 'react';
import { Modal } from './Modal';

interface NewDbModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (filename: string) => void;
}

export function NewDbModal({ isOpen, onClose, onCreate }: NewDbModalProps) {
    const [filename, setFilename] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (filename.trim()) {
            onCreate(filename.trim());
            setFilename('');
            onClose(); // Close modal immediately
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Database">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Database Name</label>
                    <input
                        autoFocus
                        type="text"
                        placeholder="e.g. users, sales_data"
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
                        Create Database
                    </button>
                </div>
            </form>
        </Modal>
    );
}
