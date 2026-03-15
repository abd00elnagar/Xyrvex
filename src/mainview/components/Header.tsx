interface HeaderProps {
    dbName: string;
    dbPath: string | null;
    isDirty: boolean;
    isAutoSave: boolean;
    onSave: () => void;
    onToggleAutoSave: () => void;
}

export function Header({ dbName, dbPath, isDirty, isAutoSave, onSave, onToggleAutoSave }: HeaderProps) {
    return (
        <header className="h-10 bg-neutral-950 border-b border-neutral-800 flex items-center px-4 flex-shrink-0">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded shadow-sm flex-shrink-0">
                        SQL Editor
                    </span>
                    <div className="h-4 w-[1px] bg-neutral-800 mx-1 flex-shrink-0" />
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                            <h1 className="text-sm font-bold text-neutral-200 tracking-tight">{dbName || "No Database"}</h1>
                            {dbPath && (
                                <span className="ml-3 text-[10px] text-neutral-500 font-mono truncate max-w-[300px]" title={dbPath}>
                                    {dbPath}
                                </span>
                            )}
                        </div>
                        {isDirty && (
                            <button 
                                onClick={onSave}
                                className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm shadow-amber-900 animate-pulse hover:scale-150 transition-all cursor-pointer" 
                                title="Unsaved changes - Click to Save" 
                            />
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button 
                        onClick={onToggleAutoSave}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all border duration-300 group ${
                            isAutoSave 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                            : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                        }`}
                        title={isAutoSave ? "Autosave is ON" : "Autosave is OFF"}
                    >
                        <div className="relative">
                            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isAutoSave ? 'bg-emerald-500 scale-110 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-neutral-600'}`} />
                            {isAutoSave && (
                                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-40" />
                            )}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.1em] transition-colors ${isAutoSave ? 'text-emerald-400' : 'text-neutral-500 group-hover:text-neutral-400'}`}>
                            Auto-save
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}
