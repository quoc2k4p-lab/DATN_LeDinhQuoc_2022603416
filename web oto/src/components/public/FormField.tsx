import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  name?: string;
  placeholder?: string;
  type?: string;
  as?: "input" | "textarea" | "select";
  options?: string[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
};

export function FormField({
  label,
  name,
  placeholder,
  type = "text",
  as = "input",
  options = [],
  value,
  onChange,
  required,
  error,
  disabled,
}: FormFieldProps) {
  const inputId = name ? `field-${name}` : undefined;
  const inputClass = cn(
    "w-full rounded-md border bg-[var(--background)] px-4 text-base sm:text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--subtle)] disabled:opacity-50 disabled:cursor-not-allowed",
    error 
      ? "border-red-500 focus:border-red-500 bg-red-500/5" 
      : "theme-border focus:border-[#e31837]",
    as === "input" && "h-12",
    as === "textarea" && "min-h-32 p-4"
  );

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] theme-subtle">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {as === "textarea" ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={inputClass}
          disabled={disabled}
        />
      ) : as === "select" ? (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={cn(inputClass, "h-12")}
          disabled={disabled}
        >
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={inputClass}
          disabled={disabled}
        />
      )}
      {error && (
        <p className="mt-1.5 block text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </label>
  );
}
