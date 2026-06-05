export function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">{eyebrow}</p>
      <h2 className="font-display text-3xl font-extrabold tracking-normal text-[var(--foreground)] sm:text-4xl">
        {title}
      </h2>
      {copy ? <p className="mt-4 text-base leading-7 theme-subtle">{copy}</p> : null}
    </div>
  );
}
