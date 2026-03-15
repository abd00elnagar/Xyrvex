import { ReactNode, useEffect, useRef } from 'react';

export type DialogType = 'info' | 'warning' | 'error' | 'confirm' | 'success';

interface DialogProps {
    isOpen: boolean;
    type: DialogType;
    title: string;
    message: string | ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
}

export function Dialog({ 
    isOpen, 
    type, 
    title, 
    message, 
    confirmLabel = 'OK', 
    cancelLabel = 'Cancel', 
    onConfirm, 
    onCancel,
    showCancel = false
}: DialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    if (onCancel) onCancel();
                    else onConfirm();
                }
            };
            window.addEventListener('keydown', handleEscape);
            return () => window.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onCancel, onConfirm]);

    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'error': return {
                icon: (
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                border: 'border-red-500/30',
                glow: 'shadow-red-500/10',
                bg: 'bg-red-500/5',
                button: 'bg-red-600 hover:bg-red-500 text-white'
            };
            case 'warning': return {
                icon: (
                    <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                ),
                border: 'border-amber-500/30',
                glow: 'shadow-amber-500/10',
                bg: 'bg-amber-500/5',
                button: 'bg-amber-600 hover:bg-amber-500 text-white'
            };
            case 'success': return {
                icon: (
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
                border: 'border-emerald-500/30',
                glow: 'shadow-emerald-500/10',
                bg: 'bg-emerald-500/5',
                button: 'bg-emerald-600 hover:bg-emerald-500 text-white'
            };
            case 'confirm': return {
                icon: (
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                border: 'border-blue-500/30',
                glow: 'shadow-blue-500/10',
                bg: 'bg-blue-500/5',
                button: 'bg-blue-600 hover:bg-blue-500 text-white'
            };
            default: return {
                icon: (
                    <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                border: 'border-neutral-700',
                glow: 'shadow-neutral-900',
                bg: 'bg-neutral-800/10',
                button: 'bg-neutral-700 hover:bg-neutral-600 text-neutral-50'
            };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                ref={dialogRef}
                className={`w-full max-w-sm bg-neutral-950 border ${styles.border} rounded-2xl shadow-2xl ${styles.glow} overflow-hidden animate-in zoom-in-95 duration-200`}
            >
                <div className={`h-1.5 w-full ${styles.button.split(' ')[0]}`} />
                
                <div className="p-6">
                    <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-xl ${styles.bg} flex-shrink-0 animate-in slide-in-from-left-2 duration-300`}>
                            {styles.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-neutral-100 mb-1 truncate">
                                {title}
                            </h3>
                            <div className="text-sm text-neutral-400 leading-relaxed break-words">
                                {message}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-end space-x-3">
                        {(showCancel || type === 'confirm') && (
                            <button
                                onClick={onCancel || onConfirm}
                                className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-all"
                            >
                                {cancelLabel}
                            </button>
                        )}
                        <button
                            onClick={onConfirm}
                            className={`px-6 py-2 text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 ${styles.button}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
