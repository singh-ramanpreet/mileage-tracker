import { Link, createRouter } from "@tanstack/react-router"
import { Card, CardContent } from "./components/ui/card"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultNotFoundComponent: () => (
      <div className="flex flex-col space-y-4 py-4">
        <Card>
          <CardContent>
            <span>Page not found. </span>
            <Link to="/" className="underline">
              Go to home
            </Link>
          </CardContent>
        </Card>
      </div>
    ),
  })

  return router
}
