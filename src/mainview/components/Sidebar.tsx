interface SidebarProps {
    tables: string[];
    onSelectTable: (tableName: string) => void;
    activeTable: string | null;
    onOpenDb: () => void;
}

export function Sidebar({ tables, onSelectTable, activeTable, onOpenDb }: SidebarProps) {
    return (
        <aside className="w-64 border-r border-neutral-800 flex flex-col bg-neutral-950 flex-shrink-0">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
                <h2 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Tables</h2>
                <div className="flex space-x-1">
                    <button
                        onClick={onOpenDb}
                        className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 transition-colors"
                        title="Open Database"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                {tables.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-neutral-600 italic leading-relaxed">
                        No tables found. <br />Open a database or run a CREATE TABLE query.
                    </div>
                ) : (
                    tables.map(table => (
                        <button
                            key={table}
                            onClick={() => onSelectTable(table)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-all duration-200 group flex items-center space-x-2 ${activeTable === table
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 border border-transparent'
                                }`}
                        >
                            <svg className={`w-4 h-4 opacity-50 ${activeTable === table ? 'text-emerald-400' : 'text-neutral-500 group-hover:text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 11h16m-16 4h16" />
                            </svg>
                            <span className="truncate">{table}</span>
                        </button>
                    ))
                )}
            </div>

            <div className="p-3 border-t border-neutral-900 bg-neutral-950/80">
                <button
                    onClick={onOpenDb}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded text-xs font-semibold transition-all border border-neutral-800"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    <span>Open Database</span>
                </button>
            </div>
        </aside>
    );
}
