-- Migration 025: Add trigger_word to characters table
-- Leonardo LoRA Elements require a trigger word in the generation prompt to activate.
-- Without the trigger word, passing the Element UUID does nothing — the fine-tune is ignored.
-- Example: Gimli Element trigger word = 'foil'
-- Code prepends this to the enhanced prompt before sending to Leonardo.

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS trigger_word TEXT;

COMMENT ON COLUMN characters.trigger_word IS 'Leonardo LoRA trigger word — must appear in prompt for Element to activate. E.g. "foil" for Gimli.';
