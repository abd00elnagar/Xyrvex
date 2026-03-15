import { useState } from 'react';

interface SidebarProps {
    tables: string[];
    onSelectTable: (tableName: string) => void;
    activeTable: string | null;
    onOpenDb: () => void;
    onNewDb: () => void;
    onAddTable: () => void;
    onDropTable: (tableName: string) => void;
}

export function Sidebar({ tables, onSelectTable, activeTable, onOpenDb, onNewDb, onAddTable, onDropTable }: SidebarProps) {
    const [isTablesOpen, setIsTablesOpen] = useState(true);

    return (
        <aside className="w-64 border-r border-neutral-800 flex flex-col bg-neutral-950 flex-shrink-0">
            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                
                {/* Tables Group */}
                <div className="space-y-1">
                    <button 
                        onClick={() => setIsTablesOpen(!isTablesOpen)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest hover:text-neutral-300 transition-colors group"
                    >
                        <div className="flex items-center space-x-1.5">
                            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isTablesOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <span>Tables ({tables.length})</span>
                        </div>
                    </button>
                    
                    {isTablesOpen && (
                        <div className="pl-4 space-y-0.5">
                            {tables.length === 0 ? (
                                <div className="px-2 py-3 text-xs text-neutral-600 italic">
                                    No tables.
                                </div>
                            ) : (
                                tables.map(table => (
                                    <div key={table} className="group flex items-stretch">
                                        <button
                                            onClick={() => onSelectTable(table)}
                                            className={`flex-1 text-left px-3 py-1.5 rounded-l text-sm transition-all duration-200 flex items-center space-x-2 border-l border-t border-b ${
                                                activeTable === table
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 border-transparent'
                                            }`}
                                        >
                                            <svg className={`w-3.5 h-3.5 opacity-50 flex-shrink-0 ${activeTable === table ? 'text-emerald-400' : 'text-neutral-500 group-hover:text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 11h16m-16 4h16" />
                                            </svg>
                                            <span className="truncate">{table}</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDropTable(table);
                                            }}
                                            className={`px-2 flex items-center justify-center rounded-r transition-all duration-200 border-r border-t border-b ${
                                                activeTable === table 
                                                ? 'opacity-100 bg-emerald-500/10 border-emerald-500/20 text-emerald-500/70 hover:text-red-500' 
                                                : 'opacity-0 group-hover:opacity-100 hover:bg-neutral-800/50 border-transparent text-neutral-600 hover:text-red-500'
                                            }`}
                                            title="Drop Table"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))
                            )}
                            
                            {/* Add Table Button */}
                            <button
                                onClick={onAddTable}
                                className="w-full mt-1 flex items-center space-x-2 px-3 py-1.5 text-xs text-neutral-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors group"
                            >
                                <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add New Table</span>
                            </button>
                        </div>
                    )}
                </div>

            </div>

            <div className="p-3 border-t border-neutral-900 bg-neutral-950/80 space-y-2">
                <button
                    onClick={onNewDb}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded text-xs font-semibold transition-all border border-emerald-500/20"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    <span>New Database</span>
                </button>
                <button
                    onClick={onOpenDb}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded text-xs font-semibold transition-all border border-neutral-800"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    <span>Open Database</span>
                </button>
            </div>
        </aside>
    );
}
