import { useState, useEffect } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { ComputerIcon, Database02Icon, Moon01Icon, Sun01Icon, Settings01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileHandleManager } from "@/components/file-handle-manager"
import { useTheme } from "@/components/providers/theme-provider"
import { useFileHandle } from "@/components/providers/file-handle-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { units, setUnits, fileHandle, hasPermission } = useFileHandle()

  const [currency, setCurrency] = useState(units.currency)
  const [distance, setDistance] = useState(units.distance)
  const [volume, setVolume] = useState(units.volume)
  const [saved, setSaved] = useState(false)

  // Sync local state when units change (e.g. after opening a new file)
  useEffect(() => {
    setCurrency(units.currency)
    setDistance(units.distance)
    setVolume(units.volume)
  }, [units])

  const handleSaveUnits = async () => {
    await setUnits({ currency, distance, volume })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const hasChanges = currency !== units.currency || distance !== units.distance || volume !== units.volume
  const isConnected = fileHandle && hasPermission

  return (
    <div className="animate-in fade-in flex flex-col items-center space-y-4 py-4 duration-500">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">Settings</CardTitle>
          <CardDescription>Manage your app preferences and data storage.</CardDescription>
        </CardHeader>
      </Card>

      {/* Appearance */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Sun01Icon} />
            <span className="font-semibold">Appearance</span>
          </div>
          <CardDescription>Customize how Mileage Tracker looks on your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="bg-muted flex flex-1 items-center gap-1 rounded-lg border p-1">
              <Button
                variant={theme === "light" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTheme("light")}
                className={cn("flex-1 px-2", theme === "light" && "shadow-sm")}
              >
                <HugeiconsIcon icon={Sun01Icon} size={16} />
                <span className="ml-2">Light</span>
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTheme("dark")}
                className={cn("flex-1 px-2", theme === "dark" && "shadow-sm")}
              >
                <HugeiconsIcon icon={Moon01Icon} size={16} />
                <span className="ml-2">Dark</span>
              </Button>
              <Button
                variant={theme === "system" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTheme("system")}
                className={cn("flex-1 px-2", theme === "system" && "shadow-sm")}
              >
                <HugeiconsIcon icon={ComputerIcon} size={16} />
                <span className="ml-2">System</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Units / Metrics */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Settings01Icon} />
            <span className="font-semibold">Units</span>
          </div>
          <CardDescription>
            Configure units stored in the CSV header. Changing units does not convert existing data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {/* Currency Symbol */}
            <div className="flex items-center justify-between">
              <Label htmlFor="currency-input">Currency Symbol</Label>
              <Input
                id="currency-input"
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-20 text-center"
                disabled={!isConnected}
              />
            </div>

            {/* Odometer: mi / km */}
            <div className="flex items-center justify-between">
              <Label>Odometer</Label>
              <div className="flex items-center gap-2">
                <span className={cn("text-sm", distance === "mi" ? "font-semibold" : "text-muted-foreground")}>mi</span>
                <Switch
                  checked={distance === "km"}
                  onCheckedChange={(checked) => setDistance(checked ? "km" : "mi")}
                  disabled={!isConnected}
                />
                <span className={cn("text-sm", distance === "km" ? "font-semibold" : "text-muted-foreground")}>km</span>
              </div>
            </div>

            {/* Fuel Volume: gal / L */}
            <div className="flex items-center justify-between">
              <Label>Fuel Volume</Label>
              <div className="flex items-center gap-2">
                <span className={cn("text-sm", volume === "gal" ? "font-semibold" : "text-muted-foreground")}>gal</span>
                <Switch
                  checked={volume === "L"}
                  onCheckedChange={(checked) => setVolume(checked ? "L" : "gal")}
                  disabled={!isConnected}
                />
                <span className={cn("text-sm", volume === "L" ? "font-semibold" : "text-muted-foreground")}>L</span>
              </div>
            </div>

            {/* Save button */}
            <Button
              className="w-full"
              onClick={handleSaveUnits}
              disabled={!hasChanges || !isConnected}
            >
              {saved ? "Saved!" : "Save Units"}
            </Button>

            {!isConnected && (
              <p className="text-muted-foreground text-center text-xs italic">
                Connect a CSV file to configure units.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Storage */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Database02Icon} />
            <span className="font-semibold">Data Storage</span>
          </div>
          <CardDescription>
            Fuel data is stored locally in a CSV file on your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileHandleManager />
        </CardContent>
      </Card>
    </div>
  )
}
