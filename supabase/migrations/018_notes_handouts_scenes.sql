-- Torchlight — a mesa e a memória (Fase 4 do plano de gameplay).
--
-- Quatro coisas que moravam fora do app: o nome do NPC que o jogador anotava no
-- WhatsApp, a carta que o Mestre lia em voz alta de um documento à parte, a
-- cena preparada na véspera num caderno, e o bestiário que só crescia e nunca
-- se deixava encontrar.

-- ---------------------------------------------------------------------------
-- §5.9 · O bloco de notas do personagem
-- ---------------------------------------------------------------------------

ALTER TABLE characters ADD COLUMN IF NOT EXISTS notes TEXT;

-- ---------------------------------------------------------------------------
-- §6.10 · Bestiário: achar, agrupar e marcar
-- ---------------------------------------------------------------------------

-- Uma lista plana por Mestre não se procura. As tags são livres de propósito:
-- cada mesa agrupa pelo que importa para ela — "cripta", "chefe", "sessão 4".
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
-- O favorito é da sessão de hoje, não do NPC para sempre; é um marcador de
-- trabalho, e o Mestre o limpa quando a cena passa.
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS npcs_gm_favorite_idx ON npcs (gm_id, favorite);

-- ---------------------------------------------------------------------------
-- §6.8 · Handouts
-- ---------------------------------------------------------------------------

/**
 * A carta, o mapa em texto, a página de diário.
 *
 * Metade disso já existia: itens de inventário do tipo `document` com Markdown
 * e um leitor paginado. O que faltava era o Mestre ter os seus — escritos na
 * preparação, guardados até a hora — e poder entregá-los.
 *
 * A entrega em si não mora aqui: ela é uma linha do log da sessão, como tudo
 * mais que acontece na mesa. Esta tabela é só a gaveta.
 */
CREATE TABLE IF NOT EXISTS handouts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gm_id      TEXT        NOT NULL REFERENCES allowed_discord_ids (discord_id),
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS handouts_gm_idx ON handouts (gm_id, created_at DESC);

ALTER TABLE handouts ENABLE ROW LEVEL SECURITY;

-- A gaveta é do Mestre e só dele: o que o jogador recebe chega pelo log, com o
-- conteúdo junto, e não por leitura desta tabela. Um handout guardado é
-- preparação — ver a gaveta seria ver o que ainda não foi revelado.
CREATE POLICY handouts_own_gm ON handouts
  FOR ALL
  TO authenticated
  USING (gm_id = public.auth_discord_id() AND public.is_gm())
  WITH CHECK (gm_id = public.auth_discord_id() AND public.is_gm());

-- ---------------------------------------------------------------------------
-- §6.11 · Cenas preparadas
-- ---------------------------------------------------------------------------

/**
 * A preparação que morava fora do app.
 *
 * Uma cena junta o que o Mestre já escreveu — a nota dele, os NPCs que estão
 * ali — e fica esperando. "Iniciar cena" arma o encontro com aqueles NPCs, que
 * é o gesto que faltava entre preparar e jogar.
 *
 * A cena é do Mestre, não da sessão: ela é escrita na véspera, quando sessão
 * nenhuma existe ainda.
 */
CREATE TABLE IF NOT EXISTS scenes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gm_id      TEXT        NOT NULL REFERENCES allowed_discord_ids (discord_id),
  title      TEXT        NOT NULL,
  gm_note    TEXT        NOT NULL DEFAULT '',
  npc_ids    UUID[]      NOT NULL DEFAULT '{}',
  -- Marcada quando a cena foi para a mesa; o Mestre pode desmarcar e reusar.
  played_at  TIMESTAMPTZ,
  sort_key   INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scenes_gm_idx ON scenes (gm_id, sort_key, created_at);

ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY scenes_own_gm ON scenes
  FOR ALL
  TO authenticated
  USING (gm_id = public.auth_discord_id() AND public.is_gm())
  WITH CHECK (gm_id = public.auth_discord_id() AND public.is_gm());

-- ---------------------------------------------------------------------------
-- O log ganha a entrega de handout
-- ---------------------------------------------------------------------------

-- A 015 fechou os tipos numa CHECK, e a entrega é um tipo novo. Trocar a
-- restrição é mais honesto do que espremer a entrega dentro de 'note': o feed
-- filtra por tipo, e uma carta entregue não é um recado.
ALTER TABLE session_events DROP CONSTRAINT IF EXISTS session_events_kind_check;
ALTER TABLE session_events ADD CONSTRAINT session_events_kind_check CHECK (kind IN (
  'roll', 'hp', 'luck', 'xp', 'light', 'note',
  'session', 'condition', 'prompt', 'encounter', 'handout'
));

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE scenes;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
