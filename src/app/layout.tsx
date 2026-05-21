import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Torchlight — Shadowdark VTT',
  description: 'Ferramentas para Shadowdark RPG',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ background: 'var(--ink-black)', color: 'var(--bone-white)', height: '100%' }}>
        {children}
        {/* Global grain texture overlay */}
        <div
          aria-hidden
          style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='320' height='320' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '320px 320px',
            opacity: 0.45,
            mixBlendMode: 'overlay',
          }}
        />
        {/* Vignette */}
        <div
          aria-hidden
          style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998,
            background: 'radial-gradient(ellipse at 50% 46%, transparent 38%, rgba(0,0,0,0.55) 100%)',
          }}
        />
      </body>
    </html>
  )
}
