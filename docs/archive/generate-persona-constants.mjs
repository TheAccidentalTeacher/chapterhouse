/**
 * Reads all persona .md files from the Ai-Agent/personas directory
 * and generates TypeScript files with exported string constants.
 *
 * Run: node generate-persona-constants.mjs
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';

const PERSONAS_DIR = String.raw`C:\Users\Valued Customer\Dropbox\Websites\AI Agents\Ai-Agent\personas`;
const OUTPUT_DIR = join(process.cwd(), 'personas-ts');

function toConstName(filename) {
  // analyst.md -> ANALYST
  // classical-educator-research.md -> CLASSICAL_EDUCATOR_RESEARCH
  return basename(filename, extname(filename))
    .toUpperCase()
    .replace(/-/g, '_');
}

function escapeForTemplate(content) {
  // Escape backticks and ${} inside template literals
  return content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const files = (await readdir(PERSONAS_DIR))
    .filter(f => f.endsWith('.md'))
    .sort();

  console.log(`Found ${files.length} persona files.\n`);

  const mainPersonas = [];
  const researchPersonas = [];

  for (const file of files) {
    const filePath = join(PERSONAS_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    const constName = toConstName(file);
    const escaped = escapeForTemplate(content);

    // Write individual file
    const tsContent = `// Auto-generated from ${file}\nexport const ${constName} = \`${escaped}\`;\n`;
    const outFile = join(OUTPUT_DIR, basename(file, '.md') + '.ts');
    await writeFile(outFile, tsContent, 'utf-8');
    console.log(`  ✅ ${file} -> ${basename(outFile)} (const ${constName})`);

    if (file.includes('research')) {
      researchPersonas.push({ file, constName, outFile: basename(outFile) });
    } else {
      mainPersonas.push({ file, constName, outFile: basename(outFile) });
    }
  }

  // Generate index.ts that re-exports everything
  let indexContent = '// Auto-generated index — re-exports all persona constants\n\n';
  indexContent += '// === Main Personas ===\n';
  for (const p of mainPersonas) {
    indexContent += `export { ${p.constName} } from './${basename(p.outFile, '.ts')}';\n`;
  }
  indexContent += '\n// === Research Companions ===\n';
  for (const p of researchPersonas) {
    indexContent += `export { ${p.constName} } from './${basename(p.outFile, '.ts')}';\n`;
  }

  await writeFile(join(OUTPUT_DIR, 'index.ts'), indexContent, 'utf-8');
  console.log(`\n  ✅ index.ts (re-exports all ${files.length} constants)`);
  console.log(`\nDone! Output in: ${OUTPUT_DIR}`);
}

main().catch(console.error);
