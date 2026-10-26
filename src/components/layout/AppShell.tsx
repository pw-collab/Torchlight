'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/useIsMobile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  playerName?: string
  playerRole?: string
  /** Where the "‹ Voltar" link goes. Omit it on Meus arquivos itself. */
  backHref?: string
  /**
   * The free end of the top bar. The table a character is sitting at lives
   * here: it belongs to the whole view rather than to any one tab, and it is
   * the only strip both the phone and the desktop layouts leave open.
   */
  headerRight?: React.ReactNode
  /**
   * The top bar's middle lane, lined up with the first column of the page's
   * 1440px content box (see `.app-header-center`). The GM keeps the panel's
   * tabs here.
   */
  headerCenter?: React.ReactNode
  /**
   * Centres the middle lane on the content box instead. The character sheet
   * keeps its light status there, as the design draws it.
   */
  centerHeader?: boolean
}

/**
 * The skull logo doubles as the account/navigation menu: a Home shortcut, the
 * player identity, and the logout ("Sair") action.
 */
function LogoMenu({
  playerName,
  playerRole,
  onLogout,
  isMobile,
}: {
  playerName?: string
  playerRole?: string
  onLogout: () => void
  isMobile: boolean
}) {
  const router = useRouter()
  const logoSize = isMobile ? 32 : 40

  // The design sets the skull bare in a 52px hit area, with no caret or glow:
  // the skull itself is the menu's handle.
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Abrir menu"
        className="focus-visible:ring-ring/50 flex min-h-11 shrink-0 cursor-pointer items-center p-1.5 outline-none focus-visible:ring-[3px]"
      >
        <Image
          src="/skull-icon.png"
          alt="Torchlight"
          width={logoSize}
          height={logoSize}
          className="object-contain"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent sideOffset={10} className="min-w-[194px]">
        <DropdownMenuItem onClick={() => router.push('/home')}>
          Meus arquivos
        </DropdownMenuItem>

        {playerName && (
          <>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
              <span className="font-heading text-foreground text-[15px] leading-tight">
                {playerName}
              </span>
              {playerRole && (
                <span className="text-muted-foreground text-[10px] leading-tight tracking-[0.06em] italic">
                  {playerRole}
                </span>
              )}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem variant="destructive" onClick={onLogout} title="Sair">
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppShell({ children, playerName, playerRole, backHref, headerRight, headerCenter, centerHeader }: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="bg-background h-dvh">
      {/* Top bar — logo menu and the back link, sitting straight on the page
          with no plate behind them, plus whatever lanes the page hands over
          (the sheet's light status, the table it sits at). Sheet navigation
          is the icon rail beside the content (TabRail). */}
      <div
        className={cn(
          'app-header-scrim pointer-events-none fixed inset-x-0 top-0 z-60 flex items-center',
          isMobile ? 'h-16 px-2' : 'h-20 px-2',
        )}
      >
        {headerCenter && (
          <div className="app-header-center">
            <div className={cn('app-header-center__box', centerHeader && 'app-header-center__box--centered')}>
              {headerCenter}
            </div>
          </div>
        )}

        <div className="pointer-events-auto relative flex min-w-0 items-center gap-[9px]">
          <LogoMenu
            playerName={playerName}
            playerRole={playerRole}
            onLogout={handleLogout}
            isMobile={isMobile}
          />

          {backHref && (
            <Link
              href={backHref}
              className={cn(
                'font-heading flex min-h-11 min-w-0 items-center gap-1.5 pr-1.5',
                'text-xs tracking-[0.11em] uppercase transition-colors',
                'text-sidebar-border hover:text-foreground',
              )}
            >
              <span aria-hidden className="text-primary-text font-bold">
                ‹
              </span>
              <span className="truncate underline underline-offset-2">Voltar</span>
            </Link>
          )}
        </div>

        {headerRight && (
          <div className="pointer-events-auto relative ml-auto flex min-w-0 shrink-0 items-center pl-2">
            {headerRight}
          </div>
        )}
      </div>

      {/* Content — offset by the header's height: with no plate behind the
          logo any more, page content would otherwise scroll straight over it. */}
      <div
        className="relative h-dvh overflow-x-hidden overflow-y-auto"
        style={{ paddingTop: isMobile ? 'calc(64px + var(--safe-top))' : 'calc(80px + var(--safe-top))' }}
      >
        {children}
      </div>
    </div>
  )
}
