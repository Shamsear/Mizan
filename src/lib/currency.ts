/**
 * Currency detection utilities.
 * Detects the user's locale at first launch and maps it to an ISO 4217 currency code.
 * Stored in Settings.baseCurrency and used for all formatting throughout the app.
 */

/** Maps a browser locale region to an ISO 4217 currency code */
const REGION_TO_CURRENCY: Record<string, string> = {
  // Americas
  US: "USD", CA: "CAD", MX: "MXN", BR: "BRL", AR: "ARS",
  CL: "CLP", CO: "COP", PE: "PEN", VE: "VES",
  // Europe
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", PT: "EUR",
  NL: "EUR", BE: "EUR", AT: "EUR", IE: "EUR", FI: "EUR",
  GR: "EUR", SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR",
  LT: "EUR", LU: "EUR", MT: "EUR", CY: "EUR",
  GB: "GBP", SE: "SEK", NO: "NOK", DK: "DKK", CH: "CHF",
  PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", BG: "BGN",
  HR: "EUR", RS: "RSD", UA: "UAH", RU: "RUB", TR: "TRY",
  // Asia-Pacific
  JP: "JPY", CN: "CNY", KR: "KRW", IN: "INR", AU: "AUD",
  NZ: "NZD", SG: "SGD", HK: "HKD", TW: "TWD", TH: "THB",
  ID: "IDR", MY: "MYR", PH: "PHP", VN: "VND", PK: "PKR",
  BD: "BDT", LK: "LKR",
  // Middle East & Africa
  SA: "SAR", AE: "AED", QA: "QAR", KW: "KWD", BH: "BHD",
  OM: "OMR", JO: "JOD", EG: "EGP", NG: "NGN", ZA: "ZAR",
  KE: "KES", GH: "GHS", MA: "MAD", TN: "TND",
  IL: "ILS",
};

/** Maps an ISO 4217 code to its display symbol */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", CAD: "CA$", MXN: "MX$", BRL: "R$", ARS: "AR$",
  CLP: "CL$", COP: "CO$", PEN: "S/", VES: "Bs",
  EUR: "€", GBP: "£", SEK: "kr", NOK: "kr", DKK: "kr",
  CHF: "Fr", PLN: "zł", CZK: "Kč", HUF: "Ft", RON: "lei",
  BGN: "лв", HRK: "kn", RSD: "дин", UAH: "₴", RUB: "₽", TRY: "₺",
  JPY: "¥", CNY: "¥", KRW: "₩", INR: "₹", AUD: "A$",
  NZD: "NZ$", SGD: "S$", HKD: "HK$", TWD: "NT$", THB: "฿",
  IDR: "Rp", MYR: "RM", PHP: "₱", VND: "₫", PKR: "₨",
  BDT: "৳", LKR: "Rs",
  SAR: "SR ", AED: "د.إ", QAR: "QR ", KWD: "د.ك", BHD: "BD",
  OMR: "﷼", JOD: "JD", EGP: "E£", NGN: "₦", ZAR: "R",
  KES: "KSh", GHS: "₵", MAD: "DH", TND: "DT", ILS: "₪",
};

/** Number of decimal places per currency */
export const CURRENCY_DECIMALS: Record<string, number> = {
  JPY: 0, KRW: 0, VND: 0, IDR: 0, CLP: 0, HUF: 0, TWD: 0,
  BHD: 3, KWD: 3, OMR: 3, JOD: 3,
};

/**
 * Detects the user's likely currency from their browser locale.
 * e.g. "en-US" → "USD", "de-DE" → "EUR", "ar-SA" → "SAR"
 */
export function detectCurrency(locale?: string): string {
  try {
    const l = locale ?? (typeof navigator !== "undefined" ? navigator.language : "en-QA");
    // Extract region code (e.g. "US" from "en-US", "QA" from "en-QA")
    const parts = l.replace("_", "-").split("-");
    const region = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
    
    // For Mizan (Qatari app), we map South Asian locales (IN, PK, BD, LK, NP) to QAR 
    // since expats from these regions living in Qatar earn/spend in Qatari Riyals.
    if (["IN", "PK", "BD", "LK", "NP"].includes(region)) {
      return "QAR";
    }
    
    return REGION_TO_CURRENCY[region] ?? "QAR";
  } catch {
    return "QAR";
  }
}

/**
 * Returns the display symbol for a given ISO 4217 currency code.
 * Falls back to the code itself if unknown.
 */
export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code;
}

/**
 * Returns the number of decimal places for a given currency.
 * Most currencies use 2. JPY, KRW etc use 0.
 */
export function getCurrencyDecimals(code: string): number {
  return CURRENCY_DECIMALS[code] ?? 2;
}

/**
 * Formats an amount in minor units (cents) to a display string.
 * e.g. formatMoney(123456, "USD") → "$1,234.56"
 */
export function formatMoney(
  amountCents: number,
  currencyCode: string,
  options: { signed?: boolean; symbolOnly?: boolean } = {}
): string {
  const decimals = getCurrencyDecimals(currencyCode);
  const amount = amountCents / Math.pow(10, decimals === 0 ? 2 : decimals);
  const symbol = getCurrencySymbol(currencyCode);
  const sign = options.signed && amountCents > 0 ? "+" : "";
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const neg = amountCents < 0 ? "−" : "";
  return `${neg}${sign}${symbol}${formatted}`;
}

/** All currencies available for the user to select in Settings */
export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "QAR", name: "Qatari Riyal", symbol: "﷼" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "₨" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
];

/** Standard QAR exchange rates (1 QAR to Home Currency) for job seeker runway calculations */
export const QAR_EXCHANGE_RATES: Record<string, number> = {
  USD: 0.27,
  EUR: 0.25,
  GBP: 0.21,
  INR: 22.82,
  PKR: 76.45,
  BDT: 32.35,
  NPR: 36.65,
  LKR: 81.20,
  PHP: 15.65,
  EGP: 13.25,
  NGN: 426.50,
  NLG: 1.0,
  QAR: 1.0,
};

