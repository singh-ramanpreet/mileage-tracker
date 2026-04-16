/** IndexedDB configuration for local file handle and data persistence */
export const DB_NAME = "mileage-tracker-db"
export const STORE_NAME = "settings"
export const HANDLE_KEY = "file-handle"
export const DATA_STORE = "data"

/** Unit settings — stored in the CSV header itself */
export interface UnitSettings {
  currency: string    // e.g. "$", "€", "£" or any custom text
  distance: "mi" | "km"
  volume: "gal" | "L"
}

/** Default units for a new file */
export const DEFAULT_UNITS: UnitSettings = {
  currency: "$",
  distance: "km",
  volume: "L",
}

/** Build CSV header string from unit settings */
export function buildCsvHeaders(units: UnitSettings): string {
  return `date,fuel_purchased(${units.currency}),fuel_volume(${units.volume}),odometer(${units.distance})`
}

/** Parse unit settings from a header line */
export function parseUnitsFromHeader(headerLine: string): UnitSettings {
  const units = { ...DEFAULT_UNITS }

  // Match fuel_purchased(...)
  const currencyMatch = headerLine.match(/fuel_purchased\(([^)]+)\)/)
  if (currencyMatch) units.currency = currencyMatch[1]

  // Match fuel_volume(...)
  const volumeMatch = headerLine.match(/fuel_volume\(([^)]+)\)/)
  if (volumeMatch) units.volume = volumeMatch[1] as "gal" | "L"

  // Match odometer(...)
  const distanceMatch = headerLine.match(/odometer\(([^)]+)\)/)
  if (distanceMatch) units.distance = distanceMatch[1] as "mi" | "km"

  return units
}

/** The raw column names (without unit suffixes) used for data access */
export const COLUMN_NAMES = ["date", "fuel_purchased", "fuel_volume", "odometer"] as const
