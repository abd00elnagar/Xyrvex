import { useState, useEffect } from 'react';
import { validateIdentifier } from '../utils/validation';

interface ValidatedInputProps {
    value: string;
    onChange: (value: string, isValid: boolean) => void;
    placeholder?: string;
    existingNames?: string[];
    className?: string;
}

export function ValidatedInput({ value, onChange, placeholder, existingNames = [], className }: ValidatedInputProps) {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const err = validateIdentifier(value, existingNames);
        setError(err);
        onChange(value, err === null);
    }, [value, existingNames]);

    return (
        <div className="w-full">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value, false)}
                placeholder={placeholder}
                className={`w-full bg-neutral-950 border rounded-lg px-3 py-2 text-sm font-mono transition-all outline-none ${
                    error 
                    ? 'border-red-500/50 focus:border-red-500 bg-red-500/5 text-red-200' 
                    : 'border-neutral-800 focus:border-emerald-500/50 text-neutral-200'
                } ${className}`}
            />
            {error && (
                <div className="mt-1 text-[10px] text-red-500 font-medium px-1 animate-in slide-in-from-top-1 duration-200">
                    {error}
                </div>
            )}
        </div>
    );
}
