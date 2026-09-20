// Unica fonte per gli anchor interni: la usano gli heading (`id`) e la TOC
// (`href`), così i due restano sempre allineati.
export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
