-- Migration 026: Add leonardo_element_id to characters table
--
-- Stores the akUUID of a trained Leonardo Element (LoRA fine-tune).
-- When set, generate-character-scenes worker uses elements:[{akUUID, weight:0.75}]
-- instead of imagePrompts — uses fast tokens only, no top-up credits required.
--
-- To find the UUID: click the element in Leonardo → copy from URL bar.
-- Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS leonardo_element_id TEXT;

COMMENT ON COLUMN characters.leonardo_element_id IS
  'akUUID of trained Leonardo Element (LoRA). When set, API uses elements[] path (fast tokens only).';
