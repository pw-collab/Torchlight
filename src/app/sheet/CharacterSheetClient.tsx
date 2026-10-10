'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  AdventureIcon,
  AiLearningIcon,
  MoneyBag01Icon,
  ScrollIcon,
  Settings03Icon,
} from '@hugeicons/core-free-icons'
import { createClient } from '@/lib/supabase'
import { useTableNow } from '@/hooks/useTableNow'
import { useCharacter } from '@/hooks/useCharacter'
import { useDiceRoll } from '@/hooks/useDiceRoll'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useTableSession } from '@/hooks/useTableSession'
import { useSessionFeed } from '@/hooks/useSessionFeed'
import { useSessionPresence } from '@/hooks/useSessionPresence'
import { useEncounter } from '@/hooks/useEncounter'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { FloatingVitals } from '@/components/sheet/FloatingVitals'
import { TorchStatus } from '@/components/sheet/TorchStatus'
import { DiceRoller } from '@/components/sheet/DiceRoller'
import { AttacksMenu } from '@/components/sheet/AttacksMenu'
import { RollHistory } from '@/components/sheet/RollHistory'
import { TabBar } from '@/components/sheet/TabBar'
import { TabRail } from '@/components/sheet/TabRail'
import { DiceOverlay } from '@/components/sheet/DiceOverlay'
import { RollToasts } from '@/components/sheet/RollToasts'
import { InventoryView } from '@/components/sheet/InventoryView'
import { FloatingTorch } from '@/components/sheet/FloatingTorch'
import { TalentsPanel } from '@/components/sheet/TalentsPanel'
import { ClassPanel } from '@/components/sheet/ClassPanel'
import { Spells } from '@/components/sheet/Spells'
import { BackstoryView } from '@/components/sheet/BackstoryView'
import { sendToDiscord } from '@/lib/discord'
import { minutesLeft, snuffBurnedOut } from '@/lib/light'
import { pendingPrompts, recordEvent, rollPayload } from '@/lib/sessionEvents'
import { handoutItem, handoutsFor } from '@/lib/handouts'
import { TableBadge } from '@/components/sheet/TableBadge'
import { TableToasts } from '@/components/sheet/TableToasts'
import { LiveAnnouncer } from '@/components/shared/LiveAnnouncer'
import { describeRoll } from '@/lib/rollSpeech'
import { PromptCard } from '@/components/sheet/PromptCard'
import { TurnBanner } from '@/components/sheet/TurnBanner'
import { TableMode } from '@/components/sheet/TableMode'
import { HandoutShelf } from '@/components/sheet/HandoutShelf'
import { BookViewerModal } from '@/components/sheet/BookViewerModal'
import { ConditionChips, disadvantageLabels } from '@/components/sheet/ConditionChips'
import { RestButton } from '@/components/sheet/RestButton'
import { consumeRation, findRation } from '@/lib/rest'
import { coinSlots, maxSlots, usedSlots } from '@/lib/slots'
import { STAT_LABELS, isStat } from '@/data/stats'
import type {
  EventPayload,
  EventVisibility,
  PromptPayload as SessionPromptPayload,
  SessionEvent,
  SessionEventKind,
  SessionPayload,
} from '@/types/session.types'
import { modifier, reroll, rollDie, rollWithMode, withDc } from '@/lib/dice'
import type { RollMode, RollResult } from '@/lib/dice'
import type { ActiveCondition, CharacterRow } from '@/types/character.types'
import type { InventoryItem } from '@/types/inventory.types'
import type { Talent } from '@/types/talent.types'
import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'
import { getArchetype } from '@/data/archetypes/index'

type Tab = 'stats' | 'inventory' | 'spells' | 'backstory'

// Labels drive the mobile bottom bar; the icons drive the desktop rail.
const TAB_META: Record<Tab, { label: string; icon: IconSvgElement }> = {
  stats:     { label: 'Atributos',  icon: AdventureIcon },
  inventory: { label: 'Inventário', icon: MoneyBag01Icon },
  spells:    { label: 'Grimório',   icon: AiLearningIcon },
  backstory: { label: 'História',   icon: ScrollIcon },
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
  // A vista de longe (§5.12): a mesma ficha, só que legível do outro lado da mesa.
  const [tableMode, setTableMode] = useState(false)
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

  // ── O que foi entregue (§6.8) ─────────────────────────────────────────────
  // Uma revelação que chega enquanto a ficha está aberta abre sozinha: é o
  // ponto do recurso — a carta cai na tela de quem recebeu, sem o Mestre ter
  // de dizer "abre lá". O que já estava no feed quando a ficha abriu, não:
  // senão todo refresh reabriria a sessão inteira de documentos.
  const [readHandoutIds, setReadHandoutIds] = useState<string[]>([])
  const [reopened, setReopened] = useState<SessionEvent | null>(null)

  const handouts = useMemo(
    () => handoutsFor(tableEvents, characterId),
    [tableEvents, characterId],
  )
  // Do fim para o começo porque o feed vem do mais novo para o mais antigo:
  // uma rajada de entregas é lida na ordem em que o Mestre as mandou.
  const unread = handouts.filter(e => e.at > openedAt && !readHandoutIds.includes(e.id))
  const openHandout = reopened ?? unread[unread.length - 1] ?? null

  function closeHandout() {
    if (reopened) setReopened(null)
    else if (openHandout) setReadHandoutIds(prev => [...prev, openHandout.id])
  }

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
  const now = useTableNow(openSession)
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
  function answerPrompt(prompt: SessionEvent, mode: RollMode = 'normal') {
    const p = prompt.payload as SessionPromptPayload
    const stat = isStat(p.attribute) ? p.attribute : null
    const mod = stat ? modifier(character!.stats[stat]) : 0
    const rolled = rollWithMode('d20', p.label, stat ? STAT_LABELS[stat] : undefined, mod, mode)
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
  async function handleRollInitiative(mode: RollMode = 'normal') {
    if (!character || !encounter) return
    const result = rollWithMode('d20', 'Iniciativa', STAT_LABELS.dex, modifier(character.stats.dex), mode)
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

  // Every tab hands the page one block for the panel. The page owns placement
  // — tab components only render blocks.
  const panels: Record<Tab, React.ReactNode> = {
    // The techniques and the talent list share one card: the deck takes three
    // of its four columns, the list the last (see .attr-panel). The name and
    // the class / archetype / ancestry tags head this tab only.
    stats: (
      <div className="attr-panel">
        {cls && (
          <ClassPanel
            characterName={character.name}
            level={character.level}
            showName={!isMobile}
            classData={cls}
            ancestry={ancestry}
            archetype={archetype}
            languages={character.languages}
            stats={character.stats}
            techniqueStates={character.techniqueStates}
            onStateChange={handleTechniqueStatesChange}
            onRoll={handleRoll}
          />
        )}
        <TalentsPanel
          talents={character.talents}
          levelProgress={character.levelProgress}
          currentLevel={character.level}
          onUpdate={handleTalentsUpdate}
          onRoll={handleRoll}
        />
      </div>
    ),
    // Um bloco só: o tesouro deixou de ter uma linha própria na página e
    // virou a Bolsa de moedas, um item da mochila como qualquer outro.
    inventory: (
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
        gold={character.gold}
        silver={character.silver}
        copper={character.copper}
        onCurrencyUpdate={handleCurrencyUpdate}
        onLightChange={change => record('light', { ...change, by: 'player' })}
        clock={openSession}
      />
    ),
    spells: (
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
    backstory: <BackstoryView character={character} onUpdate={updateCharacter} />,
  }

  const panel = panels[tab]
  // A sobrecarga era um texto vermelho no inventário e nada mais (§5.10). Com a
  // regra de carga unificada na Fase 0, ela passa a se anunciar junto das
  // condições — no mesmo lugar e do mesmo jeito, porque para quem rola é a
  // mesma coisa: algo está pesando contra.
  const overloaded =
    usedSlots(character.inventory) + coinSlots(character) > maxSlots(character.stats.str)
  const disadvantages = [
    ...disadvantageLabels(character.conditions),
    ...(overloaded ? ['Sobrecarga'] : []),
  ]
  const ration = findRation(character.inventory)

  /**
   * A faixa de estado: o que a mesa está esperando desta ficha, o que está em
   * vigor sobre ela, e o botão de acampar. Nada disso é assunto de uma aba só:
   * no desktop ela abre o card de baixo, acima das rolagens; no celular, o
   * topo da ficha.
   */
  const stateStrip = (
    <>
      {encounter && (
        <TurnBanner
          encounter={encounter}
          actors={encounterActors}
          mine={myActor}
          onRollInitiative={mode => void handleRollInitiative(mode)}
        />
      )}
      <PromptCard prompts={prompts} onAnswer={answerPrompt} />
      <HandoutShelf handouts={handouts} onOpen={setReopened} />
      {(character.conditions.length > 0 || isOwner) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ConditionChips conditions={character.conditions} onRemove={handleConditionRemove} />
          {isOwner && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setTableMode(true)}
              title="Números grandes, para ler com o celular do outro lado da mesa"
              className="font-heading h-9 min-h-9 shrink-0 rounded-[1px] px-3 text-[8.5px] tracking-[0.14em] uppercase"
            >
              ⛶ Modo mesa
            </Button>
          )}
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
      // The light rides the top bar over the vitals, so it stays in view
      // whatever the panel is showing. Phones keep their floating badge.
      headerCenter={isMobile ? undefined : (
        <TorchStatus inventory={character.inventory} clock={openSession} onClick={() => setTab('inventory')} />
      )}
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
          {panel}
        </div>
      ) : (
        // The whole sheet is one screen on a ten-column, eight-row grid, laid
        // out as the design's auto-layout: the vitals over the dock in columns
        // 1-2, the nav rail down column 3, and the tab's panel across columns
        // 4-10 (see .sheet-* in globals.css).
        <div className="sheet-grid">
          <aside className="sheet-vitals">
            {vitals}
          </aside>

          {/* The dock: what the table is waiting on, the rolls made so far,
              and the attack and dice buttons on its floor. */}
          <section className="sheet-dock" aria-label="Mesa e rolagens">
            <div className="sheet-dock__strip">{stateStrip}</div>
            <RollHistory
              rolls={rollHistory}
              fortuneLeft={character.luckTokens}
              onSpendFortune={handleFortuneReroll}
            />
            <div className="sheet-dock__actions">
              <AttacksMenu
                inventory={character.inventory}
                str={character.stats.str}
                dex={character.stats.dex}
                meleeBonus={character.meleeBonus}
                rangedBonus={character.rangedBonus}
                onRoll={handleRoll}
                onOpenInventory={() => setTab('inventory')}
              />
              <div className="col-span-2 flex min-w-0">
                <DiceRoller
                  onRoll={handleRoll}
                  docked
                  disadvantageFrom={disadvantages}
                  luckTokens={character.luckTokens}
                  onLuckChange={handleLuckChange}
                />
              </div>
            </div>
          </section>

          <div className="sheet-rail">
            <TabRail
              tabs={railItems}
              active={tab}
              onChange={setTab}
              link={{ href: editHref, label: 'Editar personagem', icon: Settings03Icon }}
            />
          </div>

          <div className="sheet-panel">
            {panel}
          </div>
        </div>
      )}

      {/* Navigation: labelled bottom bar on mobile, with the dice as its
          trailing button. The desktop has the rail, and the dice in the dock. */}
      {isMobile && (
        <TabBar
          tabs={tabItems}
          active={tab}
          onChange={setTab}
          trailing={<DiceRoller onRoll={handleRoll} disadvantageFrom={disadvantages} />}
        />
      )}

      {/* Phones have no top-bar lane to give the light, so they keep the
          floating badge; the desktop carries TorchStatus in the header. */}
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
      {/* Phones get the fresh rolls as toasts; the desktop shows the same
          cards in the dock's history instead. */}
      {isMobile && (
        <RollToasts
          rolls={rollHistory}
          fortuneLeft={character.luckTokens}
          onSpendFortune={handleFortuneReroll}
        />
      )}
      {/* Both layouts: the newest roll, read out for screen readers. */}
      <LiveAnnouncer
        message={rollHistory[0] ? describeRoll(rollHistory[0]) : null}
        id={rollHistory[0]?.id}
      />
      {/* Nada que o Mestre faça com este personagem acontece em silêncio. */}
      <TableToasts events={tableEvents} characterId={characterId} since={openedAt} />
      {tableMode && (
        <TableMode character={character} clock={openSession} onClose={() => setTableMode(false)} />
      )}
      {openHandout && (
        <BookViewerModal
          item={handoutItem(openHandout)}
          onClose={closeHandout}
          /* Somente leitura: o leitor nunca oferece a edição, e nada há a salvar. */
          onSaveContent={() => {}}
          readOnly
        />
      )}
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
        // Mobile sits above the bottom bar; desktop takes the bottom-right
        // corner, clear of the dock and its roll buttons on the left.
        bottom: isMobile ? 'calc(72px + var(--safe-bottom))' : 24,
        right: isMobile ? 16 : 24,
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
