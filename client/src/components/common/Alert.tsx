import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  message: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'error', message, className = '' }) => {
  const styles = {
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />,
    },
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-800',
      icon: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
    },
  };

  const currentStyle = styles[type];

  return (
    <div
      className={`p-4 rounded-lg border flex items-start gap-3 text-sm ${currentStyle.bg} ${className}`}
      role="alert"
    >
      {currentStyle.icon}
      <div className="flex-1">{message}</div>
    </div>
  );
};
