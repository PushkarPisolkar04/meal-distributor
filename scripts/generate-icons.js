// Rasterizes the vector logo into the PNG assets Expo needs.
// Run once after changing the logo:  node scripts/generate-icons.js
// (sharp is only needed for this build step, not by the app at runtime.)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assets = path.join(__dirname, '..', 'assets');
const badge = fs.readFileSync(path.join(assets, 'logo-badge.svg'));
const glyph = fs.readFileSync(path.join(assets, 'logo-glyph.svg'));
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

async function full(svg, size, out) {
  await sharp(svg, { density: 512 }).resize(size, size).png().toFile(path.join(assets, out));
  console.log('wrote', out, size);
}

// Padded glyph on transparent canvas (Android adaptive foreground safe zone).
async function padded(svg, canvas, inner, out) {
  const pad = Math.round((canvas - inner) / 2);
  const art = await sharp(svg, { density: 512 })
    .resize(inner, inner, { fit: 'contain', background: transparent })
    .png()
    .toBuffer();
  await sharp({ create: { width: canvas, height: canvas, channels: 4, background: transparent } })
    .composite([{ input: art, top: pad, left: pad }])
    .png()
    .toFile(path.join(assets, out));
  console.log('wrote', out, canvas, `(inner ${inner})`);
}

(async () => {
  await full(badge, 1024, 'icon.png'); // iOS + general app icon
  await full(badge, 1024, 'splash-icon.png'); // native splash (full logo)
  await full(badge, 48, 'favicon.png'); // web
  await padded(glyph, 1024, 660, 'adaptive-icon.png'); // Android adaptive foreground
  console.log('done');
})();
