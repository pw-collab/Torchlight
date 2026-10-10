-- Torchlight — iniciativa em grupo, e a vez que se assume.
--
-- A mesa não rola d20 + DES por cabeça. A iniciativa é de lado: o grupo rola
-- um d6 só, por todos, e o Mestre rola outro pelos dele. Quem tirou mais age
-- primeiro; no empate, o grupo. Dentro de um lado não há fila: os jogadores
-- combinam na hora quem vai, e quem vai **assume a vez**. Enquanto alguém
-- está agindo ninguém mais assume — a vez só fica livre quando ele a encerra.
--
-- E a vez não é coisa só de combate. Em Shadowdark a mesa sempre anda em
-- turnos, na exploração também; o d6 é que só se rola ao entrar num
-- encontro. Por isso quem está agindo mora na mesa (`session_turns`), e o
-- encontro só acrescenta os dois dados e a contagem de rodadas.
--
-- Sai o que a iniciativa individual deixou: o número por ator, a vez como
-- ponteiro no encontro e o RPC com que o jogador escrevia o próprio d20.

-- ---------------------------------------------------------------------------
-- Os dois d6
-- ---------------------------------------------------------------------------

-- Nulo enquanto aquele lado não rolou. O do Mestre nasce com o encontro; o do
-- grupo é de quem tocar primeiro em "rolar" (ver `set_party_initiative`).
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS pc_initiative  INTEGER CHECK (pc_initiative BETWEEN 1 AND 6);
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS npc_initiative INTEGER CHECK (npc_initiative BETWEEN 1 AND 6);

ALTER TABLE encounters DROP COLUMN IF EXISTS active_actor_id;
ALTER TABLE encounter_actors DROP COLUMN IF EXISTS initiative;
DROP FUNCTION IF EXISTS public.set_initiative(UUID, UUID, INTEGER);

-- ---------------------------------------------------------------------------
-- Fora de combate, também para o PC
-- ---------------------------------------------------------------------------

-- `defeated` era só do NPC: a vida do PC mora na ficha, e a trilha não a
-- copiava. Mas a vez precisa saber quem pode agir, e a ficha de um jogador
-- não enxerga as condições dos outros. Então a linha do PC passa a carregar o
-- mesmo sinal, mantido pelo banco a partir da ficha: fora de combate é o
-- morto e o caído estabilizado, que está inconsciente. Quem está morrendo
-- ainda tem vez — é nela que rola contra a morte (ver src/lib/dying.ts).
CREATE OR REPLACE FUNCTION public.pc_out_of_fight(p_conditions JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    p_conditions @> '[{"id": "morto"}]'::jsonb OR p_conditions @> '[{"id": "estavel"}]'::jsonb,
    FALSE
  );
$$;

-- SECURITY DEFINER: quem muda a ficha costuma ser o jogador, e ele não
-- escreve na trilha — sem isto a RLS engoliria a atualização em silêncio.
CREATE OR REPLACE FUNCTION public.sync_pc_actor_defeated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE encounter_actors a
  SET defeated = public.pc_out_of_fight(NEW.conditions)
  FROM encounters e
  WHERE a.encounter_id = e.id
    AND e.status = 'active'
    AND a.source = 'pc'
    AND a.ref_id = NEW.id
    AND a.defeated IS DISTINCT FROM public.pc_out_of_fight(NEW.conditions);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS characters_sync_actor_defeated ON characters;
CREATE TRIGGER characters_sync_actor_defeated
  AFTER UPDATE OF conditions ON characters
  FOR EACH ROW
  WHEN (OLD.conditions IS DISTINCT FROM NEW.conditions)
  EXECUTE FUNCTION public.sync_pc_actor_defeated();

-- O PC que entra na trilha já entra como a ficha diz.
CREATE OR REPLACE FUNCTION public.pc_actor_defeated_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.source = 'pc' THEN
    SELECT public.pc_out_of_fight(c.conditions) INTO NEW.defeated
    FROM characters c WHERE c.id = NEW.ref_id;
    NEW.defeated := COALESCE(NEW.defeated, FALSE);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS encounter_actors_pc_defeated ON encounter_actors;
CREATE TRIGGER encounter_actors_pc_defeated
  BEFORE INSERT ON encounter_actors
  FOR EACH ROW
  EXECUTE FUNCTION public.pc_actor_defeated_on_insert();

-- Os encontros que estiverem abertos quando esta migração rodar.
UPDATE encounter_actors a
SET defeated = public.pc_out_of_fight(c.conditions)
FROM characters c, encounters e
WHERE a.source = 'pc'
  AND a.ref_id = c.id
  AND a.encounter_id = e.id
  AND e.status = 'active';

-- ---------------------------------------------------------------------------
-- session_turns — a vez da mesa
-- ---------------------------------------------------------------------------

-- Uma linha por mesa, criada na primeira vez assumida. As chaves são as que
-- o painel já usa para dizer de quem se fala: 'pc:<personagem>' para o grupo
-- (a mesma na exploração e no combate) e 'npc:<ator do encontro>' para os do
-- Mestre.
CREATE TABLE IF NOT EXISTS session_turns (
  session_id  UUID        PRIMARY KEY REFERENCES sessions (id) ON DELETE CASCADE,
  -- Quem está agindo. Nulo: a vez está livre.
  acting_key  TEXT,
  -- O nome viaja junto porque a ficha do jogador não lê os personagens dos
  -- outros, e é "Corvo está agindo" que ela precisa mostrar.
  acting_name TEXT,
  -- Quem já agiu nesta rodada.
  acted       TEXT[]      NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE session_turns ENABLE ROW LEVEL SECURITY;

-- A mesa lê; ninguém escreve direto, nem o Mestre. Toda mudança passa pelos
-- RPCs abaixo, que trancam a linha: é isso que impede dois jogadores de
-- assumirem a vez no mesmo instante.
DROP POLICY IF EXISTS session_turns_select ON session_turns;
CREATE POLICY session_turns_select ON session_turns
  FOR SELECT
  TO authenticated
  USING (public.is_session_gm(session_id) OR public.is_session_member(session_id));

-- ---------------------------------------------------------------------------
-- A ordem dos lados
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.turn_key(p_source TEXT, p_ref_id UUID, p_id UUID)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE WHEN p_source = 'pc' THEN 'pc:' || p_ref_id::text ELSE 'npc:' || p_id::text END;
$$;

/**
 * O lado que tem a vez: o primeiro, na ordem dos d6, com alguém de pé que
 * ainda não agiu. Nulo quando um dos d6 falta, ou quando ninguém de pé
 * ficou por agir — a rodada fechou.
 *
 * A mesma regra roda na tela, em src/lib/turns.ts. As duas têm de concordar.
 */
CREATE OR REPLACE FUNCTION public.turn_side(p_encounter_id UUID, p_acted TEXT[])
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT o.side
  FROM encounters e,
       unnest(
         CASE WHEN e.pc_initiative >= e.npc_initiative
           THEN ARRAY['pc', 'npc']
           ELSE ARRAY['npc', 'pc']
         END
       ) WITH ORDINALITY AS o(side, pos)
  WHERE e.id = p_encounter_id
    AND e.pc_initiative IS NOT NULL
    AND e.npc_initiative IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM encounter_actors a
      WHERE a.encounter_id = e.id
        AND a.source = o.side
        AND NOT a.defeated
        AND public.turn_key(a.source, a.ref_id, a.id) <> ALL (p_acted)
    )
  ORDER BY o.pos
  LIMIT 1;
$$;

/**
 * Fecha a rodada quando ninguém de pé ficou por agir: a contagem anda e a
 * lista de quem já agiu recomeça. Devolve se fechou. Quem chama já tem a
 * linha da vez trancada.
 */
CREATE OR REPLACE FUNCTION public.close_round_if_done(p_session_id UUID, p_encounter_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_acted TEXT[];
BEGIN
  -- Alguém agindo é rodada aberta.
  SELECT t.acted INTO v_acted
  FROM session_turns t
  WHERE t.session_id = p_session_id AND t.acting_key IS NULL;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM encounters e
    WHERE e.id = p_encounter_id AND e.pc_initiative IS NOT NULL AND e.npc_initiative IS NOT NULL
  ) THEN
    RETURN FALSE;
  END IF;

  -- Ainda há quem agir, ou não há ninguém de pé para recomeçar.
  IF public.turn_side(p_encounter_id, v_acted) IS NOT NULL
     OR public.turn_side(p_encounter_id, '{}') IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE encounters SET round = round + 1 WHERE id = p_encounter_id;
  UPDATE session_turns SET acted = '{}', updated_at = now() WHERE session_id = p_session_id;
  RETURN TRUE;
END;
$$;

/**
 * Quem pode mover esta peça. O Mestre move qualquer uma; o jogador, só o
 * próprio personagem, e só na mesa em que ele está sentado. Devolve se quem
 * chama é o Mestre.
 */
CREATE OR REPLACE FUNCTION public.turn_caller_is_gm(p_session_id UUID, p_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_caller TEXT := public.auth_discord_id();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF public.is_session_gm(p_session_id) THEN
    RETURN TRUE;
  END IF;

  IF p_key IS NULL OR p_key NOT LIKE 'pc:%' OR NOT EXISTS (
    SELECT 1
    FROM characters c
    JOIN session_members m ON m.character_id = c.id
    WHERE c.id::text = substr(p_key, 4)
      AND c.user_id = v_caller
      AND m.session_id = p_session_id
  ) THEN
    RAISE EXCEPTION 'not_your_character';
  END IF;

  RETURN FALSE;
END;
$$;

/** O encontro aberto da mesa, se houver: o mais recente, como a tela lê. */
CREATE OR REPLACE FUNCTION public.active_encounter(p_session_id UUID)
RETURNS encounters
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT * FROM encounters e
  WHERE e.session_id = p_session_id AND e.status = 'active'
  ORDER BY e.created_at DESC
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- Assumir, encerrar, recomeçar
-- ---------------------------------------------------------------------------

/**
 * Assume a vez. Recusa se alguém já está agindo, se quem pede já agiu nesta
 * rodada, ou — no combate — se a vez é do outro lado ou falta um dos d6.
 *
 * A linha da vez é trancada antes de tudo: dois jogadores tocando "assumir"
 * no mesmo instante esperam um pelo outro, e o segundo encontra a vez tomada.
 */
CREATE OR REPLACE FUNCTION public.claim_turn(p_session_id UUID, p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_turns     session_turns%ROWTYPE;
  v_encounter encounters%ROWTYPE;
  v_actor     encounter_actors%ROWTYPE;
  v_character characters%ROWTYPE;
  v_name      TEXT;
  v_wrapped   BOOLEAN := FALSE;
BEGIN
  PERFORM public.turn_caller_is_gm(p_session_id, p_key);

  INSERT INTO session_turns (session_id) VALUES (p_session_id) ON CONFLICT (session_id) DO NOTHING;
  SELECT * INTO v_turns FROM session_turns t WHERE t.session_id = p_session_id FOR UPDATE;

  v_encounter := public.active_encounter(p_session_id);

  IF v_turns.acting_key = p_key THEN
    RETURN jsonb_build_object('wrapped', FALSE, 'round', v_encounter.round);
  END IF;
  IF v_turns.acting_key IS NOT NULL THEN
    RAISE EXCEPTION 'turn_taken';
  END IF;

  IF v_encounter.id IS NULL THEN
    -- Exploração: só o grupo tem vez, uma por rodada.
    SELECT c.* INTO v_character
    FROM characters c
    JOIN session_members m ON m.character_id = c.id
    WHERE p_key LIKE 'pc:%' AND c.id::text = substr(p_key, 4) AND m.session_id = p_session_id;

    IF v_character.id IS NULL THEN
      RAISE EXCEPTION 'not_in_play';
    END IF;
    IF public.pc_out_of_fight(v_character.conditions) THEN
      RAISE EXCEPTION 'out_of_fight';
    END IF;
    IF p_key = ANY (v_turns.acted) THEN
      RAISE EXCEPTION 'already_acted';
    END IF;
    v_name := v_character.name;
  ELSE
    IF v_encounter.pc_initiative IS NULL OR v_encounter.npc_initiative IS NULL THEN
      RAISE EXCEPTION 'initiative_pending';
    END IF;

    SELECT a.* INTO v_actor
    FROM encounter_actors a
    WHERE a.encounter_id = v_encounter.id AND public.turn_key(a.source, a.ref_id, a.id) = p_key
    LIMIT 1;

    IF v_actor.id IS NULL THEN
      RAISE EXCEPTION 'not_in_play';
    END IF;
    IF v_actor.defeated THEN
      RAISE EXCEPTION 'out_of_fight';
    END IF;

    -- A rodada pode ter fechado sem ninguém virá-la — o último goblin que
    -- faltava saiu da trilha. Quem assume a vez abre a seguinte.
    v_wrapped := public.close_round_if_done(p_session_id, v_encounter.id);
    IF v_wrapped THEN
      v_turns.acted := '{}';
      v_encounter.round := v_encounter.round + 1;
    END IF;

    IF p_key = ANY (v_turns.acted) THEN
      RAISE EXCEPTION 'already_acted';
    END IF;
    IF public.turn_side(v_encounter.id, v_turns.acted) IS DISTINCT FROM v_actor.source THEN
      RAISE EXCEPTION 'not_your_side';
    END IF;
    v_name := v_actor.name;
  END IF;

  UPDATE session_turns
  SET acting_key = p_key, acting_name = v_name, updated_at = now()
  WHERE session_id = p_session_id;

  RETURN jsonb_build_object('wrapped', v_wrapped, 'round', v_encounter.round);
END;
$$;

/**
 * Encerra a vez de quem está agindo e o marca como quem já agiu. No combate,
 * se ele era o último de pé, a rodada fecha aqui mesmo.
 *
 * O Mestre também pode chamar isto para quem não está agindo: é pular a vez
 * — o jogador sem o celular, quem chegou no meio da rodada.
 */
CREATE OR REPLACE FUNCTION public.end_turn(p_session_id UUID, p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gm        BOOLEAN;
  v_turns     session_turns%ROWTYPE;
  v_encounter encounters%ROWTYPE;
  v_wrapped   BOOLEAN := FALSE;
BEGIN
  v_gm := public.turn_caller_is_gm(p_session_id, p_key);

  INSERT INTO session_turns (session_id) VALUES (p_session_id) ON CONFLICT (session_id) DO NOTHING;
  SELECT * INTO v_turns FROM session_turns t WHERE t.session_id = p_session_id FOR UPDATE;

  IF v_turns.acting_key IS DISTINCT FROM p_key AND NOT v_gm THEN
    RAISE EXCEPTION 'not_your_turn';
  END IF;

  UPDATE session_turns
  SET acting_key  = CASE WHEN acting_key = p_key THEN NULL ELSE acting_key END,
      acting_name = CASE WHEN acting_key = p_key THEN NULL ELSE acting_name END,
      acted       = CASE WHEN p_key = ANY (acted) THEN acted ELSE array_append(acted, p_key) END,
      updated_at  = now()
  WHERE session_id = p_session_id;

  v_encounter := public.active_encounter(p_session_id);
  IF v_encounter.id IS NOT NULL THEN
    v_wrapped := public.close_round_if_done(p_session_id, v_encounter.id);
  END IF;

  RETURN jsonb_build_object(
    'wrapped', v_wrapped,
    'round', v_encounter.round + CASE WHEN v_wrapped THEN 1 ELSE 0 END
  );
END;
$$;

/** Uma rodada nova de exploração: a vez fica livre e todos voltam a ter a sua. Só o Mestre. */
CREATE OR REPLACE FUNCTION public.reset_turns(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.auth_discord_id() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF NOT public.is_session_gm(p_session_id) THEN
    RAISE EXCEPTION 'not_the_gm';
  END IF;

  INSERT INTO session_turns (session_id) VALUES (p_session_id)
  ON CONFLICT (session_id) DO UPDATE
    SET acting_key = NULL, acting_name = NULL, acted = '{}', updated_at = now();
END;
$$;

/**
 * O d6 do grupo. É um dado só para todos: qualquer um sentado à mesa rola,
 * e o Mestre rola por quem está sem o celular. Vale o primeiro — dois
 * jogadores tocando juntos, o segundo recebe 'initiative_rolled'.
 *
 * Devolve o d6 do Mestre, para quem rolou poder dizer à mesa quem começa.
 */
CREATE OR REPLACE FUNCTION public.set_party_initiative(p_encounter_id UUID, p_value INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller  TEXT := public.auth_discord_id();
  v_session UUID;
  v_foes    INTEGER;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_value IS NULL OR p_value NOT BETWEEN 1 AND 6 THEN
    RAISE EXCEPTION 'bad_roll';
  END IF;

  SELECT e.session_id INTO v_session
  FROM encounters e
  WHERE e.id = p_encounter_id AND e.status = 'active';

  IF v_session IS NULL THEN
    RAISE EXCEPTION 'encounter_not_found';
  END IF;

  IF NOT public.is_session_gm(v_session) AND NOT EXISTS (
    SELECT 1
    FROM session_members m
    JOIN characters c ON c.id = m.character_id
    WHERE m.session_id = v_session AND c.user_id = v_caller
  ) THEN
    RAISE EXCEPTION 'not_at_this_table';
  END IF;

  UPDATE encounters
  SET pc_initiative = p_value
  WHERE id = p_encounter_id AND pc_initiative IS NULL
  RETURNING npc_initiative INTO v_foes;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'initiative_rolled';
  END IF;
  RETURN v_foes;
END;
$$;

-- Os ajudantes só servem às funções acima, que rodam como dono.
REVOKE ALL ON FUNCTION public.pc_out_of_fight(JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.turn_key(TEXT, UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.turn_side(UUID, TEXT[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.close_round_if_done(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.turn_caller_is_gm(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.active_encounter(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_pc_actor_defeated() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pc_actor_defeated_on_insert() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.claim_turn(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.end_turn(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reset_turns(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_party_initiative(UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_turn(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_turn(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_turns(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_party_initiative(UUID, INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- Encontro novo, vez nova
-- ---------------------------------------------------------------------------

-- Abrir ou encerrar um encontro zera a vez: quem estava no meio de uma ação
-- de exploração não atravessa a iniciativa agindo, e quem agiu no último
-- turno de combate não sai dele já tendo agido na exploração. É um gatilho
-- para valer em todo caminho que abre encontro — o painel e a aba de cenas.
CREATE OR REPLACE FUNCTION public.reset_turns_with_encounter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;
  UPDATE session_turns
  SET acting_key = NULL, acting_name = NULL, acted = '{}', updated_at = now()
  WHERE session_id = NEW.session_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_turns_with_encounter() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS encounters_reset_turns ON encounters;
CREATE TRIGGER encounters_reset_turns
  AFTER INSERT OR UPDATE OF status ON encounters
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_turns_with_encounter();

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE session_turns;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
