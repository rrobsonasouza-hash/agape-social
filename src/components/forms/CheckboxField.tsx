import { InputHTMLAttributes, forwardRef } from "react";

interface CheckboxFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export const CheckboxField = forwardRef<
  HTMLInputElement,
  CheckboxFieldProps
>(({ label, className = "", ...props }, ref) => {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 ${className}`}
    >
      <input
        ref={ref}
        type="checkbox"
        {...props}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />

      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>
    </label>
  );
});

CheckboxField.displayName = "CheckboxField";