/**
 * FillItem — displays a single refueling event with a date pill (like simple-budget).
 */

import { format } from "date-fns"
import { parseLocalDate } from "@/lib/types"
import type { FuelRecord } from "@/lib/types"
import type { UnitSettings } from "@/lib/constants"

interface FillItemProps {
  record: FuelRecord
  units: UnitSettings
  nextOdometer?: number
}

export default function FillItem({ record, units, nextOdometer }: FillItemProps) {
  const d = parseLocalDate(record.date)
  const dateObj = new Date(d.year, d.month - 1, 1)
  const shortMonth = format(dateObj, "MMM")
  const dayNum = d.day

  const purchased = parseFloat(record.fuel_purchased)
  const volume = parseFloat(record.fuel_volume)
  const odo = parseFloat(record.odometer)
  const trip = nextOdometer !== undefined && !isNaN(odo) ? nextOdometer - odo : null

  return (
    <div className="hover:bg-muted cursor-pointer rounded-lg py-1 pr-2 transition-colors">
      <div className="flex shrink-0 items-center gap-2">
        {/* Date pill + Volume */}
        <div className="flex w-[49.5%] shrink-0 items-center gap-2">
          <div className="bg-secondary text-secondary-foreground flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg">
            <div className="bg-muted-foreground/20 w-full rounded-t-lg text-center">
              <span className="text-xs font-semibold uppercase">{shortMonth}</span>
            </div>
            <span className="text-lg font-bold">{dayNum}</span>
          </div>

          <div className="text-left">
            <h3 className="text-primary truncate font-medium">
              {!isNaN(volume) ? `${volume} ${units.volume}` : "—"}
            </h3>
            {!isNaN(odo) && (
            <p className="text-muted-foreground truncate text-sm">
              {odo.toLocaleString()} {units.distance}
            </p>
          )}
          </div>
        </div>

        {/* Trip / Odometer */}
        <div className="w-[29%] shrink-0 text-left">
          {trip !== null ? (
            <>
            <h3 className="text-primary truncate font-medium">
              {trip.toLocaleString()} {units.distance} 
            </h3>
            <p className="text-muted-foreground truncate text-sm">{(trip / volume).toFixed(2)} {units.distance}/{units.volume}</p>
            </>
          ) : (
            <h3 className="text-muted-foreground truncate font-medium">—</h3>
          )}
          
        </div>

        {/* Cost */}
        <div className="w-[19%] shrink-0 text-right">
          <span className="text-primary font-medium">
            {!isNaN(purchased) ? `${units.currency}${purchased.toFixed(2)}` : "—"}
          </span>
        </div>
      </div>
    </div>
  )
}
