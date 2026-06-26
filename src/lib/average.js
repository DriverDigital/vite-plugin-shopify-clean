/**
 * Returns the arithmetic mean of the given numbers.
 *
 * @param {number[]} nums - The array of numbers to average.
 * @returns {number} The sum of `nums` divided by its length. Returns `NaN`
 *   for an empty array, since the mean of no values is undefined.
 */
export function average(nums) {
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}
