'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/useIsMobile'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  children: React.ReactNode
  playerName?: string
  playerRole?: string
  breadcrumbs?: BreadcrumbItem[]
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
  const logoSize = isMobile ? 26 : 30

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Abrir menu"
        className="group/logo flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 px-1.5 outline-none"
      >
        <Image
          src="/skull-icon.png"
          alt="Torchlight"
          width={logoSize}
          height={logoSize}
          className="object-contain drop-shadow-[0_0_12px_var(--destructive)]"
        />
        <span className="text-secondary-foreground inline-block text-[10px] leading-none transition-transform group-data-popup-open/logo:-scale-y-100">
          ▾
        </span>
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
                <span className="text-destructive text-[10px] leading-tight tracking-[0.06em] italic">
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

export function AppShell({ children, playerName, playerRole, breadcrumbs = [] }: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Mobile keeps only the trailing crumb; desktop shows the full trail.
  const visibleCrumbs = isMobile ? breadcrumbs.slice(-1) : breadcrumbs

  return (
    <div className="bg-background h-dvh">
      {/* Condensed top bar — logo menu + breadcrumb only. Nav tabs and the dice
          roller now live in the bottom bar (see TabBar / DiceRoller). */}
      <div
        className={cn(
          'fixed inset-x-0 top-0 z-60 flex items-center',
          isMobile ? 'h-16 px-3' : 'h-20 px-6',
        )}
      >
        <div
          className={cn(
            'bg-secondary border-border flex max-w-full min-w-0 items-center border-2 p-1.5 shadow-[0_6px_6px_rgba(0,0,0,0.2)]',
            isMobile ? 'gap-1' : 'gap-2.5',
          )}
        >
          <LogoMenu
            playerName={playerName}
            playerRole={playerRole}
            onLogout={handleLogout}
            isMobile={isMobile}
          />

          {visibleCrumbs.length > 0 && (
            <Breadcrumb className="h-11 min-w-0 overflow-hidden pr-2">
              <BreadcrumbList className="font-heading h-full flex-nowrap gap-1.5 text-xs tracking-[0.11em] uppercase">
                {visibleCrumbs.map((crumb, i) => {
                  const isLast = i === visibleCrumbs.length - 1
                  return (
                    <BreadcrumbItem key={i} className="min-w-0 gap-1.5 overflow-hidden">
                      {(i > 0 || isMobile) && (
                        <BreadcrumbSeparator className="text-destructive shrink-0 font-bold">
                          ›
                        </BreadcrumbSeparator>
                      )}
                      {crumb.href ? (
                        <BreadcrumbLink
                          render={
                            <button type="button" onClick={() => router.push(crumb.href!)} />
                          }
                          className="max-w-[180px] cursor-pointer truncate text-[var(--muted-foreground)] underline underline-offset-2 hover:text-[var(--bone-dim)]"
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage
                          className={cn(
                            'truncate',
                            isLast
                              ? 'text-secondary-foreground'
                              : 'text-[var(--muted-foreground)]',
                          )}
                        >
                          {crumb.label}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative h-dvh overflow-x-hidden overflow-y-auto">{children}</div>
    </div>
  )
}
