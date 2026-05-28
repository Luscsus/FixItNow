/**
 * Generates the PNG icon set required for the FixItNow PWA manifest.
 *
 * Outputs (all in frontend/public/icons/):
 *   icon-192.png            — standard 192×192
 *   icon-512.png            — standard 512×512
 *   icon-192-maskable.png   — 192×192 with 10% safe-zone padding
 *   icon-512-maskable.png   — 512×512 with 10% safe-zone padding
 *   apple-touch-icon-180.png — 180×180 for iOS home screen
 */

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, '..');

const srcSvg = readFileSync(resolve(root, 'public/icon.svg'), 'utf8');
const outDir = resolve(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

// The icon SVG is already 512×512 with a rounded-rect background that fills
// the whole canvas. For "any" purpose icons we render it at the target size
// directly. For maskable icons we need the content to sit within an 80% safe
// zone, so we scale it down and add a navy background behind it.

const NAVY = '#0f1b3d';

function makeSvgAtSize(size) {
  // Simply re-declare viewBox — the browser/renderer scales it.
  return srcSvg
    .replace(/width="\d+"/, `width="${size}"`)
    .replace(/height="\d+"/, `height="${size}"`);
}

function makeMaskableSvg(size) {
  // Pad to 10% on each side → content occupies 80% of the canvas.
  const pad    = size * 0.1;
  const inner  = size * 0.8;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${NAVY}"/>
  <image href="data:image/svg+xml;base64,${Buffer.from(makeSvgAtSize(Math.round(inner))).toString('base64')}"
         x="${pad}" y="${pad}" width="${inner}" height="${inner}"/>
</svg>`;
}

function render(svg, size, filename) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  });
  const pngData = resvg.render();
  const png     = pngData.asPng();
  writeFileSync(resolve(outDir, filename), png);
  console.log(`  ✓ icons/${filename}  (${png.length} bytes)`);
}

console.log('Generating PWA icons…\n');

render(makeSvgAtSize(192),       192, 'icon-192.png');
render(makeSvgAtSize(512),       512, 'icon-512.png');
render(makeMaskableSvg(192),     192, 'icon-192-maskable.png');
render(makeMaskableSvg(512),     512, 'icon-512-maskable.png');
render(makeSvgAtSize(180),       180, 'apple-touch-icon-180.png');

console.log('\nDone. All icons written to public/icons/');
