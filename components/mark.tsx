/** Square mark: black field, one blue stripe. */
export function Mark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" fill="#090b10" />
      <rect width="7" height="32" fill="#155eef" />
    </svg>
  );
}
