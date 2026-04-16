/**
 * FuelLogCard — the main dashboard card.
 * Lists all fill-ups in reverse chronological order with efficiency calculations.
 */

import { useMemo, useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FuelStationIcon } from "@hugeicons/core-free-icons"
import { Add01Icon } from "@hugeicons/core-free-icons"
import FillItem from "./fill-item"
import FillDialog from "./fill-dialog"
import type { FuelRecord } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useFileHandle } from "@/components/providers/file-handle-provider"

interface FuelLogCardProps {
  records: Array<FuelRecord>
}

export default function FuelLogCard({ records }: FuelLogCardProps) {
  const { units } = useFileHandle()
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    setCurrentPage(1)
  }, [records.length])

  /** Sort by odometer ascending for efficiency calculations */
  const sortedAsc = useMemo(() => {
    return [...records].sort((a, b) => {
      const odoA = parseFloat(a.odometer) || 0
      const odoB = parseFloat(b.odometer) || 0
      return odoA - odoB
    })
  }, [records])

  /** Display order: most recent first, with nextOdometer attached */
  const displayRecords = useMemo(() => {
    return sortedAsc
      .map((r, i) => ({
        ...r,
        nextOdometer: sortedAsc[i + 1] ? parseFloat(sortedAsc[i + 1].odometer) : undefined,
      }))
      .reverse()
  }, [sortedAsc])

  /**
   * Summary metrics:
   *   1. Efficiency = distance / volume (km/L or mpg)
   *   2. Cost per distance = price / distance ($/km or $/mi)
   * Each shown as "Last Fill" and "30-Day Avg".
   */
  const summaryMetrics = useMemo(() => {
    if (sortedAsc.length < 2) return null

    const effLabel = units.distance === "km" ? "km/L" : "mpg"
    const costLabel = `${units.currency}/${units.distance}`

    // --- Last fill ---
    // Distance = latest odometer − previous odometer
    // That distance was covered using the *previous* fill's fuel and cost
    const last = sortedAsc[sortedAsc.length - 1]
    const prev = sortedAsc[sortedAsc.length - 2]
    const lastOdo = parseFloat(last.odometer)
    const prevOdo = parseFloat(prev.odometer)
    const prevVolume = parseFloat(prev.fuel_volume)
    const prevCost = parseFloat(prev.fuel_purchased)

    let lastEfficiency: number | null = null
    let lastCostPerDist: number | null = null

    if (!isNaN(lastOdo) && !isNaN(prevOdo) && lastOdo > prevOdo && !isNaN(prevVolume) && prevVolume > 0) {
      const dist = lastOdo - prevOdo
      lastEfficiency = dist / prevVolume
      if (!isNaN(prevCost)) lastCostPerDist = prevCost / dist
    }

    // --- 30-day average ---
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutoffISO = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`

    let totalDist30 = 0
    let totalVol30 = 0
    let totalCost30 = 0

    for (let i = 1; i < sortedAsc.length; i++) {
      if (sortedAsc[i].date < cutoffISO) continue
      const curOdo = parseFloat(sortedAsc[i].odometer)
      const pOdo = parseFloat(sortedAsc[i - 1].odometer)
      const pVol = parseFloat(sortedAsc[i - 1].fuel_volume)
      const pCost = parseFloat(sortedAsc[i - 1].fuel_purchased)
      if (!isNaN(curOdo) && !isNaN(pOdo) && curOdo > pOdo && !isNaN(pVol) && pVol > 0) {
        const d = curOdo - pOdo
        totalDist30 += d
        totalVol30 += pVol
        if (!isNaN(pCost)) totalCost30 += pCost
      }
    }

    const avg30Efficiency = totalVol30 > 0 ? totalDist30 / totalVol30 : null
    const avg30CostPerDist = totalDist30 > 0 ? totalCost30 / totalDist30 : null

    return { effLabel, costLabel, lastEfficiency, lastCostPerDist, avg30Efficiency, avg30CostPerDist }
  }, [sortedAsc, units])

  const totalPages = Math.ceil(displayRecords.length / pageSize)
  const paginatedRecords = displayRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon icon={FuelStationIcon} />
          <span>Fuel Log</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary: 2 metrics × 2 timeframes */}
          {summaryMetrics && (
            <div className="bg-muted/50 overflow-hidden rounded-lg border">
              {/* Header row */}
              <div className="grid grid-cols-3 text-center">
                <div />
                <div className="text-muted-foreground border-b px-2 py-1.5 text-[10px] font-medium tracking-wider uppercase">
                  Last Fill
                </div>
                <div className="text-muted-foreground border-b px-2 py-1.5 text-[10px] font-medium tracking-wider uppercase">
                  30-Day Avg
                </div>
              </div>

              {/* Row 1: Efficiency (distance / volume) */}
              <div className="grid grid-cols-3 items-center text-center">
                <div className="text-muted-foreground px-2 py-2 text-xs font-medium">
                  {summaryMetrics.effLabel}
                </div>
                <div className="py-2 text-lg font-bold tabular-nums">
                  {summaryMetrics.lastEfficiency !== null ? summaryMetrics.lastEfficiency.toFixed(1) : "–"}
                </div>
                <div className="py-2 text-lg font-bold tabular-nums">
                  {summaryMetrics.avg30Efficiency !== null ? summaryMetrics.avg30Efficiency.toFixed(1) : "–"}
                </div>
              </div>

              {/* Row 2: Cost per distance (price / distance) */}
              <div className="grid grid-cols-3 items-center border-t text-center">
                <div className="text-muted-foreground px-2 py-2 text-xs font-medium">
                  {summaryMetrics.costLabel}
                </div>
                <div className="py-2 text-lg font-bold tabular-nums">
                  {summaryMetrics.lastCostPerDist !== null ? summaryMetrics.lastCostPerDist.toFixed(2) : "–"}
                </div>
                <div className="py-2 text-lg font-bold tabular-nums">
                  {summaryMetrics.avg30CostPerDist !== null ? summaryMetrics.avg30CostPerDist.toFixed(2) : "–"}
                </div>
              </div>
            </div>
          )}

          {/* Fill-up list */}
          <div className="flex flex-col">
            {paginatedRecords.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm italic">
                No fill-ups logged yet.
              </p>
            )}
            {paginatedRecords.map((record, idx) => (
              <FillDialog key={`${record.date}-${record.odometer}-${idx}`} mode="edit" record={record}>
                <FillItem record={record} units={units} nextOdometer={record.nextOdometer} />
              </FillDialog>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <div className="flex items-center gap-1">
                {(() => {
                  const pages: Array<number | string> = []
                  const range = 1
                  for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
                      pages.push(i)
                    } else if (pages[pages.length - 1] !== "...") {
                      pages.push("...")
                    }
                  }
                  return pages.map((page, i) => {
                    if (page === "...") return <span key={`e-${i}`} className="px-2">...</span>
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        className={cn("h-8 w-8 p-0", { "pointer-events-none": currentPage === page })}
                        onClick={() => setCurrentPage(page as number)}
                      >
                        {page}
                      </Button>
                    )
                  })
                })()}
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
        <div className="size-4" />
        <FillDialog mode="add">
          <><HugeiconsIcon icon={Add01Icon} /> Log Fill-Up</>
        </FillDialog>
      </CardContent>
    </Card>
  )
}
