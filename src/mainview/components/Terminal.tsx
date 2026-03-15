import { useState, useEffect, useRef } from "react";
import type { TerminalResult } from "../../shared/types";

interface TerminalProps {
    isOpen: boolean;
    onToggle: () => void;
    onExecute: (sql: string) => Promise<TerminalResult>;
}

export function Terminal({ isOpen, onToggle, onExecute }: TerminalProps) {
    const [sql, setSql] = useState("");
    const [result, setResult] = useState<TerminalResult | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    
    // Resize state
    const [height, setHeight] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef(false);

    useEffect(() => {
        if (!isOpen) {
            setHeight(null); // Reset when closed
        } else if (height === null) {
            setHeight(window.innerHeight * 0.5); // Initial open height: 50%
        }
    }, [isOpen, height]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragRef.current) return;
            // Calculate new height from bottom of the screen. Subtract 40px for header/margins if needed.
            const newHeight = Math.max(150, Math.min(window.innerHeight - 80, window.innerHeight - e.clientY));
            setHeight(newHeight);
        };
        const handleMouseUp = () => {
            if (dragRef.current) {
                dragRef.current = false;
                setIsDragging(false);
                document.body.style.cursor = 'default';
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleExecute = async () => {
        if (!sql.trim()) return;
        setIsExecuting(true);
        try {
            const res = await onExecute(sql);
            setResult(res);
        } catch (err) {
            setResult({ sql, error: String(err) });
        } finally {
            setIsExecuting(false);
        }
    };

    const containerStyle = {
        height: isOpen ? (height ? `${height}px` : '50vh') : '40px'
    };

    return (
        <div 
            className={`border-t border-neutral-800 bg-neutral-950/80 backdrop-blur-md relative z-20 flex flex-col ${isOpen ? 'shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' : ''} ${!isDragging ? 'transition-all duration-300' : ''}`}
            style={containerStyle}
        >
            {isOpen && (
                <div 
                    className="absolute top-0 left-0 w-full h-1.5 cursor-row-resize z-50 hover:bg-emerald-500/50 transition-colors"
                    onMouseDown={() => {
                        dragRef.current = true;
                        setIsDragging(true);
                        document.body.style.cursor = 'row-resize';
                    }}
                />
            )}
            
            <div
                className="h-10 flex flex-shrink-0 items-center px-6 bg-neutral-800/30 cursor-pointer hover:bg-neutral-800/50 transition-colors group select-none"
                onClick={onToggle}
            >
                <div className="flex items-center space-x-2 flex-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-600'}`} />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest group-hover:text-neutral-200 transition-colors">SQL Console</span>
                </div>
                <svg className={`w-4 h-4 text-neutral-500 transform transition-all duration-300 ${isOpen ? 'rotate-0' : 'rotate-180 opacity-50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7" /></svg>
            </div>

            {isOpen && (
                <div className="p-5 flex-1 flex flex-col space-y-3 min-h-0 animate-in fade-in duration-300">
                    <div className="relative flex-1 group min-h-[100px] max-h-[50%]">
                        <textarea
                            className="w-full h-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 pt-4 pr-32 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/30 transition-colors resize-none shadow-inner"
                            placeholder="-- Enter SQL command..."
                            spellCheck={false}
                            value={sql}
                            onChange={(e) => setSql(e.target.value)}
                        />
                        <div className="absolute right-3 bottom-3 flex space-x-2">
                            <button
                                onClick={handleExecute}
                                disabled={isExecuting}
                                className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-wider active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isExecuting ? "Executing..." : "Execute Query"}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-neutral-900/80 border border-neutral-800/50 rounded-lg p-3 overflow-hidden flex flex-col min-h-[150px]">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-tight mb-1 flex-shrink-0">Output</div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {result ? (
                                <div className="text-xs font-mono">
                                    {result.error ? (
                                        <span className="text-red-400">{result.error}</span>
                                    ) : (
                                        <div className="text-neutral-300 space-y-2">
                                            <div className="text-emerald-500/80">Success: {result.changes} changes made.</div>
                                            {result.rows && result.rows.length > 0 && result.columns && (
                                                <div className="overflow-x-auto border border-neutral-800 rounded">
                                                    <table className="min-w-full text-[10px] text-neutral-400">
                                                        <thead>
                                                            <tr className="bg-neutral-800/50">
                                                                {result.columns.map(c => <th key={c} className="px-2 py-1 text-left border-b border-neutral-800">{c}</th>)}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {result.rows.slice(0, 50).map((row, i) => (
                                                                <tr key={i} className="border-b border-neutral-800/30">
                                                                    {row.map((cell, j) => <td key={j} className="px-2 py-1 truncate max-w-[300px]">{String(cell)}</td>)}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {result.rows.length > 50 && (
                                                        <div className="p-1 px-2 text-[9px] text-neutral-600 italic">Showing first 50 rows...</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-xs font-mono text-neutral-400 italic">No command executed yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
