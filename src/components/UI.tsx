import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '../utils/constants';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20',
    secondary: 'bg-pink-600 text-white hover:bg-pink-500 shadow-lg shadow-pink-500/20',
    accent: 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20',
    danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-500/20',
    outline: 'border-2 border-white/10 text-white hover:bg-white/5',
    ghost: 'text-white/60 hover:text-white hover:bg-white/5',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg font-bold',
    xl: 'px-10 py-5 text-xl font-black uppercase tracking-wider',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative overflow-hidden rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  );
};

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6', className)}>
    {children}
  </div>
);

export const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all',
      className
    )}
    {...props}
  />
);
