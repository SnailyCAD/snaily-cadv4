/**
 * find the first smallest missing item from an array
 */
export function findFirstSmallestInArray(numbers: number[]) {
  const sorted = numbers.sort((a, b) => a - b);
  let int = 1;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] === int) int++;
  }

  return int;
}
