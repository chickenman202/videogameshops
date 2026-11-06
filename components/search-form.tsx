import type { Filters } from "@/lib/filters";

export function SearchForm({
  action = "/directory",
  filters,
  placeholder = "City, state, or shop name",
  label = "Search stores",
  hint = "Try a city, a state, or a shop name.",
  id = "store-search",
}: {
  action?: string;
  filters?: Filters;
  placeholder?: string;
  label?: string;
  hint?: string;
  id?: string;
}) {
  const hintId = `${id}-hint`;
  return (
    <form action={action} method="get" className="rounded-2xl border border-line bg-card p-4 shadow-card" role="search">
      {filters?.sellsNew ? <input type="hidden" name="new" value="1" /> : null}
      {filters?.sellsUsed ? <input type="hidden" name="used" value="1" /> : null}
      {filters?.tradeIns ? <input type="hidden" name="trade" value="1" /> : null}
      {filters?.repairs ? <input type="hidden" name="repair" value="1" /> : null}
      <label className="block text-sm font-bold text-ink" htmlFor={id}>
        {label}
      </label>
      <p id={hintId} className="mt-1 text-sm text-muted">
        {hint}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3 hidden -translate-y-1/2 text-muted sm:block">
            <SearchIcon />
          </span>
          <input
            id={id}
            name="q"
            defaultValue={filters?.q ?? ""}
            placeholder={placeholder}
            autoComplete="off"
            aria-describedby={hintId}
            className="field sm:pl-10"
          />
        </div>
        <button type="submit" className="btn btn-primary w-full sm:w-auto">
          Search
        </button>
      </div>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}
