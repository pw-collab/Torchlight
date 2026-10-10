'use client'

import { useState } from 'react'
import { moraleDue } from '@/lib/encounterSetup'
import { findRation } from '@/lib/rest'
import { PromptComposer } from '@/components/gm/PromptComposer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountPad } from './AmountPad'
import { MonsterPicker } from './MonsterPicker'
import { NarrateForm } from './NarrateForm'
import { TreasureForm } from './TreasureForm'
import type { TableController } from './controller'
import { CHIP, CommandGrid, CommandTile, FIELD, LABEL, SubView, parseAmount } from './ui'
import { cn } from '@/lib/utils'

export type TableView = 'menu' | 'start' | 'add' | 'prompt' | 'narrate' | 'treasure' | 'rest' | 'xp' | 'area' | 'seat' | 'end'

/**
 * Os comandos da mesa inteira — o que não é de um personagem nem de um
 * monstro: começar a briga, passar a rodada, a bola de fogo, o tesouro do
 * baú, o acampamento, a narração.
 *
 * Fora do combate o menu é de exploração; dentro dele, de batalha.
 *
 * O formulário aberto mora na tela, não aqui: o Mestre clica num card, volta
 * à mesa e encontra o menu onde deixou — e o alerta de encontro consegue
 * abrir direto o "começar um combate".
 */
export function TableCommands({
  ctl, view, setView,
}: {
  ctl: TableController
  view: TableView
  setView: (view: TableView) => void
}) {
  const back = () => setView('menu')
  const { enc, crawl, seats } = ctl
  const encounter = enc.encounter
  // O combate pode acabar (ou começar) por outro caminho — pela aba de
  // preparo, por exemplo. Um formulário que não serve mais ao momento volta
  // ao menu em vez de ficar aberto à toa.
  const combatOnly = view === 'add' || view === 'seat' || view === 'end'
  const current: TableView = (!encounter && combatOnly) || (encounter && view === 'start') ? 'menu' : view
  const seatList = seats.map(s => ({ id: s.character.id, name: s.character.name }))

  if (current === 'start') {
    const found = crawl.last?.check.encounter ? crawl.last.check : null
    return (
      <SubView title="Começar um combate" onBack={back}>
        {found && (
          <p className="font-body m-0 text-[11px] text-[var(--destructive)] italic">
            Da checagem: {found.distance?.label} · {found.activity?.label} · {found.reaction?.label}
          </p>
        )}
        <MonsterPicker
          mode="start"
          bestiary={ctl.bestiary}
          defaultName={found ? 'Encontro na masmorra' : ''}
          busy={enc.busy}
          onConfirm={(name, picks) => {
            crawl.dismiss()
            void enc.start(name, picks)
            back()
          }}
        />
      </SubView>
    )
  }

  if (current === 'add') {
    return (
      <SubView title="Reforços" onBack={back}>
        <MonsterPicker
          mode="add"
          bestiary={ctl.bestiary}
          busy={enc.busy}
          onConfirm={(_, picks) => { void enc.addNpcs(picks); back() }}
        />
      </SubView>
    )
  }

  if (current === 'prompt') {
    return <PromptComposer seats={seatList} onSend={request => { ctl.sendPrompt(request); back() }} onClose={back} />
  }

  if (current === 'narrate') {
    return (
      <SubView title="Narrar para a mesa" onBack={back}>
        <NarrateForm onSend={text => { ctl.narrate(text); back() }} />
      </SubView>
    )
  }

  if (current === 'treasure') {
    return (
      <SubView title="Tesouro" onBack={back}>
        <TreasureForm
          seats={seatList}
          initialRecipients={seatList.map(s => s.id)}
          onGive={(ids, grant) => { void ctl.giveTreasure(ids, grant); back() }}
        />
      </SubView>
    )
  }

  if (current === 'xp') {
    return (
      <SubView title="XP para a mesa inteira" onBack={back}>
        <AmountPad
          presets={[1, 2, 3, 5, 10]}
          actions={[{ label: '△ Dar a todos', tone: 'primary', onApply: n => { void ctl.grantXpToAll(n); back() } }]}
        />
      </SubView>
    )
  }

  if (current === 'area') {
    return (
      <SubView title="Dano em área" onBack={back}>
        <p className="font-body m-0 text-[11px] text-[var(--muted-foreground)] italic">
          A bola de fogo, a armadilha, o desabamento: digite o dano e depois clique em cada alvo nos cards.
        </p>
        <AmountPad
          actions={[{
            label: '🎯 Escolher alvos',
            tone: 'danger',
            onApply: n => { ctl.beginTargeting({ kind: 'area', amount: n, picked: [] }); back() },
          }]}
        />
      </SubView>
    )
  }

  if (current === 'rest') {
    const eating = seats.filter(s => findRation(s.character.inventory)).length
    return (
      <SubView title="Acampar" onBack={back}>
        <p className="font-body m-0 text-[12px] leading-relaxed text-[var(--foreground)]">
          Oito horas de sono e uma ração cada: quem come recupera todo o PV, as magias perdidas e as técnicas.
          Sem ração, nada volta.
        </p>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {seats.map(seat => {
            const ration = findRation(seat.character.inventory)
            return (
              <li key={seat.character.id} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-heading text-[var(--foreground)]">{seat.character.name}</span>
                <span className={cn('font-mono', ration ? 'text-[var(--muted-foreground)]' : 'text-[var(--destructive)]')}>
                  {ration ? `${ration.quantity} ração(ões)` : 'sem ração'}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => crawl.check()}
            title="Num lugar perigoso, o sono também atrai visitas"
            className={cn(CHIP, 'h-10')}
          >
            🎲 Checar encontro antes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => { void ctl.partyRest(); back() }}
            disabled={seats.length === 0}
            className="font-heading h-10 min-h-10 flex-1 rounded-[1px] border-[var(--chart-2)] text-[10px] font-bold tracking-[0.14em] text-[var(--chart-2)] uppercase disabled:opacity-30"
          >
            ⛺ Acampar ({eating} de {seats.length} comem)
          </Button>
        </div>
      </SubView>
    )
  }

  if (current === 'seat') {
    const missing = seats.filter(seat => !enc.actors.some(a => a.source === 'pc' && a.refId === seat.character.id))
    return (
      <SubView title="Pôr na trilha" onBack={back}>
        {missing.length === 0 ? (
          <p className="font-body text-[11px] text-[var(--muted-foreground)] italic">Todo o grupo já está na trilha.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {missing.map(seat => (
              <Button key={seat.character.id} type="button" variant="outline" onClick={() => void enc.seatPc(seat)} className={CHIP}>
                + {seat.character.name}
              </Button>
            ))}
          </div>
        )}
      </SubView>
    )
  }

  if (current === 'end') {
    return (
      <SubView title="Encerrar o combate" onBack={back}>
        <EndCombat
          defeated={enc.actors.filter(a => a.source === 'npc' && a.defeated).length}
          busy={enc.busy}
          onEnd={async (xp, thenTreasure) => {
            await enc.end(xp)
            setView(thenTreasure ? 'treasure' : 'menu')
          }}
        />
      </SubView>
    )
  }

  // ── O menu ────────────────────────────────────────────────────────────────

  const common = (
    <>
      <CommandTile icon="❔" label="Pedir rolagem" hint="Teste para um, alguns ou todos" onClick={() => setView('prompt')} disabled={seats.length === 0} />
      <CommandTile icon="💬" label="Narrar" hint="Uma linha para todas as fichas" onClick={() => setView('narrate')} />
      <CommandTile icon="📖" label="Entregar" hint="Carta, mapa, página de diário" onClick={ctl.openHandouts} disabled={seats.length === 0} />
      <CommandTile icon="💥" label="Dano em área" hint="Armadilha, explosão: vários alvos" tone="danger" onClick={() => setView('area')} />
    </>
  )

  if (encounter) {
    const missing = seats.some(seat => !enc.actors.some(a => a.source === 'pc' && a.refId === seat.character.id))
    const due = moraleDue(enc.actors)
    return (
      <CommandGrid idle={`Rodada ${encounter.round}. Clique numa figura para comandá-la. N passa a vez, Esc cancela.`}>
        <CommandTile
          icon="▸"
          label={encounter.activeActorId ? 'Próximo turno' : 'Começar'}
          hint={`Rodada ${encounter.round} · atalho N`}
          tone="gold"
          onClick={() => void enc.advance()}
          disabled={enc.busy || enc.order.length === 0}
        />
        <CommandTile icon="👹" label="Reforços" hint="Mais monstros do bestiário" tone="danger" onClick={() => setView('add')} />
        <CommandTile
          icon="🏳"
          label="Moral"
          hint={due ? 'Metade caiu: a regra pede o teste' : 'SAB DC 15, quem falha foge'}
          tone={due ? 'gold' : 'default'}
          highlight={due}
          onClick={() => void enc.rollMorale()}
          disabled={enc.busy || !enc.actors.some(a => a.source === 'npc' && !a.defeated)}
        />
        {common}
        {missing && <CommandTile icon="🧍" label="Pôr na trilha" hint="Quem chegou depois" onClick={() => setView('seat')} />}
        <CommandTile icon="🏁" label="Encerrar combate" hint="XP e, se quiser, o tesouro" onClick={() => setView('end')} />
      </CommandGrid>
    )
  }

  const found = crawl.last?.check.encounter === true
  return (
    <CommandGrid idle={found ? 'Algo se aproxima! Monte o encontro com ⚔ Iniciar combate.' : 'Exploração: N passa uma rodada, e a masmorra responde no ritmo do perigo.'}>
      <CommandTile
        icon="⚔"
        label="Iniciar combate"
        hint={found ? 'Algo se aproximou: monte o encontro' : 'Escolha os monstros'}
        tone="danger"
        highlight={found}
        onClick={() => setView('start')}
      />
      <CommandTile icon="🎲" label="Checar encontro" hint={`${crawl.dangerLevel.label}: d6, no 1 algo vem`} onClick={() => crawl.check()} />
      {common}
      <CommandTile icon="💰" label="Tesouro" hint="Moedas, item e XP do achado" tone="gold" onClick={() => setView('treasure')} disabled={seats.length === 0} />
      <CommandTile icon="⛺" label="Acampar" hint="Ração, PV cheio, magias de volta" tone="heal" onClick={() => setView('rest')} disabled={seats.length === 0} />
      <CommandTile icon="△" label="XP para todos" hint="Uma cena que valeu" onClick={() => setView('xp')} disabled={seats.length === 0} />
      <CommandTile icon="📜" label="Recap" hint="O que já aconteceu hoje" onClick={ctl.toggleRecap} />
    </CommandGrid>
  )
}

/** O fim da briga: o XP de cada um e o caminho direto para o baú. */
function EndCombat({
  defeated, busy, onEnd,
}: {
  defeated: number
  busy?: boolean
  onEnd: (xpEach: number, thenTreasure: boolean) => void | Promise<void>
}) {
  // Uma sugestão, não uma regra: em Shadowdark o XP vem sobretudo do tesouro,
  // e o app não sabe o que a mesa acha que aquela luta valeu.
  const [xp, setXp] = useState('0')
  const value = parseAmount(xp)

  return (
    <div className="flex flex-col gap-3">
      <p className="font-body m-0 text-[12px] text-[var(--foreground)]">
        {defeated > 0 ? `${defeated} inimigo${defeated === 1 ? '' : 's'} caiu${defeated === 1 ? '' : 'ram'}. ` : ''}
        Em Shadowdark o XP vem sobretudo do tesouro: dê XP aqui só se a luta valeu por si.
      </p>
      <label className="flex items-center gap-2">
        <span className={LABEL}>XP a cada um</span>
        <Input value={xp} onChange={e => setXp(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} inputMode="numeric" className={cn(FIELD, 'w-14')} />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => void onEnd(value, true)}
          disabled={busy}
          className="font-heading h-10 min-h-10 flex-1 rounded-[1px] border-[var(--chart-1)] text-[10px] font-bold tracking-[0.14em] uppercase"
        >
          🏁 Encerrar e abrir o baú
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void onEnd(value, false)}
          disabled={busy}
          className="font-heading h-10 min-h-10 rounded-[1px] border-[var(--destructive)] px-4 text-[10px] font-bold tracking-[0.14em] text-[var(--destructive)] uppercase"
        >
          Só encerrar
        </Button>
      </div>
    </div>
  )
}
