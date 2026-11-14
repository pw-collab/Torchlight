# Torchlight: spec completa para reconstruir do zero

> Uso: cole este documento como prompt para gerar o projeto do zero. Ele descreve
> **o que** o app faz e **quais regras não podem quebrar**. O **como** (stack, layout,
> arquitetura, visual) está aberto para exploração, exceto onde marcado como
> **invariante**. A seção 13 lista onde vale a pena ousar.
>
> Extraído do código em `main` @ `1f2eb82` (nov/2026): `src/`, `supabase/migrations/001..022`,
> `docs/`, `replica/`.

---

## 0. Prompt de abertura (resumo para colar primeiro)

Construa **Torchlight**, um companheiro digital para mesas presenciais de **Shadowdark RPG**
ambientado em **Ravenloft (Terra das Brumas)**, para um grupo privado (1 Mestre e cerca de 6 jogadores).
Não é um VTT com mapa ou grid. É: ficha de personagem interativa com regras automatizadas,
dados 3D com física, inventário com slots e tochas em tempo real, e um painel do Mestre que vê e
age sobre a mesa ao vivo (feed de eventos, turnos, combate sem grid, pedidos de rolagem, handouts).
Login só por Discord com allowlist. Eventos relevantes também vão para um canal do Discord via webhook.
Toda a interface é em **português do Brasil**. Tema escuro, clima de horror gótico à luz de tocha.
Uso principal: celular na mão ou apoiado na mesa (jogador) e notebook (Mestre).

---

## 1. Produto

### 1.1 Loop central
O jogador abre a ficha na mesa, rola dados nela, e o Mestre vê cada rolagem, mudança de PV
e tique da tocha ao vivo numa única tela de sessão, podendo agir sobre qualquer personagem.

### 1.2 Usuários e papéis
| Papel | Quem | Pode |
|---|---|---|
| `player` | Discord ID na allowlist | criar e editar os próprios personagens, entrar numa mesa por código, rolar, ver o elenco da campanha (dados mínimos) |
| `gm` | Discord ID na allowlist com role gm | tudo do player + ler e editar qualquer personagem, criar e conduzir sessões, bestiário, cenas, handouts |
| fora da allowlist | qualquer um | nada; vê erro claro no login |

- A allowlist é gerida fora do app (painel do banco). Sem auto-cadastro.
- **Invariante:** o papel vem da tabela da allowlist, nunca do token. O Discord ID vem da identidade
  OAuth verificada (no Supabase: `auth.identities`), **nunca** de `user_metadata` (editável pelo usuário).

### 1.3 Fora de escopo
Grid, mapa ou canvas; chat in-app; bot do Discord ou slash commands (só webhook de saída);
múltiplas campanhas; UI de allowlist; light mode (opcional numa reconstrução).

---

## 2. Telas e rotas

| ID | Tela | Rota | Para quê |
|---|---|---|---|
| S01 | Landing | `/` | entrada deslogada; logado vai para S03 |
| S02 | Login | `/login`, `/auth/callback` | OAuth Discord; erros `no_discord_id` e "não está na allowlist" |
| S03 | Elenco da campanha | `/home` | todos os personagens da campanha, os meus primeiro; ir para ficha; GM vê link do painel |
| S04 | Criador de personagem | `/character-creator` | wizard de 10 capítulos (seção 5) |
| S05 | Ficha | `/sheet/[id]` | jogar; 4 abas (Atributos, Inventário, Grimório, História) |
| S06 | Modo mesa | toggle na S05 | 4 números gigantes para ler de longe |
| S08 | Editar personagem | `/sheet/[id]/edit` | wizard de edição (mesmos passos, sem rolagens obrigatórias) |
| S09 | Progressão | painel na S05 | trilha nível 1 a 20 |
| S10 | 404 de ficha | `/sheet/[id]` inválido | |
| S11 | Mestre: Sessão | `/gm` aba sessão | a mesa ao vivo (seção 8) |
| S12 | Mestre: Preparo | `/gm` aba cenas | cenas preparadas e handouts |
| S13 | Mestre: NPCs | `/gm` aba bestiário | bestiário com busca, tags, favoritos, importação |
| API | `POST /api/discord` | | relay para o webhook, autenticado |
| API | `GET /api/time` | | relógio do servidor (`{ now }`, sem cache) |

Todas as rotas exceto `/`, `/login`, `/auth/*` e estáticos exigem sessão + allowlist.
Ficha: dono ou GM. `/gm`: só GM.

### Fluxos
- **F01 Login:** S01 → Discord → callback → checa allowlist → S03.
- **F02 Criar:** S03 → S04 (10 passos) → grava → S05.
- **F03 Entrar na mesa:** na S05, digita código de 6 caracteres → vira membro da sessão.
- **F04 Rolar:** atributo, ataque, magia ou dado livre → modo (normal/vantagem/desvantagem) → dado 3D → resultado na ficha + feed do Mestre + Discord.
- **F05 Luz:** acender tocha no inventário → contagem em tempo real derivada do relógio da mesa.
- **F06 Mestre conduz:** cria sessão (código) → jogadores entram → feed → turnos e combate → pedidos, handouts → encerra → recap → Discord.
- **F07 Mestre prepara:** bestiário → cena com NPCs e nota → "iniciar cena" arma o combate.
- **F08 Subir de nível:** XP chega ao limite → nível sobe → rolar recompensas na trilha.

---

## 3. Modelo de dados

Todas as tabelas com chave uuid (exceto allowlist), `created_at timestamptz`, RLS em tudo.
Funções auxiliares de segurança: `auth_discord_id()`, `is_gm()`, `is_session_member(session)`,
`is_session_gm(session)`.

### 3.1 Tabelas
```
allowed_discord_ids  discord_id PK, role ('player'|'gm'), added_at

characters
  id, version (int, incrementado por trigger a cada UPDATE), user_id -> allowlist,
  session_id -> sessions (mesa atual, set null), player_name,
  name, class_id, archetype_id, ancestry_id, level (1..20), xp,
  str, dex, con, int, wis, cha,
  hp_max, hp_current, ac, luck_tokens,
  gold, silver, copper,
  melee_bonus, ranged_bonus, spellcasting_bonus, casting_attr,
  equipment jsonb  (InventoryItem[]),
  spells jsonb     (spell ids),
  talents jsonb    (Talent[]),
  technique_states jsonb (TechniqueState[]),
  level_progress jsonb   (LevelEntry[]),
  conditions jsonb       (ActiveCondition[]),
  languages text[], knowledge_areas jsonb, domain_id, faith,
  background_text, background_details jsonb, relations jsonb, impulses jsonb,
  notes text, portrait_url

sessions
  id, gm_id, name, code (6 chars, único, alfabeto sem O/0/I/1: ABCDEFGHJKLMNPQRSTUVWXYZ23456789),
  active, ended_at, paused_at, clock_shift_seconds
  -- trigger: só uma sessão ativa por GM

session_members   (session_id, character_id) PK, user_id, player_name, joined_at
                  -- um personagem está em no máximo uma mesa

session_events    id, session_id, actor_name, character_id (set null),
                  kind ('roll'|'hp'|'luck'|'xp'|'light'|'note'|'session'|'condition'|'prompt'|'encounter'|'handout'),
                  payload jsonb, visibility ('table'|'gm_only'), created_at
                  -- APPEND-ONLY. Nunca editar nem apagar.

session_turns     session_id PK, acting_key, acting_name, acted text[], updated_at
                  -- escrita só via RPCs

encounters        id, session_id, name, round, pc_initiative (1..6|null), npc_initiative (1..6|null),
                  status ('active'|'ended'), ended_at
encounter_actors  id, encounter_id, source ('pc'|'npc'), ref_id (sem FK), name,
                  hp_current, hp_max, ac, atk_bonus, damage_die  -- só NPC
                  conditions jsonb, defeated, sort_key

npcs              id, gm_id, session_id, name, npc_type, flavor_text, motives, difficulty,
                  hp, ac, atk_desc, weapon_desc, level, movement, alignment,
                  stats jsonb {str..cha como modificadores}, experience, features jsonb [{title,tag,description}],
                  tags text[], favorite
handouts          id, gm_id, title, content (markdown)
scenes            id, gm_id, title, gm_note, npc_ids uuid[], played_at, sort_key
storage: bucket "avatars" (leitura pública, escrita só do dono, só imagem, 5 MB)
```

### 3.2 Tipos JSON (dentro de `characters`)
```ts
InventoryItem {
  id, name, description, slots, quantity,
  type: 'weapon'|'armor'|'gear'|'treasure'|'shield'|'document',
  equipped?, slot?: 'mainHand'|'offHand'|'armor',
  weaponKind?: 'melee'|'ranged', attackBonus?, damageDie?, acBonus?,
  isLight?, lightKind?: 'torch'|'candle'|'lantern', lightMaxMinutes?,
  lightMinutesLeft?,  // minutos guardados no momento de litAt
  isLit?, litAt?: ISO|null,
  cost?, range?, content? (markdown, para documentos)
}
Talent { id, name, origin: 'ancestry'|'class'|'general', description, level?,
         effects?: TalentEffect[], classId?, tableRoll?, choice?, choiceLabel?, pending? }
TalentEffect = {kind:'stat',stat,amount} | {kind:'melee'|'ranged'|'spellcasting'|'ac', amount}
TechniqueState { id, choice?, usesRemaining?, expendedAbilities?: string[] }
  // id especial 'grimoire' guarda magias perdidas em expendedAbilities
LevelEntry { level, hpRoll?, hpDie?, hpGain?, talentId?, talentRoll?, talentDie1?, talentDie2?, talentEffect?, sealedAt? }
ActiveCondition { id, label, note?, appliedBy?, appliedAt?, rounds? }
BackgroundDetails { concept, epithet, alias, hometown, theme, appearance, origin,
                    backstory (md), companions (md), facts: {id,label,value}[] }
Relations { people: {id,name,role,note}[], institutions: {id,name,note}[] }
Impulses { objectives: string[], secrets: string[], flaws: string[], fears: string[] }
```
Linhas antigas trazem formatos legados (equipamento `{itemId, slots}`, impulsos em texto corrido,
família/aliados/rivais em texto). A leitura normaliza; só reescreve quando o jogador salva aquela parte.
Numa reconstrução limpa, pode-se ignorar o legado ou fazer migração única.

### 3.3 Payloads do log (`session_events.payload`)
- `roll`: label, subLabel, die, result, total, modifier, isCritical, isFumble, rolls[], dc, success,
  characterName, promptId (responde a pedido), rerollOf (total anterior, Fortuna), revealOf (revela rolagem secreta), isDamage
- `hp` / `luck` / `xp`: from, to, delta, by ('gm'|'player'), undo?, reason?: 'rest', ration?, spells?
- `light`: action 'lit'|'out', itemName, minutesLeft, by
- `condition`: action 'applied'|'removed', label, conditionId, note, by
- `prompt`: promptId, attribute|null, label, dc, secret?, by:'gm'
- `note`: text, narration? (narração do Mestre vira aviso em todas as fichas)
- `handout`: title, content (o conteúdo viaja no evento), characterName? (nulo = mesa toda)
- `session`: action 'join'|'leave'|'start'|'end'
- `encounter`: action 'start'|'end'|'initiative'|'turn'|'round'|'down'|'attack'|'morale', party, foes, actorName, round, targetName, hit, ac, total, fled[], held[]

### 3.4 Permissões (RLS)
- Allowlist: cada um lê só a própria linha.
- Characters: dono faz CRUD do seu; GM lê, edita e apaga todos.
- **Elenco (`campaign_roster()`)**: função que devolve só `id, name, concept, portrait_url, owner_name, is_own`
  de todos os personagens, para qualquer membro da allowlist. Jogador nunca lê a linha inteira de outro.
- Sessions: GM gerencia as suas; membros leem a sessão em que estão.
- session_members: membros e GM da sessão leem; saída via RPC.
- session_events: membros e GM leem (eventos `gm_only` só o GM); inserção por membros (com o próprio personagem) e GM.
- encounters / encounter_actors: membros leem; só o GM escreve.
- session_turns: membros leem; ninguém escreve direto (só RPCs com lock de linha).
- npcs, handouts, scenes: só o GM dono (`gm_id = auth_discord_id() AND is_gm()`, com WITH CHECK).

### 3.5 RPCs (lógica que precisa ser atômica no servidor)
| RPC | Faz |
|---|---|
| `join_session(code, character_id)` | valida dono, acha sessão ativa pelo código (upper/trim), remove de outra mesa, insere membro, aponta `characters.session_id`, loga `session/join` |
| `leave_session(character_id)` | loga saída, remove membro, limpa `session_id` |
| `character_session(character_id)` | qual mesa o personagem está |
| `close_other_sessions()` / trigger | mantém uma sessão ativa por GM |
| `campaign_roster()` | elenco mínimo (acima) |
| `claim_turn(session, key)` | assume a vez se livre e permitida; pode abrir rodada nova (`wrapped`) |
| `end_turn(session, key)` | encerra a vez; GM pode pular a de outro; fecha a rodada se todos agiram |
| `reset_turns(session)` | GM: nova rodada de exploração |
| `set_party_initiative(encounter, value)` | grava o d6 do grupo; **vale o primeiro**, os seguintes recebem recusa |
| triggers | `bump_character_version`; `sync_pc_actor_defeated` (PC morto ou estável vira `defeated` na trilha); reset dos turnos ao abrir/fechar encontro |

### 3.6 Realtime
Assinaturas: personagem (`characters` por id), sessão, membros, feed (`session_events` por sessão),
encontro e atores, turnos, cenas. Canal de **presença** por sessão: quem está com a ficha aberta agora.
**Requisito:** ao reconectar, refazer fetch (hoje é um ponto fraco conhecido).

---

## 4. Regras do jogo (motor): invariantes

Tudo isso deve viver num **módulo de regras puro, testável, sem UI**, compartilhado por ficha e painel do Mestre.

### 4.1 Atributos e dados
- Modificador = `floor((valor - 10) / 2)`. Siglas: FOR, DES, CON, INT, SAB, CAR.
- Criação: rolar **3d6 seis vezes** e o jogador **distribui** os seis resultados entre os atributos
  (pode trocar; botão "preencher em ordem"). Pode rerrolar o conjunto todo se **nenhum valor passar de 14**.
- d20: **20 natural = crítico** (sempre sucesso), **1 natural = falha crítica** (sempre falha), só quando é um d20 sozinho.
- Vantagem/desvantagem: rola dois d20, guarda o maior/menor. É um **modo**, não bônus. Mostra os dois dados, o descartado esmaecido.
- DC opcional em qualquer rolagem: veredito SUCESSO/FALHA vs DC (DC vazio ou 0 = sem veredito).
- Fórmulas: `NdM±K`, somas (`2d6+1d4`), `d6` vira `1d6`, versátil `1d8/1d10` usa o primeiro.
  Pool livre de dados misturados (até 12 dados).
- Crítico em ataque com arma: **dobra os dados de dano**, não o bônus (`1d8+1` → `2d8+1`). Fumble não rola dano.
- Texto com fórmulas (NPCs, descrições) vira clicável para rolar.

### 4.2 Fortuna (luck tokens)
Começa em 0. Mestre concede e gasta; jogador gasta. Gastar um token **rerrola** a última rolagem
(mesmo modo, mesmo DC, mesmo dano anexado); o feed mostra os dois totais (`rerollOf`).

### 4.3 Carga e inventário
- Slots máximos = `max(FOR, 10)` (+ mod de CON se positivo para quem tem a técnica Hauler, ou equivalente).
- Peso = soma de `slots × quantidade`.
- Moedas: cada 100 moedas (PO+PP+PC) ocupam 1 slot; menos de 100 não pesa.
- Sobrecarga: aviso visual (opcional: pré-marcar desvantagem).
- Equipar em mão principal, mão secundária, armadura. Armas de 2 mãos ("2 Handed" na descrição) ocupam as duas.
- CA = 10 + mod DES; com armadura: CA da armadura (+ mod DES só se a CA base da armadura for < 14);
  escudo soma por cima. Talentos podem somar CA.
- Ataque: d20 + mod FOR (corpo a corpo) ou DES (distância) + bônus da ficha + bônus da arma.
  O resultado oferece rolar o dano em seguida.
- Aparar com escudo: `max(1, mod DES)` d6.
- Itens do tipo `document` têm conteúdo Markdown e abrem num leitor paginado.

### 4.4 Luz (o coração do Shadowdark)
- Cada fonte de luz é um item (tocha 60 min, vela, lanterna).
- **Invariante: o tempo é derivado, nunca "tickado".** Ao acender, grava `litAt` e `lightMinutesLeft`.
  Restante = `guardado - floor((agora_da_mesa - litAt) / 60s)`. Uma escrita ao acender, uma ao apagar.
  Fechar a aba, celular em background ou outro dispositivo leem o mesmo número.
- Apagar guarda os minutos restantes. Guardar (desequipar) apaga. Fonte que zera é apagada na próxima reconciliação.
- Queimando = equipada + acesa + com tempo. A luz do personagem = a fonte acesa com mais tempo.
- Contagem regressiva em segundos para a UI, coerente com os minutos.
- **Relógio único:** todos os dispositivos usam a hora do servidor (offset medido uma vez via `/api/time`).
- **Relógio da masmorra (por sessão):** `agora_da_mesa = (paused_at ?? agora_servidor) + clock_shift_seconds`.
  - Pausar congela a luz de todos. Retomar desconta o tempo parado (shift -= duração da pausa).
  - "+10 min" (turno de exploração) adianta o shift e queima a luz de todos juntos.
  - Mestre pode apagar a luz de alguém ("uma rajada apaga sua tocha").

### 4.5 Vida, morte e condições
- PV: dano e cura digitados (`11` = dano por padrão, `-11`, `+5`, Enter aplica) ou botões.
- **Cair a 0 PV** (estando de pé): condição **Morrendo** com relógio de `max(1, 1d4 + mod CON)` rodadas.
- Na vez de quem está morrendo: d20 puro contra a morte; **só 20 natural** levanta com 1 PV;
  qualquer outro resultado gasta uma rodada; ao zerar, **Morto**.
- Aliado estabiliza com teste de **INT DC 15** → **Estável** (inconsciente, para de morrer).
- Qualquer PV > 0 limpa Morrendo, Estável e Morto (curar morto é decisão do Mestre).
- Morto e Estável estão "fora de combate" (sem vez); Morrendo ainda tem vez (para rolar contra a morte).
- Condições de catálogo (aplicáveis pelo Mestre ou jogador): Cego*, Surdo, Amedrontado*, Envenenado*,
  Atordoado, Contido, Caído, Exausto, Paralisado, Inconsciente, Enfeitiçado, Sangrando, Invisível.
  `*` = impõe desvantagem (a ficha avisa no painel de dados, não decide sozinha).
  Morrendo, Estável, Morto são automáticas (fora do seletor). Mestre pode escrever condição livre.

### 4.6 Descanso
Acampar consome **1 ração** (busca por nome "ração/rações/ration", sem acento) e devolve **todo o PV**,
as magias perdidas, os usos das técnicas e as habilidades gastas (escolhas permanecem). Sem ração, não descansa.
Loga no feed. Mestre pode acampar o grupo todo.

### 4.7 Magia
- DC de conjuração = **10 + círculo** (tier 1 a 5). Rolagem: d20 + mod do atributo de conjuração + bônus de conjuração.
- **Falhou: a magia fica perdida até o próximo descanso** (persistido na ficha). 20 natural sempre conjura.
- Círculo máximo aprendível = um novo círculo a cada 2 níveis, teto 5.
- Tradições: Arcano, Divino, Primal, Bruxaria, Psiônica. Cada classe conjuradora aprende de uma.
  Hoje qualquer personagem pode aprender qualquer magia do catálogo (filtro por tradição é um chip, não trava).
- Psiônica: "Ciências" manifestam com o atributo escrito no título (`[WIS]`), não o atributo da ficha.
  Crítico = "Efeito de Poder", fumble = "Falha Crítica". Esgotada em vez de "Falhou".
- Classes conjuradoras: Wizard (INT, Arcano), Sorcerer (CON, Arcano), Priest (SAB, Divino), Druid (SAB, Primal),
  Witch (CAR, Bruxaria), Psionicist (INT, Psion).

### 4.8 Técnicas de classe (até 4 por classe)
Tipos: `passive` (pode dar modificador derivado de atributo, ex.: Hauler = +mod CON em slots),
`choice` (jogador escolhe atributo, tipo de arma ou texto livre; ex.: Weapon Mastery, Grit),
`limited_use` (N usos, recarrega no descanso), `spell_like` (d20 + atributo vs DC; falhou, gasta até o descanso).
Estado por personagem em `technique_states`.

### 4.9 Talentos
- Cada classe tem uma **tabela 2d6** (faixas como `2`, `3-6`, `7-9`, `10-11`, `12`).
- Nível 1: 1 rolagem de talento (Humano: 2, traço Ambitious). Níveis ímpares rolam de novo.
- Uma linha da tabela pode: aplicar efeito fixo; pedir escolha entre opções; pedir distribuição de pontos
  (ex.: +2 entre atributos, máx. por atributo); pedir uma nota (qual arma, qual armadura); ou mandar
  escolher outra linha da tabela.
- **Invariante: talentos são reversíveis.** Cada talento guarda os efeitos que aplicou; remover ou trocar a
  escolha tira exatamente aquilo. A ficha guarda totais simples (atributos, bônus, CA), então o resto do app
  não precisa conhecer talentos.
- Talento com escolha pendente fica marcado até o jogador escolher.

### 4.10 Progressão (regra da casa)
- Níveis 1 a 20. XP para sair do nível N = **N × 10**.
- Todo nível acima de 1: rola o dado de vida da classe e soma ao PV máximo (**CON não é somado de novo**; conta só na criação).
- Níveis ímpares: rola 2d6 na tabela de talentos.
- Trilha visual de 20 caixas: `sealed` (tudo rolado), `open` (alcançado, com rolagem pendente), `locked`.
  Cada recompensa pode ser desfeita individualmente.
- Commoner (nível 0): sem dado de vida, PV = mod CON.

### 4.11 PV inicial
Dado de vida da classe + mod CON, **mínimo 1**.

### 4.12 Turnos e iniciativa (sem grid)
- A mesa anda em turnos **também na exploração**. Dentro do grupo não há fila: quem vai toca **Assumir a vez**;
  ninguém mais assume até ele tocar **Encerrar a vez**. Rodada passa quando todos de pé agiram (combate)
  ou quando o Mestre passa (exploração).
- **Iniciativa em grupo:** ao abrir o combate o Mestre rola 1d6 pelos dele; o primeiro jogador que tocar rola
  1d6 pelo grupo (só o primeiro vale). Maior age primeiro, o lado inteiro, depois o outro. **Empate: o grupo.**
  A ordem dos lados vale o encontro todo.
- Chaves de vez: `pc:<characterId>` e `npc:<actorId>`.
- Status por ator: acting, ready, waiting, done, out.
- Quem entra no meio (reforço, atrasado) espera a próxima rodada se a vez do lado já passou.
- **O banco é a autoridade** (RPCs com lock); a UI só lê a mesma regra para mostrar o botão certo.

### 4.13 Combate (encontro)
- NPC do bestiário vira **ator** com cópia própria de PV, CA, bônus de ataque e dano (editar o bestiário não cura o goblin).
  Statblock incompleto entra com 1 PV e CA 10.
- Nomes únicos: "Goblin", "Goblin 2", "Goblin 3".
- PC na trilha lê PV e CA da própria ficha (uma verdade só).
- Ataque de NPC: escolhe o alvo, rola, app diz **acertou/errou contra a CA real** e oferece aplicar o dano.
  Bônus e dano extraídos do texto de ATK ("1 espada longa +2 (1d8)") como palpite editável.
- Dano rolado por jogador aparece no feed do Mestre esperando alvo (aplicar com um toque).
- Dano em área: um número, vários alvos.
- **Moral:** acende quando o grupo inimigo perdeu metade, ou o inimigo solitário perdeu metade do PV.
  Teste SAB DC 15 por inimigo; quem falha recebe "Fugindo". Mestre decide se aplica (mortos-vivos etc.).
- Encerrar combate: XP para cada um e atalho para o tesouro.

### 4.14 Exploração (masmorra viva)
- Nível de perigo: Inseguro (checagem a cada 3 rodadas), Arriscado (2), Mortal (1). Estado local do Mestre.
- Checagem: d6, no 1 algo se aproxima. Então rola de uma vez:
  distância d6 (1 Perto, 2-4 Próximo, 5-6 Longe), atividade 2d6 (≤4 Caçando, ≤6 Comendo, ≤8 Construindo/ninho,
  ≤10 Socializando, 11 Montando guarda, 12 Dormindo), reação 2d6 + melhor CAR da mesa
  (≤6 Hostil, ≤8 Desconfiada, 9 Neutra, ≤11 Curiosa, 12+ Amigável).
- Alerta de encontro abre direto "Iniciar combate".

### 4.15 Tesouro e XP
Faixas: Pobre 0 XP, Comum 1, Fabuloso 3, Lendário 10. Entrega de moedas (PO/PP/PC) + item opcional + XP,
para um ou vários. Feed: "30 PO, 5 PP · Cálice de prata".

### 4.16 Escrita concorrente
**Invariante: nenhuma escrita sobrescreve a de outro.** Mestre e jogador editam o mesmo personagem.
- Cada personagem tem `version`. Escritas só aplicam na versão de onde foram calculadas.
- Ações do Mestre recalculam a partir da linha fresca e tentam de novo ("dano 3" calculado sobre o PV atual).
- A ficha enfileira suas escritas; conflito é recusado **visivelmente** (aviso de falha), nunca em silêncio.
- Toda falha de escrita mostra aviso; nada parece salvo quando não foi.

---

## 5. Criador de personagem (S04)

10 capítulos com barra de passos; passos seguintes bloqueados até o atual estar completo; botão "Próximo"
desabilitado sempre diz o que falta. **Rascunho salvo no navegador** a cada mudança (versão do formato;
aviso "rascunho retomado" com opção "Começar do zero"); apagado ao selar.

| # | Capítulo | Conteúdo |
|---|---|---|
| 1.1 | Atributos | 3d6 × 6 com animação, distribuir nos atributos, rerrolar se nada > 14 |
| 1.2 | Classe | baralho de cartas das 17 classes: dado de vida, proficiências, técnicas, texto de lore em 1ª pessoa |
| 1.3 | Arquétipo | cartas filtradas pela classe: conceito, talento, perguntas, conexões, aliados/rivais, kit, gancho |
| 2 | Origem | ancestria (cartas com traços e nível de pária 0-6), domínio de origem (filtrado pela ancestria), idiomas (do domínio + livres conforme regra da ancestria, podendo depender do mod INT), fé |
| 3 | Vida | rola dado de vida + CON, mínimo 1 |
| 4 | Talentos | rolagens 2d6 devidas (1, ou 2 para humano) com escolhas resolvidas na hora |
| 5 | Pertences | equipamento inicial da classe + kit do arquétipo (automáticos) + itens do catálogo; contador de slots ao vivo; CA calculada |
| 6 | Magias | só para conjuradores: escolher do catálogo até o limite, até o círculo permitido |
| 7 | Narrativa | nome, conceito, história (Markdown), impulsos, pessoas; gancho do arquétipo como sugestão |
| 8 | Revisão | prévia completa; selar grava o personagem e a entrada de progressão do nível 1 |

O wizard de edição (S08) reusa os mesmos passos em modo edição: campos numéricos livres, rolagens ilimitadas.

---

## 6. Ficha (S05)

### 6.1 Sempre visível
- Retrato (upload de avatar), escudo de CA, barra de PV com entrada de dano digitada, 6 atributos
  (modificador grande, sigla + valor embaixo; tocar abre normal/vantagem/desvantagem).
- Nome, tags de Classe + nível, Arquétipo, Ancestria.
- Status da tocha (segmentos + relógio mm:ss) no topo.
- Fortuna como fileira de tokens (tocar aceso gasta, apagado devolve).
- XP e nível.
- **Bandeja de dados (dock):** última rolagem + dano encadeado, ataques rápidos, botão da vez,
  d4 d6 d8 d10 d12 e d20 em destaque; montar pool; campo de DC; histórico de rolagens (reabre com rerrolar).
- Condições ativas como chips; "Morrendo" com rodadas e botão "Contra a morte".
- Badge da mesa (entrar por código, sair, nome da sessão, presença).

### 6.2 Abas
- **Atributos:** técnicas de classe como cartas (frente: resumo; verso: regra completa; contadores de uso;
  escolha), talentos em lista com nível e escolha, bônus de combate, trilha de progressão.
- **Inventário:** grade de itens com ícone por tipo, equipar, acender/apagar luz, quantidade, editar,
  remover, adicionar do catálogo ou à mão; slots usados/máximos; moedas; leitor de documentos.
- **Grimório:** a técnica de conjuração da classe + cartas de magia (escola, círculo, DC, resumo; verso com
  texto; Conjurar com modo; estado FALHOU/ESGOTADA; recuperar; esquecer).
- **História:** capa (epíteto, alcunha, conceito, origem/cidade/domínio, fatos com rótulo livre), História em
  Markdown (com quadro de "eventos traumáticos"), Por dentro (o que quer, segredos, falhas, medos em bullets;
  colar texto vira bullets), Pessoas e instituições, Caderno de notas livre, Prateleira de handouts recebidos.

### 6.3 Ao vivo na mesa
- **Banner da vez:** de quem é a vez, rolar a iniciativa do grupo, assumir/encerrar a vez, recusa explicada
  ("Alguém assumiu a vez antes.").
- **Cartão de pedido do Mestre:** "CON DC 12 contra o gás" com botão; a resposta volta com o `promptId`.
  Fica no fluxo da página até ser respondido.
- **Toasts da mesa:** o que o Mestre fez com você (dano, condição, Fortuna), narrações, handouts.
- Botão de descanso com contagem de rações.
- **Modo mesa:** PV, CA, Fortuna e luz em tamanho gigante.
- Live region para leitor de tela anunciando a rolagem mais nova (crítico e fumble em palavras).

### 6.4 Ficha de terceiros
Jogador só abre a própria. GM abre qualquer uma, editável.

---

## 7. Elenco (S03)
Cards de todos os personagens da campanha (nome, conceito, retrato, dono), os meus primeiro,
"criar personagem", GM vê acesso ao painel. Dados vêm da função mínima (3.4).

---

## 8. Painel do Mestre (S11 a S13)

### 8.1 Sessão (S11): uma tela, estilo RPG por turnos
- **Barra do topo:** abas, sessão aberta (nome, código de 6 caracteres para ditar, quem está com a ficha
  aberta, Encerrar).
- **Arena:** linha da rodada (d6 de cada lado, tokens de turno, luz, relógio da masmorra com pausar /
  retomar / +10 min), e o palco com **grupo à esquerda e inimigos à direita** como figuras
  (badge de CA, barra de PV, condições, seta sobre quem age, alvo com retícula, números de dano/cura saltando,
  "caído" afunda, "morrendo" pulsa).
- **Deck (embaixo):** plaqueta do selecionado | comandos | log.
  - **Comandos da mesa (exploração):** Iniciar combate, Checar encontro, Tesouro, Acampar, XP para todos,
    Recap, Pedir rolagem, Narrar, Entregar handout, Dano em área.
  - **Comandos da mesa (combate):** próximo, Reforços (do bestiário), Moral, Pôr na trilha, Encerrar combate.
  - **Comandos de um PC:** Dano/Cura, Fortuna (+/-), XP, Condições, Apagar luz, Pedir teste, Tesouro,
    Assumir/Encerrar/Pular a vez, Pôr na trilha, Contra a morte, Estabilizar, Abrir ficha.
  - **Comandos de um inimigo:** Atacar (escolhe alvo), Dano/Cura, Condições, Teste, Habilidades (texto
    rolável), Agir agora, Encerrar/Pular a vez, Editar, Tirar da trilha.
  - **Log ao vivo:** mais recente no topo; filtros Tudo / Rolagens / Vitalidade / Luz / Encontro / Mesa;
    críticos, quedas e falhas com borda colorida; cada linha em uma frase + detalhe dos dados;
    **desfazer** ajustes de PV/Fortuna/XP (escreve um evento de correção, não apaga);
    revelar rolagem secreta do Mestre.
- Rolagens do Mestre nascem **secretas** (`gm_only`) com opção de revelar.
- **Recap** ao encerrar: quem esteve, críticos e fumbles, quedas, XP ganho, tempo de tocha queimado,
  duração ("1h20"); exclui eventos secretos; botão publicar no Discord (montado no servidor a partir do log).
- Abaixo de 1024px: página rola, linha da rodada gruda no topo, deck vira gaveta com uma aba por coluna.

### 8.2 Preparo (S12)
- **Cenas:** título, nota do Mestre (privada), NPCs vinculados, ordem; não jogadas primeiro.
  "Iniciar cena" cria o combate com esses NPCs e marca `played_at` (pode desmarcar e reusar).
- **Handouts:** gaveta privada (título + Markdown). Entregar a um personagem ou à mesa: vira evento do log
  com o conteúdo junto (continua legível mesmo se o original for apagado) e abre na ficha do jogador.

### 8.3 Bestiário (S13)
CRUD de NPCs; criação colando um statblock em Markdown (parser + formatador inverso); busca por nome, tipo
e tags (sem acento); filtro por tags (união); favoritos da sessão; duplicar ("Goblin (cópia)");
importação em lote (separador `---` ou cada `# ` novo); texto com fórmulas clicável para rolar.

Formato Markdown do statblock:
```
# Nome
Tipo
*texto de ambientação*
**Motivos & Táticas:** ...
## Stats
Difficulty: 12 | HP: 11 | AC: 13 | ATK: 1 espada +2 (1d8) | Weapon: ...
LV: 2 | MV: near | AL: C
FOR: +2 | DES: +1 | CON: +1 | INT: -1 | SAB: +0 | CAR: -1
Experience: ...
## Features
**Título** — Tag. Descrição
```

---

## 9. Integração com Discord
- OAuth Discord via provedor de auth. Callback registrado no provedor, não no app.
- Webhook único para o canal de rolagens. **Invariante:** o navegador nunca escolhe o nome de quem fala;
  o relay resolve o autor pela sessão (cookie). O cliente manda o evento sem `player`.
- Eventos: rolagem (bloco com dado, bônus, total, `✅ SUCESSO`/`❌ FALHA vs DC`, `✨ CRÍTICO!`, `💀 FALHA CRÍTICA!`),
  tocha acesa, tocha quase apagando (< 10 min), tocha apagou, recap.
- Formato de exemplo: `🎲 **Aldric** — Ataque: Espada longa`, `🕯️ [Aldric] Tocha acesa — 60min restantes`.
- Sanitizar menções. Discord limita cerca de 30 msgs/min por webhook: considerar fila com retry (hoje não há).
- O log in-app é a fonte da verdade; Discord é espelho.

---

## 10. Conteúdo do jogo (catálogos estáticos)

Dados versionados no código (não no banco). **Reaproveitar os arquivos de `src/data/` como estão**: são o
conteúdo da campanha, em português, e dão trabalho de redigir. Conteúdo derivado de Shadowdark exige a
licença de terceiros para uso público; para uso do grupo privado, ok.

| Catálogo | Fonte | Conteúdo |
|---|---|---|
| Classes (17) | `src/data/classes/*.ts`, lore em `lore.ts` | Commoner (nível 0), Artificer, Barbarian, Bard, Druid, Fighter, Monk, Paladin, Plague Doctor, Priest, Psionicist, Ranger, Sorcerer, Thief, Warlock, Witch, Wizard. Cada uma: dado de vida, proficiências (texto), até 4 técnicas tipadas, tabela 2d6 de talentos com opções, conjuração opcional, equipamento inicial, texto de lore em 1ª pessoa |
| Ancestrias (10) | `src/data/ancestries/` | Humano (0), Elfo (1), Anão (3), Pequenino (1), Gnomo (3), Tiefling (5), Caliban bruto/bestial/maldito (5), Ressurreto (6). Traços, domínios possíveis, idiomas fixos, regra de idiomas, nível de pária |
| Arquétipos (19) | `src/data/archetypes/` | Alquimista, Anacoreta, Arcabuzeiro, Arcanista, Cavaleiro Errante, Caçador de Monstros, Companheiro Primevo, Detetive, Erudito, Essencialista, Inquisidor, Lutador de Arena, Metafísico, Necromante, Ocultista, Patife, Pirata, Soldado, Voodan. Classes que podem, glifo, talento, perguntas, conexões, kit, gancho |
| Domínios | `src/data/domains/` | Domínios de Ravenloft (Barovia, Darkon, Falkovnia, Lamordia, Mordent...): região, Darklord, descrição, experiências comuns, idiomas, religiões |
| Religiões | `src/data/religions/` | Ezra, Hala, Ordem Eterna, Senhor da Manhã, Loa, Racionalismo... |
| Itens | `src/data/inventory/items.ts` | armas (dano, alcance C/N/F, propriedades), armaduras, escudos, equipamento, fontes de luz, custo |
| Magias (232) | `src/data/spells/catalog.json` | id, nome, círculo, alcance, duração, tempo, descrição, resumo, tradições, escola; inclui 31 poderes psiônicos |
| Condições | `src/data/conditions/` | catálogo da seção 4.5 |
| Opções de talento | `src/data/talentOptions.ts` | construtores: statBoost, attacks, melee, ranged, spellcasting, distribute, fromTable, note, pick |

Arte: ícones de itens em `public/items/`, dados em `public/dice/`, caveira, moldura hexagonal.

---

## 11. Identidade visual atual (referência, livre para reinventar)

- **Tema:** escuro, único. Horror gótico, luz de tocha, papel e brasa. Textura de grão sobre tudo.
- **Paleta (Figma, out/2026):** fundo `#110d0b`, card `#1c1512`, elevado `#2a201c`, popover `#372b27`,
  texto `#ecdbb8`, texto suave `#b0a18f`, primária/brasa `#df7653` (texto sobre ela `#1b1513`),
  contraponto ciano "espírito" `#48b8d2` (botão da vez), destrutivo `#ff6467`, borda de input `#8f796a`.
  Cores por origem: classe = brasa, arquétipo `#9f815d`, ancestria `#8fb4c0`, magia = violeta, conhecida = verdete.
- **Tipografia:** Germania One (títulos e numerais), Libre Franklin (texto e rótulos), Bricolage Grotesque
  (relógio e leituras técnicas).
- **Forma:** cantos retos (raio 0), bordas grossas de "moldura", cartas 3:4 com frente/verso.
- **Movimento:** easing único `cubic-bezier(.4,0,.2,1)`; dados 3D com física (three.js + cannon-es via
  `open-dice-dnd`), centralizados num "palco", câmera que aproxima no crítico e treme no fumble, dado descartado
  esmaece, som de impacto, háptico. Fallback SVG sem WebGL ou com mais de 12 dados.
  **Tudo respeita `prefers-reduced-motion`.**
- **Layout desktop da ficha (Figma 1440×960):** duas metades iguais (personagem à esquerda com trilho de abas,
  retrato, vitais e identidade; técnicas/aba à direita como baralho em 3 colunas) e a bandeja de dados flutuando
  por baixo cruzando as duas. Mobile: barra de abas fixa embaixo com o botão de dados.
- **Acessibilidade:** WCAG AA em todos os pares de cor (contraste já validado), foco visível, primitivos
  acessíveis (Base UI), live region para rolagens. Dívidas: escala tipográfica (muito texto < 10px),
  alvos de toque de 24 a 32px (ideal 44px em celular), breakpoints demais (consolidar em 640/1024/1440).

---

## 12. Requisitos não funcionais
- Celular primeiro para a ficha; notebook para o Mestre.
- Nada depende de aba aberta: tempo derivado de timestamps; sem cron.
- Hora do servidor como referência única.
- Escritas otimistas só com reconciliação por versão; falhas sempre visíveis.
- Log append-only como fonte de feed, histórico, recap, desfazer e pedidos (sem tabela de pendências:
  pedido e resposta são duas linhas ligadas por `promptId`).
- Rolagens são eventos: clique duplo = duas rolagens (correto).
- Segurança: RLS em tudo, funções privilegiadas sem acesso `anon`, `search_path` fixo, nenhum Discord ID no navegador,
  bucket de avatar só imagem.
- Testes: unitários do módulo de regras; E2E (Playwright) dos fluxos: login, identidade, rascunho do criador,
  dados e anúncio, tocha, turnos, edições perdidas, história, talentos; checagem de acessibilidade (axe).
- Stack atual (referência): Next.js 16 App Router (auth no `proxy.ts`), React 19, TypeScript, Tailwind 4,
  shadcn/ui sobre Base UI, Hugeicons, framer-motion, Supabase (Postgres 17, Auth, Realtime, Storage), Vercel.
  Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DISCORD_WEBHOOK_URL`.

---

## 13. Onde explorar (sugestões para a nova versão)

**Arquitetura**
- Motor de regras como pacote isolado e puro (funções de dados, luz, morte, turnos, talentos, progressão),
  com testes de propriedade. UI e servidor só chamam.
- Event sourcing de verdade: hoje o log é append-only mas o estado do personagem é mutado à parte.
  Alternativa: estado derivado de eventos (ou comandos validados no servidor que escrevem estado + evento numa transação).
- Mover ações do Mestre e do jogador para comandos no servidor (RPC/edge/server actions) em vez de escrita direta
  do cliente com controle de versão.
- Normalizar `characters` (45 colunas, 10 jsonb): inventário, talentos, condições em tabelas próprias, ou manter
  documento mas com schema validado (Zod) dos dois lados.
- Refetch ao reconectar o realtime; fila com retry para o Discord.
- Considerar CRDT ou sync engine (ex.: Replicache, Zero, ElectricSQL, Liveblocks) para a mesa ao vivo.
- Gerar tipos do banco automaticamente; migrações via CLI (hoje aplicadas à mão, já houve drift).

**Design e UX**
- Escala tipográfica com piso de 12px (10px para rótulos em caixa alta) e alvos de toque de 44px.
- Repensar a ficha mobile: hoje é a desktop encolhida em abas.
- Painel do Mestre como "mesa de batalha" mais teatral, ou como dashboard denso: testar os dois.
- Modo espectador (TV na mesa mostrando a arena, a luz e o relógio).
- Light mode opcional; tema "pergaminho".

**Funcionalidade que caberia**
- Relógio de tocha compartilhado pelo grupo (a luz é coletiva no Shadowdark).
- Iniciativa e turnos visíveis num segundo dispositivo.
- Histórico de campanha (recaps encadeados), linha do tempo.
- Importar/exportar personagem (JSON/PDF).

---

## 14. Critérios de aceite mínimos (vertical slice)
1. Login Discord bloqueia quem não está na allowlist com mensagem clara.
2. Criar personagem pelos 10 passos, sobreviver a um refresh no meio (rascunho) e cair na ficha.
3. Rolar um atributo com vantagem: dois dados 3D, o descartado esmaecido, veredito vs DC, aparece no feed do Mestre e no Discord com o nome resolvido no servidor.
4. Acender uma tocha, fechar a aba, abrir em outro aparelho: mesmo tempo restante. Mestre pausa: congela para todos.
5. Mestre aplica 3 de dano enquanto o jogador muda o PV: nenhuma das duas escritas se perde.
6. PC cai a 0: entra Morrendo com relógio; 20 natural levanta com 1 PV; estabilizar para o relógio.
7. Combate: Mestre rola o d6, primeiro jogador rola o do grupo (segundo recebe recusa), lados agem na ordem, empate fica com o grupo, só um age por vez.
8. Mestre pede "CON DC 12" para todos; cada ficha mostra o cartão; respostas voltam ao feed comparadas ao DC.
9. Encerrar sessão gera recap sem eventos secretos e publica no Discord.
