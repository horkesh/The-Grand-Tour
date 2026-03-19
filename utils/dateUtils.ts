/** Returns the current day-of-year (1-based). */
export function getDayOfYear(): number {
  return Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 864e5,
  );
}
