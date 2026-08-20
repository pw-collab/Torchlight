-- Torchlight — condições e estados (§5.6 do plano de gameplay).
--
-- Não existia nada: quem estava cego, envenenado ou caído era lembrança de
-- alguém na mesa. Shadowdark tem uma lista curta, então o modelo é enxuto — um
-- array na própria ficha, não uma tabela. Cada entrada guarda o que a mesa
-- precisa saber:
--
--   [{ "id": "cego", "label": "Cego", "note": "névoa do santuário",
--      "appliedBy": "Mestre", "appliedAt": "2026-08-19T20:00:00Z" }]
--
-- `id` vem do catálogo em src/data/conditions quando é uma condição conhecida,
-- ou é gerado quando o Mestre escreve uma à mão — a lista do livro não fecha o
-- que pode acontecer numa mesa.

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS conditions JSONB NOT NULL DEFAULT '[]'::jsonb;
