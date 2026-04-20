import { ReactNode, InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, rightElement, error, helperText, className = '', id, name, ...props }, ref) => {
    const gen = useId().replace(/:/g, '');
    const inputId = id ?? name ?? `input-${gen}`;
    const inputName = name ?? id ?? inputId;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            {icon}
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            name={inputName}
            className={`
              w-full px-4 py-3 border rounded-xl
              focus:ring-2 focus:ring-pink-500 focus:border-transparent
              outline-none transition-all
              ${rightElement ? 'pr-11' : ''}
              ${error ? 'border-red-500' : 'border-gray-300'}
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;



