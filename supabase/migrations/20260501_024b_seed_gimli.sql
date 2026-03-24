-- Migration 024b: Seed Gimli the Malamute
-- Gimli = 125-lb Alaskan Malamute, SomersSchool K-5 curriculum explainer
-- Reference images are in public/Gimli/ — Cloudinary URLs added after first deploy

INSERT INTO characters (
  slug,
  name,
  description,
  physical_description,
  art_style,
  negative_prompt,
  reference_images,
  hero_image_url,
  preferred_provider,
  is_active
) VALUES (
  'gimli',
  'Gimli',
  'SomersSchool''s K-5 curriculum explainer. 125-lb Alaskan Malamute. Reluctant but competent. Sighs before explaining. Secretly loves teaching.',
  'A large fluffy Alaskan Malamute dog with grey and white fur, stocky muscular build, thick double coat, expressive dark amber eyes, black nose, characteristic malamute facial markings with lighter face mask, sturdy paws, curled tail. He has a slightly grumpy but wise expression. Large and dignified.',
  'Pixar 3D animation style, vibrant colors, soft warm lighting, expressive cartoon face, clean backgrounds, child-friendly illustration, high quality render, detailed fur texture',
  'realistic photo, human, person, scary, dark, horror, deformed, ugly, blurry, low quality, watermark, text overlay',
  ARRAY[
    'https://chapterhouse.vercel.app/Gimli/gimli%20in%20field.png',
    'https://chapterhouse.vercel.app/Gimli/Gimli%20Determined%20.png',
    'https://chapterhouse.vercel.app/Gimli/Gimli%20Superhero.png'
  ],
  'https://chapterhouse.vercel.app/Gimli/Gimli%20Determined%20.png',
  'replicate',
  true
);
