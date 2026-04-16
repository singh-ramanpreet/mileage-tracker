/**
 * FileHandleProvider
 *
 * Manages the connection to a local CSV file via the File System Access API.
 * Parses unit settings from the CSV header line.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import {
  clearFileHandle as clearStoredHandle,
  getFileHandle,
  getLocalData,
  setFileHandle,
  setLocalData,
  verifyPermission,
} from "@/lib/file-storage"
import {
  buildCsvHeaders,
  COLUMN_NAMES,
  DEFAULT_UNITS,
  parseUnitsFromHeader,
} from "@/lib/constants"
import type { UnitSettings } from "@/lib/constants"

interface FileHandleContextType {
  fileHandle: FileSystemFileHandle | null
  hasPermission: boolean
  isLoading: boolean

  pickFile: () => Promise<void>
  requestAccess: () => Promise<boolean>
  clearHandle: () => Promise<void>

  data: Array<Record<string, unknown>>
  setData: (newData: Array<Record<string, unknown>>) => Promise<void>
  syncWithFile: () => Promise<void>
  createFile: () => Promise<void>

  /** Unit settings parsed from the CSV header */
  units: UnitSettings
  /** Update units — rewrites only the header line in the CSV */
  setUnits: (newUnits: UnitSettings) => Promise<void>
}

const FileHandleContext = createContext<FileHandleContextType | undefined>(undefined)

export function FileHandleProvider({ children }: { children: React.ReactNode }) {
  const [fileHandle, setFileHandleState] = useState<FileSystemFileHandle | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [data, setDataState] = useState<Array<Record<string, unknown>>>([])
  const [units, setUnitsState] = useState<UnitSettings>(DEFAULT_UNITS)

  /**
   * Parses CSV content. Header columns may have unit suffixes like
   * "fuel_purchased($)" — we strip the suffix to get normalized keys.
   */
  const parseAndCache = useCallback(async (handle: FileSystemFileHandle) => {
    const file = await handle.getFile()
    const content = await file.text()

    const lines = content.split("\n").filter((l) => l.trim())
    if (lines.length === 0) {
      setDataState([])
      setUnitsState(DEFAULT_UNITS)
      await setLocalData("records", [])
      return
    }

    // Parse units from the raw header
    const rawHeader = lines[0]
    setUnitsState(parseUnitsFromHeader(rawHeader))

    // Normalize header columns: "fuel_purchased($)" → "fuel_purchased"
    const rawHeaders = rawHeader.split(",").map((h) => h.trim())
    const normalizedHeaders = rawHeaders.map((h) => h.replace(/\([^)]*\)/, ""))

    const parsedData = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim())
      const obj: Record<string, unknown> = {}
      normalizedHeaders.forEach((h, i) => (obj[h] = values[i] || ""))
      return obj
    })

    setDataState(parsedData)
    await setLocalData("records", parsedData)
  }, [])

  const syncWithFile = useCallback(async () => {
    if (!fileHandle) return
    try {
      const status = await fileHandle.queryPermission({ mode: "readwrite" })
      if (status !== "granted") return
      await parseAndCache(fileHandle)
    } catch (err) {
      console.error("Sync with file failed:", err)
    }
  }, [fileHandle, parseAndCache])

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const handle = await getFileHandle()
        if (!handle || cancelled) return
        setFileHandleState(handle)
        const status = await handle.queryPermission({ mode: "readwrite" })
        const granted = status === "granted"
        setHasPermission(granted)
        if (granted) {
          await parseAndCache(handle)
        } else {
          const cachedData = await getLocalData<Record<string, unknown>>("records")
          setDataState(cachedData)
        }
      } catch (err) {
        console.error("Initialization failed:", err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [parseAndCache])

  const pickFile = useCallback(async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "CSV Data File",
            accept: {
              "text/plain": [".csv"],
              "text/csv": [".csv"],
              "application/csv": [".csv"],
            },
          },
        ],
        excludeAcceptAllOption: true,
        multiple: false,
      })
      await setFileHandle(handle)
      setFileHandleState(handle)
      setHasPermission(true)
      await parseAndCache(handle)
    } catch (err) {
      if ((err as Error).name !== "AbortError") console.error("Pick file failed:", err)
    }
  }, [parseAndCache])

  const requestAccess = useCallback(async () => {
    if (!fileHandle) return false
    const granted = await verifyPermission(fileHandle, true)
    setHasPermission(granted)
    if (granted) await parseAndCache(fileHandle)
    return granted
  }, [fileHandle, parseAndCache])

  const clearHandle = useCallback(async () => {
    await clearStoredHandle()
    setFileHandleState(null)
    setHasPermission(false)
    setDataState([])
    setUnitsState(DEFAULT_UNITS)
  }, [])

  const createFile = useCallback(async () => {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: "mileage.csv",
        types: [{ description: "CSV Data File", accept: { "text/csv": [".csv"] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(buildCsvHeaders(DEFAULT_UNITS))
      await writable.close()

      await setFileHandle(handle)
      setFileHandleState(handle)
      setHasPermission(true)
      setDataState([])
      setUnitsState(DEFAULT_UNITS)
      await setLocalData("records", [])
    } catch (err) {
      if ((err as Error).name !== "AbortError") console.error("Create file failed:", err)
    }
  }, [])

  /** Serialize data to CSV using the current unit settings */
  const writeCsv = useCallback(
    async (records: Array<Record<string, unknown>>, unitSettings: UnitSettings) => {
      if (!fileHandle || !hasPermission) return
      try {
        const headerLine = buildCsvHeaders(unitSettings)
        const csvContent = [
          headerLine,
          ...records.map((row) =>
            COLUMN_NAMES.map((col) => {
              const val = String(row[col] || "")
              return val.includes(",") ? `"${val}"` : val
            }).join(",")
          ),
        ].join("\n")

        const writable = await fileHandle.createWritable()
        await writable.write(csvContent)
        await writable.close()
      } catch (err) {
        console.error("Background sync failed:", err)
      }
    },
    [fileHandle, hasPermission]
  )

  const setData = useCallback(
    async (newData: Array<Record<string, unknown>>) => {
      const sortedData = [...newData].sort((a, b) => {
        const dateA = String(a.date || "")
        const dateB = String(b.date || "")
        return dateA.localeCompare(dateB)
      })
      setDataState(sortedData)
      await setLocalData("records", sortedData)
      await writeCsv(sortedData, units)
    },
    [units, writeCsv]
  )

  /** Update units — rewrites the CSV header only (no data conversion) */
  const setUnits = useCallback(
    async (newUnits: UnitSettings) => {
      setUnitsState(newUnits)
      await writeCsv(data, newUnits)
    },
    [data, writeCsv]
  )

  return (
    <FileHandleContext.Provider
      value={{
        fileHandle,
        hasPermission,
        isLoading,
        pickFile,
        requestAccess,
        clearHandle,
        data,
        setData,
        syncWithFile,
        createFile,
        units,
        setUnits,
      }}
    >
      {children}
    </FileHandleContext.Provider>
  )
}

export function useFileHandle() {
  const context = useContext(FileHandleContext)
  if (context === undefined) {
    throw new Error("useFileHandle must be used within a FileHandleProvider")
  }
  return context
}
