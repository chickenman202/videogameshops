/** Square mark: black field, one red stripe. Not a storefront illustration. */
export function Mark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" fill="#101114" />
      <rect width="7" height="32" fill="#e10600" />
    </svg>
  );
}
