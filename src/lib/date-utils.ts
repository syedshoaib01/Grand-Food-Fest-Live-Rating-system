/**
 * Festival Timezone Utilities (Asia/Kolkata - IST, UTC+05:30)
 * 
 * Grand Food Fest 2026 takes place at Gachibowli Stadium, Hyderabad.
 * All event dates, day cutoffs, and midnight quota resets operate in India Standard Time.
 */

export const FESTIVAL_TIMEZONE = "Asia/Kolkata";
export const IST_OFFSET_MINUTES = 330; // UTC+5:30

/**
 * Returns current timestamp formatted in Asia/Kolkata timezone
 */
export function getFestivalTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: FESTIVAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Get the calendar day string (YYYY-MM-DD) in Asia/Kolkata timezone
 */
export function getFestivalDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FESTIVAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts; // Returns YYYY-MM-DD
}

/**
 * Creates a UTC Date corresponding to midnight (00:00:00 IST) of an event day
 */
export function createISTMidnightDate(year: number, month: number, day: number): Date {
  // IST is UTC+5:30, so 00:00:00 IST is 18:30:00 UTC on the previous day
  const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  // Subtract 5 hours 30 mins to convert IST midnight to UTC
  d.setMinutes(d.getMinutes() - IST_OFFSET_MINUTES);
  return d;
}

/**
 * Creates a UTC Date corresponding to the end of an event day (23:59:59.999 IST)
 */
export function createISTEndOfDayDate(year: number, month: number, day: number): Date {
  const d = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  d.setMinutes(d.getMinutes() - IST_OFFSET_MINUTES);
  return d;
}
