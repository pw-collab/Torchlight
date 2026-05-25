import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = ['/', '/login', '/auth', '/_next', '/favicon.ico']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
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

  const discordId = user.user_metadata?.provider_id || user.user_metadata?.sub
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
