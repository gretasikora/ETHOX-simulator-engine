/**
 * Cubic easing: slow start, fast middle, slow end.
 * Used for smooth care impact animations.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
