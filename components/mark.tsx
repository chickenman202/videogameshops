/** Small storefront mark used in the header, footer, and tab icon. */
export function Mark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1e4d3a" />
      <path
        d="M7 15.2 16 8l9 7.2"
        fill="none"
        stroke="#fffdf8"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="9" y="15" width="14" height="10" rx="1.2" fill="#fffdf8" />
      <rect x="14.2" y="19" width="3.6" height="6" rx="0.6" fill="#1e4d3a" />
    </svg>
  );
}
