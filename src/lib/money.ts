/**
 * Money is stored everywhere as an integer number of minor units ("cents").
 * Never store or math on floating-point currency. Parse at the input edge,
 * format at the display edge, keep integers in between.
 */

export type Cents = number;

/** Parse user input ("1,240.50", "1240", "$40") into integer cents. */
export function parseAmountToCents(input: string): Cents | null {
  if (input == null) return null;
  const cleaned = input.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/** Currency symbol lookup with a sensible fallback to the ISO code. */
const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
};

export function currencySymbol(code: string): string {
  return SYMBOLS[code] ?? code + " ";
}

export type FormatOpts = {
  /** Include the currency symbol. Default true. */
  symbol?: boolean;
  /** Force sign display (+/-). Default false. */
  signed?: boolean;
  /** Hide the fractional part when it's .00. Default true. */
  compactZeros?: boolean;
};

/** Format integer cents into a display string for the given currency. */
export function formatCents(
  cents: Cents,
  currency = "QAR",
  opts: FormatOpts = {},
): string {
  const { symbol = true, signed = false, compactZeros = true } = opts;
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;

  const groupedWhole = whole.toLocaleString("en-US");
  const showFrac = !(compactZeros && frac === 0);
  const body = showFrac
    ? `${groupedWhole}.${String(frac).padStart(2, "0")}`
    : groupedWhole;

  const sign = negative ? "-" : signed ? "+" : "";
  const sym = symbol ? currencySymbol(currency) : "";
  return `${sign}${sym}${body}`;
}

/** Display string suited to the split-flap board (symbol + grouped, no sign). */
export function boardString(cents: Cents, currency = "QAR"): string {
  return formatCents(Math.abs(cents), currency, { compactZeros: true });
}
