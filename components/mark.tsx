/** Official storefront mark. Paths and colors match public/logo.svg. */
export function Mark({ className = "size-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} aria-hidden="true">
      <g fillRule="evenodd">
        <path
          fill="#141416"
          stroke="#C5CCD6"
          strokeWidth="16"
          strokeLinejoin="round"
          strokeLinecap="round"
          d="M256 86 L420 228 V422 H92 V228 Z"
        />
        <rect x="128" y="256" width="56" height="58" rx="7" fill="#FFFFFF" />
        <rect x="128" y="332" width="56" height="58" rx="7" fill="#FFFFFF" />
        <rect x="328" y="256" width="56" height="58" rx="7" fill="#FFFFFF" />
        <rect x="328" y="332" width="56" height="58" rx="7" fill="#FFFFFF" />
        <rect x="204" y="248" width="104" height="174" rx="10" fill="#141416" stroke="#C5CCD6" strokeWidth="12" />
        <rect x="220" y="276" width="72" height="122" rx="11" fill="#FFFFFF" />
        <rect x="220" y="304" width="72" height="16" fill="#155EEF" />
      </g>
    </svg>
  );
}
