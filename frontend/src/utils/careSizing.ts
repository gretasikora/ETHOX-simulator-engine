/**
 * Care-based node sizing and glow for impact animation.
 * level_of_care: 0..1 (or 0..10 from API, will be normalized)
 */

const SIZE_MIN = 4;
const SIZE_MAX = 18;

/** Normalize level_of_care to 0..1 (API may return 0..10) */
function normalizeCare(value: number): number {
  if (value > 1) return Math.max(0, Math.min(1, value / 10));
  return Math.max(0, Math.min(1, value));
}

/**
 * Compute final node size from level_of_care.
 * size = baseSize * (0.75 + 1.25 * level_of_care), clamped 4..18
 */
export function computeCareSize(levelOfCare: number, baseSize: number): number {
  const loc = normalizeCare(levelOfCare);
  const raw = baseSize * (0.75 + 1.25 * loc);
  return Math.max(SIZE_MIN, Math.min(SIZE_MAX, raw));
}

export interface CareGlowResult {
  borderColor: string;
  borderSize: number;
  glowStrength: number; // 0..1 for color modulation
}

/** Baseline for "neutral" care; delta from this drives glow direction */
export const BASELINE_CARE = 0.5;

/**
 * Compute glow/border styling based on level_of_care.
 * - High (>= 0.65): subtle cyan glow
 * - Low (<= 0.35): subtle dim cool gray
 * - Neutral: no accent
 */
export function computeCareGlow(levelOfCare: number): CareGlowResult {
  const loc = normalizeCare(levelOfCare);

  if (loc >= 0.65) {
    return {
      borderColor: "#26C6FF", // aurora accent-1 cyan
      borderSize: 1.5,
      glowStrength: 0.4 + 0.4 * ((loc - 0.65) / 0.35),
    };
  }
  if (loc <= 0.35) {
    return {
      borderColor: "#64748B", // cool gray
      borderSize: 1,
      glowStrength: 0.3 * (1 - loc / 0.35),
    };
  }
  return {
    borderColor: "transparent",
    borderSize: 0,
    glowStrength: 0,
  };
}
