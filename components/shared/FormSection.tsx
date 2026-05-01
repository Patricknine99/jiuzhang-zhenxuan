export function FormSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-[0.8fr_1.2fr] md:px-6 md:py-20">
      <div>
        <div className="accent-line mb-5" />
        <h1 className="text-3xl font-bold md:text-5xl">{title}</h1>
        <p className="mt-5 text-lg leading-8 text-stone-600">{description}</p>
        <div className="mt-8 rounded-2xl bg-amber-100 p-5 text-sm leading-7 text-amber-900">
          当前版本已预留飞书、企业微信、钉钉集成接口；正式写入会通过安全中转完成，不在浏览器端暴露密钥。
        </div>
      </div>
      <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200 md:p-8">{children}</div>
    </section>
  );
}
