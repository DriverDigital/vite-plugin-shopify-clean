/**
 * Constrain a value to the inclusive [min, max] range.
 *
 * @param {number} value - The value to constrain.
 * @param {number} min - The lower bound (inclusive).
 * @param {number} max - The upper bound (inclusive).
 * @returns {number} `value` clamped so that `min <= result <= max`.
 */
export function clamp (value, min, max) {
  return Math.min(Math.max(value, min), max)
}
