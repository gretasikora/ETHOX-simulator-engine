export const CLUSTER_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#14b8a6",
];

export function getClusterColor(clusterId: number): string {
  return CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];
}

/** Convert HSL to hex so WebGL (Sigma) can render it. */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n: number) => {
    const v = Math.round((n + m) * 255);
    return Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getGradientColor(value: number, min: number, max: number): string {
  const range = max - min;
  const normalized = range === 0 ? 0.5 : (value - min) / range;
  const clamped = Math.max(0, Math.min(1, normalized));
  const hue = 240 - clamped * 180;
  return hslToHex(hue, 70, 55);
}

export function hexToRgba(hex: string, alpha: number): string {
  const match = hex.replace(/^#/, "").match(/.{2}/g);
  if (!match) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(match[0], 16);
  const g = parseInt(match[1], 16);
  const b = parseInt(match[2], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
