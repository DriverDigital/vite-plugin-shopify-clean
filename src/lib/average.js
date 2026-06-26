/**
 * Returns the arithmetic mean of the given numbers.
 *
 * @param {number[]} nums - The array of numbers to average.
 * @returns {number} The sum of `nums` divided by its length.
 */
export function average(nums) {
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}
