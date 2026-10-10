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
      {/* React hoists these into <head>. Bricolage Grotesque ships the display
          roles at wght 800, Libre Franklin the text roles across 100..900.

          Not `next/font/google`: its `getFontAxes` only honours the `axes`
          option when the weight is `variable`, so pinning Bricolage at 800
          would drop the `opsz` axis and leave `font-optical-sizing: auto`
          with nothing to act on. This embed keeps both — wght fixed at 800,
          opsz live across 12..96.

          The lint rule below is a false positive here: its own `pages` guard
          never trips outside `pages/`, and a root layout wraps every route,
          so nothing is "page-only" about these tags. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Libre+Franklin:ital,wght@0,100..900;1,100..900&display=swap"
        rel="stylesheet"
      />
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
