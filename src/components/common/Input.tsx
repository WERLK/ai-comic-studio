import { clsx } from 'clsx';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-cyber-blue mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 bg-cyber-dark2 border border-cyber-purple/30 rounded-lg',
            'text-white placeholder:text-gray-500 font-body',
            'focus:outline-none focus:border-cyber-pink focus:shadow-neon transition-all duration-200',
            error && 'border-cyber-pink',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-cyber-pink">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-cyber-blue mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 bg-cyber-dark2 border border-cyber-purple/30 rounded-lg',
            'text-white placeholder:text-gray-500 font-body resize-none',
            'focus:outline-none focus:border-cyber-pink focus:shadow-neon transition-all duration-200',
            error && 'border-cyber-pink',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-cyber-pink">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
