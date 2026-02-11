import { forwardRef } from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-300"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""
          } ${className}`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error
              ? `${inputId}-error`
              : hint
                ? `${inputId}-hint`
                : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-400">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-gray-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-300"
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          className={`mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""
          } ${className}`}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-400">{error}</p>
        )}
        {!error && hint && (
          <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";
