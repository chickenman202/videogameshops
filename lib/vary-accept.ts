/** Add the Accept token without treating Accept-Encoding as Accept. Repeated tokens collapse. */
export function varyWithAccept(value: unknown): string {
  const text = Array.isArray(value) ? value.map((part) => String(part)).join(", ") : String(value ?? "");
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const part of text.split(",")) {
    const token = part.trim();
    if (!token) continue;
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(token);
  }
  if (!seen.has("accept")) unique.push("Accept");
  return unique.join(", ");
}
