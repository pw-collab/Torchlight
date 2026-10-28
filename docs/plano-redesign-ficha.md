# Plano: redesign da ficha (layout e tokens)

Fonte: Figma `Playground`, frame `137:556` (a ficha exportada de torchlight-nine.vercel.app e ajustada à mão), 1440 x 960.
Base de código: `main` em 27a6e17.

Este documento não muda código. Ele lê o auto-layout do Figma, compara com o que roda hoje e propõe a ordem de implementação.

---

## 1. Resumo

Três mudanças grandes, nessa ordem de impacto:

1. **Paleta.** Sai o cinza-azulado frio com vermelho (`#090b0c`, `#161b1d`, `#9f0712`) e entra uma paleta marrom quente com brasa (`#110d0b`, `#1c1512`, `#df7653`) e um ciano de contraponto (`#48b8d2`). Os tokens são globais, então isso repinta o app inteiro, não só a ficha.
2. **Tipografia.** Os títulos e números passam de Bricolage Grotesque 800 para **Germania One**. Libre Franklin segue no texto corrido. Bricolage fica só nos rótulos técnicos (relógio da tocha, "Voltar").
3. **Arquitetura da ficha.** Hoje: sinais vitais + dock empilhados à esquerda, trilho de abas no meio, painel da aba à direita. No Figma: **duas metades iguais** (personagem à esquerda, técnicas à direita) e o **dock vira uma bandeja flutuante** que cruza as duas metades por baixo.

---

## 2. Leitura do auto-layout no Figma

### 2.1 Árvore (só o que está visível)

```
Frame 1440x960 · VERTICAL · fill bg-sunken
├─ Header · HORIZONTAL · h 72 · pad 8 · main CENTER
│  ├─ Container · VERTICAL · fill · max-w 1440 · pad 0 48 · cross CENTER
│  │  └─ TorchStatus · HORIZONTAL · w 250 fixo · gap 4
│  │     ├─ ícone tocha 24
│  │     ├─ Progress · HORIZONTAL · gap 2 · fill → 4 segmentos fill, h 14, cor ember
│  │     └─ "59:25" · Bricolage Bold 14 · tracking 1.12px · muted-foreground
│  └─ Voltar (ABSOLUTE, esquerda) · HORIZONTAL · gap 9
│     ├─ Avatar caveira 52x52 · pad 6 · radius 999
│     └─ "‹ VOLTAR" · Bricolage Medium 12 · uppercase · tracking 1.36px
│
└─ Conteúdo · GRID 10 col x 8 lin (todas FLEX 1fr) · gap 24 · pad 16 48 48 48 · max-w 1440
   ├─ Ficha (col 1-5, lin 1-7) · HORIZONTAL · gap 24 · pad 24 · fill bg-base · stroke 4 OUTSIDE border-outline
   │  ├─ Trilho de abas · VERTICAL · gap 8 · hug
   │  │  └─ 4 botões 64x64 (Atributos, Inventário, Grimório, História), ícone 32
   │  ├─ Coluna vitais · VERTICAL · gap 16 · fill (≈250) · clip
   │  │  ├─ Retrato · h 292 fixo · imagem FILL
   │  │  │  └─ Escudo CA (ABSOLUTE, canto sup. dir., 52x52) · ember + Germania 24
   │  │  ├─ HP bar · HORIZONTAL · pad 8 12 · SPACE_BETWEEN · bg-raised · stroke 2 border-frame
   │  │  ├─ Divider (linha + caveira + linha)
   │  │  ├─ Atributos · GRID 3x2 · gap 4 · células 56 de altura
   │  │  └─ Divider
   │  └─ Coluna identidade · VERTICAL · gap 24 · fill (≈250)
   │     ├─ Nome · Germania 48
   │     ├─ Tags · VERTICAL gap 6 → linha [Classe Nv III] [Arquétipo] / linha [Ancestralidade]
   │     ├─ Divider
   │     └─ Talentos · VERTICAL gap 16 · fill
   │        ├─ "Talentos" · Germania 18
   │        └─ lista · VERTICAL gap 6 → Talent list item
   │
   ├─ Técnicas (col 6-10, lin 1-7) · VERTICAL · fill bg-base · stroke 4 OUTSIDE border-outline · clip
   │  ├─ Cabeçalho · HORIZONTAL · pad 24 24 0 24 · SPACE_BETWEEN
   │  │  ├─ "Técnicas" · Germania 24
   │  │  └─ Botão 157x32 (OCULTO no Figma)
   │  └─ Deck · GRID 3 col FLEX x linhas HUG · gap 16 · pad 24 · clip
   │     ├─ Button card x N (proporção 3:4)
   │     └─ Overflow Shadow (ABSOLUTE, base, h 56, gradiente)
   │
   └─ Dock (ABSOLUTE) · col 2-9 (x 185, w 1070) · ancorado na base do grid · h 146
      · GRID 10 col x 2 lin · gap 12 · pad 12 · fill bg-raised · stroke 2 border-frame
      ├─ col 1-2, lin 1 · Result card (última rolagem)
      ├─ col 1-2, lin 2 · ↳ Result card "Dano" (rolagem encadeada)
      ├─ col 3-5 · VAZIO no Figma → turno + pedidos do Mestre (§7.1)
      ├─ col 6-7, lin 1 · Botão Muted ícone espada (ataques)
      ├─ col 6-7, lin 2 · Botão Secondary "TURNO" (ciano)
      ├─ col 8-10, lin 1 · D4 · D6 · D8 (Outline)
      └─ col 8-10, lin 2 · D10 · D12 · Botão Primary ícone d20 (brasa)
```

### 2.2 Medidas que importam

| Medida | Valor | Observação |
|---|---|---|
| Largura útil | 1440 - 2x48 = 1344 | igual a hoje |
| Coluna do grid | 112,8 px | (1344 - 9x24) / 10 |
| Linha do grid (tela de 960) | 82 px | (888 - 16 - 48 - 7x24) / 8 |
| Ficha / Técnicas | 660 x 718 cada | 5 colunas cada, linhas 1 a 7 |
| Dock | 1070 x 146 | 8 colunas (2 a 9), base em 840 |
| Sobreposição dock x painéis | 40 px | painéis acabam em y 734, dock começa em 694 |
| Header | 72 px | hoje o AppShell tem 80 |

### 2.3 Componentes do Figma

| Componente Figma | Variantes / props | Equivalente no código |
|---|---|---|
| `Button` (64:849) | Style: Primary, Outline, Muted, Secondary · Type: Label, Icon · slot de ícone | `src/components/ui/button.tsx` (o comentário já cita 64-849) |
| `Button card` (80:491) | Tipo: Passivo, Ativo · Show Uses · slot Uses | `src/components/shared/GlyphCard.tsx` + `ClassPanel.tsx` |
| `Result card` (251:914) | Modo: Vantagem, Desvantagem, Normal, Dano | `src/components/sheet/RollCard.tsx` |
| `HP bar` (250:1017) | nenhuma | bloco de HP em `FloatingVitals.tsx` |
| `Attribute Button` (181:625) | nenhuma | tile de atributo em `FloatingVitals.tsx` |
| `Talent list item` (182:1106) | nenhuma | linha em `TalentsPanel.tsx` |
| `Divider` (250:1233) | nenhuma | novo (hoje `OrnateTitle` faz algo parecido) |
| `Character Tag` | ícone + texto 8px | chip de tipo nos cards e no Result card |

---

## 3. Layout: hoje x Figma

### 3.1 Desenho

```
HOJE (desktop ≥ 1100)                       FIGMA
┌──────────┬─┬────────────────────┐         ┌──────────────┬──────────────┐
│ vitals   │ │                    │         │▌ │vit │ nome  │  Técnicas    │
│ c1-2     │r│  painel da aba     │         │▌ │    │ tags  │  ┌──┐┌──┐┌──┐│
│ l1-4     │a│  c4-10, l1-7       │         │▌ │ HP │ ───── │  └──┘└──┘└──┘│
├──────────┤i│  (Atributos =      │         │  │attr│Talento│  ┌──┐┌──┐    │
│ dock     │l│   técnicas +       │         │  │    │       │  └──┘└──┘    │
│ c1-2     │ │   talentos)        │         └──┼────┴───────┴──────────┼───┘
│ l5-8     │ │                    │            │ rolagem │   │atq│d4 d6 d8│
└──────────┴─┴────────────────────┘            │ ↳ dano  │   │trn│d10 d12●│
                                               └─────────────────────────┘
```

### 3.2 O que muda, peça por peça

| Peça | Hoje | Figma | Impacto |
|---|---|---|---|
| Grid | 10x8, gap 24, pad 32 48 48 | 10x8, gap 24, pad 16 48 48 | só o topo (o header encolhe 8px) |
| Vitals | bloco próprio, col 1-2 | coluna dentro do card da Ficha | `FloatingVitals` perde a moldura própria |
| Trilho de abas | coluna 3 do grid, com régua | dentro do card da Ficha, à esquerda | `TabRail` sai de `.sheet-rail` |
| Nome + tags | cabeçalho do `ClassPanel` (só na aba Atributos) | coluna identidade (muda com a aba, §7.1) | sai do `ClassPanel` |
| Talentos | 4ª coluna do painel Atributos | coluna identidade, na aba Atributos | sai de `.attr-panel` |
| Equipados + bônus | dentro do `InventoryView` | coluna identidade, na aba Inventário | sai do `InventoryView` |
| Condições | faixa de estado no dock | 1ª coluna da Ficha, abaixo dos atributos | `ConditionChips` muda de lugar |
| Painel da aba | col 4-10 | col 6-10 (metade direita) | cabe 3 cards de técnica, não 3 + talentos |
| Dock | card na col 1-2, l 5-8, com faixa de estado + histórico + 3 botões | bandeja flutuante col 2-9 por cima da base dos painéis | maior mudança de comportamento |
| Dados | `DiceRoller` abre popover | D4 a D12 diretos: esquerdo rola, direito soma 1 (§7.1) | `DiceRoller` ganha modo "teclado" |
| Turno | botões dentro do `TurnBanner` | botão fixo: "Iniciar turno" / "Encerrar turno" | `TurnBanner` encolhe |
| Histórico | lista rolável (`RollHistory`) | só a última; hover mostra as anteriores como balões, sem fundo | `RollHistory` vira pilha flutuante |
| Editar | link no `TabRail` | botão Muted com ícone, no pé do trilho, sempre visível | `TabRail` ganha pé |
| TorchStatus | alinhado à coluna 1 | centralizado no header | `.app-header-center__box` simplifica |
| Bordas de painel | 1px `--border` | 4px por fora `border-outline` | usar `outline`, não `border` |

### 3.3 Como traduzir em CSS

```css
.sheet-grid {
  grid-template-columns: repeat(10, minmax(0, 1fr));
  grid-template-rows: minmax(0, 1fr) auto;   /* painéis | dock */
  column-gap: 24px;
  padding: 16px 48px 48px;
  height: calc(100dvh - 72px - var(--safe-top));
}
.sheet-card   { grid-area: 1 / 1 / 2 / 6; }
.sheet-panel  { grid-area: 1 / 6 / 2 / 11; }
.sheet-dock   { grid-area: 2 / 2 / 3 / 10;
                margin-top: calc(-1 * var(--dock-overlap)); /* 40px */
                z-index: 1; }
.sheet-card, .sheet-panel {
  outline: 4px solid var(--border);  /* = stroke OUTSIDE: não come espaço */
  background: var(--bg-base);
}
```

Notas:

- **Duas linhas em vez de oito.** As 8 linhas FLEX do Figma só servem para os painéis terminarem na linha 7 e o dock ocupar a 8. Com `1fr auto` e margem negativa no dock, a sobreposição fica fixa em 40px em qualquer altura de tela. Com 8 linhas flexíveis ela varia (some em telas altas).
- **Scroll dentro do painel, não no painel.** O `outline` precisa ficar no elemento externo; quem rola é um filho. O `padding-bottom` desse filho tem que ser `var(--dock-overlap) + 24px` para o último card sair de baixo do dock.
- **Fade.** O "Overflow Shadow" de 56px é o mesmo `mask-image` que `.attr-panel__deck` já usa. Reaproveitar.
- **Colunas internas da Ficha.** `display: flex; gap: 24px; padding: 24px`: trilho `flex: none`, vitais e identidade `flex: 1 1 0; min-width: 0`.

---

## 4. Tokens

### 4.1 O que existe no Figma

Uma coleção `Theme`, um modo `Dark`, 36 variáveis de cor. Nenhum estilo de texto, de efeito ou de cor. Nenhuma variável de espaço ou raio.

### 4.2 Proposta de mapeamento

Princípio: **o nome shadcn continua sendo o que os componentes usam** (são ~2000 usos de `bg-card`, `text-muted-foreground` etc.). Os nomes do Figma entram como variáveis próprias e os nomes shadcn passam a apontar para eles. Assim o Figma vira a fonte da verdade sem reescrever o app.

| Papel | Var Figma | Hex | Var no código | Hoje | Nota |
|---|---|---|---|---|---|
| Fundo da página | `bg-sunken` | #110d0b | `--background` → `var(--bg-sunken)` | #090b0c | |
| Superfície de painel | `bg-base` | #1c1512 | `--card`, `--sidebar` → `var(--bg-base)` | #161b1d | ver conflito A |
| Superfície elevada | `bg-raised` | #2a201c | **nova** `--bg-raised` | | HP, atributos, dock |
| Superfície flutuante | `bg-panel` | #372b27 | `--popover` → `var(--bg-panel)` | #161b1d | não usada no frame |
| Texto | `foreground` | #ecdbb8 | `--foreground` | #f9fbfb | |
| Texto secundário | `muted-foreground` | #b0a18f | `--muted-foreground` | #9ca8ab | |
| Superfície discreta | `muted` | #2d221f | `--muted` | #22292b | card passivo, botões |
| Destaque / selecionado | `accent` (= `card`) | #6e564e | `--accent` | vermelho | ver conflito B |
| Ação principal | `ember` | #df7653 | `--primary` → `var(--ember)` | #9f0712 | |
| Texto sobre ação | `ember-foreground` | #1b1513 | `--primary-foreground` | #fef2f2 | |
| Vermelho como texto | `ember` | #df7653 | `--primary-text` → `var(--ember)` | #e4574e | passa a 5,9:1, o token pode virar alias |
| Ação secundária | `spirit` | #48b8d2 | **nova** `--spirit` | | ver conflito C |
| Texto sobre spirit | `spirit-foreground` | #131a1b | **nova** `--spirit-foreground` | | |
| Erro | `destructive` | #ff6467 | `--destructive` | #ff6467 | sem mudança |
| Régua / moldura | `border-outline` | #53433c | `--border` | branco 10% | |
| Traço de tinta | `border-frame` | #110d0b | **nova** `--border-frame` | | contorno escuro de controles |
| Borda de controle | `border-control` | #8f796a | `--input-border` | branco 36% | 4,4:1 sobre bg-base |
| Preenchimento de campo | `input` | #f2a288 @ 15% | `--input` | branco 15% | |
| Aba ativa | `sidebar-primary` | #df7653 | `--sidebar-primary` | | já é ember |
| Classe | `class` / `-foreground` | #df7653 / #34140a | **novas** | | |
| Arquétipo | `archetype` / `-foreground` | #9f815d / #201a13 | **novas** | | |
| Ancestralidade | `ancestry` / `-foreground` | #8fb4c0 / #182e34 | **novas** | | |
| Tocha | (hex solto) | #df7653 | `--torch` → `var(--ember)` | #fb9e31 | hoje é laranja próprio |
| Foco | (não existe) | | `--ring` → `var(--foreground)` | #d0d6d8 | proposta, ver §4.5 |

Cada nova var entra também no `@theme inline` (`--color-bg-raised`, `--color-spirit`, `--color-border-frame`, `--color-class` ...) para virar utilitário Tailwind.

### 4.3 Conflitos de nome

- **A. `card`.** No código, `--card` é a superfície de painel (115 usos). No Figma, `card` (#6e564e) é a superfície de item em destaque (Result card, técnica ativa) e tem o mesmo valor de `accent`. Recomendação: no Figma, apagar `card` e usar `accent`; no código, `--card` aponta para `bg-base`.
- **B. `accent`.** No código, `--accent` hoje é o mesmo vermelho do primary (67 usos). No shadcn, `accent` é o fundo de hover e de item selecionado, que é exatamente o papel do #6e564e no Figma. Trocar o valor deixa o hover de menus e dropdowns marrom, o que é desejável. Auditar os usos que contavam com o vermelho.
- **C. `secondary`.** No código, `--secondary` é uma superfície neutra (65 usos, inclusive a variante `secondary` do botão, "o botão escuro com régua dourada"). No Figma, o botão "Secondary" é o ciano `spirit`. Recomendação: **não** jogar o ciano em `--secondary`; criar `--spirit` e uma variante de botão `spirit`, e apontar `--secondary` para `muted`.

### 4.4 Restos da paleta antiga dentro do Figma

Estas variáveis do Figma ainda têm valores da paleta fria e precisam de versão quente:

| Var | Valor no Figma | Proposta |
|---|---|---|
| `popover` / `popover-foreground` | #161b1d / #f9fbfb | `bg-panel` / `foreground` |
| `chart-1` a `chart-5` | cinzas azulados | #d9c7a3, #b0a18f, #6e564e, #53433c, #2d221f |
| `sidebar-accent` / `-foreground` | #22292b / #f9fbfb | `muted` / `foreground` |
| `sidebar-ring` | #67787c | `border-control` |

`chart-1` e `chart-2` têm 93 usos no código (brilho dourado, barras). Vale conferir cada um depois da troca.

Também há cores soltas, sem variável: ícone e segmentos da tocha (#df7653), ícone ↳ (#ecdbb8), caveira do avatar (#b0a28f, #1f1713). Ligar a variáveis.

Pares quase idênticos que podem virar alias: `card-foreground` e `accent-foreground` (#ecd9b7) com `foreground` (#ecdbb8); `class` com `ember`; `border-frame` com `bg-sunken`.

### 4.5 Contraste (WCAG)

Calculado sobre os hex do Figma:

| Par | Razão | Situação |
|---|---|---|
| foreground / bg-base | 13,2 | ok |
| muted-foreground / bg-base | 7,2 | ok |
| muted-foreground / muted | 6,1 | ok |
| ember / bg-base | 5,9 | ok (texto em brasa liberado) |
| ember-foreground / ember | 5,9 | ok |
| spirit-foreground / spirit | 7,6 | ok |
| archetype-foreground / archetype | 4,7 | ok |
| card-foreground / card | 4,9 | ok |
| border-control / bg-base | 4,4 | ok para borda (≥ 3) |
| **muted-foreground / card** | **2,7** | **falha**: "Ataque · 1d20+7" no Result card |
| **ember / card** | **2,2** | **falha**: dado escolhido ("14") no Result card |
| **border-outline como texto / bg-sunken** | **2,1** | **falha**: "VOLTAR" no header |
| border-outline / bg-base | 1,9 | ok só porque é decorativo (moldura, divider) |

Correções sugeridas:
- Result card: meta em `card-foreground` com opacidade 80%, ou fundo do card em `muted`.
- Dado escolhido: `foreground` com sublinhado em brasa, ou fundo do card mais escuro.
- "Voltar": `muted-foreground` (7,2:1).
- Texto de 8px nos chips: passa no contraste mas é pequeno demais para leitura. Subir para 10px.
- Foco: o Figma não define. `--ring` = `foreground` dá 13:1 sobre o fundo e se distingue do `border-control`.

Atualizar `replica/design/tokens.json` com os novos hex e rodar `python3 replica/design/contrast.py replica/design/tokens.json`.

### 4.6 Tipografia

Escala lida do frame:

| Papel | Família | Tam. | Entrelinha | Extra | Onde |
|---|---|---|---|---|---|
| display-xl | Germania One | 48 | 120% | | nome, HP atual |
| display-lg | Germania One | 28 | 100% | | modificador, total da rolagem |
| display-md | Germania One | 24 | 120% | | título de painel, HP máx, CA |
| display-sm | Germania One | 18 | auto | | "Talentos" |
| title | Germania One | 16 | 100 a 120% | uppercase | título de card, nome da rolagem |
| button | Libre Franklin Bold | 16 | 120% | uppercase | rótulo de botão |
| tag | Libre Franklin SemiBold | 14 | auto | | classe, arquétipo, ancestralidade |
| body | Libre Franklin Regular | 12 | 150% | | descrição de técnica |
| caption | Libre Franklin Regular / Italic / Medium | 10 | 120 a 150% | tracking 1,2px nos rótulos | atributos, talentos, meta da rolagem |
| micro | Libre Franklin SemiBold | 8 | 125% | uppercase | chips (subir para 10) |
| clock | Bricolage Grotesque Bold | 14 | auto | tracking 1,12px | relógio da tocha |
| nav-label | Bricolage Grotesque Medium | 12 | auto | uppercase, tracking 1,36px | "Voltar" |

Mudanças no código:
- `layout.tsx`: adicionar `Germania+One` ao link do Google Fonts. Bricolage hoje está travada em `wght@800`; o Figma usa 500 e 700, então trocar por `wght@500..800`. Grenze só aparece no "‹" e pode sair (usar ícone).
- `globals.css`: `--font-heading` e `--font-numeral` → `'Germania One'`. `--font-stat` fica Bricolage. Germania One só tem peso Regular: o `font-weight` dos títulos deixa de fazer efeito (já é assim hoje com a Bricolage travada).
- Criar utilitários de texto (`.text-display-xl` etc.) ou `@utility` do Tailwind 4, um por linha da tabela.
- No Figma: criar os mesmos estilos de texto, para os componentes pararem de carregar tamanho solto.

### 4.7 Espaço, borda, raio

- **Espaços usados:** 2, 3, 4, 6, 8, 12, 16, 24, 48. Todos cabem na escala de 4px do Tailwind (0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 12). Não precisa de var nova; no Figma vale criar variáveis com esses nomes.
- **Larguras de borda:** 1 (chip), 2 (controle), 3 (aba ativa), 4 (painel). Proposta: `--border-w-chip: 1px`, `--border-w-control: 2px`, `--border-w-active: 3px`, `--border-w-panel: 4px`.
- **Raio:** 0 em tudo (já é `--radius: 0`). Exceção: avatar redondo.
- **Sombras:** o Figma não tem nenhuma. Os `--glow-*` atuais derivam de `--primary` e passam a brilhar em brasa sozinhos. Manter.
- **Moldura dupla tracejada** nos cards de técnica: 2px tracejado, recuo de 2px, duas camadas. Hoje o `GlyphCard` usa marcas ✦ ↝ ✦; trocar.

---

## 5. Componentes: o que muda em cada um

| Arquivo | Mudança |
|---|---|
| `app/layout.tsx` | fontes (§4.6) |
| `app/globals.css` | tokens (§4.2), `.sheet-*` (§3.3), `.attr-panel` some ou vira só o deck |
| `components/layout/AppShell.tsx` | header 72px, pad 8; "‹ Voltar" em `muted-foreground`; centro do header centralizado; caveira cor de osso (vetor `Profile-icon` do Figma) no lugar do `skull-icon.png` vermelho, também no login |
| `app/sheet/CharacterSheetClient.tsx` | nova estrutura: `.sheet-card` (trilho + vitais + identidade) · `.sheet-panel` · `.sheet-dock` |
| `components/sheet/TabRail.tsx` | botões 64x64; ativo = `bg-muted` + 3px `border-control`; inativo = `bg-base` + 2px `border-frame`, ícone `muted-foreground`; Editar no pé da coluna |
| `components/sheet/FloatingVitals.tsx` | sem moldura própria; retrato 292px com escudo de CA no canto; HP bar; dividers; grid 3x2 gap 4; condições abaixo dos atributos |
| `components/sheet/ConditionChips.tsx` | sai da faixa de estado e vai para baixo dos atributos |
| `components/sheet/InventoryView.tsx` | slots de equipar e bônus saem para a coluna identidade na aba Inventário |
| `components/sheet/ClassPanel.tsx` | perde nome e tags; vira só o deck "Técnicas" com título de 24px |
| `components/shared/DetailChip.tsx` | cores por tipo: `class`, `archetype`, `ancestry`; 1px `border-frame`; Libre SemiBold 14 |
| `components/sheet/TalentsPanel.tsx` | muda de lugar (coluna identidade); quadrado do nível 19px em brasa |
| `components/shared/GlyphCard.tsx` | variantes Passivo (`muted`, borda `border-control`) e Ativo (`accent`, borda `border-frame`); moldura tracejada; slot de usos (raios) |
| `components/sheet/RollCard.tsx` | 4 modos do Result card; chip Vantagem/Desvantagem no canto; dados escolhido/descartado empilhados |
| `components/sheet/BackstoryView.tsx` | recebe `HandoutShelf`, `RestButton` e o botão de Modo mesa, que saem do dock |
| `components/sheet/RollHistory.tsx` | só a última; no hover, as anteriores sobem como balões roláveis, sem fundo de container |
| `components/sheet/DiceRoller.tsx` | modo dock: 5 botões de dado com quantidade (esquerdo rola, direito soma 1, "x" no canto limpa) + botão d20 primário que abre o painel atual |
| `components/sheet/AttacksMenu.tsx` | gatilho vira botão Muted só com ícone de espada |
| `components/sheet/TurnBanner.tsx` | ação vira o botão spirit do dock: "Rolar iniciativa" → "Iniciar turno" / "Encerrar turno"; o banner fica só com o texto |
| `components/sheet/TorchStatus.tsx` | 4 segmentos h14 gap 2, relógio Bricolage Bold 14; cor `ember` |
| `components/ui/button.tsx` | variantes alinhadas ao 64:849: `default` (Primary/ember), `outline`, `muted`, nova `spirit`; borda 2px `border-frame` |
| Novo: `components/shared/Divider.tsx` | linha + caveira 12px + linha, em `border-outline` |

---

## 6. Ordem de execução

Cada fase é um PR que pode ir para produção sozinho.

**Fase 0. Preparação**
- Capturas Playwright da ficha, do painel do Mestre, da home e da criação, para comparar antes e depois.
- Atualizar `replica/design/tokens.json` com os pares novos (§4.5).

**Fase 1. Tokens de cor** (só `globals.css`, sem mexer em layout) · **feita em 28/10**
- Variáveis do Figma em `.dark`, nomes shadcn como alias, novas vars no `@theme inline`.
- Corrigir os três pares que falham.
- Varredura visual do app inteiro, porque a troca é global. Atenção a `accent`, `secondary`, `chart-1`, `chart-2`.

**Fase 2. Tipografia** · **feita em 28/10**
- Fontes em `layout.tsx`, `--font-heading` → Germania One, utilitários de texto.
- Conferir quebras de linha: Germania One é mais estreita que Bricolage 800, os títulos vão encolher.
- Regra aplicada no código todo: texto em `--font-heading` abaixo de 16px passou para `--font-mono` (Libre Franklin, peso 600 quando não havia peso), como o Figma faz. Germania One ficou nos títulos de 16px para cima, nos numerais e nos monogramas do Mestre. Botões passaram a Libre Franklin Bold. `font-synthesis-weight: none` evita negrito falso na Germania.

**Fase 3. Layout da ficha (desktop)** · **feita em 28/10**
- Grid de duas linhas: card da Ficha (col 1-5) e painel (col 6-10) com moldura de 4px por fora (`outline`), dock na col 2-9 subindo 40px sobre os dois (`--dock-overlap`).
- Card da Ficha: trilho com Editar no pé; coluna de vitais (retrato até 292px, escudo de CA, bloco de PV, divisores, atributos, condições); segunda coluna por aba (Atributos, Grimório e História: nome, tags e talentos; Inventário: equipamento e bônus, desenhados pelo `InventoryView` via portal).
- Painel: Técnicas sozinho na aba Atributos; Mochila na aba Inventário; a aba História abre com a seção "Mesa" (handouts, Modo mesa, Descansar).
- Dock: rolagens (col 1-2), morte/turno/pedidos (col 3-5), ataques (col 6-7), dados (col 8-10). O botão de turno e o teclado de dados ficam para a Fase 4.
- Header de 72px, tocha centralizada, caveira cor de osso (`public/skull-bone.svg`, exportada do Figma) no header e no login.
- Abaixo de 1100px o grid empilha e o dock gruda na base da tela; o celular segue o layout próprio.
- Achado no caminho: alguns textos usavam `--primary-foreground` como "texto claro"; com a brasa, essa cor virou marrom escuro. Trocados por `--foreground` (tags, legenda de técnica ativa, selo aceso, nome no celular, título da raiz) e, no PV do celular, o texto passou a escuro sobre a brasa.

**Fase 4. Componentes** · **feita em 28/10**
- `Button`: variantes `muted` e `spirit` (Muted e Secondary do 64:849). O botão de ataques do dock passa a Muted.
- Dados (`DiceKeys`): D4 a D12 no dock. Botão direito (ou + e ↑ no teclado) soma um dado; esquerdo rola o que mostra e volta a 1; o "x" no canto limpa. O d20 de brasa abre o painel de sempre, agora sem o punhado (que segue no celular).
- Turno (`TurnButton`, no ciano): "Rolar iniciativa", "Iniciar turno", "Encerrar turno"; desligado em "Iniciar turno" quando não há jogada, com o motivo no title. O `TurnBanner` do desktop fica só com o texto.
- Rolagens (`ResultCard` + `RollHistory`): o Result card do Figma, com o dano encadeado no ↳; antes do dano, as ofertas "Dano" e "Fortuna" na segunda linha. As anteriores sobem como balões no hover ou foco, sem fundo. Contraste corrigido: texto secundário e dado mantido na cor de texto do card; veredito, crítico e vantagem viram tags na borda.
- Técnicas (`GlyphCard` compacto): o Button card do Figma, com esteira de 6px (escura no passivo, `accent` no que se gasta), moldura de 2px dobrada por tracejado e tag colorida pela origem (classe, ancestralidade, arquétipo).
- Talentos: quadrado do nível em brasa.
- História: as seções perdem a moldura própria dentro do painel.
- Fora do escopo, já existia antes: o axe aponta `nested-interactive` nos 6 botões de atributo (`RollModeMenu` em volta de um `Button` com `span`).

**Fase 5. Responsivo e estados**
- O Figma só desenha 1440. Abaixo de 1100px: card da Ficha em cima, painel embaixo, dock grudado na base da tela. Celular: manter o layout atual (`isMobile`) só com tokens e fontes novos.
- Hover, foco, pressionado e desabilitado não estão no Figma. Propor: hover = `accent`, foco = `ring`, pressionado = `.tactile` atual, desabilitado = 50%.

**Fase 6. QA**
- `npm run lint`, `npm run build`, `npm run test:e2e` (inclui axe), `contrast.py`, comparação com as capturas da Fase 0.

---

## 7. Decisões

### 7.1 Respondidas (28/10)

1. **Paleta: o app todo.** Mestre, home e criação de personagem também. Os tokens continuam globais, sem escopo por página.
2. **Abas mudam duas coisas.** A troca de aba muda o painel da direita **e** a segunda coluna do card da Ficha (a coluna identidade).
   - Atributos: nome, tags e talentos (como no Figma).
   - Inventário: slots de equipar e os bônus (corpo a corpo, distância, CA).
   - Grimório e História: ainda não definido. Até lá, a coluna mostra o mesmo conteúdo de Atributos.
3. **Editar personagem: sempre visível.** Vai para a base do trilho de abas, com o componente `Button` (Style Muted, Type Icon, ícone `edit-03`). É o lugar do "Button - Edit" oculto no Figma (64x64, abaixo das abas). O trilho vira coluna com as abas no topo e o Editar no pé.
4. **Colunas 3 a 5 do dock: só turno e pedidos do Mestre** (`TurnBanner` sem o botão, que vai para o "TURNO", e `PromptCard`).
   - **Condições** saem do dock e vão para a primeira coluna do card da Ficha, logo abaixo dos atributos (no lugar do segundo divider).
   - Handouts, descanso e modo mesa ainda precisam de lugar (ver §7.2).
5. **Histórico: só a última rolagem visível.** No hover, sobem os balões das anteriores, roláveis, **sem fundo de container** (só os próprios Result cards flutuando por cima dos painéis).
6. **Dados no dock.** Cada botão de dado guarda uma quantidade e mostra ela no rótulo (D6, 2D6, 3D6).
   - **Botão direito:** soma uma unidade (o comportamento de hoje, que passa para o botão direito).
   - **Botão esquerdo:** rola a quantidade mostrada e volta para 1.
   - Isso substitui o punhado misto do popover atual: cada botão rola só o próprio dado.
7. **Botão "TURNO": um botão, dois estados.** "Iniciar turno" pede a vez (`onClaim`); durante a vez vira "Encerrar turno" (`onEnd`).

### 7.2 Respondidas (28/10, segunda rodada)

1. **Iniciativa: sim.** O botão de turno tem três estados: "Rolar iniciativa" antes de existir ordem, depois "Iniciar turno" / "Encerrar turno".
2. **Limpar a quantidade de um dado:** um botão "x" no canto superior direito do botão do dado, visível só quando a quantidade passa de 1. A quantidade também volta para 1 depois de rolar. No celular segue o popover atual.
3. **Botão primário d20: sim,** o clique abre o painel atual (Normal / Vantagem / Desvantagem, CD, modificador).
4. **Handouts, descanso e modo mesa vão para a aba História** do personagem (o `HandoutShelf`, o `RestButton` e o botão de Modo mesa saem do dock).
5. **Botão oculto no cabeçalho de Técnicas:** resto do template, não entra.

### 7.3 Ainda em aberto

1. **Coluna identidade no Grimório e na História.** Na História ela pode ser o lugar natural de handouts, descanso e modo mesa (item 4 acima).
2. **Nomes e contraste:** na Fase 1 segui as recomendações de §4.3 (`card` → `bg-base`, `accent` = marrom de destaque, `spirit` separado de `secondary`). As correções de contraste de §4.5 ficam nos componentes (Fase 4).

---

## 8. Riscos

- **Troca global de cor.** `primary` tem 226 usos e `destructive` 294. Hoje os dois são vermelhos e a diferença é sutil; com `primary` em brasa, todo lugar que usava `primary` querendo dizer "perigo" vai parecer errado. Auditar na Fase 1.
- **Altura da tela.** Com o dock por cima, a área útil dos painéis cai 40px. Em telas de 760px de altura (o `min-height` atual) o deck de técnicas mostra pouco mais de uma linha de cards.
- **Coluna de identidade com 250px.** Nomes longos em Germania 48 vão quebrar. Precisa de `text-wrap: balance` e talvez reduzir para 36 acima de 12 caracteres.
- **Talentos sempre visíveis.** Personagens de nível alto têm 5 ou mais talentos; a coluna precisa rolar sozinha sem empurrar os vitais.
- **Germania One** é uma fonte só, de peso único, servida pelo Google Fonts. Se ela falhar ao carregar, o fallback precisa de métricas parecidas (`size-adjust`) para o layout não pular.
