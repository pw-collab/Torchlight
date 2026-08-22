'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Backpack03Icon,
  Book02Icon,
  SparklesIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { createClient } from '@/lib/supabase'
import { useCharacter } from '@/hooks/useCharacter'
import { useNow } from '@/hooks/useNow'
import { useDiceRoll } from '@/hooks/useDiceRoll'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useTableSession } from '@/hooks/useTableSession'
import { useSessionFeed } from '@/hooks/useSessionFeed'
import { useSessionPresence } from '@/hooks/useSessionPresence'
import { useEncounter } from '@/hooks/useEncounter'
import { AppShell } from '@/components/layout/AppShell'
import { FloatingVitals } from '@/components/sheet/FloatingVitals'
import { FortuneTile } from '@/components/sheet/FortuneBar'
import { TorchStatus } from '@/components/sheet/TorchStatus'
import { DiceRoller } from '@/components/sheet/DiceRoller'
import { TabBar } from '@/components/sheet/TabBar'
import { TabRail } from '@/components/sheet/TabRail'
import { DiceOverlay } from '@/components/sheet/DiceOverlay'
import { RollToasts } from '@/components/sheet/RollToasts'
import { InventoryView, TreasureVault } from '@/components/sheet/InventoryView'
import { FloatingTorch } from '@/components/sheet/FloatingTorch'
import { TalentsPanel } from '@/components/sheet/TalentsPanel'
import { ClassPanel } from '@/components/sheet/ClassPanel'
import { Spells } from '@/components/sheet/Spells'
import { BackstoryView } from '@/components/sheet/BackstoryView'
import { sendToDiscord } from '@/lib/discord'
import { minutesLeft, snuffBurnedOut } from '@/lib/light'
import { tableNow } from '@/lib/dungeonClock'
import { pendingPrompts, recordEvent, rollPayload } from '@/lib/sessionEvents'
import { TableBadge } from '@/components/sheet/TableBadge'
import { TableToasts } from '@/components/sheet/TableToasts'
import { PromptCard } from '@/components/sheet/PromptCard'
import { TurnBanner } from '@/components/sheet/TurnBanner'
import { ConditionChips, disadvantageLabels } from '@/components/sheet/ConditionChips'
import { RestButton } from '@/components/sheet/RestButton'
import { consumeRation, findRation } from '@/lib/rest'
import { maxSlots, usedSlots } from '@/lib/slots'
import { STAT_LABELS, isStat } from '@/data/stats'
import type {
  EventPayload,
  EventVisibility,
  PromptPayload as SessionPromptPayload,
  SessionEvent,
  SessionEventKind,
  SessionPayload,
} from '@/types/session.types'
import { modifier, reroll, rollDie, withDc } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import type { ActiveCondition, CharacterRow } from '@/types/character.types'
import type { InventoryItem } from '@/types/inventory.types'
import type { Talent } from '@/types/talent.types'
import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'
import { getArchetype } from '@/data/archetypes/index'

type Tab = 'stats' | 'inventory' | 'spells' | 'backstory'

// Labels drive the mobile bottom bar; the icons drive the desktop rail.
const TAB_META: Record<Tab, { label: string; icon: IconSvgElement }> = {
  stats:     { label: 'Atributos',  icon: SparklesIcon },
  inventory: { label: 'Inventário', icon: Backpack03Icon },
  spells:    { label: 'Grimório',   icon: Book02Icon },
  backstory: { label: 'História',   icon: UserIcon },
}
const TAB_KEYS = Object.keys(TAB_META) as Tab[]

interface Props {
  characterId: string
  playerName: string
  /**
   * O Mestre também abre esta tela, e nela ele é visita: entrar e sair da mesa
   * é do dono do personagem, e o RPC recusaria de qualquer forma.
   */
  isOwner: boolean
}

export function CharacterSheetClient({ characterId, playerName, isOwner }: Props) {
  const { character, loading, updateCharacter, savedAt } = useCharacter(characterId)
  const [tab, setTab] = useState<Tab>('stats')
  const [rollHistory, setRollHistory] = useState<RollResult[]>([])
  const isMobile = useIsMobile()

  // ── A mesa ────────────────────────────────────────────────────────────────
  // Enquanto o personagem está numa sessão, o que acontece aqui vira linha do
  // log da mesa — e é isso que o painel do Mestre lê. Fora de uma mesa a ficha
  // funciona exatamente como antes: `sessionId` nulo e nada é registrado.
  const table = useTableSession(characterId)
  const characterName = character?.name

  // O feed continua ligado na mesa encerrada — o que aconteceu continua sendo
  // legível —, mas a ficha para de escrever nela. São valores diferentes de
  // propósito: desligar o feed apagaria justamente o evento de encerramento e
  // a mesa "reabriria" sozinha no render seguinte.
  const feedSessionId = table.session?.id ?? null
  const { events: tableEvents } = useSessionFeed(feedSessionId, 60)

  const tableClosed = useMemo(
    () =>
      tableEvents.some(
        event => event.kind === 'session' && (event.payload as SessionPayload).action === 'end',
      ),
    [tableEvents],
  )
  const openSession = tableClosed ? null : table.session
  const sessionId = openSession?.id ?? null

  const presenceMe = useMemo(
    () =>
      characterName
        ? { key: characterId, characterId, name: characterName, role: 'player' as const }
        : null,
    [characterId, characterName],
  )
  const { gmPresent } = useSessionPresence(sessionId, presenceMe)

  // O feed carrega o histórico inteiro; só o que chegar depois de a ficha abrir
  // merece um aviso na tela.
  const [openedAt] = useState(() => Date.now())

  /** Registra na mesa, quando há uma. Fora dela, silêncio — e nada quebra. */
  const record = useCallback(
    (kind: SessionEventKind, payload: EventPayload, visibility?: EventVisibility) => {
      if (!sessionId) return
      void recordEvent({
        sessionId,
        actorName: playerName,
        characterId,
        kind,
        payload: { ...payload, characterName },
        visibility,
      })
    },
    [sessionId, playerName, characterId, characterName],
  )

  // ── O combate (§5.8) ──────────────────────────────────────────────────────
  // A trilha inteira é do Mestre; aqui só interessa a linha deste personagem:
  // entrar na ordem e saber quando é a vez dele.
  const { encounter, actors: encounterActors } = useEncounter(sessionId)
  const myActor = useMemo(
    () => encounterActors.find(a => a.source === 'pc' && a.refId === characterId),
    [encounterActors, characterId],
  )

  /** O que o Mestre pediu e ainda espera desta ficha (§6.4). */
  const prompts = useMemo(
    () => pendingPrompts(tableEvents, characterId),
    [tableEvents, characterId],
  )

  // Roll lifecycle: useDiceRoll drives the phase timeline (anticipation →
  // tumble → impact); history/toasts land exactly on the impact frame.
  const onRollSettled = useCallback((result: RollResult) => {
    setRollHistory(prev => [result, ...prev].slice(0, 20))
  }, [])
  const {
    phase: rollPhase,
    roll: activeRoll,
    mode: rollMode,
    throwRoll,
    startRoll,
    settle: settleRoll,
    fallBackToTimed,
  } = useDiceRoll({ onSettled: onRollSettled })

  const handleRoll = useCallback((result: RollResult, visibility?: EventVisibility) => {
    startRoll(result)
    // Uma rolagem secreta não passa pelo canal da mesa — o Discord é público.
    if (visibility !== 'gm_only') sendToDiscord({ type: 'roll', ...result })
    record('roll', rollPayload(result), visibility)
  }, [startRoll, record])

  /**
   * Light burns on the wall clock now (see `lib/light`): the minutes on screen
   * are derived from when the source was lit, so nothing has to be running for
   * time to pass — the old 60s interval rewrote the whole equipment JSONB every
   * minute and stopped the moment the tab did.
   *
   * The one write left is settling the record when a source reaches zero, which
   * also announces the dark. It's guarded by id because the tick that notices
   * the burn-out can fire again before the write comes back.
   */
  const updateRef = useRef(updateCharacter)
  useEffect(() => { updateRef.current = updateCharacter }, [updateCharacter])
  const recordRef = useRef(record)
  useEffect(() => { recordRef.current = record }, [record])

  // A mesa pode ter o tempo parado ou adiantado pelo Mestre (§6.9), e a luz
  // segue o relógio dela — inclusive a hora de anunciar que apagou.
  const now = tableNow(openSession, useNow())
  const inventory = character?.inventory
  const announcedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!inventory) return

    // A source that is burning again has news to give when it next runs out.
    for (const item of inventory) {
      if (minutesLeft(item, now) > 0) announcedRef.current.delete(item.id)
    }

    const fresh = inventory.filter(
      i => i.isLight && i.isLit && minutesLeft(i, now) <= 0 && !announcedRef.current.has(i.id),
    )
    if (fresh.length === 0) return
    for (const item of fresh) announcedRef.current.add(item.id)

    const settled = snuffBurnedOut(inventory, now)
    if (settled) updateRef.current({ equipment: settled as any } as Partial<CharacterRow>)
    sendToDiscord({ type: 'torch_out' })
    for (const item of fresh) {
      recordRef.current('light', { action: 'out', itemName: item.name, by: 'player' })
    }
  }, [inventory, now])

  const tableBadge = isOwner ? (
    <TableBadge
      session={openSession}
      loading={table.loading}
      busy={table.busy}
      error={table.error}
      onJoin={table.join}
      onLeave={table.leave}
      gmPresent={gmPresent}
    />
  ) : null

  if (loading) {
    return (
      <AppShell backHref="/home" playerName={playerName} headerRight={tableBadge}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <span className="animate-flicker" style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
            ✦ O arquivo está sendo consultado...
          </span>
        </div>
      </AppShell>
    )
  }

  if (!character) {
    return (
      <AppShell backHref="/home" playerName={playerName} headerRight={tableBadge}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 14, color: 'var(--destructive)' }}>
            Personagem não encontrado no arquivo.
          </p>
        </div>
      </AppShell>
    )
  }

  const cls = getClass(character.classId)
  const ancestry = getAncestry(character.ancestryId)
  const archetype = character.archetypeId ? getArchetype(character.archetypeId) : undefined

  // O log guarda o antes e o depois, não só a diferença — é o que torna o
  // "desfazer" possível mais adiante sem ninguém ter de adivinhar.
  async function handleHpChange(newHp: number) {
    const from = character!.hpCurrent
    if (newHp === from) return
    await updateCharacter({ hp_current: newHp } as Partial<CharacterRow>)
    record('hp', { from, to: newHp, delta: newHp - from, by: 'player' })
  }

  async function handleLuckChange(newValue: number) {
    const from = character!.luckTokens
    if (newValue === from) return
    await updateCharacter({ luck_tokens: newValue } as Partial<CharacterRow>)
    record('luck', { from, to: newValue, delta: newValue - from, by: 'player' })
  }

  /**
   * A Fortuna é regra de rerrolagem, não um contador (§5.2): o token sai, os
   * mesmos dados voltam à mesa e o feed guarda os dois resultados lado a lado.
   */
  function handleFortuneReroll(original: RollResult) {
    if (!character || character.luckTokens <= 0) return
    void handleLuckChange(character.luckTokens - 1)
    handleRoll(reroll(original))
  }

  /**
   * Responde ao que o Mestre pediu (§6.4). O motor de dados é o mesmo de
   * sempre; o que muda é que a rolagem já nasce com o DC do pedido e volta
   * carimbada com o `promptId`, que é o que fecha a pendência.
   */
  function answerPrompt(prompt: SessionEvent) {
    const p = prompt.payload as SessionPromptPayload
    const stat = isStat(p.attribute) ? p.attribute : null
    const mod = stat ? modifier(character!.stats[stat]) : 0
    const rolled = rollDie('d20', p.label, stat ? STAT_LABELS[stat] : undefined, mod)
    const result: RollResult = { ...withDc(rolled, p.dc), promptId: p.promptId }
    handleRoll(result, p.secret ? 'gm_only' : 'table')
  }

  async function handleInventoryUpdate(inventory: InventoryItem[]) {
    await updateCharacter({ equipment: inventory as any } as Partial<CharacterRow>)
  }

  /**
   * O jogador tira a própria condição — quem sente o veneno passar é ele, e
   * pedir ao Mestre para clicar seria fricção sem motivo. Aplicar continua
   * sendo do Mestre, do painel dele.
   */
  async function handleConditionRemove(condition: ActiveCondition) {
    const next = character!.conditions.filter(c => c.id !== condition.id)
    await updateCharacter({ conditions: next } as Partial<CharacterRow>)
    record('condition', { action: 'removed', label: condition.label, by: 'player' })
  }

  /**
   * Descanso (§5.7). Recupera pelo dado de vida da classe — o mesmo dado, e a
   * mesma leitura, que a trilha de progressão usa ao subir de nível (a CON já
   * foi contada uma vez, no HP inicial). Come uma ração; de estômago vazio o
   * descanso não recupera nada, e o feed diz isso.
   */
  async function handleRest() {
    if (!character) return
    const cls = getClass(character.classId)
    const die = `d${cls?.hitDie ?? 6}`
    const ration = findRation(character.inventory)

    const rolled = rollDie(die, 'Descanso', 'Recuperação')
    const gain = ration ? Math.min(rolled.result, character.hpMax - character.hpCurrent) : 0
    const to = character.hpCurrent + gain

    const patch: Partial<CharacterRow> = {}
    if (gain > 0) patch.hp_current = to
    if (ration) (patch as any).equipment = consumeRation(character.inventory, ration.id)
    if (Object.keys(patch).length > 0) await updateCharacter(patch)

    record('hp', {
      from: character.hpCurrent,
      to,
      delta: gain,
      reason: 'rest',
      die,
      roll: rolled.result,
      ration: Boolean(ration),
      by: 'player',
    })
  }

  /**
   * A iniciativa nasce na ficha e entra na ordem da mesa (§5.8). A escrita
   * passa por um RPC: a trilha é do Mestre, e o jogador só pode mexer na
   * própria linha — a checagem de quem é o personagem e de que ele está
   * naquela mesa é feita no banco, não aqui.
   */
  async function handleRollInitiative() {
    if (!character || !encounter) return
    const result = rollDie('d20', 'Iniciativa', STAT_LABELS.dex, modifier(character.stats.dex))
    handleRoll(result)

    const supabase = createClient()
    await supabase.rpc('set_initiative', {
      p_encounter_id: encounter.id,
      p_character_id: characterId,
      p_value: result.total,
    })
  }

  async function handleTalentsUpdate(talents: Talent[]) {
    await updateCharacter({ talents: talents as any } as Partial<CharacterRow>)
  }

  async function handleTechniqueStatesChange(states: import('@/types/technique.types').TechniqueState[]) {
    await updateCharacter({ technique_states: states as any } as Partial<CharacterRow>)
  }

  async function handleCurrencyUpdate(patch: { gold?: number; silver?: number; copper?: number }) {
    await updateCharacter(patch as Partial<CharacterRow>)
  }

  async function handleMeleeRangedUpdate(patch: { meleeBonus?: number; rangedBonus?: number }) {
    const dbPatch: Partial<CharacterRow> = {}
    if (patch.meleeBonus !== undefined) (dbPatch as any).melee_bonus = patch.meleeBonus
    if (patch.rangedBonus !== undefined) (dbPatch as any).ranged_bonus = patch.rangedBonus
    await updateCharacter(dbPatch)
  }

  async function handleSpellsChange(spells: string[]) {
    await updateCharacter({ spells } as Partial<CharacterRow>)
  }

  async function handleSpellcastingUpdate(patch: { spellcastingBonus?: number; castingAttr?: string }) {
    const dbPatch: Partial<CharacterRow> = {}
    if (patch.spellcastingBonus !== undefined) (dbPatch as any).spellcasting_bonus = patch.spellcastingBonus
    if (patch.castingAttr !== undefined) (dbPatch as any).casting_attr = patch.castingAttr
    await updateCharacter(dbPatch)
  }

  async function handleAcChange(ac: number) {
    await updateCharacter({ ac } as Partial<CharacterRow>)
  }

  async function handleXpUpdate(xp: number) {
    await updateCharacter({ xp } as Partial<CharacterRow>)
  }

  // Throws so AvatarUpload keeps the error visible instead of showing a
  // portrait that was never written to the row.
  async function handleAvatarUpload(url: string) {
    const saved = await updateCharacter({ portrait_url: url } as Partial<CharacterRow>)
    if (!saved) throw new Error('character row update failed')
  }

  const tabItems = TAB_KEYS.map(key => ({ key, label: TAB_META[key].label }))
  const railItems = TAB_KEYS.map(key => ({ key, ...TAB_META[key] }))
  const editHref = `/sheet/${characterId}/edit`

  const vitals = (
    <FloatingVitals
      ac={character.ac}
      hpMax={character.hpMax}
      hpCurrent={character.hpCurrent}
      luckTokens={character.luckTokens}
      onHpChange={handleHpChange}
      onLuckChange={handleLuckChange}
      characterId={characterId}
      portraitUrl={character.portraitUrl}
      characterName={character.name}
      level={character.level}
      xp={character.xp}
      onXpUpdate={handleXpUpdate}
      className={cls?.name ?? character.classId}
      ancestryName={ancestry?.name ?? character.ancestryId}
      onAvatarUpload={handleAvatarUpload}
      editHref={editHref}
      stats={character.stats}
      onRoll={handleRoll}
    />
  )

  // Every tab hands the page the same shape: the block that fills the content
  // column's first row and, where the tab has one, the block that fills the
  // second. The page owns placement — tab components only render blocks.
  const tabBlocks: Record<Tab, { primary: React.ReactNode; secondary?: React.ReactNode }> = {
    stats: {
      primary: cls && (
        <ClassPanel
          classData={cls}
          ancestry={ancestry}
          archetype={archetype}
          languages={character.languages}
          stats={character.stats}
          techniqueStates={character.techniqueStates}
          onStateChange={handleTechniqueStatesChange}
          onRoll={handleRoll}
        />
      ),
      secondary: (
        <TalentsPanel talents={character.talents} onUpdate={handleTalentsUpdate} onRoll={handleRoll} />
      ),
    },
    inventory: {
      primary: (
        <InventoryView
          inventory={character.inventory}
          str={character.stats.str}
          dex={character.stats.dex}
          onUpdate={handleInventoryUpdate}
          onAcChange={handleAcChange}
          onMeleeRangedUpdate={handleMeleeRangedUpdate}
          onRoll={handleRoll}
          meleeBonus={character.meleeBonus}
          rangedBonus={character.rangedBonus}
          onLightChange={change => record('light', { ...change, by: 'player' })}
          clock={openSession}
        />
      ),
      secondary: (
        <TreasureVault
          gold={character.gold}
          silver={character.silver}
          copper={character.copper}
          onUpdate={handleCurrencyUpdate}
        />
      ),
    },
    // The grimoire and the backstory are each a single block, so they take
    // both content rows rather than leaving the second one hollow.
    spells: {
      primary: (
        <Spells
          classId={character.classId}
          equippedSpells={character.spells}
          spellcastingBonus={character.spellcastingBonus}
          castingAttr={character.castingAttr}
          stats={character.stats}
          onRoll={handleRoll}
          onUpdate={handleSpellcastingUpdate}
          onSpellsChange={handleSpellsChange}
        />
      ),
    },
    backstory: {
      primary: <BackstoryView character={character} onUpdate={updateCharacter} />,
    },
  }

  const { primary, secondary } = tabBlocks[tab]
  // A sobrecarga era um texto vermelho no inventário e nada mais (§5.10). Com a
  // regra de carga unificada na Fase 0, ela passa a se anunciar junto das
  // condições — no mesmo lugar e do mesmo jeito, porque para quem rola é a
  // mesma coisa: algo está pesando contra.
  const overloaded = usedSlots(character.inventory) > maxSlots(character.stats.str)
  const disadvantages = [
    ...disadvantageLabels(character.conditions),
    ...(overloaded ? ['Sobrecarga'] : []),
  ]
  const ration = findRation(character.inventory)

  /**
   * A faixa de estado: o que a mesa está esperando desta ficha, o que está em
   * vigor sobre ela, e o botão de acampar. Abre o conteúdo em qualquer aba,
   * porque nada disso é assunto de uma aba só.
   */
  const stateStrip = (
    <>
      {encounter && (
        <TurnBanner
          encounter={encounter}
          actors={encounterActors}
          mine={myActor}
          onRollInitiative={() => void handleRollInitiative()}
        />
      )}
      <PromptCard prompts={prompts} onAnswer={answerPrompt} />
      {(character.conditions.length > 0 || isOwner) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ConditionChips conditions={character.conditions} onRemove={handleConditionRemove} />
          {isOwner && (
            <RestButton
              rations={ration?.quantity ?? 0}
              hpFull={character.hpCurrent >= character.hpMax}
              onRest={() => void handleRest()}
            />
          )}
        </div>
      )}
    </>
  )

  return (
    <AppShell
      backHref="/home"
      playerName={playerName}
      playerRole={`${cls?.name ?? character.classId} · Nível ${character.level}`}
      headerRight={tableBadge}
    >
      {isMobile ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 16,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 16,
          paddingBottom: 'calc(76px + var(--safe-bottom))',
        }}>
          {stateStrip}
          {vitals}
          {primary}
          {secondary}
        </div>
      ) : (
        // The whole sheet sits on one twelve-column grid, laid out as the
        // design's auto-layout: on row 1 the heading (columns 4-9) with
        // fortuna and the light status beside it (10 and 11); the nav rail
        // holding column 3 down rows 2-3; the tab's content filling columns
        // 4-9 of those same rows; the vitals in columns 10-11 of row 2
        // (see .sheet-* in globals.css).
        <div className="sheet-grid">
          <header className="sheet-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 48, color: 'var(--primary-foreground)', lineHeight: 1.15, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {character.name}
            </h1>
            <Link
              href={editHref}
              style={{ fontFamily: 'var(--font-heading)', fontSize: 14, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--card-foreground)', textDecoration: 'underline', textUnderlineOffset: '2px', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              Editar
            </Link>
          </header>

          <div className="sheet-fortune">
            <FortuneTile luckTokens={character.luckTokens} onLuckChange={handleLuckChange} />
          </div>

          <div className="sheet-torch">
            <TorchStatus inventory={character.inventory} clock={openSession} onClick={() => setTab('inventory')} />
          </div>

          <div className="sheet-rail">
            <TabRail tabs={railItems} active={tab} onChange={setTab} />
          </div>

          <div className={secondary ? 'sheet-primary' : 'sheet-primary sheet-primary--full'}>
            {/* O pedido do Mestre abre o conteúdo em vez de flutuar sobre ele:
                uma rolagem que a mesa está esperando não pode ser um aviso
                que some sozinho. */}
            {stateStrip}
            {primary}
          </div>
          {secondary && <div className="sheet-secondary">{secondary}</div>}

          <aside className="sheet-vitals">
            {vitals}
          </aside>
        </div>
      )}

      {/* Navigation: labelled bottom bar on mobile (dice as its trailing
          button), icon rail + free-floating dice button on desktop. */}
      {isMobile ? (
        <TabBar
          tabs={tabItems}
          active={tab}
          onChange={setTab}
          trailing={<DiceRoller onRoll={handleRoll} disadvantageFrom={disadvantages} />}
        />
      ) : (
        <DiceRoller onRoll={handleRoll} floating disadvantageFrom={disadvantages} />
      )}

      {/* Phones have no column to reserve for the light, so they keep the
          floating badge; the desktop grid carries TorchStatus instead. */}
      {isMobile && (
        <FloatingTorch
          inventory={character.inventory}
          clock={openSession}
          onClick={() => setTab('inventory')}
        />
      )}
      <DiceOverlay
        phase={rollPhase}
        roll={activeRoll}
        mode={rollMode}
        throwRoll={throwRoll}
        onSettled={settleRoll}
        onUnavailable={fallBackToTimed}
      />
      <RollToasts
        rolls={rollHistory}
        fortuneLeft={character.luckTokens}
        onSpendFortune={handleFortuneReroll}
      />
      {/* Nada que o Mestre faça com este personagem acontece em silêncio. */}
      <TableToasts events={tableEvents} characterId={characterId} since={openedAt} />
      <SaveSeal savedAt={savedAt} isMobile={isMobile} />
    </AppShell>
  )
}

function SaveSeal({ savedAt, isMobile }: { savedAt: number; isMobile: boolean }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!savedAt) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(t)
  }, [savedAt])

  if (!visible) return null
  return (
    <div
      key={savedAt}
      className="animate-seal"
      style={{
        position: 'fixed',
        // Mobile sits above the bottom bar; desktop tucks into the bottom-left
        // so it never collides with the floating dice button.
        bottom: isMobile ? 'calc(72px + var(--safe-bottom))' : 24,
        ...(isMobile ? { right: 16 } : { left: 24 }),
        zIndex: 120,
        fontFamily: 'var(--font-heading)',
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--card-foreground)',
        background: 'var(--card)',
        border: '1px solid var(--primary)',
        borderRadius: 2,
        padding: '6px 12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
        pointerEvents: 'none',
      }}
    >
      ✦ Selado
    </div>
  )
}
