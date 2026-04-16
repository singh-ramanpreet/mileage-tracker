import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router"

import appCss from "@/globals.css?url"
import { FileHandleProvider } from "@/components/providers/file-handle-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { NavBar } from "@/components/layout/nav-bar"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mileage Tracker" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "alternate icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-icon.png" },
    ],
    scripts: [
      {
        children: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(registration => {
                  console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                  console.log('SW registration failed: ', registrationError);
                });
            });
          }
        `,
      },
    ],
  }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="mileage-tracker-theme">
          <FileHandleProvider>
            <div className="mx-auto max-w-2xl p-2 pb-32">
              <Outlet />
            </div>
            <NavBar />
          </FileHandleProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
