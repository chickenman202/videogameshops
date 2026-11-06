import type { Filters } from "@/lib/filters";

export function SearchForm({
  action = "/directory",
  filters,
  placeholder = "City or store name",
  tone = "overlap",
}: {
  action?: string;
  filters?: Filters;
  placeholder?: string;
  tone?: "overlap" | "plain";
}) {
  const shell =
    tone === "overlap"
      ? "flex items-center gap-2 rounded-full border border-[#d5dbe3] bg-white p-2 shadow-[0_16px_40px_rgba(9,11,16,0.12)]"
      : "flex items-center gap-2 rounded-full border border-[#d5dbe3] bg-white p-2";

  return (
    <form action={action} method="get" className={shell} role="search">
      {filters?.sellsNew ? <input type="hidden" name="new" value="1" /> : null}
      {filters?.sellsUsed ? <input type="hidden" name="used" value="1" /> : null}
      {filters?.tradeIns ? <input type="hidden" name="trade" value="1" /> : null}
      {filters?.repairs ? <input type="hidden" name="repair" value="1" /> : null}
      <label className="sr-only" htmlFor="store-search">
        Search stores
      </label>
      <input
        id="store-search"
        name="q"
        defaultValue={filters?.q ?? ""}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-4 py-2 text-[#090b10] outline-none placeholder:text-[#8b95a3]"
      />
      <button
        type="submit"
        className="rounded-full bg-[#155eef] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0f4ed0]"
      >
        Search
      </button>
    </form>
  );
}
