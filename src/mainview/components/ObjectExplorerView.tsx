import { DbObject } from '../../shared/types';

interface ObjectExplorerViewProps {
    object: DbObject | null;
    onDrop: (type: string, name: string) => void;
    onCopySql: (sql: string) => void;
}

export function ObjectExplorerView({ object, onDrop, onCopySql }: ObjectExplorerViewProps) {
    if (!object) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 space-y-4">
                <svg className="w-16 h-16 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <div className="text-lg font-medium">Select an object to explorer its definition</div>
                <p className="text-sm opacity-60 max-w-xs text-center">
                    Browse triggers, indexes, and views from the sidebar to see their SQL schema and perform management tasks.
                </p>
            </div>
        );
    }

    const typeIcons: Record<string, JSX.Element> = {
        trigger: <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
        index: <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
        view: <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-neutral-900 slide-in">
            {/* Header */}
            <div className="border-b border-neutral-800 p-6 flex items-center justify-between bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                    <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700/50 shadow-inner">
                        {typeIcons[object.type] || <div className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{object.type}</span>
                            {object.tbl_name && (
                                <>
                                    <span className="text-neutral-700">•</span>
                                    <span className="text-xs text-neutral-500">Table: <span className="text-neutral-400 font-mono italic">{object.tbl_name}</span></span>
                                </>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-neutral-100 tracking-tight">{object.name}</h2>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onCopySql(object.sql)}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 border border-neutral-700 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        <span>Copy SQL</span>
                    </button>
                    <button
                        onClick={() => onDrop(object.type, object.name)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 border border-red-500/20 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Drop {object.type === 'view' ? 'View' : object.type === 'trigger' ? 'Trigger' : 'Index'}</span>
                    </button>
                </div>
            </div>

            {/* SQL Definition */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center space-x-2 text-xs text-neutral-500 font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        <span>SQL Definition</span>
                    </div>
                </div>
                <div className="flex-1 relative group overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/50 shadow-2xl">
                    <pre className="absolute inset-0 p-6 overflow-auto font-mono text-sm leading-relaxed text-neutral-300 custom-scrollbar whitespace-pre-wrap">
                        {object.sql || "-- No definition available"}
                    </pre>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .slide-in {
                    animation: slideIn 0.3s ease-out;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
}
