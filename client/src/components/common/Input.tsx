import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1 w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`block w-full rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-500 ${
              leftIcon ? 'pl-10' : 'pl-3'
            } pr-3 py-2 ${
              error
                ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:ring-rose-500 focus:border-rose-500'
                : 'border-slate-300 text-slate-900 placeholder-slate-400'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
