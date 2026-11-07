/** The spelling that appears most often. A tie uses alphabetical order. */
export function preferredPlaceName(counts: Map<string, number>): string {
  let best = "";
  let bestCount = -1;
  for (const [name, count] of counts) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    if (count > bestCount || (count === bestCount && trimmed.localeCompare(best, "en") < 0)) {
      best = trimmed;
      bestCount = count;
    }
  }
  return best;
}

export function nameCounts(names: Iterable<string>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }
  return counts;
}
