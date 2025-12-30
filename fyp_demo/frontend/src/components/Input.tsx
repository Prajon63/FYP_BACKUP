import { ReactNode, InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, helperText, className = '', ...props }, ref) => {
    const inputId = props.id || props.name;

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
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3 border rounded-xl
            focus:ring-2 focus:ring-pink-500 focus:border-transparent
            outline-none transition-all
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
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


