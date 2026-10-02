-- 002_save_sequence.sql
-- VistaBite Phase 1C: Add save_sequence to saved_spots
--
-- save_sequence is the permanent personal save number (#1, #2, #3...)
-- It is assigned at INSERT time using a per-user transaction lock.
-- It NEVER changes on edit/move, and NEVER gets renumbered on delete.
-- UNIQUE(user_id, save_sequence) enforces per-user uniqueness.

BEGIN;

-- 1. Add save_sequence column (nullable first so existing rows don't violate NOT NULL)
ALTER TABLE saved_spots
  ADD COLUMN IF NOT EXISTS save_sequence INTEGER;

-- 2. Backfill existing rows: assign sequence ordered by created_at, then id (stable tiebreak)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY created_at ASC, id ASC
    ) AS seq
  FROM saved_spots
  WHERE save_sequence IS NULL
)
UPDATE saved_spots ss
SET save_sequence = ranked.seq
FROM ranked
WHERE ss.id = ranked.id;

-- 3. Now that all rows have a value, enforce NOT NULL
ALTER TABLE saved_spots
  ALTER COLUMN save_sequence SET NOT NULL;

-- 4. Enforce per-user uniqueness
ALTER TABLE saved_spots
  DROP CONSTRAINT IF EXISTS uq_saved_spots_user_sequence;

ALTER TABLE saved_spots
  ADD CONSTRAINT uq_saved_spots_user_sequence UNIQUE (user_id, save_sequence);

-- 5. Supporting index for fast sequence lookup (used during INSERT)
CREATE INDEX IF NOT EXISTS idx_saved_spots_user_sequence
  ON saved_spots(user_id, save_sequence);

COMMIT;
