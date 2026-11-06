import type { Filters } from "@/lib/filters";

export function SearchForm({
  action = "/directory",
  filters,
  placeholder = "Country, region, city, or shop name",
  label = "Search shops",
  hint = "Country, region, city, or shop name.",
  id = "store-search",
  onDark = false,
}: {
  action?: string;
  filters?: Filters;
  placeholder?: string;
  label?: string;
  hint?: string;
  id?: string;
  onDark?: boolean;
}) {
  const hintId = `${id}-hint`;
  return (
    <form action={action} method="get" role="search" className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {filters?.sellsNew ? <input type="hidden" name="new" value="1" /> : null}
      {filters?.sellsUsed ? <input type="hidden" name="used" value="1" /> : null}
      {filters?.tradeIns ? <input type="hidden" name="trade" value="1" /> : null}
      {filters?.repairs ? <input type="hidden" name="repair" value="1" /> : null}
      <div className="sm:w-44 sm:pb-2">
        <label className={onDark ? "kicker text-paper" : "kicker text-ink"} htmlFor={id}>
          {label}
        </label>
        <p id={hintId} className={onDark ? "mt-1 text-sm text-paper/70" : "mt-1 text-sm text-ink-soft"}>
          {hint}
        </p>
      </div>
      <input
        id={id}
        name="q"
        defaultValue={filters?.q ?? ""}
        placeholder={placeholder}
        autoComplete="off"
        aria-describedby={hintId}
        className="min-h-11 w-full min-w-0 flex-1 border-0 border-b-2 border-ink bg-transparent px-0 font-serif text-lg text-ink placeholder:text-muted focus:border-blue-ink"
      />
      <button type="submit" className="btn btn-primary w-full sm:w-auto">
        Search
      </button>
    </form>
  );
}
