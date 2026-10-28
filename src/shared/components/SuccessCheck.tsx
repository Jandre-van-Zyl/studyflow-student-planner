export function SuccessCheck({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#17613b]">
      <svg
        aria-hidden="true"
        className="success-check h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m7.5 12 3 3 6-6" />
      </svg>
      {children}
    </span>
  );
}
