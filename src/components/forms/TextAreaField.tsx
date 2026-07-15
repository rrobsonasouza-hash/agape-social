import {
  TextareaHTMLAttributes,
  forwardRef,
} from "react";

interface TextAreaFieldProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(
  (
    {
      label,
      error,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>

        <textarea
          ref={ref}
          {...props}
          className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
            error
              ? "border-red-500"
              : "border-slate-300"
          } ${className}`}
        />

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextAreaField.displayName = "TextAreaField";