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
        <p id={`${id}-help`} className="help mt-1">
          {help}
        </p>
      )}
      <input
        {...input}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptions || undefined}
        className={`mt-2 ${className}`}
      />
      {error && (
        <p id={`${id}-error`} className="feedback-enter mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
