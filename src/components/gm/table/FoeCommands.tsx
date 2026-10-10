'use client'

import { useState } from 'react'
import type { EncounterActor } from '@/types/encounter.types'
import type { NPC } from '@/types/npc.types'
import { STAT_FULL, STAT_KEYS, STAT_LABELS } from '@/data/stats'
import { rollWithMode, withDc, type RollResult } from '@/lib/dice'
import { FLEEING_ID, isFleeing } from '@/lib/encounterSetup'
import { RollableText } from '@/components/shared/RollableText'
import { RollModeMenu } from '@/components/shared/RollModeMenu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountPad } from './AmountPad'
import { ConditionGrid } from './ConditionGrid'
import type { TableController } from './controller'
import { CommandGrid, CommandTile, FIELD, LABEL, SubView, parseAmount } from './ui'
import { cn } from '@/lib/utils'

type View = 'menu' | 'abilities' | 'check' | 'hp' | 'conditions' | 'edit'

const FLEEING = { id: FLEEING_ID, label: 'Fugindo', description: 'Falhou na moral: quer sair da luta.' }

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

/** O negrito e o itálico do statblock saem: aqui é texto corrido, com dados clicáveis. */
function plain(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
}

/**
 * Os comandos de um monstro na trilha — o turno dele, jogado daqui.
 *
 * Atacar escolhe o alvo clicando no card; as habilidades do statblock vêm com
 * os dados clicáveis; o teste rola o atributo do monstro contra um DC. Tudo o
 * que o Mestre rola aqui nasce escondido da mesa.
 */
export function FoeCommands({ ctl, actor }: { ctl: TableController; actor: EncounterActor }) {
  const [view, setView] = useState<View>('menu')
  const back = () => setView('menu')
  const sheet = ctl.enc.sheetOf(actor)
  const encounter = ctl.enc.encounter
  const myTurn = Boolean(encounter && encounter.activeActorId === actor.id)
  const bonus = actor.atkBonus ?? 0
  const hp = actor.hpCurrent ?? 0
  const max = actor.hpMax ?? hp

  if (view === 'abilities') {
    return (
      <SubView title="Habilidades" onBack={back}>
        <Abilities sheet={sheet} actor={actor} onRoll={ctl.onRoll} />
      </SubView>
    )
  }

  if (view === 'check') {
    return (
      <SubView title="Teste de atributo" onBack={back}>
        <StatCheck actor={actor} sheet={sheet} onRoll={ctl.onRoll} />
      </SubView>
    )
  }

  if (view === 'hp') {
    return (
      <SubView title={`Vida · ${hp}/${max}`} onBack={back}>
        <AmountPad
          actions={[
            { label: '🗡 Dano', tone: 'danger', onApply: n => void ctl.enc.damageActor(actor, n) },
            { label: '✚ Cura', tone: 'heal', onApply: n => void ctl.enc.healActor(actor, n) },
          ]}
        />
      </SubView>
    )
  }

  if (view === 'conditions') {
    return (
      <SubView title="Condições" onBack={back}>
        <ConditionGrid
          active={actor.conditions}
          extra={[FLEEING]}
          onToggle={condition => void ctl.enc.toggleActorCondition(actor, condition)}
        />
      </SubView>
    )
  }

  if (view === 'edit') {
    return (
      <SubView title="Editar na trilha" onBack={back}>
        <ActorEdit
          actor={actor}
          onSave={patch => { void ctl.enc.patchActor(actor, patch); back() }}
        />
      </SubView>
    )
  }

  // ── O menu ────────────────────────────────────────────────────────────────

  const idle = actor.defeated
    ? `${actor.name} caiu. Cura o põe de pé de novo; Tirar da trilha o remove do combate.`
    : myTurn
      ? `Vez de ${actor.name}: ataque, habilidade ou teste. Depois, ▸ Próximo turno.`
      : `Comandos para ${actor.name}. Passe o mouse para ver o que cada um faz.`

  return (
    <CommandGrid idle={idle}>
      <CommandTile
        icon="⚔"
        label="Atacar"
        hint={`${signed(bonus)} · ${actor.damageDie ?? '1d6'}: clique no alvo`}
        tone="danger"
        highlight={myTurn && !actor.defeated}
        disabled={actor.defeated}
        onClick={() => ctl.beginTargeting({ kind: 'attack', attackerId: actor.id, mode: 'normal' })}
      />
      <CommandTile
        icon="✨"
        label="Habilidades"
        hint={sheet ? `${sheet.features.length} no statblock, com dados clicáveis` : 'Sem ficha no bestiário'}
        onClick={() => setView('abilities')}
        disabled={!sheet}
      />
      <CommandTile icon="🎲" label="Teste" hint="Atributo do monstro contra um DC" onClick={() => setView('check')} />
      <CommandTile icon="🗡" label="Dano / Cura" hint={`PV ${hp}/${max}`} tone="danger" onClick={() => setView('hp')} />
      <CommandTile
        icon="⚑"
        label="Condições"
        hint={actor.conditions.length > 0 ? actor.conditions.map(c => c.label).join(', ') : 'Nenhuma em vigor'}
        onClick={() => setView('conditions')}
      />
      <CommandTile
        icon="🏳"
        label={isFleeing(actor) ? 'Voltar à luta' : 'Fugir'}
        hint={isFleeing(actor) ? 'Recobra a coragem' : 'Sai da briga'}
        tone="gold"
        disabled={actor.defeated}
        onClick={() => void ctl.enc.toggleActorCondition(actor, { id: FLEEING.id, label: FLEEING.label })}
      />
      <CommandTile
        icon="🎲"
        label="Iniciativa"
        hint={actor.initiative == null ? 'Ainda não rolou' : `Agora ${actor.initiative}: rolar de novo`}
        onClick={() => void ctl.enc.rollInitiativeFor(actor)}
      />
      <CommandTile icon="✎" label="Editar" hint={`PV, CA (${actor.ac ?? 10}), ataque, dano, iniciativa`} onClick={() => setView('edit')} />
      <CommandTile
        icon="✕"
        label="Tirar da trilha"
        hint="Some do combate"
        onClick={() => {
          if (window.confirm(`Tirar ${actor.name} do combate?`)) {
            ctl.focus(null)
            void ctl.enc.removeActor(actor)
          }
        }}
      />
    </CommandGrid>
  )
}

// ─── Habilidades ──────────────────────────────────────────────────────────────

function Abilities({ sheet, actor, onRoll }: { sheet?: NPC; actor: EncounterActor; onRoll: (r: RollResult) => void }) {
  if (!sheet) {
    return (
      <p className="font-body text-[11px] text-[var(--muted-foreground)] italic">
        {actor.name} entrou sem ficha no bestiário: não há habilidades para mostrar.
      </p>
    )
  }

  const lines: { label: string; text: string }[] = [
    { label: 'Ataque', text: sheet.atkDesc },
    { label: 'Arma', text: sheet.weaponDesc },
    { label: 'Movimento', text: sheet.movement },
    { label: 'Táticas', text: sheet.motives },
  ].filter(l => l.text.trim())

  return (
    <div className="flex max-h-[360px] flex-col gap-2.5 overflow-y-auto pr-1">
      {lines.map(line => (
        <p key={line.label} className="font-body m-0 text-[12px] leading-relaxed text-[var(--foreground)]">
          <span className={cn(LABEL, 'mr-1.5')}>{line.label}</span>
          <RollableText text={plain(line.text)} label={`${actor.name}: ${line.label}`} onRoll={onRoll} />
        </p>
      ))}
      {sheet.features.map((feature, index) => (
        <div key={index} className="border-l-2 border-[var(--border)] pl-2.5">
          <p className="font-heading m-0 text-[11px] tracking-[0.06em] text-[var(--foreground)]">
            {feature.title}
            {feature.tag && <span className="font-body text-[var(--muted-foreground)] italic"> · {feature.tag}</span>}
          </p>
          <p className="font-body m-0 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            <RollableText text={plain(feature.description)} label={`${actor.name}: ${feature.title}`} onRoll={onRoll} />
          </p>
        </div>
      ))}
      {lines.length === 0 && sheet.features.length === 0 && (
        <p className="font-body text-[11px] text-[var(--muted-foreground)] italic">O statblock não traz habilidades.</p>
      )}
    </div>
  )
}

// ─── Teste ────────────────────────────────────────────────────────────────────

/**
 * O monstro resiste ao feitiço, tenta não cair do parapeito, puxa a corrente:
 * d20 mais o modificador do statblock, contra o DC que o Mestre quiser.
 */
function StatCheck({ actor, sheet, onRoll }: { actor: EncounterActor; sheet?: NPC; onRoll: (r: RollResult) => void }) {
  const [dc, setDc] = useState('')
  const [last, setLast] = useState<RollResult | null>(null)
  const target = parseAmount(dc)

  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex items-center gap-2">
        <span className={LABEL}>DC (opcional)</span>
        <Input
          value={dc}
          onChange={e => setDc(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
          inputMode="numeric"
          placeholder="—"
          className={cn(FIELD, 'w-14')}
        />
      </label>
      <div className="grid grid-cols-3 gap-2">
        {STAT_KEYS.map(stat => {
          const mod = sheet?.stats[stat] ?? 0
          return (
            <RollModeMenu
              key={stat}
              label={`${actor.name}: ${STAT_FULL[stat]}`}
              onRoll={mode => {
                const roll = withDc(rollWithMode('d20', `${actor.name}: ${STAT_FULL[stat]}`, STAT_LABELS[stat], mod, mode), target || undefined)
                setLast(roll)
                onRoll(roll)
              }}
            >
              <Button
                type="button"
                variant="outline"
                render={<span />}
                nativeButton={false}
                className="flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-[1px]"
              >
                <span className="font-[var(--font-numeral)] text-lg text-[var(--foreground)]">{signed(mod)}</span>
                <span className="font-heading text-[8px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase">{STAT_LABELS[stat]}</span>
              </Button>
            </RollModeMenu>
          )
        })}
      </div>
      {last && (
        <p className="font-body m-0 text-[12px] text-[var(--foreground)]">
          {last.label}: <span className="font-mono font-bold">{last.total}</span>
          <span className="text-[var(--muted-foreground)]"> (d20 {last.result}{last.modifier ? ` ${signed(last.modifier)}` : ''})</span>
          {last.dc !== undefined && (
            <span className={last.success ? 'text-[var(--chart-2)]' : 'text-[var(--destructive)]'}>
              {' '}· {last.success ? 'sucesso' : 'falha'} vs DC {last.dc}
            </span>
          )}
        </p>
      )}
      {!sheet && (
        <p className="font-body text-[10.5px] text-[var(--muted-foreground)] italic">Sem ficha no bestiário: rola com +0.</p>
      )}
    </div>
  )
}

// ─── Editar ───────────────────────────────────────────────────────────────────

/** Corrigir o palpite do statblock ou impor o que a cena pede. */
function ActorEdit({ actor, onSave }: { actor: EncounterActor; onSave: (patch: Record<string, unknown>) => void }) {
  const [hp, setHp] = useState(String(actor.hpCurrent ?? 0))
  const [hpMax, setHpMax] = useState(String(actor.hpMax ?? actor.hpCurrent ?? 0))
  const [ac, setAc] = useState(String(actor.ac ?? 10))
  const [atk, setAtk] = useState(String(actor.atkBonus ?? 0))
  const [dmg, setDmg] = useState(actor.damageDie ?? '')
  const [init, setInit] = useState(actor.initiative == null ? '' : String(actor.initiative))

  function save() {
    const current = parseAmount(hp)
    const parsedAtk = parseInt(atk, 10)
    const parsedInit = parseInt(init, 10)
    onSave({
      hp_current: current,
      hp_max: Math.max(current, parseAmount(hpMax)),
      ac: parseAmount(ac) || 10,
      atk_bonus: Number.isFinite(parsedAtk) ? parsedAtk : 0,
      damage_die: dmg.trim() || null,
      initiative: Number.isFinite(parsedInit) ? parsedInit : null,
      defeated: current <= 0,
    })
  }

  const field = (label: string, value: string, set: (v: string) => void, width = 'w-16', pattern = /[^0-9]/g) => (
    <label className="flex flex-col gap-1">
      <span className={LABEL}>{label}</span>
      <Input value={value} onChange={e => set(e.target.value.replace(pattern, '').slice(0, 10))} className={cn(FIELD, width)} />
    </label>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2.5">
        {field('PV', hp, setHp)}
        {field('PV máx', hpMax, setHpMax)}
        {field('CA', ac, setAc)}
        {field('ATK', atk, setAtk, 'w-16', /[^0-9+-]/g)}
        {field('Dano', dmg, setDmg, 'w-20', /[^0-9dD+-]/g)}
        {field('Iniciativa', init, setInit)}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={save}
        className="font-heading h-10 min-h-10 rounded-[1px] border-[var(--primary)] text-[10px] font-bold tracking-[0.14em] uppercase"
      >
        Salvar
      </Button>
    </div>
  )
}
