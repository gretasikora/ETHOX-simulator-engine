/** Aurora Graph Lab cluster palette (used for cluster filters/experiments, not node color) */
export const CLUSTER_COLORS = [
  "#2AFADF", // teal
  "#26C6FF", // cyan
  "#7C3AED", // violet
  "#34D399", // mint
  "#FB7185", // rose
  "#60A5FA", // blue
  "#A78BFA", // light violet
];

export function getClusterColor(clusterId: number): string {
  return CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];
}

/** Age → color: young = cool teal/cyan, middle = blue/violet, older = amber/orange. Missing/invalid = neutral. */
const AGE_COLOR_LOW = "#2DD4BF";   // teal (young)
const AGE_COLOR_MID = "#7C3AED";   // violet (middle)
const AGE_COLOR_HIGH = "#F59E0B";  // amber (older)
const AGE_NEUTRAL = "#64748B";     // muted slate when missing

export const AGE_COLOR_MIN = 18;
export const AGE_COLOR_MAX = 80;

export function getAgeColor(age: number | undefined | null): string {
  if (age == null || !Number.isFinite(age)) return AGE_NEUTRAL;
  const t = Math.max(0, Math.min(1, (age - AGE_COLOR_MIN) / (AGE_COLOR_MAX - AGE_COLOR_MIN)));
  if (t <= 0.5) return lerpHex(t * 2, AGE_COLOR_LOW, AGE_COLOR_MID);
  return lerpHex((t - 0.5) * 2, AGE_COLOR_MID, AGE_COLOR_HIGH);
}

/** Gender → shape for Sigma node type. */
export type NodeShapeType = "circle" | "square" | "triangle" | "diamond";

export function getGenderShape(gender: string | undefined | null): NodeShapeType {
  if (gender == null || typeof gender !== "string") return "diamond";
  const g = gender.toLowerCase().trim();
  if (g === "male") return "circle";
  if (g === "female") return "square";
  if (g === "non_binary" || g === "non-binary") return "triangle";
  return "diamond";
}

/** Interpolate between aurora accent-0 (teal) and accent-2 (violet) for trait/centrality */
function lerpHex(t: number, hexA: string, hexB: string): string {
  const parse = (hex: string) => {
    const h = hex.replace(/^#/, "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(hexA);
  const [r2, g2, b2] = parse(hexB);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${[r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("")}`;
}

const AURORA_LOW = "#2AFADF";
const AURORA_HIGH = "#7C3AED";

export function getGradientColor(value: number, min: number, max: number): string {
  const range = max - min;
  const normalized = range === 0 ? 0.5 : (value - min) / range;
  const clamped = Math.max(0, Math.min(1, normalized));
  return lerpHex(clamped, AURORA_LOW, AURORA_HIGH);
}

export function hexToRgba(hex: string, alpha: number): string {
  const match = hex.replace(/^#/, "").match(/.{2}/g);
  if (!match) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(match[0], 16);
  const g = parseInt(match[1], 16);
  const b = parseInt(match[2], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Diverging scale for opinion -1..+1: blue/teal (negative) -> neutral -> violet (positive) - aurora themed */
export function getOpinionColor(opinion: number): string {
  const t = Math.max(-1, Math.min(1, opinion));
  const normalized = (t + 1) / 2;
  return lerpHex(normalized, AURORA_LOW, AURORA_HIGH);
}
