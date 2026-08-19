# Torchlight — Plano de Features: QoL de Gameplay e GM Mode Interativo

> Análise do código em `claude/gameplay-features-analysis-9w6wom`, referência: `main` @ `9920b47`.
> Todos os achados abaixo foram verificados no código, com caminho e linha.

-----

## 1. Sumário executivo

O Torchlight já é uma ficha de personagem excelente: criação em wizard, inventário
com slots e fontes de luz, grimório, talentos, técnicas de classe, trilha de progressão
1→20 e um motor de dados com física 3D, vantagem/desvantagem, som e háptico. Isso é a
parte difícil e ela está feita.

O que **não** existe é a *mesa*. O app hoje é um conjunto de fichas monoutilizador que
por acaso compartilham um banco. Três consequências, todas verificáveis:

1. **A sessão é uma entidade morta.** `characters.session_id` nunca é escrito
   (`src/app/character-creator/page.tsx:257-282`), e o painel do GM filtra exatamente
   por esse campo (`src/components/gm/SessionPanel.tsx:27`). O `SessionPanel` — o
   centro do GM mode — está **permanentemente vazio em produção**.
2. **Nada do que acontece na mesa é compartilhado.** Rolagens vivem em memória, por
   cliente, 20 no máximo (`src/app/sheet/CharacterSheetClient.tsx:60-62`). O GM nunca
   vê uma rolagem. O único canal comum é um webhook do Discord de mão única.
3. **O GM não pode agir.** Ele já tem permissão de UPDATE em qualquer personagem
   (`supabase/migrations/008_gm_full_access.sql`), mas a UI é 100% leitura
   (`src/components/gm/PlayerCard.tsx`) — um card que expande para um StatBlock.

Este plano tem duas metades pedidas — **QoL de gameplay** (Eixo A) e **GM mode
interativo** (Eixo B) — mas as duas dependem de uma mesma peça de fundação: transformar
`sessions` numa entidade viva com membros, eventos e presença. É a Fase 1 e destrava
quase tudo que vem depois.

-----

## 2. Mapa do que existe hoje

| Área | Estado | Onde |
|---|---|---|
| Auth Discord + allowlist | ✅ Completo | `middleware`/`allowed_discord_ids` |
| Criação de personagem | ✅ Wizard completo (ancestria, classe, arquétipo, atributos, HP, equip., magias, narrativa, talentos) | `src/app/character-creator/`, `src/components/creator/` |
| Ficha do jogador | ✅ 4 abas + vitals flutuante + retrato + XP | `src/app/sheet/CharacterSheetClient.tsx` |
| Inventário / slots / luz | ✅ Rico (equipar, acender, queimar) | `src/components/sheet/InventoryView.tsx` |
| Motor de dados | ✅ Física 3D + fallback SVG, adv/dis, pools, crítico | `src/lib/dice*.ts`, `src/hooks/useDiceRoll.ts` |
| Progressão 1→20 | ✅ Trilha "battlepass" com rolagens seladas | `src/lib/progression.ts` |
| Roster da campanha | ✅ RPC dedicada com colunas mínimas | `supabase/migrations/013_campaign_roster.sql` |
| NPCs / bestiário | ⚠️ CRUD + parser de Markdown, mas estático e isolado | `src/components/gm/NPC*.tsx` |
| Painel do GM | ❌ Quebrado (ver §3.1) e somente-leitura | `src/components/gm/SessionPanel.tsx` |
| Sessão como entidade | ❌ Só nome + flag `active` | `sessions` |
| Log / feed de mesa | ❌ Inexistente | — |
| Iniciativa / encontro | ❌ Inexistente | — |
| Condições / estados | ❌ Inexistente | — |
| Descanso | ❌ Inexistente | — |
| Presença ("quem está na mesa") | ❌ Inexistente | — |

-----

## 3. Achados que bloqueiam (corrigir antes de construir)

Estes não são features — são defeitos verificados que fazem features existentes não
funcionarem. Todos são pequenos.

### 3.1 `session_id` e `player_name` nunca são gravados — **crítico**

`src/app/character-creator/page.tsx:257-282` monta a `row` de INSERT sem `session_id`
nem `player_name`. Efeitos em cadeia:

- `SessionPanel` (`:27`, `:36`) consulta `.eq('session_id', sessionId)` → sempre zero
  personagens, e o canal Realtime tem filtro `session_id=eq.X` → nunca dispara.
- `campaign_roster()` devolve `owner_name` = `c.player_name` → sempre `null`, então o
  card do roster nunca mostra de quem é o personagem.

**Correção:** ver §4 — a solução certa não é preencher o campo no wizard, é criar um
fluxo de *entrar na sessão*.

### 3.2 A luz só queima com a aba aberta

`src/app/sheet/CharacterSheetClient.tsx:88-105`: um `setInterval` de 60s decrementa
`lightMinutesLeft` e grava o JSONB `equipment` inteiro a cada minuto.

- Fechou a aba, dormiu o celular, entrou em background → **o tempo para**. Em Shadowdark,
  onde a tocha em tempo real *é* o jogo, isso invalida a mecânica.
- Uma escrita por minuto por jogador, do array inteiro, com conflito garantido contra
  qualquer outra edição concorrente do inventário.
- O `PlayerCard` do GM (`src/components/gm/PlayerCard.tsx:22-27`) lê o campo **legado**
  `torch_end_at`, que nada no app escreve desde a migração para luz por item. A coluna
  de tocha do GM mostra `🌑` para todo mundo, sempre.

**Correção:** derivar do relógio de parede. Guardar `litAt` (timestamp) + `minutesAtLit`
no item e calcular o restante na renderização — exatamente o que o `torch_end_at`
original fazia certo. Uma escrita ao acender, uma ao apagar. O GM passa a ver a verdade
sem nenhum trabalho extra.

### 3.3 O campo "DC Alvo" é decorativo

`src/components/sheet/DiceRoller.tsx:71` declara `dc`, `:288-293` renderiza o input —
e **nada consome o valor**. `RollResult` (`src/lib/dice.ts:6-31`) não tem `dc` nem
`success`; `DiscordEvent` (`src/types/discord.types.ts`) também não. O formato de
mensagem original da spec (`SUCESSO vs DC 14`) nunca foi implementado
(`src/lib/discord.ts:6-32`).

O jogador digita a dificuldade, rola, e tem que comparar de cabeça.

**Correção:** `dc?: number` e `success?: boolean` em `RollResult`, propagados ao toast,
ao Discord e (Fase 1) ao feed da mesa. Pequeno, e é a base para as rolagens dirigidas
pelo GM (§6.4).

### 3.4 Divergência de regra nos slots de carga

- `src/lib/slots.ts:2` → `Math.max(str, 10)`, e não multiplica por quantidade.
- `src/components/sheet/InventoryView.tsx:931` → `maxSlots = str`, e multiplica por
  quantidade (`:834`).

O wizard usa o primeiro (via `useSlots`), a ficha em jogo usa o segundo. Um personagem
com FOR 8 tem 10 espaços na criação e 8 na mesa. **Definir a regra em um lugar só**
(`lib/slots.ts`) e fazer o `InventoryView` consumi-la.

### 3.5 RLS dos NPCs não checa quem está chamando — **segurança**

`supabase/migrations/007_npcs_table.sql:26-32`:

```sql
USING ( gm_id IN (SELECT discord_id FROM allowed_discord_ids WHERE role = 'gm') )
```

A cláusula testa a **coluna da linha**, nunca o autenticado. Qualquer usuário logado
lê, edita e apaga as fichas de NPC de qualquer GM — e como é `FOR ALL` sem `WITH CHECK`,
também insere. Os jogadores podem ler o bestiário inteiro da campanha.

**Correção:** `USING (gm_id = public.auth_discord_id() AND public.is_gm())` + um
`WITH CHECK` equivalente.

### 3.6 Código morto

- `src/components/sheet/TorchTimer.tsx` e `src/hooks/useTorch.ts` — zero importações.
- `src/components/sheet/SlotTracker.tsx` — zero importações (o `InventoryView` tem o seu).

Remover junto com §3.2/§3.4 para não deixar duas verdades sobre luz e carga no repo.

### 3.7 O relay do Discord é escrito pelo cliente

`src/lib/discord.ts:34-45` → `POST /api/discord` com o corpo montado no browser
(`src/app/api/discord/route.ts` repassa direto ao webhook). Qualquer jogador com o
devtools aberto publica qualquer mensagem no canal, assinada com o nome que quiser.
Quando o feed de sessão existir (§4), o relay deve sair da linha do banco, no servidor.

-----

## 4. A fundação: a sessão como entidade viva

Quase todas as features dos dois eixos querem a mesma coisa que não existe: **um fluxo
compartilhado de acontecimentos da mesa**. Construir isso uma vez destrava o resto.

### 4.1 `session_members` — a mesa tem elenco

```sql
create table session_members (
  session_id   uuid references sessions(id) on delete cascade,
  character_id uuid references characters(id) on delete cascade,
  user_id      text references allowed_discord_ids(discord_id),
  player_name  text,
  joined_at    timestamptz default now(),
  primary key (session_id, character_id)
);
```

Com um **código de sessão** de 6 caracteres em `sessions` o jogador entra pela ficha
("Entrar na mesa"), em vez de o `session_id` ser adivinhado na criação. Resolve §3.1
sem acoplar criação de personagem a sessão — um personagem sobrevive a várias sessões,
que é como campanhas funcionam.

### 4.2 `session_events` — o log append-only

```sql
create table session_events (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references sessions(id) on delete cascade,
  actor_name   text not null,
  character_id uuid references characters(id) on delete set null,
  kind         text not null,   -- roll | hp | luck | light | condition | note | prompt | encounter
  payload      jsonb not null default '{}',
  visibility   text not null default 'table',  -- table | gm_only
  created_at   timestamptz not null default now()
);
alter publication supabase_realtime add table session_events;
```

Um `RollResult` já é quase o payload pronto. Uma linha por rolagem, dano, cura, tocha
acesa, condição aplicada.

**O que isso entrega de graça:**

- Feed ao vivo para o GM e para os jogadores (§6.2)
- Histórico que sobrevive ao refresh — hoje `rollHistory` some ao recarregar
- Relay do Discord movido para um trigger no banco (corrige §3.7)
- Recap pós-sessão exportável (§5.11)
- Base para "desfazer" (§5.3) e para as rolagens dirigidas (§6.4)

### 4.3 Presença — quem está na mesa agora

O canal Realtime já está aberto em `SessionPanel` e `useCharacter`. Supabase Presence
custa quase nada em cima disso: ponto verde no `PlayerCard`, "3 de 5 aventureiros
presentes" no cabeçalho, e um aviso quando alguém cai no meio do combate.

### 4.4 Sessão precisa poder terminar

`GMPageClient.createSession` (`:66-80`) só insere com `active: true` e nunca desativa a
anterior. Duas sessões ativas ⇒ a página pega a mais recente por `created_at`, e a
antiga fica órfã. Adicionar encerrar sessão (que arquiva e gera o recap).

-----

## 5. Eixo A — QoL de gameplay durante a sessão

Ordenado por (impacto na mesa ÷ esforço). **P** = pequeno, **M** = médio, **G** = grande.

### 5.1 Tocha no relógio de parede + relógio da masmorra — **P** *(depende: §3.2)*
A correção de §3.2 já é a feature: a luz queima com a mesa, não com a aba. Em cima dela,
o botão que falta: **pausar o tempo**. Toda mesa faz pausa para pizza; hoje a tocha
queima durante a pausa. Um `paused_at` em `sessions`, controlado pelo GM, congela a luz
de todo mundo. É a feature de QoL mais pedida em qualquer jogo com timer real.

### 5.2 Gastar Fortuna para rerrolar — **P**
Hoje o token de sorte é um contador (`FortuneTile`, `src/components/sheet/FortuneBar.tsx:22-24`):
clica soma, botão direito subtrai. A regra é *rerrolar*. Quando um `RollResult` assenta,
o toast oferece **"✦ Gastar Fortuna"** → decrementa, rerrola, registra os dois resultados
lado a lado no feed. Transforma bookkeeping manual em um momento de mesa.

### 5.3 Desfazer o último ajuste — **P** *(depende: §4.2)*
O erro mais comum de qualquer VTT é aplicar dano no alvo errado ou digitar 17 em vez de 7.
Com `session_events` gravando o `from`/`to` de cada mudança de HP, um "desfazer" no toast
(janela de ~30s) é quase de graça.

### 5.4 DC que viaja com a rolagem — **P** *(depende: §3.3)*
Fechar §3.3: toast diz **SUCESSO / FALHA vs DC 14**, Discord idem, feed idem. E o
`DiceRoller` guarda o último DC usado em vez de voltar sempre a 14.

### 5.5 Entrada de dano por digitação — **P**
`FloatingVitals:83` só tem `+`/`-` de 1 em 1. Tomar 11 de dano são onze cliques.
Um campo que aceita `-11`, `+5`, `11` (dano por padrão) e Enter. No mobile isso é a
diferença entre usar e não usar o app.

### 5.6 Condições e estados — **M**
Não existe nada hoje. Shadowdark tem uma lista curta, então o modelo certo é enxuto:
um `conditions jsonb` em `characters` com `{ id, label, note?, appliedBy }`. Chips na
ficha, chips no card do GM, e — chave — o GM aplica e remove do painel dele (§6.3).
Uma condição ativa que dá desvantagem pode pré-marcar o toggle no `DiceRoller`.

### 5.7 Descanso — **M**
Não existe fluxo de descanso. Um botão que rola a recuperação da classe, aplica o HP,
consome as rações, avança o relógio da masmorra e registra no feed. Fecha o loop
"explorar → gastar → recuperar" que hoje é feito de cabeça.

### 5.8 Iniciativa — **M** *(compartilhada com §6.5)*
Um botão "Rolar iniciativa" na ficha (d20 + DES) que envia para a ordem da mesa, e a
ficha mostrando **"sua vez"** quando chega. Do lado do GM é a trilha de turnos (§6.5).

### 5.9 Bloco de notas do personagem — **P**
Uma coluna `notes text` e um painel na aba História. Hoje o jogador anota no WhatsApp
o nome do NPC. Sincroniza pelo `useCharacter` que já existe.

### 5.10 Sobrecarga com consequência — **P** *(depende: §3.4)*
Unificada a regra, a sobrecarga deixa de ser um texto vermelho e passa a marcar
desvantagem por padrão nas rolagens afetadas — com opção de ignorar.

### 5.11 Recap da sessão — **M** *(depende: §4.2)*
Ao encerrar a sessão (§4.4), gerar de `session_events` um resumo: rolagens críticas,
quedas, XP ganho, tempo de tocha queimado, quem esteve presente. Publicável no Discord.
É o material que o GM usa para abrir a próxima sessão.

### 5.12 Modo mesa / leitura à distância — **P**
Uma view de números grandes (HP, CA, Fortuna, luz) para quem joga com o celular apoiado
do outro lado da mesa. Reaproveita o `FloatingVitals` com uma escala diferente.

-----

## 6. Eixo B — GM mode interativo

O pedido é "tornar tudo interativo". A boa notícia: **as permissões já existem**
(`characters_update_gm_all`), então boa parte disso é UI sobre plumbing pronto.

### 6.1 Fazer o painel voltar a ter gente — **P** *(depende: §4.1)*
Pré-requisito de tudo. Com `session_members` e código de sessão, o `SessionPanel` mostra
o elenco real. Junto: trocar a leitura de `torch_end_at` no `PlayerCard` pela luz por
item (§3.2) e adicionar presença (§4.3).

### 6.2 Feed ao vivo da mesa — **M** *(depende: §4.2)*
A spec original excluiu "roll history / session log" do escopo, e é exatamente essa
decisão que deixa o GM mode inerte: ele **não vê nada acontecer**. Um painel rolante
com filtros (rolagens / dano / luz / notas), críticos destacados, e a linha do tempo
da sessão. É a feature que muda a natureza do modo GM.

> Recomendação: reverter esse item do escopo original. O Discord não substitui —
> tira o GM do app no meio da mesa.

### 6.3 `PlayerCard` interativo — **M** ⭐ *maior ROI do plano*
Hoje o card é um botão que expande. Com a permissão que já existe, ele vira o painel
de controle da mesa:

- aplicar dano / cura direto no card
- dar e gastar Fortuna
- conceder XP (individual ou para todos)
- aplicar e remover condições (§5.6)
- apagar a luz de alguém ("uma rajada apaga sua tocha")
- abrir a ficha completa em modo edição

Cada ação escreve em `session_events`, então o jogador vê um toast do que o GM fez —
nada acontece em silêncio.

### 6.4 Rolagens dirigidas pelo GM — **M** *(depende: §4.2, §3.3)*
O núcleo do "interativo": o GM **pede**, o jogador **responde**.

> GM: "Todos, CON DC 12 contra o gás" → seleciona o grupo, atributo, DC, envia.
> Chega na ficha de cada jogador como uma rolagem pendente com um botão.
> Ele toca, o motor de dados 3D roda, e o resultado volta para o feed do GM já
> comparado ao DC.

Em lote ou individual, aberta ou secreta. É a feature que faz os dois lados do app
conversarem em tempo real, e reaproveita inteiro o motor de dados existente.

### 6.5 Encontro ao vivo — **G** ⭐ *maior sistema faltante*
Os NPCs hoje são fichas estáticas de consulta. Um **encontro** é o runtime que falta —
e sem grid, exatamente como a filosofia do produto pede:

```
encounters       (id, session_id, name, round, active_index, status)
encounter_actors (id, encounter_id, source: 'pc'|'npc', ref_id, name,
                  hp_current, hp_max, ac, initiative, conditions jsonb)
```

- GM joga NPCs do bestiário no encontro; cada um ganha HP corrente próprio
  (dá para ter 3 goblins do mesmo statblock com vidas diferentes)
- PCs entram pela iniciativa que rolaram (§5.8)
- Trilha de turnos ordenada, avançar rodada, destaque do turno atual
- Jogadores veem de quem é a vez e um sinal de "sua vez"
- Ao encerrar: XP calculado e distribuído

### 6.6 Ataque de NPC contra a CA real — **P** *(depende: §6.5)*
O `NPCCard` já tem texto rolável (`RollableText` + `injectDiceSpans`). Falta o alvo:
escolher um PC vivo da sessão, rolar, e o app dizer **acertou/errou** contra a CA dele —
e oferecer aplicar o dano. Elimina a maior fricção de rodar combate.

### 6.7 Rolagem secreta do GM com revelação — **P** *(depende: §4.2)*
GM rola escondido (`visibility: 'gm_only'`), decide se revela. Hoje a rolagem do GM só
faz um toast local (`GMPageClient:41`, `:414`) e morre ali.

### 6.8 Handouts e revelações — **M**
Já existe metade: itens do tipo `document` com `content` em Markdown e um
`BookViewerModal` paginado (`src/components/sheet/BookViewerModal.tsx`). Falta o
empurrão: o GM entrega um documento a um personagem ou à mesa inteira, e ele abre na
tela do jogador. Carta, mapa em texto, página de diário — o prop chega na hora certa.

### 6.9 Controle do relógio da masmorra — **M** *(depende: §5.1)*
Painel do GM com: pausar/retomar o tempo de todos, `+10 min` (turno de exploração),
"a tocha de todos queima 10 minutos", apagar tudo (a escuridão desce). Em Shadowdark
o tempo é um instrumento do GM — hoje ele não tem o botão.

### 6.10 Bestiário de verdade — **M**
Hoje é uma lista plana por GM. Adicionar: busca, tags, duplicar (para variantes),
importar em lote pelo parser de Markdown que já existe, e marcar favoritos de sessão.
Junto, corrigir a RLS (§3.5).

### 6.11 Cenas preparadas → reveladas — **M**
Uma aba de preparo: cenas com nota do GM, NPCs vinculados, encontro pronto para iniciar.
Durante a sessão, "iniciar cena" arma o encontro e libera o que for do jogador. Conecta
a preparação (que hoje mora fora do app) ao jogo.

### 6.12 Ficha do jogador editável pelo GM — **P**
A permissão existe; a UI não. "Abrir ficha" no card deve abrir a ficha real, editável,
para corrigir o que o jogador errou sem pedir para ele mexer no meio da cena.

-----

## 7. Roadmap

### Fase 0 — Reparos *(1 sprint curta)*
§3.1 · §3.2 · §3.3 · §3.4 · §3.5 · §3.6 · §3.7

Sem isso o GM mode continua vazio e a tocha continua mentindo. Nada aqui é feature nova;
é fazer o que já foi construído voltar a funcionar.

### Fase 1 — A espinha *(a fase que transforma o produto)*
§4.1 membros + código de sessão · §4.2 `session_events` · §4.3 presença · §4.4 encerrar
→ §6.1 painel povoado · §6.2 feed ao vivo · §6.3 **PlayerCard interativo**

Ao fim da Fase 1 o GM abre o painel e **vê a mesa acontecendo**, e consegue agir sobre ela.

### Fase 2 — Interatividade dirigida
§6.4 rolagens dirigidas · §5.2 Fortuna rerrola · §5.4 DC · §5.5 dano digitado ·
§5.3 desfazer · §5.6 condições · §5.7 descanso · §6.7 rolagem secreta · §6.12 ficha editável

O GM pede, o jogador responde, o resultado volta. O loop fecha.

### Fase 3 — Encontros
§6.5 encontro ao vivo · §5.8 iniciativa · §6.6 ataque contra CA · §5.1/§6.9 relógio da
masmorra · §5.10 sobrecarga

O sistema de combate que falta, sem grid — coerente com o produto.

### Fase 4 — Mesa e memória
§6.8 handouts · §6.11 cenas · §6.10 bestiário · §5.9 notas · §5.11 recap · §5.12 modo mesa

-----

## 8. Anexo — dívida técnica encontrada

| # | Item | Arquivo |
|---|---|---|
| 1 | `session_id` / `player_name` nunca gravados | `src/app/character-creator/page.tsx:257-282` |
| 2 | Queima de luz depende da aba aberta; grava JSONB inteiro a cada 60s | `src/app/sheet/CharacterSheetClient.tsx:88-105` |
| 3 | `PlayerCard` lê `torch_end_at` legado, que ninguém escreve | `src/components/gm/PlayerCard.tsx:22-27` |
| 4 | `dc` declarado e renderizado, nunca consumido | `src/components/sheet/DiceRoller.tsx:71,288-293` |
| 5 | Regra de slots divergente entre criação e jogo | `src/lib/slots.ts:2` vs `InventoryView.tsx:931` |
| 6 | RLS de `npcs` não checa o autenticado | `supabase/migrations/007_npcs_table.sql:26-32` |
| 7 | `TorchTimer.tsx`, `useTorch.ts`, `SlotTracker.tsx` sem importações | — |
| 8 | Payload do Discord montado no cliente | `src/lib/discord.ts:34-45` |
| 9 | `createSession` não desativa a sessão anterior | `src/app/gm/GMPageClient.tsx:66-80` |
| 10 | `npcs` e `sessions` fora da publicação Realtime | `supabase/migrations/001_initial.sql:136` |
