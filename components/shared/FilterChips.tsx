export function FilterChips({ groups }: { groups: { label: string; values: string[] }[] }) {
  return (
    <div className="editorial-card rounded-2xl bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs font-semibold text-stone-400">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => (
                <span key={value} className="rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-600">
                  {value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
