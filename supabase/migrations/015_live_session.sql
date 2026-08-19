-- Torchlight — a sessão como entidade viva (Fase 1 do plano de gameplay).
--
-- Até aqui `sessions` era só um nome e uma flag: nada dizia quem estava na
-- mesa, e `characters.session_id` nunca era escrito, então o painel do Mestre
-- ficava permanentemente vazio. Nada do que acontecia na mesa era
-- compartilhado — as rolagens viviam na memória de um navegador e sumiam no
-- refresh.
--
-- Esta migração dá à sessão as três peças que faltavam:
--
--   * um **código** de seis caracteres, para o jogador entrar pela ficha em vez
--     de o `session_id` ser adivinhado na criação do personagem;
--   * **session_members**, o elenco da mesa — um personagem sobrevive a várias
--     sessões, então a associação é dele com a mesa, não um campo da ficha;
--   * **session_events**, o log append-only de tudo que acontece, que é o que
--     destrava feed ao vivo, histórico que sobrevive ao refresh e (adiante)
--     recap, desfazer e rolagens dirigidas.

-- ---------------------------------------------------------------------------
-- Sessões: código de entrada e fim
-- ---------------------------------------------------------------------------

/**
 * Código curto de mesa. Sem O/0 e I/1: ele é lido em voz alta e digitado no
 * celular, então as letras ambíguas saem do alfabeto. Repete até achar um livre
 * — com 32^6 combinações a colisão é teórica, mas o laço a torna impossível.
 *
 * SECURITY DEFINER porque a checagem de unicidade precisa enxergar as sessões
 * de todos os Mestres; sob a RLS de quem insere, ela só veria as próprias e o
 * índice único é que reclamaria depois.
 */
CREATE OR REPLACE FUNCTION public.generate_session_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate TEXT;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..6 LOOP
      candidate := candidate || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM sessions WHERE code = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Sessões antigas ganham um código para não ficarem inalcançáveis.
UPDATE sessions SET code = public.generate_session_code() WHERE code IS NULL;

ALTER TABLE sessions ALTER COLUMN code SET DEFAULT public.generate_session_code();
ALTER TABLE sessions ALTER COLUMN code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sessions_code_key ON sessions (code);

-- ---------------------------------------------------------------------------
-- Quem é da mesa — usado pela RLS das duas tabelas novas
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER de propósito: estas funções são chamadas de dentro das
-- policies de `session_members`, e uma consulta sujeita à RLS ali dentro seria
-- recursiva.

-- As tabelas vêm primeiro: uma função SQL é validada na criação, e estas duas
-- consultam o que ainda não existiria.

-- ---------------------------------------------------------------------------
-- session_members — a mesa tem elenco
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS session_members (
  session_id   UUID        NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  character_id UUID        NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
  user_id      TEXT        NOT NULL REFERENCES allowed_discord_ids (discord_id),
  player_name  TEXT,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, character_id)
);

CREATE INDEX IF NOT EXISTS session_members_user_idx ON session_members (user_id);
CREATE INDEX IF NOT EXISTS session_members_character_idx ON session_members (character_id);

-- ---------------------------------------------------------------------------
-- session_events — o log append-only da mesa
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS session_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID        NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  actor_name   TEXT        NOT NULL,
  character_id UUID        REFERENCES characters (id) ON DELETE SET NULL,
  -- A lista já contempla o que as fases seguintes vão escrever (condições,
  -- rolagens dirigidas, encontros), para o log não precisar de uma migração
  -- só para afrouxar a restrição.
  kind         TEXT        NOT NULL CHECK (kind IN (
                             'roll', 'hp', 'luck', 'xp', 'light', 'note',
                             'session', 'condition', 'prompt', 'encounter'
                           )),
  payload      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  visibility   TEXT        NOT NULL DEFAULT 'table' CHECK (visibility IN ('table', 'gm_only')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_events_session_idx
  ON session_events (session_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_session_member(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM session_members m
    WHERE m.session_id = p_session_id
      AND m.user_id = public.auth_discord_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_session_gm(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = p_session_id
      AND s.gm_id = public.auth_discord_id()
  );
$$;

ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;

-- Quem está na mesa vê a mesa inteira; o Mestre vê as suas.
CREATE POLICY session_members_select ON session_members
  FOR SELECT
  TO authenticated
  USING (public.is_session_member(session_id) OR public.is_session_gm(session_id));

-- Entrar é sempre pelo código (join_session). Não há INSERT direto: sem ele,
-- ninguém se coloca numa mesa cujo id tenha descoberto por outro caminho.
CREATE POLICY session_members_delete ON session_members
  FOR DELETE
  TO authenticated
  USING (user_id = public.auth_discord_id() OR public.is_session_gm(session_id));

ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

-- O Mestre lê tudo, inclusive o que rolou escondido; a mesa lê o que é da mesa.
CREATE POLICY session_events_select ON session_events
  FOR SELECT
  TO authenticated
  USING (
    public.is_session_gm(session_id)
    OR (visibility = 'table' AND public.is_session_member(session_id))
  );

-- Um jogador só registra o que é do personagem dele. O Mestre registra por
-- qualquer um — é o trabalho dele — e é o único que pode escrever sem
-- personagem (a rolagem secreta, a nota de cena).
CREATE POLICY session_events_insert ON session_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_session_gm(session_id)
    OR (
      public.is_session_member(session_id)
      AND character_id IN (
        SELECT id FROM characters WHERE user_id = public.auth_discord_id()
      )
    )
  );

-- Sem UPDATE e sem DELETE: o log é append-only por definição. O que aconteceu
-- na mesa aconteceu.

-- ---------------------------------------------------------------------------
-- Entrar e sair da mesa
-- ---------------------------------------------------------------------------

/**
 * Entra numa mesa pelo código. SECURITY DEFINER porque o jogador não enxerga
 * `sessions` que não são dele — é justamente o código que autoriza a entrada,
 * e não é preciso abrir a tabela inteira para isso.
 *
 * `characters.session_id` continua sendo escrito: é o ponteiro "mesa atual"
 * que a RLS de 001 já usa, e o que faz a ficha saber onde está sem uma segunda
 * consulta.
 */
CREATE OR REPLACE FUNCTION public.join_session(p_code TEXT, p_character_id UUID)
RETURNS TABLE (id UUID, name TEXT, code TEXT, gm_id TEXT, active BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller     TEXT := public.auth_discord_id();
  v_session    sessions%ROWTYPE;
  v_character  characters%ROWTYPE;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_character FROM characters c WHERE c.id = p_character_id;
  IF v_character.id IS NULL OR v_character.user_id <> v_caller THEN
    RAISE EXCEPTION 'not_your_character';
  END IF;

  SELECT * INTO v_session
  FROM sessions s
  WHERE s.code = upper(trim(p_code))
    AND s.active
    AND s.ended_at IS NULL;

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'session_not_found';
  END IF;

  -- Um personagem está numa mesa de cada vez; trocar de mesa desfaz a anterior.
  DELETE FROM session_members m
  WHERE m.character_id = p_character_id AND m.session_id <> v_session.id;

  INSERT INTO session_members (session_id, character_id, user_id, player_name)
  VALUES (v_session.id, p_character_id, v_caller, v_character.player_name)
  ON CONFLICT (session_id, character_id) DO UPDATE
    SET player_name = EXCLUDED.player_name;

  UPDATE characters c SET session_id = v_session.id WHERE c.id = p_character_id;

  INSERT INTO session_events (session_id, actor_name, character_id, kind, payload)
  VALUES (
    v_session.id,
    COALESCE(v_character.player_name, v_character.name),
    p_character_id,
    'session',
    jsonb_build_object('action', 'join', 'characterName', v_character.name)
  );

  RETURN QUERY
  SELECT s.id, s.name, s.code, s.gm_id, s.active, s.created_at
  FROM sessions s WHERE s.id = v_session.id;
END;
$$;

/** Sai da mesa. O log guarda a saída; a ficha volta a não apontar para lugar nenhum. */
CREATE OR REPLACE FUNCTION public.leave_session(p_character_id UUID)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller    TEXT := public.auth_discord_id();
  v_character characters%ROWTYPE;
  v_member    session_members%ROWTYPE;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_character FROM characters c WHERE c.id = p_character_id;
  IF v_character.id IS NULL OR v_character.user_id <> v_caller THEN
    RAISE EXCEPTION 'not_your_character';
  END IF;

  SELECT * INTO v_member FROM session_members m WHERE m.character_id = p_character_id;
  IF v_member.session_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO session_events (session_id, actor_name, character_id, kind, payload)
  VALUES (
    v_member.session_id,
    COALESCE(v_character.player_name, v_character.name),
    p_character_id,
    'session',
    jsonb_build_object('action', 'leave', 'characterName', v_character.name)
  );

  DELETE FROM session_members m WHERE m.character_id = p_character_id;
  UPDATE characters c SET session_id = NULL WHERE c.id = p_character_id;
END;
$$;

/**
 * A mesa do personagem, se houver. O jogador não pode ler `sessions` direto —
 * a policy de 001 é só para o Mestre — então a ficha pergunta por aqui.
 */
CREATE OR REPLACE FUNCTION public.character_session(p_character_id UUID)
RETURNS TABLE (id UUID, name TEXT, code TEXT, gm_id TEXT, active BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name, s.code, s.gm_id, s.active, s.created_at
  FROM session_members m
  JOIN sessions s ON s.id = m.session_id
  JOIN characters c ON c.id = m.character_id
  WHERE m.character_id = p_character_id
    AND c.user_id = public.auth_discord_id()
    AND s.ended_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.join_session(TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_session(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.character_session(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_session(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.character_session(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Encerrar a sessão (§4.4)
-- ---------------------------------------------------------------------------

-- `createSession` inseria com active = true sem desativar a anterior, e a
-- página pegava a mais recente por created_at — a antiga ficava órfã, ainda
-- ativa, ainda aceitando entradas pelo código. Uma mesa ativa por Mestre.
CREATE OR REPLACE FUNCTION public.close_other_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.active THEN
    UPDATE sessions
    SET active = FALSE, ended_at = COALESCE(ended_at, now())
    WHERE gm_id = NEW.gm_id
      AND id <> NEW.id
      AND active;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sessions_single_active ON sessions;
CREATE TRIGGER sessions_single_active
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.close_other_sessions();

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

-- `ADD TABLE` numa publicação estoura se a tabela já estiver lá, e esta
-- migração pode ser reaplicada num banco meio migrado.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE session_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE session_members;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
