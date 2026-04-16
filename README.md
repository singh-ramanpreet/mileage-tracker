# Mileage Tracker

A local-first fuel and mileage tracking PWA. Track your vehicle's fuel efficiency and costs with a simple CSV file stored directly on your device.

## Features

- **Local-First Privacy** — Your data stays on your device using the File System Access API. No servers, no accounts.
- **Fuel Logging** — Easily log refueling events with date, cost, volume, and odometer readings.
- **Trip Tracking** — Automatically calculates trip distance and fuel efficiency (km/L or mpg) between fill-ups.
- **Interactive Charts** — Visualize your fuel efficiency and cost-per-distance trends over time.
- **Smart Filters** — Filter charts by time range (30 days, 3 months, 6 months, or all-time).
- **Averages & Metrics** — Real-time average lines on charts with labels for quick performance assessment.
- **Flexible Units** — Configure currency, distance (km/mi), and volume (L/gal) to match your region.
- **Layout Consistency** — Polished, percentage-based UI layout designed for readability.
- **PWA Support** — Install on your phone or desktop for quick access and offline use.

## CSV Schema

The application uses an extremely simple CSV format that you can open in any spreadsheet editor:

```csv
date,fuel_purchased($),fuel_volume(L),odometer(km)
2024-04-16,45.20,12.5,45230
2024-04-01,38.15,10.2,44850
```

## Tech Stack

- **Framework**: TanStack Router
- **Styling**: Tailwind CSS v4 + Base UI
- **Visualization**: Chart.js
- **Build Tool**: Vite + Bun

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun run dev
```

## License

MIT License - Copyright (c) 2026 Ramanpreet Singh
