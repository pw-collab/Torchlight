/**
 * One card on the campaign roster. Deliberately narrower than `Character`:
 * these are the only values `campaign_roster()` hands back for characters the
 * viewer does not own (see migration 013).
 */
export interface RosterCharacter {
  id: string
  name: string
  /** "Conceito" from the sheet's backstory tab — the blurb under the name. */
  concept: string | null
  portraitUrl: string | null
  /** Display name of the player who owns it; null on rows predating player_name. */
  ownerName: string | null
  isOwn: boolean
}
