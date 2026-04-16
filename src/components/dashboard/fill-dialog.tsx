/**
 * FillDialog — modular dialog for both adding and editing a fill-up.
 *
 * - mode="add": no delete button, but save/cancel keep same position
 * - mode="edit": shows delete, save, cancel — equally spaced, no icons
 *
 * Labels reflect the unit settings from the provider.
 * Date field uses shadcn Calendar + Popover.
 */

import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon } from "@hugeicons/core-free-icons"
import { useFileHandle } from "@/components/providers/file-handle-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { FuelRecord } from "@/lib/types"

/** Format a Date to YYYY-MM-DD for CSV storage */
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Parse a YYYY-MM-DD string into a local Date object */
function fromISO(s: string): Date | undefined {
  if (!s) return undefined
  const parts = s.split("-")
  if (parts.length < 3) return undefined
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
}

const EMPTY_RECORD: FuelRecord = {
  date: "",
  fuel_purchased: "",
  fuel_volume: "",
  odometer: "",
}

interface FillDialogProps {
  /** "add" for new entries, "edit" for existing */
  mode: "add" | "edit"
  /** The record to edit (ignored for mode="add") */
  record?: FuelRecord
  /** Trigger element */
  children: ReactNode
}

export default function FillDialog({ mode, record, children }: FillDialogProps) {
  const { data, setData, units } = useFileHandle()
  const [open, setOpen] = useState(false)

  const initial = mode === "edit" && record ? record : EMPTY_RECORD

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    fromISO(initial.date) || new Date()
  )
  const [fuelPurchased, setFuelPurchased] = useState(initial.fuel_purchased)
  const [fuelVolume, setFuelVolume] = useState(initial.fuel_volume)
  const [odometer, setOdometer] = useState(initial.odometer)

  // Reset form when dialog opens or record changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && record) {
        setSelectedDate(fromISO(record.date) || new Date())
        setFuelPurchased(record.fuel_purchased)
        setFuelVolume(record.fuel_volume)
        setOdometer(record.odometer)
      } else {
        setSelectedDate(new Date())
        setFuelPurchased("")
        setFuelVolume("")
        setOdometer("")
      }
    }
  }, [open, mode, record])

  const findIndex = (): number => {
    if (mode !== "edit" || !record) return -1
    return data.findIndex(
      (r) =>
        String(r.date) === record.date &&
        String(r.fuel_purchased) === record.fuel_purchased &&
        String(r.fuel_volume) === record.fuel_volume &&
        String(r.odometer) === record.odometer
    )
  }

  const handleSave = async () => {
    if (!selectedDate) return

    const newRecord: Record<string, unknown> = {
      date: toISO(selectedDate),
      fuel_purchased: fuelPurchased,
      fuel_volume: fuelVolume,
      odometer,
    }

    if (mode === "add") {
      await setData([...data, newRecord])
    } else {
      const idx = findIndex()
      if (idx === -1) return
      const updated = [...data]
      updated[idx] = newRecord
      await setData(updated)
    }
    setOpen(false)
  }

  const handleDelete = async () => {
    const idx = findIndex()
    if (idx === -1) return
    const updated = [...data]
    updated.splice(idx, 1)
    await setData(updated)
    setOpen(false)
  }

  const volumeUnit = units.volume
  const distanceUnit = units.distance
  const currencySymbol = units.currency

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          mode === "add" ? (
            <Button className="w-full" size="lg" />
          ) : (
            <div className="cursor-pointer" />
          )
        }
      >
        {children}
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-center">
            {mode === "add" ? "Log Fill-Up" : "Edit Fill-Up"}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
        >
          <div className="flex flex-col gap-3">
            {/* Date — Calendar Popover */}
            <div className="space-y-1">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    />
                  }
                >
                  <HugeiconsIcon icon={Calendar03Icon} size={16} className="mr-2" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(day) => {
                      if (day) setSelectedDate(day)
                    }}
                    defaultMonth={selectedDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Fuel Purchased */}
            <div className="space-y-1">
              <Label htmlFor="fill-purchased">Fuel Purchased ({currencySymbol})</Label>
              <Input
                id="fill-purchased"
                type="number"
                step="0.01"
                placeholder="e.g. 43.63"
                value={fuelPurchased}
                onChange={(e) => setFuelPurchased(e.target.value)}
              />
            </div>

            {/* Fuel Volume */}
            <div className="space-y-1">
              <Label htmlFor="fill-volume">Fuel Volume ({volumeUnit})</Label>
              <Input
                id="fill-volume"
                type="number"
                step="0.01"
                placeholder="e.g. 12.5"
                value={fuelVolume}
                onChange={(e) => setFuelVolume(e.target.value)}
              />
            </div>

            {/* Odometer */}
            <div className="space-y-1">
              <Label htmlFor="fill-odo">Odometer ({distanceUnit})</Label>
              <Input
                id="fill-odo"
                type="number"
                step="1"
                placeholder="e.g. 45230"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <div className="flex w-full gap-2">
              {mode === "edit" ? (
                <Button variant="destructive" className="flex-1" type="button" onClick={handleDelete}>
                  Delete
                </Button>
              ) : (
                <div className="flex-1" />
              )}
              <Button type="submit" className="flex-1">
                Save
              </Button>
              <Button variant="outline" className="flex-1" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
