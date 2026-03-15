import type { AppRPC } from "../../shared/types";

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
                        className={`flex items-center space-x-1.5 px-2 py-1 rounded transition-all border ${
                            isAutoSave 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                            : 'bg-neutral-900 border-neutral-800 text-neutral-500 grayscale opacity-60'
                        }`}
                        title={isAutoSave ? "Autosave is ON" : "Autosave is OFF"}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isAutoSave ? 'bg-emerald-500' : 'bg-neutral-600'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Auto-save</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
