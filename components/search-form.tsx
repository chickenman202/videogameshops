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
    <form action={action} method="get" role="search">
      {filters?.sellsNew ? <input type="hidden" name="new" value="1" /> : null}
      {filters?.sellsUsed ? <input type="hidden" name="used" value="1" /> : null}
      {filters?.tradeIns ? <input type="hidden" name="trade" value="1" /> : null}
      {filters?.repairs ? <input type="hidden" name="repair" value="1" /> : null}
      <label className={onDark ? "kicker text-paper" : "kicker text-ink"} htmlFor={id}>
        {label}
      </label>
      <p id={hintId} className={onDark ? "mt-2 text-sm text-paper/70" : "mt-2 text-sm text-muted"}>
        {hint}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          name="q"
          defaultValue={filters?.q ?? ""}
          placeholder={placeholder}
          autoComplete="off"
          aria-describedby={hintId}
          className="field min-w-0 flex-1"
        />
        <button type="submit" className={onDark ? "btn btn-light w-full sm:w-auto" : "btn btn-primary w-full sm:w-auto"}>
          Search
        </button>
      </div>
    </form>
  );
}
