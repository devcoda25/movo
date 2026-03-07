'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({
        label,
        error,
        options,
        className = '',
        ...props
    }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-foreground mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        className={`
              w-full px-4 py-3 text-sm bg-background border rounded-xl 
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent 
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              appearance-none
              ${error ? 'border-destructive focus:ring-destructive' : 'border-border'}
              ${className}
            `}
                        {...props}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
                {error && (
                    <p className="mt-2 text-sm text-destructive">{error}</p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;
