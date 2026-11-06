/** The only platform names this site creates pages for. */
export const PLATFORMS = [
  { slug: "playstation", label: "PlayStation" },
  { slug: "xbox", label: "Xbox" },
  { slug: "nintendo", label: "Nintendo" },
  { slug: "pc", label: "PC" },
  { slug: "handheld", label: "Handheld" },
  { slug: "retro", label: "Retro" },
  { slug: "vr", label: "VR" },
] as const;

export type PlatformLabel = (typeof PLATFORMS)[number]["label"];
export type PlatformSlug = (typeof PLATFORMS)[number]["slug"];

const BY_SLUG = new Map(PLATFORMS.map((platform) => [platform.slug, platform]));
const BY_LABEL = new Map(
  PLATFORMS.map((platform) => [platform.label.toLowerCase(), platform]),
);

export function getPlatformBySlug(slug: string) {
  return BY_SLUG.get(slug.trim().toLowerCase() as PlatformSlug) ?? null;
}

export function getPlatformByLabel(label: string) {
  return BY_LABEL.get(label.trim().toLowerCase()) ?? null;
}

export function isPlatformLabel(value: string): value is PlatformLabel {
  return BY_LABEL.has(value.trim().toLowerCase());
}

/** "Retro Game Stores" or "PlayStation Game Stores". */
export function platformHeading(label: string): string {
  if (label === "Retro") return "Retro Game Stores";
  if (label === "VR") return "VR Game Stores";
  return `${label} Game Stores`;
}
