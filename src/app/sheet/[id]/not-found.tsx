import Link from 'next/link'

export default function SheetNotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        background: 'var(--background)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--destructive)',
          marginBottom: 20,
        }}
      >
        Esta ficha não consta no arquivo ou não vos pertence.
      </p>
      <Link
        href="/home"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--foreground)',
        }}
      >
        ← Voltar aos arquivos
      </Link>
    </main>
  )
}
