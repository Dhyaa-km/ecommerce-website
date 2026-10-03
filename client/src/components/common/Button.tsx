import React, { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500 shadow-sm',
    secondary: 'bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-700 shadow-sm',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm',
    outline: 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-sky-500',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400',
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" className={variant === 'outline' || variant === 'ghost' ? 'border-sky-600' : 'border-white'} />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
