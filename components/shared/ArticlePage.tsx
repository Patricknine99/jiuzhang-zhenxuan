export function ArticlePage({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 md:px-6 md:py-20">
      <div className="accent-line mb-5" />
      <h1 className="text-3xl font-bold md:text-5xl">{title}</h1>
      <p className="mt-5 text-lg leading-8 text-stone-600">{description}</p>
      <div className="prose-page mt-10 border-t border-stone-200 pt-8">{children}</div>
    </article>
  );
}
