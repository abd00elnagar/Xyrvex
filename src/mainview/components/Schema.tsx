import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FullSchema, TableSchema, ForeignKeyInfo } from "../../shared/types";
import { rpc } from "../rpc";

interface Point {
    x: number;
    y: number;
}

const TABLE_WIDTH = 280;
const HEADER_HEIGHT = 56;
const ROW_HEIGHT = 32;
const VERTICAL_PADDING = 8; // p-2 is 8px
const ROW_GAP = 2; // space-y-0.5 is 2px

// --- Sub-components for Optimization ---

const getColumnY = (table: TableSchema, columnName: string) => {
    const index = table.columns.findIndex(c => c.name === columnName);
    if (index === -1) return HEADER_HEIGHT + VERTICAL_PADDING + (ROW_HEIGHT / 2);
    return HEADER_HEIGHT + VERTICAL_PADDING + (index * (ROW_HEIGHT + ROW_GAP)) + (ROW_HEIGHT / 2);
};

const TableCard = React.memo(({ 
    table, 
    position, 
    isDragging, 
    onMouseDown 
}: { 
    table: TableSchema; 
    position: Point; 
    isDragging: boolean; 
    onMouseDown: (e: React.MouseEvent, tableName: string) => void 
}) => {
    return (
        <div
            className={`absolute w-[280px] bg-[#111] border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] table-card ${
                isDragging 
                    ? 'border-emerald-500 ring-[12px] ring-emerald-500/5 z-50 scale-[1.02] shadow-emerald-500/10' 
                    : 'border-white/5 hover:border-white/10'
            }`}
            style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            }}
        >
            <div 
                onMouseDown={(e) => onMouseDown(e, table.name)}
                style={{ height: `${HEADER_HEIGHT}px` }}
                className="relative px-5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between cursor-grab active:cursor-grabbing rounded-t-2xl overflow-hidden"
            >
                <div className="flex items-center space-x-3 text-white/90">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shadow-inner">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] block leading-tight">
                            {table.name}
                        </span>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest mt-0.5 block">
                            Relation Table
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-2 space-y-0.5">
                {table.columns.map(col => {
                    const isFK = table.foreignKeys.some(fk => fk.from === col.name);
                    return (
                        <div 
                            key={col.name} 
                            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] transition-colors duration-200 hover:bg-white/[0.03] ${
                                col.primaryKey ? 'text-amber-400 font-black' : 'text-neutral-300'
                            }`}
                            style={{ height: `${ROW_HEIGHT}px` }}
                        >
                            <div className="flex items-center space-x-3 truncate">
                                {col.primaryKey ? (
                                    <div className="w-4 h-4 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                ) : isFK ? (
                                    <div className="w-4 h-4 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="w-4 h-4 flex items-center justify-center">
                                        <div className="w-1 h-1 rounded-full bg-neutral-700" />
                                    </div>
                                )}
                                <span className={`truncate tracking-wide ${col.primaryKey ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : ''}`}>
                                    {col.name}
                                </span>
                            </div>
                            <span className={`text-[9px] font-mono uppercase transition-colors ${col.primaryKey ? 'text-amber-500/50' : 'text-neutral-600'}`}>
                                {col.type}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

const Edge = React.memo(({ 
    fk, 
    startTable, 
    endTable, 
    startPos, 
    endPos 
}: { 
    fk: ForeignKeyInfo, 
    startTable: TableSchema, 
    endTable: TableSchema, 
    startPos: Point, 
    endPos: Point 
}) => {
    const startY = getColumnY(startTable, fk.from);
    const targetColName = fk.to === '' ? endTable.columns.find(c => c.primaryKey)?.name || '' : fk.to;
    const endY = getColumnY(endTable, targetColName);

    const x1 = startPos.x < endPos.x ? startPos.x + TABLE_WIDTH : startPos.x;
    const y1 = startPos.y + startY;
    const x2 = startPos.x < endPos.x ? endPos.x : endPos.x + TABLE_WIDTH;
    const y2 = endPos.y + endY;

    const dx = Math.max(Math.abs(x2 - x1) * 0.6, 60);
    const path = `M ${x1} ${y1} C ${x1 + (x1 < x2 ? dx : -dx)} ${y1}, ${x2 + (x1 < x2 ? -dx : dx)} ${y2}, ${x2} ${y2}`;

    return (
        <g className="group/edge">
            <path 
                d={path}
                stroke="rgba(16, 185, 129, 0.1)"
                strokeWidth="4"
                fill="none"
                className="hover:stroke-emerald-500/20"
            />
            <path 
                d={path}
                stroke="#10b981"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="4 4"
                className="opacity-40 group-hover/edge:opacity-100 edge-path"
            />
            <circle cx={x1} cy={y1} r="3" fill="#10b981" className="shadow-lg opacity-40 group-hover/edge:opacity-100" />
            <circle cx={x2} cy={y2} r="3" fill="#10b981" className="shadow-lg opacity-40 group-hover/edge:opacity-100" />
        </g>
    );
});

// --- Main Schema Component ---

export default function Schema({ tables: _tables, tableData: _data, dbPath }: { tables: string[], tableData: any, dbPath: string | null }) {
    const [fullSchema, setFullSchema] = useState<FullSchema | null>(null);
    const [positions, setPositions] = useState<Record<string, Point>>({});
    const [draggingTable, setDraggingTable] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
    
    // Zoom & Pan state
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
    
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchFullSchema = useCallback(async () => {
        try {
            const schema = await rpc.request.schemaGet({});
            setFullSchema(schema);
            
            // Load saved positions
            if (dbPath) {
                const { positions: savedPos } = await rpc.request.positionsGet({ dbPath });
                setPositions((prev: Record<string, Point>) => {
                    const newPos = { ...prev, ...savedPos };
                    schema.tables.forEach((table: TableSchema, index: number) => {
                        if (!newPos[table.name]) {
                            newPos[table.name] = {
                                x: 100 + (index % 3) * 350,
                                y: 100 + Math.floor(index / 3) * 450
                            };
                        }
                    });
                    return newPos;
                });
            }
        } catch (err) {
            console.error("Failed to fetch schema:", err);
        }
    }, [dbPath]);

    useEffect(() => {
        fetchFullSchema();
    }, [fetchFullSchema]);

    const savePositions = useCallback(async (currentPos: Record<string, Point>) => {
        if (!dbPath) return;
        try {
            await rpc.request.positionsSave({ dbPath, positions: currentPos });
        } catch (err) {
            console.error("Failed to save positions:", err);
        }
    }, [dbPath]);

    // Draggable Table Logic
    const handleTableMouseDown = useCallback((e: React.MouseEvent, tableName: string) => {
        if (e.button !== 0) return;
        setDraggingTable(tableName);
        setDragOffset({
            x: e.clientX / transform.scale - (positions[tableName]?.x || 0),
            y: e.clientY / transform.scale - (positions[tableName]?.y || 0)
        });
        e.stopPropagation();
    }, [transform.scale, positions]);

    // Pan Logic
    const handleContainerMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
            e.preventDefault();
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (draggingTable) {
            const x = e.clientX / transform.scale - dragOffset.x;
            const y = e.clientY / transform.scale - dragOffset.y;
            setPositions(prev => ({ ...prev, [draggingTable]: { x, y } }));
        } else if (isPanning) {
            setTransform(prev => ({
                ...prev,
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            }));
        }
    }, [draggingTable, dragOffset, isPanning, panStart, transform.scale]);

    const handleMouseUp = useCallback(() => {
        if (draggingTable) {
            savePositions(positions);
        }
        setDraggingTable(null);
        setIsPanning(false);
    }, [draggingTable, positions, savePositions]);

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            const zoomSpeed = 0.001;
            const delta = -e.deltaY * zoomSpeed;
            setTransform(prev => {
                const newScale = Math.min(Math.max(prev.scale + delta, 0.1), 3);
                return { ...prev, scale: newScale };
            });
            e.preventDefault();
        } else {
            setTransform(prev => ({
                ...prev,
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    useEffect(() => {
        if (draggingTable || isPanning) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingTable, isPanning, handleMouseMove, handleMouseUp]);

    if (!fullSchema) {
        return (
            <div className="flex-1 flex items-center justify-center text-neutral-500">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-medium animate-pulse uppercase tracking-[0.2em] opacity-50">Introspecting Database...</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            onMouseDown={handleContainerMouseDown}
            onWheel={handleWheel}
            className="flex-1 relative overflow-hidden bg-[#050505] cursor-grab active:cursor-grabbing select-none"
        >
            {/* Dynamic Grid Background */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{ 
                    backgroundImage: `
                        linear-gradient(to right, #ffffff 1px, transparent 1px),
                        linear-gradient(to bottom, #ffffff 1px, transparent 1px)
                    `,
                    backgroundSize: `${40 * transform.scale}px ${40 * transform.scale}px`,
                    backgroundPosition: `${transform.x}px ${transform.y}px`
                }}
            />

            <div 
                className="absolute inset-0"
                style={{ 
                    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                    transformOrigin: '0 0'
                }}
            >
                {/* Connections Layer */}
                <svg className="absolute top-0 left-0 w-[10000px] h-[10000px] pointer-events-none overflow-visible">
                    {fullSchema.tables.map(table => (
                        table.foreignKeys.map((fk, idx) => {
                            const endTable = fullSchema.tables.find(t => t.name === fk.table);
                            if (!endTable) return null;
                            const startPos = positions[table.name];
                            const endPos = positions[endTable.name];
                            if (!startPos || !endPos) return null;

                            return (
                                <Edge 
                                    key={`${table.name}-${fk.table}-${idx}`}
                                    fk={fk}
                                    startTable={table}
                                    endTable={endTable}
                                    startPos={startPos}
                                    endPos={endPos}
                                />
                            );
                        })
                    ))}
                </svg>

                {/* Table Cards Layer */}
                {fullSchema.tables.map(table => (
                    <TableCard 
                        key={table.name}
                        table={table}
                        position={positions[table.name] || { x: 0, y: 0 }}
                        isDragging={draggingTable === table.name}
                        onMouseDown={handleTableMouseDown}
                    />
                ))}
            </div>

            {/* Controls HUD */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-4">
                <div className="bg-black/60 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl px-6 py-3 flex items-center space-x-6">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-neutral-500 tracking-[0.2em]">Magnification</span>
                        <span className="text-xs font-black text-emerald-500 mt-0.5">{Math.round(transform.scale * 100)}%</span>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <button 
                        onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
                        className="flex flex-col items-center hover:text-white transition-colors group"
                    >
                        <span className="text-[8px] font-black uppercase text-neutral-500 tracking-[0.2em] group-hover:text-neutral-400">Reset View</span>
                        <svg className="w-4 h-4 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest max-w-[120px] leading-relaxed">
                        Hold <span className="text-white px-1.5 py-0.5 bg-white/10 rounded-md">ALT</span> + drag to pan
                    </div>
                </div>
            </div>
            
            {/* Status Indicator */}
            <div className="absolute top-6 right-6">
                <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">Live Schema Graph</span>
                </div>
            </div>
        </div>
    );
}