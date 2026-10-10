import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Quem abre sem estar na lista.
 *
 * A raiz é comparada inteira, não como prefixo: com `'/'` numa lista de
 * prefixos, toda rota começava com ela, e o proxy deixava tudo passar sem
 * nunca checar a lista de convidados nem o papel de Mestre.
 */
const PUBLIC_EXACT = ['/']
const PUBLIC_PREFIXES = ['/login', '/auth', '/_next']

/**
 * Rotas que respondem por si. O handler de `/api/discord` já confere a sessão
 * e a lista e responde em JSON; um redirect para a página de login seria a
 * resposta errada para um `fetch`.
 */
const SELF_GUARDED_PREFIXES = ['/api']

function underAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(p => pathname === p || pathname.startsWith(`${p}/`))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // O token renovado vai para a requisição (o que a página renderiza a seguir
  // lê) e para a resposta (o que o navegador guarda). Só na resposta, a página
  // veria o token vencido e tentaria renovar de novo com um refresh token que
  // já foi gasto — e trataria a pessoa como deslogada.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Renova a sessão em toda navegação, pública ou não: é aqui que a
  // renovação pode ser gravada — a página, renderizando no servidor, não pode.
  const { data: { user } } = await supabase.auth.getUser()

  if (PUBLIC_EXACT.includes(pathname) || underAny(pathname, PUBLIC_PREFIXES)) return response
  if (underAny(pathname, SELF_GUARDED_PREFIXES)) return response

  /** Um redirect que leva junto os cookies que a renovação acabou de gravar. */
  function redirectTo(path: string) {
    const redirect = NextResponse.redirect(new URL(path, request.url))
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie))
    return redirect
  }

  if (!user) return redirectTo('/login')

  const discordId = user.user_metadata?.provider_id || user.user_metadata?.sub
  if (!discordId) return redirectTo('/login?error=no_discord_id')

  const { data: allowed } = await supabase
    .from('allowed_discord_ids')
    .select('role')
    .eq('discord_id', discordId)
    .single()

  if (!allowed) return redirectTo('/login?error=not_allowed')

  if (underAny(pathname, ['/gm']) && allowed.role !== 'gm') return redirectTo('/home')

  return response
}

export const config = {
  // Arquivos estáticos ficam de fora: a caveira da página de login e os dados
  // em `public/` precisam carregar para quem ainda não entrou, e não há por que
  // gastar uma consulta de sessão e outra de lista em cada imagem.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|mp3|wav|ogg|glb|gltf)$).*)',
  ],
}
