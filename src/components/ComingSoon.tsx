export default function ComingSoon({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow text-xs text-encre-douce">{eyebrow}</p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold text-encre sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-md text-sm text-encre-douce">
        Cette page est en cours de construction.
      </p>
    </section>
  );
}
