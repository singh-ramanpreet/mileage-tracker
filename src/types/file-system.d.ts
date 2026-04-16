interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: "file"
  getFile: () => Promise<File>
  createWritable: (options?: FileSystemCreateWritableOptions) => Promise<FileSystemWritableFileStream>
}

/**
 * Represents a reference to a directory on the user's local disk.
 */
interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: "directory"
  getDirectoryHandle: (name: string, options?: FileSystemGetDirectoryOptions) => Promise<FileSystemDirectoryHandle>
  getFileHandle: (name: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>
  removeEntry: (name: string, options?: FileSystemRemoveOptions) => Promise<void>
  resolve: (possibleDescendant: FileSystemHandle) => Promise<Array<string> | null>
  values: () => AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>
}

/**
 * Base handle for file system entries (files or directories).
 */
interface FileSystemHandle {
  readonly kind: "file" | "directory"
  readonly name: string
  isSameEntry: (other: FileSystemHandle) => Promise<boolean>
  queryPermission: (descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>
  requestPermission: (descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>
}

/**
 * Options for querying or requesting handle permissions.
 */
interface FileSystemHandlePermissionDescriptor {
  mode?: "read" | "readwrite"
}

/**
 * Configuration for file picker accept types.
 */
interface FilePickerAcceptType {
  description?: string
  accept: Record<string, Array<string>>
}

/**
 * Configuration for the showOpenFilePicker browser dialog.
 */
interface OpenFilePickerOptions {
  multiple?: boolean
  excludeAcceptAllOption?: boolean
  types?: Array<FilePickerAcceptType>
}

/**
 * Window extension to include the File System Access API entry points.
 */
interface Window {
  showOpenFilePicker: (options?: OpenFilePickerOptions) => Promise<Array<FileSystemFileHandle>>
  showSaveFilePicker: (options?: unknown) => Promise<FileSystemFileHandle>
  showDirectoryPicker: (options?: unknown) => Promise<FileSystemDirectoryHandle>
}

/**
 * A writable stream for local files.
 */
interface FileSystemWritableFileStream extends WritableStream {
  write: (data: BufferSource | Blob | string | FileSystemWriteChunkType) => Promise<void>
  seek: (position: number) => Promise<void>
  truncate: (size: number) => Promise<void>
}

type FileSystemWriteChunkType =
  | { type: "write"; position?: number; data: BufferSource | Blob | string }
  | { type: "seek"; position: number }
  | { type: "truncate"; size: number }

interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean
}

interface FileSystemGetDirectoryOptions {
  create?: boolean
}

interface FileSystemGetFileOptions {
  create?: boolean
}

interface FileSystemRemoveOptions {
  recursive?: boolean
}
