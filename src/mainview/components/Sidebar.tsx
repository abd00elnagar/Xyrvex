import { useState } from 'react';
import { DbObject, SqlSnippet } from '../../shared/types';

interface SidebarProps {
    tables: string[];
    onSelectTable: (tableName: string) => void;
    activeTable: string | null;
    onOpenDb: () => void;
    onNewDb: () => void;
    onAddTable: () => void;
    onDropTable: (tableName: string) => void;
    // Objects
    objects: DbObject[];
    activeObject: DbObject | null;
    onSelectObject: (object: DbObject | null) => void;
    onRefreshObjects: () => void;
    onAddObject: (type: 'trigger' | 'index' | 'view', tableName?: string) => void;
    // Snippets
    snippets: SqlSnippet[];
    activeSnippetId: string | null;
    onSelectSnippet: (id: string) => void;
    onAddSnippet: () => void;
    onImportSnippet: () => void;
    onExportSnippet: (snippet: SqlSnippet) => void;
    onDeleteSnippet: (id: string) => void;
    onRenameSnippet: (id: string, newName: string) => void;
    // Resizing
    width: number;
    onResizeStart: () => void;
    onOpenSettings: () => void;
}

export function Sidebar({ 
    tables, onSelectTable, activeTable, onOpenDb, onNewDb, onAddTable, onDropTable,
    objects, activeObject, onSelectObject, onRefreshObjects, onAddObject,
    snippets, activeSnippetId, onSelectSnippet, onAddSnippet, onImportSnippet, onExportSnippet, onDeleteSnippet, onRenameSnippet,
    width, onResizeStart, onOpenSettings
}: SidebarProps) {
    const [isTablesOpen, setIsTablesOpen] = useState(true);
    const [isObjectsOpen, setIsObjectsOpen] = useState(true);
    const [isSnippetsOpen, setIsSnippetsOpen] = useState(true);
    
    // Nested object toggle state
    const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({
        trigger: true,
        index: true,
        view: true
    });
    const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

    const toggleType = (type: string) => setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));
    const toggleTable = (table: string) => setExpandedTables(prev => ({ ...prev, [table]: !prev[table] }));
    
    // Snippet Renaming State
    const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const handleSnippetRenameSubmit = (id: string) => {
        if (editingSnippetId === id) {
            if (editingName.trim()) {
                onRenameSnippet(id, editingName.trim());
            }
            setEditingSnippetId(null);
        }
    };

    return (
        <aside 
            className="border-r border-neutral-800 flex flex-col bg-neutral-950 flex-shrink-0 relative group/sidebar"
            style={{ width: `${width}px` }}
        >
            {/* Resize Handle */}
            <div 
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-50 hover:bg-emerald-500/50 transition-colors"
                onMouseDown={(e) => {
                    e.preventDefault();
                    onResizeStart();
                }}
            />
            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                
                {/* Tables Group */}
                <div className="space-y-1">
                    <button 
                        onClick={() => setIsTablesOpen(!isTablesOpen)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold text-neutral-400 uppercase tracking-widest hover:text-neutral-200 transition-colors group"
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
                                className="w-full mt-1 flex items-center space-x-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors group"
                            >
                                <svg className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add New Table</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* SQL Snippets Group */}
                <div className="space-y-1 mt-4">
                    <button 
                        onClick={() => setIsSnippetsOpen(!isSnippetsOpen)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold text-neutral-400 uppercase tracking-widest hover:text-neutral-200 transition-colors group"
                    >
                        <div className="flex items-center space-x-1.5">
                            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isSnippetsOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <span>Snippets ({snippets?.length || 0})</span>
                        </div>
                    </button>
                    
                    {isSnippetsOpen && (
                        <div className="pl-4 space-y-0.5">
                            {!snippets || snippets.length === 0 ? (
                                <div className="px-2 py-3 text-xs text-neutral-600 italic">
                                    No snippets.
                                </div>
                            ) : (
                                snippets.map(snippet => (
                                    <div key={snippet.id} className="group flex items-stretch">
                                        <button
                                            onClick={() => onSelectSnippet(snippet.id)}
                                            onDoubleClick={() => {
                                                setEditingSnippetId(snippet.id);
                                                setEditingName(snippet.name);
                                            }}
                                            className={`flex-1 text-left px-3 py-1.5 rounded-l text-sm transition-all duration-200 flex items-center space-x-2 border-l border-t border-b overflow-hidden relative ${
                                                activeSnippetId === snippet.id
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 border-transparent'
                                            }`}
                                        >
                                            <svg className={`w-3.5 h-3.5 opacity-50 flex-shrink-0 ${activeSnippetId === snippet.id ? 'text-blue-400' : 'text-neutral-500 group-hover:text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                            </svg>
                                            {editingSnippetId === snippet.id ? (
                                                <input
                                                    autoFocus
                                                    className="absolute inset-0 w-full h-full bg-blue-500/20 text-blue-400 outline-none px-9 font-sans z-20 border-2 border-blue-500/50 shadow-[inset_0_0_12px_rgba(59,130,246,0.2)] placeholder-blue-500/50"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onBlur={() => handleSnippetRenameSubmit(snippet.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSnippetRenameSubmit(snippet.id);
                                                        else if (e.key === 'Escape') setEditingSnippetId(null);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()} // Prevent triggering select
                                                />
                                            ) : (
                                                <span className="truncate">{snippet.name}</span>
                                            )}
                                        </button>
                                        <div className={`flex rounded-r overflow-hidden transition-all duration-200 border-r border-t border-b ${
                                            activeSnippetId === snippet.id
                                            ? 'bg-blue-500/10 border-blue-500/20'
                                            : 'bg-neutral-900 border-transparent group-hover:border-neutral-800 opacity-0 group-hover:opacity-100'
                                        }`}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onExportSnippet(snippet);
                                                }}
                                                className={`px-1.5 transition-colors ${
                                                    activeSnippetId === snippet.id
                                                    ? 'text-blue-500/70 hover:text-emerald-400 hover:bg-blue-500/20'
                                                    : 'text-neutral-500 hover:text-emerald-400 hover:bg-neutral-800'
                                                }`}
                                                title="Export Snippet"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteSnippet(snippet.id);
                                                }}
                                                className={`px-1.5 transition-colors ${
                                                    activeSnippetId === snippet.id
                                                    ? 'text-blue-500/70 hover:text-red-500 hover:bg-blue-500/20'
                                                    : 'text-neutral-500 hover:text-red-500 hover:bg-neutral-800'
                                                }`}
                                                title="Delete Snippet"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                            
                            <div className="flex space-x-1 mt-1">
                                <button
                                    onClick={onAddSnippet}
                                    className="flex-1 flex items-center justify-center space-x-1.5 px-2 py-1.5 text-xs text-neutral-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-colors group"
                                    title="Add Snippet"
                                >
                                    <svg className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Add</span>
                                </button>
                                <button
                                    onClick={onImportSnippet}
                                    className="flex-1 flex items-center justify-center space-x-1.5 px-2 py-1.5 text-xs text-neutral-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors group"
                                    title="Import Snippet"
                                >
                                    <svg className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span>Import</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Objects Group */}
                <div className="space-y-1 mt-4">
                    <button 
                        onClick={() => setIsObjectsOpen(!isObjectsOpen)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold text-neutral-400 uppercase tracking-widest hover:text-neutral-200 transition-colors group"
                    >
                        <div className="flex items-center space-x-1.5">
                        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isObjectsOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <span>Objects ({objects.length})</span>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRefreshObjects(); }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-neutral-300 transition-all"
                            title="Refresh Objects"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </button>

                    {isObjectsOpen && (
                        <div className="pl-4 space-y-1">
                            {['trigger', 'index', 'view'].map(type => {
                                const typeObjects = objects.filter(o => o.type === type);
                                
                                return (
                                    <div key={type} className="space-y-0.5">
                                        <div className="group/type flex items-center justify-between">
                                            <button 
                                                onClick={() => toggleType(type)}
                                                className="flex-1 flex items-center space-x-1.5 px-2 py-1 text-xs font-semibold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30 rounded transition-colors"
                                            >
                                                <svg className={`w-3 h-3 transition-transform duration-200 ${expandedTypes[type] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                <span className="capitalize">{type}s ({typeObjects.length})</span>
                                            </button>
                                        </div>

                                        {expandedTypes[type] && (
                                            <div className="pl-3 space-y-0.5 border-l border-neutral-800 ml-1.5 mt-0.5">
                                                {type === 'view' ? (
                                                    // Views are flat
                                                    typeObjects.length > 0 ? (
                                                        typeObjects.map(obj => (
                                                            <button
                                                                key={obj.name}
                                                                onClick={() => onSelectObject(obj)}
                                                                className={`w-full text-left px-3 py-1 text-xs rounded transition-all duration-200 flex items-center space-x-2 ${
                                                                    activeObject?.name === obj.name && activeObject?.type === type
                                                                    ? 'bg-purple-500/10 text-purple-400 border-l border-purple-500/50'
                                                                    : 'text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300'
                                                                }`}
                                                            >
                                                                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                <span className="truncate">{obj.name}</span>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-1 text-xs text-neutral-600 italic">No views</div>
                                                    )
                                                ) : (
                                                    // Triggers and Indexes nested by table
                                                    tables.map(tableName => {
                                                        const tableObjects = typeObjects.filter(o => o.tbl_name === tableName);
                                                        
                                                        return (
                                                            <div key={tableName} className="space-y-0.5">
                                                                <div className="group/table flex items-center justify-between">
                                                                    <button 
                                                                        onClick={() => toggleTable(`${type}:${tableName}`)}
                                                                        className="flex-1 flex items-center space-x-1.5 px-2 py-0.5 text-[11px] font-medium text-neutral-500 hover:text-neutral-300 transition-colors"
                                                                    >
                                                                        <svg className={`w-2.5 h-2.5 transition-transform duration-200 ${expandedTables[`${type}:${tableName}`] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                                        <span className="truncate">{tableName} {tableObjects.length > 0 && `(${tableObjects.length})`}</span>
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); onAddObject(type as any, tableName); }}
                                                                        className="opacity-0 group-hover/table:opacity-100 p-1 hover:bg-emerald-500/10 text-emerald-500 rounded transition-all mr-1"
                                                                        title={`Add ${type}`}
                                                                    >
                                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                                    </button>
                                                                </div>

                                                                {expandedTables[`${type}:${tableName}`] && (
                                                                    <div className="pl-3 border-l border-neutral-800/50 ml-1.5 mt-0.5">
                                                                        {tableObjects.length > 0 ? (
                                                                            tableObjects.map(obj => (
                                                                                <button
                                                                                    key={obj.name}
                                                                                    onClick={() => onSelectObject(obj)}
                                                                                    className={`w-full text-left px-3 py-1 text-xs rounded transition-all duration-200 flex items-center space-x-2 ${
                                                                                        activeObject?.name === obj.name && activeObject?.type === type
                                                                                        ? type === 'trigger' 
                                                                                            ? 'bg-orange-500/10 text-orange-400 border-l border-orange-500/50'
                                                                                            : 'bg-blue-500/10 text-blue-400 border-l border-blue-500/50'
                                                                                        : 'text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300'
                                                                                    }`}
                                                                                >
                                                                                    {type === 'trigger' ? (
                                                                                        <svg className="w-3 h-3 opacity-50 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                                                    ) : (
                                                                                        <svg className="w-3 h-3 opacity-50 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                                                    )}
                                                                                    <span className="truncate">{obj.name}</span>
                                                                                </button>
                                                                            ))
                                                                        ) : (
                                                                            <div className="px-3 py-1 text-xs text-neutral-600 italic">No {type}s</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            <div className="p-3 border-t border-neutral-900 bg-neutral-950/50 space-y-2">
                <button
                    onClick={onNewDb}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-xl text-xs font-bold transition-all border border-emerald-500/30 active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    <span>New Database</span>
                </button>
                <button
                    onClick={onOpenDb}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-neutral-800/10 hover:bg-neutral-800/20 text-neutral-100 hover:text-neutral-50 rounded-xl text-xs font-bold transition-all border border-neutral-800/50 active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    <span>Open Database</span>
                </button>
                <button
                    onClick={onOpenSettings}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-neutral-800/10 hover:bg-neutral-800/20 text-neutral-100 hover:text-neutral-50 rounded-xl text-xs font-bold transition-all border border-neutral-800/50 active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Settings</span>
                </button>
            </div>
        </aside>
    );
}
