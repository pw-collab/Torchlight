'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Seat } from '@/lib/gmActions'
import type { GmAction } from '@/lib/gmActions'
import { brightest } from '@/lib/light'
import { tableNow } from '@/lib/dungeonClock'
import { STABILIZE_DC, dyingRounds, mortalState, roundsLabel } from '@/lib/dying'
import { findRation, lostSpells } from '@/lib/rest'
import { PromptComposer } from '@/components/gm/PromptComposer'
import { StatBlock } from '@/components/sheet/StatBlock'
import { Spells } from '@/components/sheet/Spells'
import { Button } from '@/components/ui/button'
import { AmountPad } from './AmountPad'
import { ConditionGrid } from './ConditionGrid'
import { TreasureForm } from './TreasureForm'
import type { TableController } from './controller'
import { CommandGrid, CommandTile, SubView } from './ui'

type View = 'menu' | 'hp' | 'luck' | 'xp' | 'conditions' | 'prompt' | 'treasure' | 'sheet'

/**
 * Os comandos de um aventureiro. Tudo o que o Mestre faz com um personagem —
 * ferir, curar, dar Fortuna e XP, pôr condições, apagar a luz, pedir um teste,
 * entregar tesouro, rolar a vez de quem está morrendo — sai daqui, sem abrir
 * a ficha. Cada gesto vira linha do log e aviso na tela do jogador.
 */
export function PcCommands({ ctl, seat }: { ctl: TableController; seat: Seat }) {
  const [view, setView] = useState<View>('menu')
  const c = seat.character
  const busy = ctl.busyId === c.id
  const act = (action: GmAction) => void ctl.act(c, action)
  const back = () => setView('menu')

  const mortal = mortalState(c.conditions)
  const rounds = dyingRounds(c.conditions)
  const light = brightest(c.inventory, tableNow(ctl.clock))
  const encounter = ctl.enc.encounter
  const actor = ctl.enc.actors.find(a => a.source === 'pc' && a.refId === c.id)
  const myTurn = Boolean(encounter && actor && encounter.activeActorId === actor.id)
  const ration = findRation(c.inventory)
  const lost = lostSpells(c.techniqueStates)

  if (view === 'hp') {
    return (
      <SubView title={`Vida · ${c.hpCurrent}/${c.hpMax}`} onBack={back}>
        <AmountPad
          actions={[
            { label: '🗡 Dano', tone: 'danger', onApply: n => act({ type: 'hp', delta: -n }) },
            { label: '✚ Cura', tone: 'heal', onApply: n => act({ type: 'hp', delta: n }) },
          ]}
        />
      </SubView>
    )
  }

  if (view === 'luck') {
    return (
      <SubView title="Fortuna" onBack={back}>
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            disabled={busy || c.luckTokens <= 0}
            onClick={() => act({ type: 'luck', delta: -1 })}
            className="font-heading h-12 w-16 rounded-[1px] text-xl text-[var(--chart-1)] disabled:opacity-30"
            aria-label="Gastar um token de Fortuna"
          >
            −
          </Button>
          <span className="font-[var(--font-numeral)] min-w-12 text-center text-4xl text-[var(--chart-1)]">
            ✦ {c.luckTokens}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => act({ type: 'luck', delta: 1 })}
            className="font-heading h-12 w-16 rounded-[1px] text-xl text-[var(--chart-1)]"
            aria-label="Conceder um token de Fortuna"
          >
            +
          </Button>
        </div>
        <p className="font-body text-center text-[11px] text-[var(--muted-foreground)] italic">
          Fortuna rerrola qualquer rolagem. Dê por uma boa ideia, uma cena bem jogada.
        </p>
      </SubView>
    )
  }

  if (view === 'xp') {
    return (
      <SubView title={`Experiência · ${c.xp} XP`} onBack={back}>
        <AmountPad
          presets={[1, 2, 3, 5, 10]}
          actions={[{ label: '△ Dar XP', tone: 'primary', onApply: n => act({ type: 'xp', delta: n }) }]}
        />
      </SubView>
    )
  }

  if (view === 'conditions') {
    return (
      <SubView title="Condições" onBack={back}>
        <ConditionGrid active={c.conditions} onToggle={condition => act({ type: 'condition', condition })} />
      </SubView>
    )
  }

  if (view === 'prompt') {
    return (
      <PromptComposer
        seats={ctl.seats.map(s => ({ id: s.character.id, name: s.character.name }))}
        initialTargets={[c.id]}
        onSend={request => { ctl.sendPrompt(request); back() }}
        onClose={back}
      />
    )
  }

  if (view === 'treasure') {
    return (
      <SubView title="Tesouro" onBack={back}>
        <TreasureForm
          seats={ctl.seats.map(s => ({ id: s.character.id, name: s.character.name }))}
          initialRecipients={[c.id]}
          busy={busy}
          onGive={(ids, grant) => { void ctl.giveTreasure(ids, grant); back() }}
        />
      </SubView>
    )
  }

  if (view === 'sheet') {
    return (
      <SubView title="Ficha" onBack={back}>
        <StatBlock stats={c.stats} />
        {c.spells.length > 0 && (
          <Spells classId={c.classId} equippedSpells={c.spells} lostSpells={lost} />
        )}
        <div className="flex items-center gap-3">
          <Link
            href={`/sheet/${c.id}`}
            className="font-heading text-[9px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase underline underline-offset-2 hover:text-[var(--foreground)]"
          >
            Abrir ficha
          </Link>
          <Link
            href={`/sheet/${c.id}/edit`}
            className="font-heading text-[9px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase underline underline-offset-2 hover:text-[var(--foreground)]"
          >
            Editar
          </Link>
        </div>
      </SubView>
    )
  }

  // ── O menu ────────────────────────────────────────────────────────────────

  const idle = mortal === 'dying' && rounds !== null
    ? `${c.name} está à beira da morte: ${roundsLabel(rounds)}. Na vez dele, um d20; só o 20 natural levanta.`
    : myTurn
      ? `Vez de ${c.name}: o jogador age na ficha. O dano que ele rolar aparece no palco esperando o alvo.`
      : !ration
        ? `${c.name} está sem rações: não recupera nada ao acampar.`
        : `Comandos para ${c.name}. Passe o mouse para ver o que cada um faz.`

  return (
    <CommandGrid idle={idle}>
      {mortal === 'dying' && rounds !== null && (
        <>
          <CommandTile
            icon="🎲"
            label="Contra a morte"
            hint="d20: só o 20 natural levanta. Para quem está fora do app."
            tone="danger"
            highlight={myTurn}
            disabled={busy}
            onClick={() => act({ type: 'death-roll' })}
          />
          <CommandTile
            icon="✚"
            label="Estabilizar"
            hint={`Um aliado passou no INT DC ${STABILIZE_DC}: o relógio da morte para`}
            tone="heal"
            disabled={busy}
            onClick={() => act({ type: 'stabilize' })}
          />
        </>
      )}
      <CommandTile icon="🗡" label="Dano / Cura" hint={`PV ${c.hpCurrent}/${c.hpMax}`} tone="danger" onClick={() => setView('hp')} disabled={busy} />
      <CommandTile icon="⚑" label="Condições" hint={c.conditions.length > 0 ? `${c.conditions.length} em vigor` : 'Nenhuma em vigor'} onClick={() => setView('conditions')} disabled={busy} />
      <CommandTile icon="❔" label="Pedir teste" hint="Atributo e DC, para este personagem" onClick={() => setView('prompt')} />
      {encounter && actor && actor.initiative == null && (
        <CommandTile
          icon="🎲"
          label="Iniciativa"
          hint="Rolar por ele: d20 + DES"
          tone="gold"
          onClick={() => void ctl.enc.rollInitiativeFor(actor)}
        />
      )}
      {encounter && !actor && (
        <CommandTile icon="🧍" label="Pôr na trilha" hint="Entrou depois do combate" tone="gold" onClick={() => void ctl.enc.seatPc(seat)} />
      )}
      <CommandTile icon="✦" label="Fortuna" hint={`${c.luckTokens} token${c.luckTokens === 1 ? '' : 's'}: dar ou gastar`} tone="gold" onClick={() => setView('luck')} disabled={busy} />
      <CommandTile icon="△" label="XP" hint={`${c.xp} XP: dar qualquer valor`} onClick={() => setView('xp')} disabled={busy} />
      <CommandTile icon="💰" label="Tesouro" hint="Moedas, item e o XP do achado" tone="gold" onClick={() => setView('treasure')} disabled={busy} />
      <CommandTile
        icon="🌑"
        label="Apagar luz"
        hint={light ? `Uma rajada apaga: ${light.name}` : 'Sem luz acesa'}
        onClick={() => act({ type: 'snuff' })}
        disabled={busy || !light}
      />
      <CommandTile icon="📋" label="Ficha" hint={lost.length > 0 ? `Atributos e magias: ${lost.length} perdida(s)` : 'Atributos e magias'} onClick={() => setView('sheet')} />
    </CommandGrid>
  )
}
