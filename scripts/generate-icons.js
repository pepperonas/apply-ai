#!/usr/bin/env node

/**
 * Generate Chrome Extension Icons
 * Creates PNG icons with red background and white "AI" text
 */

const fs = require('fs');
const path = require('path');

// SVG template for different sizes
function generateSVG(size) {
  const fontSize = Math.floor(size * 0.44);
  const borderRadius = Math.floor(size * 0.19);
  const textY = Math.floor(size * 0.66);
  const boltSize = Math.floor(size * 0.125);
  const boltX = Math.floor(size * 0.78);
  const boltY = Math.floor(size * 0.22);
  const boltRadius = Math.floor(size * 0.125);
  const boltFontSize = Math.floor(size * 0.156);
  const boltTextY = Math.floor(size * 0.28);

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Roter Hintergrund (Chrome On Steroids Red) -->
  <rect width="${size}" height="${size}" fill="#DC2626" rx="${borderRadius}"/>
  
  <!-- Weißer "AI" Text -->
  <text 
    x="${size/2}" 
    y="${textY}" 
    font-family="Arial, sans-serif" 
    font-size="${fontSize}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle"
    letter-spacing="-1">AI</text>
  
  <!-- Gelber Badge mit Blitz oben rechts -->
  <circle cx="${boltX}" cy="${boltY}" r="${boltRadius}" fill="#FCD34D"/>
  <text 
    x="${boltX}" 
    y="${boltTextY}" 
    font-family="Arial, sans-serif" 
    font-size="${boltFontSize}" 
    fill="#DC2626" 
    text-anchor="middle"
    font-weight="bold">⚡</text>
</svg>`;
}

// Generate icons
const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '../icons');

console.log('🎨 Generating Chrome On Steroids Icons...\n');

sizes.forEach(size => {
  const svg = generateSVG(size);
  const filename = `icon${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✅ Generated ${filename} (${size}x${size}px)`);
});

console.log('\n📝 Note: SVG icons created. For PNG conversion, use an online tool or imagemagick:');
console.log('   convert icon128.svg icon128.png');
console.log('   convert icon48.svg icon48.png');
console.log('   convert icon16.svg icon16.png');
console.log('\n🎯 Or use: https://cloudconvert.com/svg-to-png');
console.log('\n✨ Done! Icons saved to icons/ directory');
