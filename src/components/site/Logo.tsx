export function Logo({
  variant = "dark",
  showWordmark = true,
  className = "",
}: {
  variant?: "dark" | "light";
  showWordmark?: boolean;
  className?: string;
}) {
  const ink = variant === "light" ? "#F7F4EE" : "#071A2B";
  const sub = variant === "light" ? "text-plasma/64" : "text-slate";

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 64 64" className="h-10 w-10 shrink-0 md:h-11 md:w-11">
        <path
          d="M32 4C24 15 15 25 15 38.1C15 48.8 22.6 57 32 57s17-8.2 17-18.9C49 25 40 15 32 4Z"
          fill="none"
          stroke={ink}
          strokeWidth="2.5"
        />
        <circle cx="32" cy="37" r="9.4" fill="none" stroke="#146EF5" strokeWidth="2.5" />
        <ellipse
          cx="32"
          cy="37"
          rx="25"
          ry="9.5"
          fill="none"
          stroke="#146EF5"
          strokeWidth="1.8"
          transform="rotate(-14 32 37)"
        />
        <circle cx="32" cy="37" r="3.7" fill="#EF5D58" />
      </svg>
      {showWordmark && (
        <div className="leading-none">
          <div className="flex items-baseline gap-1.5" style={{ color: ink }}>
            <span className="font-sans text-[0.62rem] font-semibold tracking-[0.18em]">DR</span>
            <span className="font-display text-[1.38rem] tracking-[-0.02em]">Tarfaya</span>
          </div>
          <div className={`mt-1 text-[0.5rem] font-semibold uppercase tracking-[0.2em] ${sub}`}>
            Laboratoire · Hématologie
          </div>
        </div>
      )}
    </div>
  );
}
