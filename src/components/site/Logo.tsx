import brandLogo from "@/assets/brand/dr-tarfaya-logo.png";

export function Logo({
  variant = "dark",
  showWordmark = true,
  className = "",
}: {
  variant?: "dark" | "light";
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center ${
        variant === "light"
          ? "rounded-lg bg-white/95 px-2 py-1 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)]"
          : ""
      } ${className}`}
    >
      <img
        src={brandLogo}
        alt={
          showWordmark
            ? "Dr Tarfaya — Laboratoire d’analyses médicales"
            : "Dr Tarfaya"
        }
        className={
          showWordmark
            ? "h-auto w-[12.25rem] object-contain sm:w-[14rem]"
            : "h-12 w-12 object-contain object-left"
        }
        width={600}
        height={211}
        decoding="async"
      />
    </span>
  );
}
