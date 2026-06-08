import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'relative inline-flex items-center justify-center font-display font-medium transition-all duration-200 rounded-lg';
  
  const variants = {
    primary: 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white hover:shadow-neon hover:scale-[1.02] active:scale-95',
    secondary: 'bg-cyber-dark2 border border-cyber-pink/50 text-cyber-pink hover:neon-border-pink hover:shadow-neon active:scale-95',
    ghost: 'bg-transparent border border-cyber-blue/30 text-cyber-blue hover:neon-border-blue hover:shadow-neon-blue active:scale-95',
    danger: 'bg-cyber-pink/20 border border-cyber-pink/50 text-cyber-pink hover:bg-cyber-pink/30 active:scale-95',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}
