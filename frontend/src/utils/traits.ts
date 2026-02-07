/**
 * Convert snake_case to Title Case for display.
 * Leaves existing spaced keys as-is (e.g. "Energy Level" stays "Energy Level").
 */
export function formatTraitLabel(name: string): string {
  if (!name) return name;
  if (name.includes(" ")) return name;
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export interface TraitEntry {
  name: string;
  value: number;
}

/**
 * Sort traits by value descending. Returns array of { name, value }.
 */
export function sortTraits(traits: Record<string, number>): TraitEntry[] {
  return Object.entries(traits ?? {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
