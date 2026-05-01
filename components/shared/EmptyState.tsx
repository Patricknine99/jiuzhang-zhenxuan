export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
      <h3 className="text-lg font-bold text-stone-950">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
