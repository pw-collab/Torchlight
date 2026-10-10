import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { discordIdOf } from '@/lib/discordId'

const PUBLIC_PATHS = ['/', '/login', '/auth', '/_next', '/favicon.ico']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // `/` must match exactly: as a prefix it matches every path and the gate never runs.
  if (PUBLIC_PATHS.some(p => (p === '/' ? pathname === '/' : pathname.startsWith(p)))) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const discordId = discordIdOf(user)
  if (!discordId) {
    return NextResponse.redirect(new URL('/login?error=no_discord_id', request.url))
  }

  const { data: allowed } = await supabase
    .from('allowed_discord_ids')
    .select('role')
    .eq('discord_id', discordId)
    .single()

  if (!allowed) {
    return NextResponse.redirect(new URL('/login?error=not_allowed', request.url))
  }

  if (pathname.startsWith('/gm') && allowed.role !== 'gm') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return response
}

export const config = {
  // Files in public/ (icons, dice art) stay open: the login page shows them.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|ogg|wav|woff2?)$).*)'],
}
