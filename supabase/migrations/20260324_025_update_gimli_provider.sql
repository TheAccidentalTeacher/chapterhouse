-- Migration 025: Update Gimli's preferred_provider to 'leonardo'
--
-- Background: Replicate img2img (flux-dev) was tested and found to copy the reference
-- image composition rather than using it as style guidance. Leonardo Phoenix + RENDER_3D
-- style preset produces consistent 3D cartoon output that better matches ToonBee's
-- art direction. Within-job consistency principle: all slides in a production run
-- use the same provider + style settings.

UPDATE characters
SET preferred_provider = 'leonardo'
WHERE slug = 'gimli';
