import { Icon, type IconName } from './Icon';

export function WorkspacePlaceholder({
  title,
  description,
  icon,
  planned,
}: {
  title: string;
  description: string;
  icon: IconName;
  planned: string[];
}) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Your workspace</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">{description}</p>
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 sm:p-10">
        <span className="inline-flex rounded-2xl bg-teal-50 p-4 text-accent">
          <Icon name={icon} className="h-8 w-8" />
        </span>
        <h2 className="mt-6 text-xl font-semibold text-ink">Coming next</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          The shared foundation is ready. This feature is the next part for your group to build.
        </p>
        <ul className="mt-5 space-y-3 text-sm text-slate-600">
          {planned.map((item) => (
            <li key={item} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
