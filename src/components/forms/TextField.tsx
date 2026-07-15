import {
  ChangeEvent,
  InputHTMLAttributes,
  forwardRef,
} from "react";

import {
  maskCEP,
  maskCNPJ,
  maskCPF,
  maskTelefone,
} from "@/lib/formatters/masks";

type TextFieldMask =
  | "cpf"
  | "cnpj"
  | "telefone"
  | "cep";

interface TextFieldProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  mask?: TextFieldMask;
}

function aplicarMascara(
  value: string,
  mask?: TextFieldMask
): string {
  switch (mask) {
    case "cpf":
      return maskCPF(value);

    case "cnpj":
      return maskCNPJ(value);

    case "telefone":
      return maskTelefone(value);

    case "cep":
      return maskCEP(value);

    default:
      return value;
  }
}

export const TextField = forwardRef<
  HTMLInputElement,
  TextFieldProps
>(
  (
    {
      label,
      error,
      mask,
      className = "",
      onChange,
      ...props
    },
    ref
  ) => {
    function handleChange(
      event: ChangeEvent<HTMLInputElement>
    ) {
      if (mask) {
        const valorFormatado = aplicarMascara(
          event.target.value,
          mask
        );

        event.target.value = valorFormatado;
      }

      onChange?.(event);
    }

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>

        <input
          ref={ref}
          {...props}
          onChange={handleChange}
          className={`w-full rounded-lg border px-4 py-3 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
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

TextField.displayName = "TextField";