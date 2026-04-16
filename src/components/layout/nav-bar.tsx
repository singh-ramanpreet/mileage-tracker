import { Link } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Home01Icon, Settings01Icon, Chart01Icon } from "@hugeicons/core-free-icons"

export function NavBar() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 mx-auto flex max-w-2xl items-center justify-around border-t p-4 backdrop-blur-md">
      <Link
        to="/"
        className="text-muted-foreground flex flex-col items-center gap-1 transition-colors"
        activeProps={{ className: "!text-foreground" }}
      >
        <HugeiconsIcon icon={Home01Icon} size={24} />
        <span className="text-[10px] font-medium tracking-wider uppercase">Home</span>
      </Link>

      <Link
        to="/charts"
        className="text-muted-foreground flex flex-col items-center gap-1 transition-colors"
        activeProps={{ className: "!text-foreground" }}
      >
        <HugeiconsIcon icon={Chart01Icon} size={24} />
        <span className="text-[10px] font-medium tracking-wider uppercase">Charts</span>
      </Link>

      <Link
        to="/settings"
        className="text-muted-foreground flex flex-col items-center gap-1 transition-colors"
        activeProps={{ className: "!text-foreground" }}
      >
        <HugeiconsIcon icon={Settings01Icon} size={24} />
        <span className="text-[10px] font-medium tracking-wider uppercase">Settings</span>
      </Link>
    </nav>
  )
}
