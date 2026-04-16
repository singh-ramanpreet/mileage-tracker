import { DATA_STORE, DB_NAME, HANDLE_KEY, STORE_NAME } from "@/lib/constants"

/**
 * Retrieves the persisted FileSystemFileHandle from IndexedDB.
 * This allows the application to "remember" which local file the user
 * previously connected across browser sessions.
 *
 * @returns Combined file handle or null if not found
 */
export async function getFileHandle(): Promise<FileSystemFileHandle | null> {
  if (typeof window === "undefined") return null

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      // STORE_NAME: Persistent settings/handle storage
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
      // DATA_STORE: Live data caching for records
      if (!db.objectStoreNames.contains(DATA_STORE)) {
        db.createObjectStore(DATA_STORE)
      }
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const transaction = db.transaction(STORE_NAME, "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const getRequest = store.get(HANDLE_KEY)

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null)
      }

      getRequest.onerror = () => {
        reject(getRequest.error)
      }
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Persists a FileSystemFileHandle to IndexedDB for future use.
 * @param handle The file handle obtained from the browser file picker
 */
export async function setFileHandle(handle: FileSystemFileHandle): Promise<void> {
  if (typeof window === "undefined") return

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const transaction = db.transaction(STORE_NAME, "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const putRequest = store.put(handle, HANDLE_KEY)

      putRequest.onsuccess = () => {
        resolve()
      }

      putRequest.onerror = () => {
        reject(putRequest.error)
      }
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Wipes the connected file handle and all cached data from the browser.
 * Used for "Reset" or "Disconnect" functionality.
 */
export async function clearFileHandle(): Promise<void> {
  if (typeof window === "undefined") return

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Clear both settings (handle) and live records
      const settingsTx = db.transaction(STORE_NAME, "readwrite")
      settingsTx.objectStore(STORE_NAME).delete(HANDLE_KEY)

      const dataTx = db.transaction(DATA_STORE, "readwrite")
      dataTx.objectStore(DATA_STORE).clear()

      resolve()
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Retrieves cached data from the DATA_STORE.
 * Primarily used to populate UI instantly before file permissions are re-granted.
 *
 * @param key The specific cache key (e.g., 'records')
 * @returns Array of data items
 */
export async function getLocalData<T>(key: "records"): Promise<Array<T>> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const transaction = db.transaction(DATA_STORE, "readonly")
      const store = transaction.objectStore(DATA_STORE)
      const getRequest = store.get(key)

      getRequest.onsuccess = () => {
        resolve(getRequest.result || [])
      }

      getRequest.onerror = () => {
        reject(getRequest.error)
      }
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Caches high-performance data in the DATA_STORE.
 * @param key The specific cache key (e.g., 'records')
 * @param data Array of items to persist
 */
export async function setLocalData<T>(key: "records", data: Array<T>): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const transaction = db.transaction(DATA_STORE, "readwrite")
      const store = transaction.objectStore(DATA_STORE)
      const putRequest = store.put(data, key)

      putRequest.onsuccess = () => {
        resolve()
      }

      putRequest.onerror = () => {
        reject(putRequest.error)
      }
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * Helper to query and/or request permissions for a specific file handle.
 * Browsers often require re-granting 'readwrite' permissions after a page refresh.
 *
 * @param handle The handle to verify
 * @param withWrite Whether write access is needed (defaults to true)
 * @returns Boolean indicating if permission was granted
 */
export async function verifyPermission(handle: FileSystemFileHandle, withWrite: boolean = true): Promise<boolean> {
  const options: FileSystemHandlePermissionDescriptor = {
    mode: withWrite ? "readwrite" : "read",
  }

  // Check if we already have permission, if so, return true.
  if ((await handle.queryPermission(options)) === "granted") {
    return true
  }

  // Request permission from the user (Must be triggered by a user gesture)
  if ((await handle.requestPermission(options)) === "granted") {
    return true
  }

  return false
}
