export function SectionHeading({
  title,
  eyebrow,
  description,
  align = "left",
  dark = false
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <div className={`accent-line mb-4 ${align === "center" ? "mx-auto" : ""}`} />
      {eyebrow ? (
        <p className={`mb-2 text-sm font-semibold ${dark ? "text-orange-300" : "text-[var(--color-brand)]"}`}>
          {eyebrow}
        </p>
      ) : null}
      <h2 className={`text-2xl font-bold md:text-3xl ${dark ? "text-stone-100" : "text-stone-950"}`}>
        {title}
      </h2>
      {description ? (
        <p className={`mt-3 text-sm leading-7 md:text-base ${dark ? "text-stone-400" : "text-stone-500"}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
