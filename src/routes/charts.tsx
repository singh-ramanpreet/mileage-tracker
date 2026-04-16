import { createFileRoute } from "@tanstack/react-router"
import { Chart01Icon, FilterIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import { useEffect, useMemo, useRef, useState } from "react"

import { useFileHandle } from "@/components/providers/file-handle-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toFuelRecord, parseLocalDate } from "@/lib/types"

// Register Chart.js components
Chart.register(LineController, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export const Route = createFileRoute("/charts")({
  component: ChartsPage,
})

function ChartsPage() {
  const { data, fileHandle, hasPermission, units } = useFileHandle()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  const [metric, setMetric] = useState<"efficiency" | "costPerDist">("efficiency")
  const [timeRange, setTimeRange] = useState<"30d" | "3m" | "6m" | "all">("3m")

  const records = useMemo(() => {
    return data.map((r) => toFuelRecord(r)).sort((a, b) => {
      const odoA = parseFloat(a.odometer) || 0
      const odoB = parseFloat(b.odometer) || 0
      return odoA - odoB
    })
  }, [data])

  const chartData = useMemo(() => {
    const labels: Array<string> = []
    const plotData: Array<number> = []

    const now = new Date()
    const cutoff = new Date()
    if (timeRange === "30d") cutoff.setDate(now.getDate() - 30)
    else if (timeRange === "3m") cutoff.setMonth(now.getMonth() - 3)
    else if (timeRange === "6m") cutoff.setMonth(now.getMonth() - 6)
    else cutoff.setFullYear(now.getFullYear() - 100) // All time

    // Calculate metrics between each consecutive fill-up
    for (let i = 1; i < records.length; i++) {
      const last = records[i]
      const prev = records[i - 1]

      const { year: y, month: m, day: d } = parseLocalDate(last.date)
      const dateObj = new Date(y, m - 1, d)

      if (dateObj < cutoff) continue

      const lastOdo = parseFloat(last.odometer)
      const prevOdo = parseFloat(prev.odometer)
      const prevVolume = parseFloat(prev.fuel_volume)
      const prevCost = parseFloat(prev.fuel_purchased)

      if (
        !isNaN(lastOdo) &&
        !isNaN(prevOdo) &&
        lastOdo > prevOdo &&
        !isNaN(prevVolume) &&
        prevVolume > 0
      ) {
        const dist = lastOdo - prevOdo
        const label = dateObj.toLocaleDateString("default", { month: "short", day: "numeric" })
        
        let value = 0
        if (metric === "efficiency") {
          value = dist / prevVolume
        } else {
          if (!isNaN(prevCost)) {
            value = prevCost / dist
          } else {
            continue
          }
        }

        labels.push(label)
        plotData.push(value)
      }
    }

    const average = plotData.length > 0 ? plotData.reduce((a, b) => a + b, 0) / plotData.length : 0
    const averageData = new Array(plotData.length).fill(average)

    const metricLabel =
      metric === "efficiency"
        ? units.distance === "km"
          ? "km/L"
          : "mpg"
        : `${units.currency}/${units.distance}`

    return {
      labels,
      datasets: [
        {
          label: metricLabel,
          data: plotData,
          backgroundColor: "rgba(59, 130, 246, 0.6)", // blue-500
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: "rgb(59, 130, 246)",
          tension: 0.1, // Smooth lines slightly
        },
        {
          label: "Average",
          data: averageData,
          borderColor: "rgba(239, 68, 68, 0.8)", // red-500
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
      ],
      metricLabel,
    }
  }, [records, metric, units, timeRange])

  useEffect(() => {
    if (!chartRef.current) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || ""
                if (label) label += ": "
                if (context.parsed.y !== null) {
                  if (metric === "costPerDist") {
                    label += new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    })
                      .format(context.parsed.y)
                      .replace("$", units.currency)
                  } else {
                    label += context.parsed.y.toFixed(2)
                  }
                }
                return label
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                if (metric === "costPerDist") {
                  return new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumSignificantDigits: 3,
                  })
                    .format(value as number)
                    .replace("$", units.currency)
                }
                return Number(value).toFixed(1)
              },
            },
          },
        },
      },
      plugins: [
        {
          id: "averageLineLabel",
          afterDraw: (chart) => {
            const {
              ctx,
              chartArea: { right },
              scales: { y },
            } = chart
            const dataset = chart.data.datasets[1]
            if (!dataset || !dataset.data || dataset.data.length === 0) return

            const avgValue = dataset.data[0] as number
            const yPos = y.getPixelForValue(avgValue)

            ctx.save()
            ctx.fillStyle = String(dataset.borderColor)
            ctx.font = "bold 11px sans-serif"
            ctx.textAlign = "right"
            ctx.textBaseline = "bottom"
            ctx.fillText(`Avg: ${avgValue.toFixed(2)}`, right, yPos - 5)
            ctx.restore()
          },
        },
      ],
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [chartData, metric, units])

  const metricItems = [
    { label: `Fuel Efficiency (${units.distance === "km" ? "km/L" : "mpg"})`, value: "efficiency" },
    { label: `Fuel Cost per ${units.distance} (${units.currency}/${units.distance})`, value: "costPerDist" },
  ]

  const timeItems = [
    { label: "Last 30 Days", value: "30d" },
    { label: "Last 3 Months", value: "3m" },
    { label: "Last 6 Months", value: "6m" },
    { label: "All Time", value: "all" },
  ]

  if (!fileHandle || !hasPermission) {
    return (
      <div className="flex flex-col space-y-4 py-4">
        <Card>
          <CardContent className="text-muted-foreground pt-6 text-center italic">
            Please connect a file on the Home or Settings page to view charts.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 py-4 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 gap-4">
        {/* Filter Selection */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <HugeiconsIcon icon={FilterIcon} size={20} className="text-muted-foreground" />
            <span className="text-muted-foreground text-sm font-medium tracking-wider">Settings</span>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-muted-foreground/70 text-xs font-semibold tracking-tight">Metric</label>
              <Select items={metricItems} value={metric} onValueChange={(v) => v && setMetric(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {metricItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-muted-foreground/70 text-xs font-semibold tracking-tight">Time Range</label>
              <Select items={timeItems} value={timeRange} onValueChange={(v) => v && setTimeRange(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {timeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <HugeiconsIcon icon={Chart01Icon} size={24} />
          <CardTitle>Fuel Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-[400px] w-full pt-4">
            <canvas ref={chartRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
