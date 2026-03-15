import { AppSettings } from '../../shared/types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSettingsChange: (newSettings: Partial<AppSettings>) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSettingsChange }: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl w-[500px] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
                    <h2 className="text-sm font-semibold text-neutral-200">Settings</h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-5 overflow-y-auto space-y-6 max-h-[70vh] custom-scrollbar">
                    
                    {/* Appearance */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Appearance</h3>
                        
                        <div className="space-y-2">
                            <label className="text-sm text-neutral-300">Theme</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['dark', 'light'].map(theme => (
                                    <button
                                        key={theme}
                                        onClick={() => onSettingsChange({ theme: theme as any })}
                                        className={`py-2 rounded border text-sm capitalize transition-colors ${
                                            settings.theme === theme 
                                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                                            : 'border-neutral-700 hover:border-neutral-500 text-neutral-400'
                                        }`}
                                    >
                                        {theme}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-neutral-300">Accent Color</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['emerald', 'blue', 'purple'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => onSettingsChange({ accentColor: color as any })}
                                        className={`py-2 rounded border text-sm capitalize transition-colors flex items-center justify-center space-x-2 ${
                                            settings.accentColor === color 
                                            ? 'border-neutral-500 text-neutral-200 bg-neutral-800' 
                                            : 'border-neutral-800 hover:border-neutral-700 text-neutral-500'
                                        }`}
                                    >
                                        <div className="w-3 h-3 rounded-full" style={{ 
                                            backgroundColor: color === 'emerald' ? '#10b981' : 
                                                            color === 'blue' ? '#3b82f6' : 
                                                            '#a855f7' 
                                        }} />
                                        <span>{color}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-3 pt-3 border-t border-neutral-800">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Typography</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-sm text-neutral-300">SQL Editor Font Size</label>
                                    <span className="text-xs text-neutral-500">{settings.fontSizeSql}px</span>
                                </div>
                                <input 
                                    type="range" min="10" max="24" 
                                    value={settings.fontSizeSql} 
                                    onChange={(e) => onSettingsChange({ fontSizeSql: parseInt(e.target.value) })}
                                    className="w-full accent-emerald-500 cursor-pointer"
                                />
                            </div>
                            
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-sm text-neutral-300">Data Grid Font Size</label>
                                    <span className="text-xs text-neutral-500">{settings.fontSizeTable}px</span>
                                </div>
                                <input 
                                    type="range" min="10" max="24" 
                                    value={settings.fontSizeTable} 
                                    onChange={(e) => onSettingsChange({ fontSizeTable: parseInt(e.target.value) })}
                                    className="w-full accent-emerald-500 cursor-pointer"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-sm text-neutral-300">Global UI Font Size</label>
                                    <span className="text-xs text-neutral-500">{settings.fontSizeUI}px</span>
                                </div>
                                <input 
                                    type="range" min="10" max="18" 
                                    value={settings.fontSizeUI} 
                                    onChange={(e) => onSettingsChange({ fontSizeUI: parseInt(e.target.value) })}
                                    className="w-full accent-emerald-500 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
