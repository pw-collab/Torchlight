-- Torchlight — encontros e o relógio da masmorra (Fase 3 do plano de gameplay).
--
-- Os NPCs eram fichas estáticas de consulta: o Mestre abria o bestiário, lia o
-- statblock e fazia o resto de cabeça — três goblins do mesmo statblock com
-- vidas diferentes viviam num papel ao lado do teclado. O **encontro** é o
-- runtime que faltava, e sem grid, como a filosofia do produto pede.
--
-- Junto vem o relógio da masmorra. Em Shadowdark o tempo é um instrumento do
-- Mestre, e até aqui ele não tinha o botão: a tocha queimava durante a pausa
-- para a pizza, e não havia como gastar um turno de exploração.

-- ---------------------------------------------------------------------------
-- O relógio da mesa
-- ---------------------------------------------------------------------------

-- A luz é derivada do relógio (migração de Fase 0), então mexer no relógio move
-- a luz de todo mundo de uma vez, sem tocar em ficha nenhuma.
--
--   paused_at            enquanto preenchido, o tempo da mesa está congelado
--   clock_shift_seconds  o quanto o relógio da mesa corre à frente do relógio
--                        de parede — negativo depois de uma pausa (o tempo
--                        parado não conta), positivo depois de um turno de
--                        exploração (dez minutos que passaram de propósito)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS clock_shift_seconds INTEGER NOT NULL DEFAULT 0;

-- Para o relógio chegar ao jogador no instante em que o Mestre o pausa, a ficha
-- precisa enxergar a linha da própria mesa: o Realtime do Supabase entrega
-- mudança de linha a quem a RLS deixaria ler, e a policy de 001 é só do Mestre.
-- O que se abre aqui é a mesa em que a pessoa já está sentada, e cujo nome e
-- código ela já recebe pelo RPC `character_session`.
DROP POLICY IF EXISTS sessions_select_member ON sessions;
CREATE POLICY sessions_select_member ON sessions
  FOR SELECT
  TO authenticated
  USING (public.is_session_member(id));

-- ---------------------------------------------------------------------------
-- encounters
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS encounters (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID        NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  round        INTEGER     NOT NULL DEFAULT 1,
  -- O plano falava num índice para a vez. Guardar o **ator** em vez da posição
  -- sobrevive ao que acontece de verdade numa mesa: alguém rola iniciativa
  -- atrasado, um goblin cai e sai da trilha, o Mestre acrescenta um reforço no
  -- meio da rodada. Um índice apontaria para outra pessoa a cada mudança.
  active_actor_id UUID,
  status       TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS encounters_session_idx ON encounters (session_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- encounter_actors
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS encounter_actors (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID        NOT NULL REFERENCES encounters (id) ON DELETE CASCADE,
  source       TEXT        NOT NULL CHECK (source IN ('pc', 'npc')),
  -- O personagem ou o NPC de origem. Sem FK: um NPC pode ser apagado do
  -- bestiário no meio da campanha e a linha do encontro continua sendo o
  -- registro do que esteve na mesa.
  ref_id       UUID,
  name         TEXT        NOT NULL,
  -- Só para NPCs. O PC lê a vida da própria ficha — duas verdades sobre o
  -- mesmo HP é exatamente o defeito que a Fase 0 passou limpando.
  hp_current   INTEGER,
  hp_max       INTEGER,
  ac           INTEGER,
  -- O ataque vem do statblock quando o NPC entra na trilha, e fica na linha:
  -- assim o ator continua sabendo bater mesmo que a ficha de origem seja
  -- apagada do bestiário no meio da campanha.
  atk_bonus    INTEGER,
  damage_die   TEXT,
  -- Nulo enquanto não rolou; a trilha põe quem não rolou no fim.
  initiative   INTEGER,
  conditions   JSONB       NOT NULL DEFAULT '[]'::jsonb,
  defeated     BOOLEAN     NOT NULL DEFAULT FALSE,
  -- Desempate estável entre iniciativas iguais, na ordem em que entraram.
  sort_key     INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS encounter_actors_encounter_idx ON encounter_actors (encounter_id);
CREATE INDEX IF NOT EXISTS encounter_actors_ref_idx ON encounter_actors (ref_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounter_actors ENABLE ROW LEVEL SECURITY;

/** O encontro a que a linha de ator pertence — para a policy não repetir o join. */
CREATE OR REPLACE FUNCTION public.encounter_session(p_encounter_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.session_id FROM encounters e WHERE e.id = p_encounter_id;
$$;

-- A mesa vê o encontro: é dela que é a vez. Só o Mestre monta e mexe.
CREATE POLICY encounters_select ON encounters
  FOR SELECT
  TO authenticated
  USING (public.is_session_gm(session_id) OR public.is_session_member(session_id));

CREATE POLICY encounters_write_gm ON encounters
  FOR ALL
  TO authenticated
  USING (public.is_session_gm(session_id))
  WITH CHECK (public.is_session_gm(session_id));

CREATE POLICY encounter_actors_select ON encounter_actors
  FOR SELECT
  TO authenticated
  USING (
    public.is_session_gm(public.encounter_session(encounter_id))
    OR public.is_session_member(public.encounter_session(encounter_id))
  );

CREATE POLICY encounter_actors_write_gm ON encounter_actors
  FOR ALL
  TO authenticated
  USING (public.is_session_gm(public.encounter_session(encounter_id)))
  WITH CHECK (public.is_session_gm(public.encounter_session(encounter_id)));

-- ---------------------------------------------------------------------------
-- A iniciativa do jogador
-- ---------------------------------------------------------------------------

/**
 * O jogador rola a própria iniciativa e ela entra na ordem da mesa.
 *
 * Escrever direto em `encounter_actors` é do Mestre — é a trilha dele. Mas a
 * iniciativa é a única coisa do encontro que nasce na ficha do jogador, e
 * abrir a tabela inteira para isso seria dar a ele o HP dos goblins junto.
 * SECURITY DEFINER com as duas checagens que importam: o personagem é dele, e
 * ele está na mesa daquele encontro.
 */
CREATE OR REPLACE FUNCTION public.set_initiative(
  p_encounter_id UUID,
  p_character_id UUID,
  p_value INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller     TEXT := public.auth_discord_id();
  v_session_id UUID;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM characters c WHERE c.id = p_character_id AND c.user_id = v_caller
  ) THEN
    RAISE EXCEPTION 'not_your_character';
  END IF;

  SELECT e.session_id INTO v_session_id
  FROM encounters e
  WHERE e.id = p_encounter_id AND e.status = 'active';

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'encounter_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM session_members m
    WHERE m.session_id = v_session_id AND m.character_id = p_character_id
  ) THEN
    RAISE EXCEPTION 'not_at_this_table';
  END IF;

  UPDATE encounter_actors a
  SET initiative = p_value
  WHERE a.encounter_id = p_encounter_id
    AND a.source = 'pc'
    AND a.ref_id = p_character_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_initiative(UUID, UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_initiative(UUID, UUID, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE encounters;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE encounter_actors;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
