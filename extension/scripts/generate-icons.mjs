import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { mkdirSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dir, '..', 'public');
mkdirSync(publicDir, { recursive: true });

const sizes = [16, 48, 128];

function makeSvg(size) {
  const cx = size / 2;
  const fontSize = Math.round(size * 0.5);
  const textY = Math.round(cx + fontSize * 0.36);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${cx}" cy="${cx}" r="${cx}" fill="hsl(32,95%,54%)"/>
    <text x="${cx}" y="${textY}" text-anchor="middle" font-size="${fontSize}" font-weight="800" font-family="system-ui,sans-serif" fill="white">W</text>
  </svg>`;
}

for (const size of sizes) {
  const svg = Buffer.from(makeSvg(size));
  const outPath = join(publicDir, `icon-${size}.png`);
  await sharp(svg).png().toFile(outPath);
  console.log(`[icons] generated icon-${size}.png`);
}
