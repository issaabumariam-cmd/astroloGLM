const fs = require("fs");
const path = require("path");

// Generate PWA icons as SVG files (Next.js supports SVG icons)
// We'll create both PNG placeholders via SVG data URLs and actual SVG files

const PUBLIC = path.join(__dirname, "..", "public");

// SVG icon with zodiac wheel
function createIconSVG(size) {
  const signs = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
  const center = size / 2;
  const radius = size / 2 - 4;
  const fontSize = Math.round(size / 16);

  let signTexts = "";
  signs.forEach((sign, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    signTexts += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" fill="#8b7355" opacity="0.7" font-family="serif">${sign}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.1}" fill="#faf7f2"/>
  <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#8b7355" stroke-width="${size * 0.005}" opacity="0.3"/>
  <circle cx="${center}" cy="${center}" r="${radius - size * 0.06}" fill="none" stroke="#8b7355" stroke-width="${size * 0.003}" opacity="0.2"/>
  ${signTexts}
  <circle cx="${center}" cy="${center}" r="${size * 0.02}" fill="#8b7355" opacity="0.5"/>
</svg>`;
}

// Write SVG icons
fs.writeFileSync(path.join(PUBLIC, "icon-192.svg"), createIconSVG(192), "utf-8");
fs.writeFileSync(path.join(PUBLIC, "icon-512.svg"), createIconSVG(512), "utf-8");

// Also create an apple-touch-icon
fs.writeFileSync(path.join(PUBLIC, "apple-icon.svg"), createIconSVG(180), "utf-8");

// Create a favicon SVG (simplified — just the zodiac wheel)
fs.writeFileSync(path.join(PUBLIC, "favicon.svg"), createIconSVG(64), "utf-8");

// Create maskable icon (same but with more padding for safe area)
function createMaskableSVG(size) {
  const signs = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
  const center = size / 2;
  const radius = size * 0.35; // smaller for safe zone
  const fontSize = Math.round(size / 20);

  let signTexts = "";
  signs.forEach((sign, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    signTexts += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" fill="#8b7355" opacity="0.7" font-family="serif">${sign}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#faf7f2"/>
  <circle cx="${center}" cy="${center}" r="${radius + 8}" fill="none" stroke="#8b7355" stroke-width="${size * 0.005}" opacity="0.3"/>
  ${signTexts}
  <circle cx="${center}" cy="${center}" r="${size * 0.02}" fill="#8b7355" opacity="0.5"/>
</svg>`;
}

fs.writeFileSync(path.join(PUBLIC, "icon-maskable-192.svg"), createMaskableSVG(192), "utf-8");
fs.writeFileSync(path.join(PUBLIC, "icon-maskable-512.svg"), createMaskableSVG(512), "utf-8");

console.log("✅ PWA icons generated:");
fs.readdirSync(PUBLIC).filter(f => f.includes("icon") || f.includes("favicon")).forEach(f => {
  const stat = fs.statSync(path.join(PUBLIC, f));
  console.log("  " + f + " (" + stat.size + " bytes)");
});