import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Torchlight — Shadowdark VTT',
  description: 'Ferramentas para Shadowdark RPG',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: 'var(--background)',
}

// `style-lyra` scopes the shadcn component styles; `dark` switches the
// library's dark variants on — Torchlight has no light mode.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="style-lyra dark font-sans">
      <body className="h-full">
        {children}
        {/* Global grain texture overlay */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[9999] opacity-45 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='320' height='320' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '320px 320px',
          }}
        />
      </body>
    </html>
  )
}
