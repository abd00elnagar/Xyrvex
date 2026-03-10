import type { AppRPC } from "../../shared/types";

interface HeaderProps {
    dbName: string;
}

export function Header({ dbName }: HeaderProps) {
    return (
        <header className="h-10 bg-neutral-950 border-b border-neutral-800 flex items-center px-4 flex-shrink-0">
            <div className="flex items-center space-x-3 w-full">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded shadow-sm">
                    SQL Editor
                </span>
                <div className="h-4 w-[1px] bg-neutral-800 mx-1" />
                <span className={`text-sm font-medium truncate max-w-md ${dbName === "No database open" ? 'text-neutral-600 italic' : 'text-neutral-300'}`}>
                    {dbName === "No database open" ? "No Active Database" : dbName}
                </span>
            </div>
        </header>
    );
}
