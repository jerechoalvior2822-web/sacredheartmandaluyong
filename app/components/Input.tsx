import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block mb-2 text-sm font-semibold text-primary">{label}</label>}
      <input
        className={`w-full px-4 py-2.5 bg-background border-2 border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${error ? 'border-destructive' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && <label className="block mb-2 text-sm font-semibold text-primary">{label}</label>}
      <textarea
        className={`w-full px-4 py-2.5 bg-background border-2 border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none ${error ? 'border-destructive' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="block mb-2 text-sm font-semibold text-primary">{label}</label>}
      <select
        className={`w-full px-4 py-2.5 bg-background border-2 border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer ${error ? 'border-destructive' : ''} ${className}`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
