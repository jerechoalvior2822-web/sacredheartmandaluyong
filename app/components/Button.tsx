import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-[#8B2635] text-white hover:bg-[#6B1D28] active:bg-[#5B1620]',
    secondary: 'bg-[#D9B98D] text-[#8B2635] hover:bg-[#C9A97D] active:bg-[#B9996D]',
    outline: 'border-2 border-[#8B2635] text-[#8B2635] hover:bg-[#8B2635]/5 active:bg-[#8B2635]/10',
    ghost: 'text-[#8B2635] hover:bg-[#8B2635]/10 active:bg-[#8B2635]/20',
    destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-2.5 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
