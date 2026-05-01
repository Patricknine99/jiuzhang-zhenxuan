import type { ProviderLevel } from "@/lib/types";

const levelStyles: Record<ProviderLevel, string> = {
  L1: "bg-stone-100 text-stone-500",
  L2: "bg-amber-100 text-amber-800",
  L3: "bg-emerald-100 text-emerald-800"
};

export function LevelBadge({
  level,
  label
}: {
  level: ProviderLevel;
  label: string;
}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${levelStyles[level]}`}>
      {level} · {label}
    </span>
  );
}
