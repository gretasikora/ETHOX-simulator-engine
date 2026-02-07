/**
 * Pack a CSS color string into a float for Sigma WebGL (matches sigma/utils floatColor).
 */
const cache: Record<string, number> = {};
const FLOAT32 = new Float32Array(1);
const INT32 = new Int32Array(FLOAT32.buffer);

function parseHex(hex: string): { r: number; g: number; b: number; a: number } {
  const h = hex.replace(/^#/, "");
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }
  if (h.length === 8) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: parseInt(h.slice(6, 8), 16) / 255,
    };
  }
  return { r: 255, g: 255, b: 255, a: 1 };
}

function parseRgba(str: string): { r: number; g: number; b: number; a: number } {
  const m = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (m) {
    return {
      r: Math.max(0, Math.min(255, parseInt(m[1], 10))),
      g: Math.max(0, Math.min(255, parseInt(m[2], 10))),
      b: Math.max(0, Math.min(255, parseInt(m[3], 10))),
      a: m[4] != null ? Math.max(0, Math.min(1, parseFloat(m[4]))) : 1,
    };
  }
  return { r: 255, g: 255, b: 255, a: 1 };
}

export function floatColor(val: string): number {
  if (cache[val] !== undefined) return cache[val];
  const parsed = val.startsWith("rgba") || val.startsWith("rgb(") ? parseRgba(val) : parseHex(val);
  const { r, g, b, a } = parsed;
  const a8 = Math.max(0, Math.min(255, (a * 255) | 0));
  INT32[0] = ((a8 << 24) | (b << 16) | (g << 8) | r) & 0xfeffffff;
  cache[val] = FLOAT32[0];
  return cache[val];
}
