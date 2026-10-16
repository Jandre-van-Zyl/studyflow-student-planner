import { type InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  help?: string;
}

export function FormField({ id, label, error, help, className = '', ...input }: Props) {
  const descriptions = [error ? `${id}-error` : '', help ? `${id}-help` : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {help && (
        <p id={`${id}-help`} className="mt-1 text-xs leading-5 text-slate-500">
          {help}
        </p>
      )}
      <input
        {...input}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptions || undefined}
        className={`mt-2 min-h-11 w-full rounded-xl border bg-white px-3 py-2 text-ink disabled:bg-slate-100 ${error ? 'border-red-500' : 'border-slate-300'} ${className}`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
