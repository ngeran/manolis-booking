// Calendar date (YYYY-MM-DD) in the restaurant's timezone.
// Set RESTAURANT_TZ (IANA name, e.g. "Europe/Athens") so day boundaries follow
// the restaurant rather than the server clock (UTC on Vercel).
export function localDateKey(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: process.env.RESTAURANT_TZ || "UTC" });
}
