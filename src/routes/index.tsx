import { createFileRoute } from "@tanstack/react-router"
import { useMemo } from "react"
import { useFileHandle } from "@/components/providers/file-handle-provider"
import { FileHandleManager } from "@/components/file-handle-manager"
import FuelLogCard from "@/components/dashboard/fuel-log-card"
import { toFuelRecord } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"

export const Route = createFileRoute("/")(  {
  component: HomePage,
})

function HomePage() {
  const { data, fileHandle, hasPermission, isLoading } = useFileHandle()

  const records = useMemo(() => data.map(toFuelRecord), [data])

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[400px] animate-pulse flex-col items-center justify-center italic">
        Loading...
      </div>
    )
  }

  if (!fileHandle || !hasPermission) {
    return (
      <div className="flex flex-col items-center space-y-4 pt-5">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span>Welcome to Mileage Tracker</span>
            </div>
            <CardDescription>
              Track fuel economy by logging fill-ups. Data is stored locally in a CSV file on your device.
              <br />
              <br />
              Select an existing CSV file or create a new one to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileHandleManager />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      <FuelLogCard records={records} />
    </div>
  )
}
