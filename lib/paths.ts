export function pagePath(basePath: string, page: number): string {
  if (page <= 1) return basePath;
  return `${basePath}/page/${page}`;
}

export function statePath(stateSlug: string): string {
  return `/directory/${stateSlug}`;
}

export function cityPath(stateSlug: string, citySlug: string): string {
  return `/directory/${stateSlug}/${citySlug}`;
}

export function platformPath(platformSlug: string): string {
  return `/directory/platforms/${platformSlug}`;
}

export function platformCityPath(
  stateSlug: string,
  citySlug: string,
  platformSlug: string,
): string {
  return `/directory/${stateSlug}/${citySlug}/${platformSlug}`;
}

export function storePath(slug: string): string {
  return `/store/${slug}`;
}
