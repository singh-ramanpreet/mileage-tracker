import {
  Add01Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  FileCodeIcon,
  FolderOpenIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useFileHandle } from "@/components/providers/file-handle-provider"
import { Button } from "@/components/ui/button"

export function FileHandleManager() {
  const { fileHandle, hasPermission, pickFile, createFile, requestAccess, clearHandle } = useFileHandle()

  if (!fileHandle) {
    return (
      <div className="border-primary/20 bg-primary/5 group hover:border-primary/40 hover:bg-primary/10 flex flex-col items-center justify-center space-y-4 rounded-xl border-2 border-dashed p-8 text-center transition-all">
        <div className="bg-primary/10 text-primary rounded-full p-3 transition-transform group-hover:scale-110">
          <HugeiconsIcon icon={FolderOpenIcon} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">No CSV Connected</h3>
        </div>
        <div className="flex w-full flex-col gap-4">
          <Button onClick={pickFile} size="lg">
            <HugeiconsIcon icon={FileCodeIcon} /> Pick CSV
          </Button>
          <Button onClick={createFile} size="lg" variant="outline">
            <HugeiconsIcon icon={Add01Icon} /> Create New
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-secondary/50 border-border/60 flex flex-col items-center gap-4 rounded-lg border p-3">
        <div className="flex w-full items-center gap-3">
          <div className="bg-background text-primary rounded-lg border p-2 shadow-sm">
            <HugeiconsIcon icon={FileCodeIcon} />
          </div>
          <div className="overflow-hidden">
            <div className="truncate text-sm font-medium">{fileHandle.name}</div>
            <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[10px]">
              {hasPermission ? (
                <div className="flex items-center gap-1 text-center text-xs font-medium text-emerald-500">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                  <span>Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-center text-xs font-medium text-amber-500">
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} />
                  <span>Permission Needed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-row gap-2">
          <Button variant="outline" onClick={requestAccess} className="flex-1">
            Grant
          </Button>
          <Button variant="outline" onClick={clearHandle} className="flex-1">
            Reset
          </Button>
        </div>
      </div>

      {hasPermission && (
        <div className="space-y-3">
          <div className="bg-primary/5 border-primary/20 flex items-center gap-2 rounded-lg border p-3 text-center text-xs font-medium text-emerald-500">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} />
            <p>
              Saving changes directly to: <span className="font-mono">{fileHandle.name}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
