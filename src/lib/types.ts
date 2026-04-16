/**
 * Mileage Tracker — Types & Helpers
 *
 * CSV schema: date, fuel_purchased(<currency>), fuel_volume(<vol>), odometer(<dist>)
 *
 * Each row is a refueling event:
 *   e.g. "2024-04-01, 43.63, 12.5, 45230"
 */

/** A single refueling record from the CSV */
export interface FuelRecord {
  date: string
  fuel_purchased: string
  fuel_volume: string
  odometer: string
}

/** Converts a raw Record<string, unknown> into a typed FuelRecord */
export function toFuelRecord(r: Record<string, unknown>): FuelRecord {
  return {
    date: String(r.date || ""),
    fuel_purchased: String(r.fuel_purchased || ""),
    fuel_volume: String(r.fuel_volume || ""),
    odometer: String(r.odometer || ""),
  }
}

/** Safely parses a YYYY-MM-DD string into local year, month, day */
export function parseLocalDate(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split("-")
  if (parts.length >= 3) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10),
    }
  }
  const d = new Date(dateStr)
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
}

/** Compute fuel efficiency between two consecutive fill-ups (sorted by odometer ascending) */
export function computeEfficiency(current: FuelRecord, previous: FuelRecord): number | null {
  const curOdo = parseFloat(current.odometer)
  const prevOdo = parseFloat(previous.odometer)
  const fuel = parseFloat(current.fuel_volume)
  if (isNaN(curOdo) || isNaN(prevOdo) || isNaN(fuel) || fuel <= 0 || curOdo <= prevOdo) return null
  return (curOdo - prevOdo) / fuel
}
