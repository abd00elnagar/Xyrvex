import { useState, useEffect, useRef } from 'react';

interface MenuItem {
    label?: string;
    action?: string;
    shortcut?: string;
    type?: 'separator';
    submenu?: MenuItem[];
}

interface MenuProps {
    onAction: (action: string) => void;
}

export function Menu({ onAction }: MenuProps) {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const menus: MenuItem[] = [
        {
            label: 'File',
            submenu: [
                { label: 'New Database', action: 'new-db', shortcut: 'Ctrl+N' },
                { label: 'Open Database', action: 'open-db', shortcut: 'Ctrl+O' },
                { type: 'separator' },
                { label: 'Save', action: 'save', shortcut: 'Ctrl+S' },
                { label: 'Save As...', action: 'save-as', shortcut: 'Ctrl+Shift+S' },
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
                { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
                { type: 'separator' },
                { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
                { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
                { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V' },
            ]
        },
        {
            label: 'View',
            submenu: [
                { label: 'Refresh Table', action: 'refresh', shortcut: 'Ctrl+R' },
                { label: 'Toggle SQL Console', action: 'toggle-terminal', shortcut: 'Ctrl+`' },
                { label: 'Toggle Autosave', action: 'toggle-autosave' },
            ]
        }
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = (action?: string) => {
        if (action) {
            onAction(action);
            setActiveMenu(null);
        }
    };

    return (
        <nav 
            ref={menuRef}
            className="h-8 bg-neutral-950 border-b border-neutral-800 flex items-center px-4 select-none z-50 relative"
        >
            <div className="flex items-center space-x-1">
                <div className="flex items-center space-x-2 mr-4 group">
                    <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                        <svg className="w-full h-full text-neutral-900" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zM4 7h16M4 11h16m-16 4h16" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-neutral-300 tracking-wider">SQL EDITOR</span>
                </div>

                {menus.map((menu) => (
                    <div key={menu.label} className="relative">
                        <button
                            onMouseEnter={() => activeMenu && setActiveMenu(menu.label!)}
                            onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label!)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                activeMenu === menu.label 
                                ? 'bg-neutral-800 text-neutral-50' 
                                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                            }`}
                        >
                            {menu.label}
                        </button>

                        {activeMenu === menu.label && menu.submenu && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl py-1 z-50 backdrop-blur-xl bg-opacity-95">
                                {menu.submenu.map((item, idx) => (
                                    item.type === 'separator' ? (
                                        <div key={idx} className="my-1 border-t border-neutral-800/50" />
                                    ) : (
                                        <button
                                            key={item.label}
                                            onClick={() => handleAction(item.action)}
                                            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-neutral-300 hover:bg-emerald-500/10 hover:text-emerald-400 text-left transition-all group"
                                        >
                                            <span className="font-medium">{item.label}</span>
                                            {item.shortcut && (
                                                <span className="text-[0.65rem] text-neutral-600 group-hover:text-emerald-600/60 font-mono tracking-tighter">
                                                    {item.shortcut}
                                                </span>
                                            )}
                                        </button>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </nav>
    );
}
