// Rasterizes the vector logo into the PNG assets Expo needs.
// Run once after changing the logo:  node scripts/generate-icons.js
// (sharp is only needed for this build step, not by the app at runtime.)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assets = path.join(__dirname, '..', 'assets');
const badge = fs.readFileSync(path.join(assets, 'logo-badge.svg'));
const glyph = fs.readFileSync(path.join(assets, 'logo-glyph.svg'));

async function render(svg, size, out) {
  await sharp(svg, { density: 512 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(assets, out));
  console.log('wrote', out, size);
}

(async () => {
  await render(badge, 1024, 'icon.png'); // iOS + general app icon
  await render(glyph, 1024, 'adaptive-icon.png'); // Android adaptive foreground
  await render(glyph, 1024, 'splash-icon.png'); // native splash image
  await render(badge, 48, 'favicon.png'); // web
  console.log('done');
})();
