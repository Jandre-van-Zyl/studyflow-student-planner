const paths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  subjects: 'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4z M13 7a3 3 0 0 1 3-3h5v15h-4a4 4 0 0 0-4 2',
  assessments: 'M8 4H5v17h14V4h-3 M9 2h6v5H9z M8 12h8 M8 16h5',
  activities: 'M3 3h18v12H3z M8 21l4-6 4 6 M7 7h10 M7 11h6',
  planner: 'M4 5h16v16H4z M8 2v6 M16 2v6 M4 10h16 M8 14h3 M13 17h3',
  account: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
  settings: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
