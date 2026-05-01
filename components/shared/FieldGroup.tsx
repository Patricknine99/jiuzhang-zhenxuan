export function FieldGroup({
  label,
  children,
  required = false
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-stone-700">
        {label}
        {required ? <span className="text-[var(--color-brand)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
