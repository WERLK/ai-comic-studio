import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={clsx(
              'relative w-full mx-4 bg-cyber-dark2 border border-cyber-purple/30 rounded-2xl shadow-2xl',
              'after:absolute after:-top-px after:left-0 after:right-0 after:h-px',
              'after:bg-gradient-to-r after:from-transparent after:via-cyber-pink/50 after:to-transparent',
              sizes[size]
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-purple/20">
                <h2 className="text-lg font-display font-semibold text-cyber-blue neon-text-blue">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-cyber-pink transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
