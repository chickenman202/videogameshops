/** Shown only while the live catalog is empty and the temporary shop preview is on screen. */
export function PreviewNote({ onDark = false }: { onDark?: boolean }) {
  return (
    <p className={onDark ? "mt-4 max-w-xl font-mono text-xs leading-relaxed text-paper/70" : "mt-4 max-w-xl font-mono text-xs leading-relaxed text-muted"}>
      Preview of real shops copied from data/stores.json. This list is only here while the live catalog is empty.
    </p>
  );
}
