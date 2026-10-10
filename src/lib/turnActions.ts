import { createClient } from '@/lib/supabase'

/**
 * As jogadas da vez, pelos RPCs da migração 022 — os mesmos para o Mestre e
 * para o jogador. É o banco quem tranca a vez e recusa a jogada fora de hora;
 * daqui só sai o motivo, dito como se diz na mesa.
 *
 * O log fica com quem chama: a linha do jogador precisa do personagem dele
 * (a RLS do log pede), a do Mestre não.
 */

const REASONS: Record<string, string> = {
  turn_taken: 'Alguém assumiu a vez antes.',
  already_acted: 'Já agiu nesta rodada.',
  not_your_side: 'Agora a vez é do outro lado.',
  initiative_pending: 'Falta rolar a iniciativa.',
  initiative_rolled: 'A iniciativa do grupo já foi rolada.',
  out_of_fight: 'Fora de combate: sem vez.',
  not_in_play: 'Fora da trilha.',
  not_your_turn: 'Não é a sua vez.',
  not_your_character: 'Este personagem não é seu.',
  not_at_this_table: 'Você não está nesta mesa.',
  not_authenticated: 'Sua sessão expirou: entre de novo.',
}

function reasonFor(message: string | undefined): string {
  const key = message && Object.keys(REASONS).find(k => message.includes(k))
  return key ? REASONS[key] : 'Não deu para mexer na vez agora.'
}

export type TurnOutcome =
  | { ok: true; wrapped: boolean; round: number | null }
  | { ok: false; reason: string }

async function turnRpc(name: 'claim_turn' | 'end_turn', sessionId: string, key: string): Promise<TurnOutcome> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc(name, { p_session_id: sessionId, p_key: key })
  if (error) return { ok: false, reason: reasonFor(error.message) }
  const out = (data ?? {}) as { wrapped?: boolean; round?: number | null }
  return { ok: true, wrapped: out.wrapped === true, round: out.round ?? null }
}

/** Assume a vez. `wrapped`: assumir abriu uma rodada nova. */
export function claimTurn(sessionId: string, key: string): Promise<TurnOutcome> {
  return turnRpc('claim_turn', sessionId, key)
}

/**
 * Encerra a vez de quem está agindo. O Mestre também usa isto para pular a
 * vez de quem não está agindo. `wrapped`: era o último, e a rodada fechou.
 */
export function endTurn(sessionId: string, key: string): Promise<TurnOutcome> {
  return turnRpc('end_turn', sessionId, key)
}

/** Uma rodada nova de exploração: a vez fica livre para todos. Só o Mestre. */
export async function resetTurns(sessionId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('reset_turns', { p_session_id: sessionId })
  if (error) console.error('[turns] a rodada não virou', error)
}

/**
 * Grava o d6 do grupo. Vale o primeiro: quem chega depois recebe a recusa e
 * não anima dado nenhum. Devolve o d6 do Mestre, para dizer quem começa.
 */
export async function setPartyInitiative(
  encounterId: string,
  value: number,
): Promise<{ ok: true; foes: number | null } | { ok: false; reason: string }> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('set_party_initiative', {
    p_encounter_id: encounterId,
    p_value: value,
  })
  if (error) return { ok: false, reason: reasonFor(error.message) }
  return { ok: true, foes: typeof data === 'number' ? data : null }
}
