import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  const Component = hover ? motion.div : 'div';
  const motionProps = hover ? {
    whileHover: { y: -4, boxShadow: '0 10px 30px rgba(139, 38, 53, 0.15)' },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      className={`bg-card rounded-xl shadow-md border border-border overflow-hidden ${className}`}
      {...motionProps}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 border-b border-border ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 border-t border-border ${className}`}>{children}</div>;
}
