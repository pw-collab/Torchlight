import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Torchlight — Shadowdark VTT',
  description: 'Shadowdark RPG companion tool',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-900 text-zinc-100">
        {children}
      </body>
    </html>
  )
}
