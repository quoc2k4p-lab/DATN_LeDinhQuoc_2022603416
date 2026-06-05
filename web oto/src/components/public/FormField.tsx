type FormFieldProps = {
  label: string;
  placeholder?: string;
  type?: string;
  as?: "input" | "textarea" | "select";
  options?: string[];
};

export function FormField({
  label,
  placeholder,
  type = "text",
  as = "input",
  options = [],
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] theme-subtle">
        {label}
      </span>
      {as === "textarea" ? (
        <textarea
          placeholder={placeholder}
          className="min-h-32 w-full rounded-md border theme-border bg-[var(--background)] p-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--subtle)] focus:border-[#e31837]"
        />
      ) : as === "select" ? (
        <select className="h-12 w-full rounded-md border theme-border bg-[var(--background)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[#e31837]">
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className="h-12 w-full rounded-md border theme-border bg-[var(--background)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--subtle)] focus:border-[#e31837]"
        />
      )}
    </label>
  );
}
