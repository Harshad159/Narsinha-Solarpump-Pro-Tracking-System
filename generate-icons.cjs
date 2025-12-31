const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create a professional solar pump icon with blue gradient
async function generateIcon(size, outputPath) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="sun" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.1}"/>
      
      <!-- Sun rays -->
      <g transform="translate(${size/2}, ${size * 0.35})">
        <circle r="${size * 0.18}" fill="url(#sun)" opacity="0.3"/>
        <circle r="${size * 0.12}" fill="url(#sun)"/>
        ${Array.from({length: 8}, (_, i) => {
          const angle = (i * 45) * Math.PI / 180;
          const x1 = Math.cos(angle) * size * 0.15;
          const y1 = Math.sin(angle) * size * 0.15;
          const x2 = Math.cos(angle) * size * 0.24;
          const y2 = Math.sin(angle) * size * 0.24;
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fbbf24" stroke-width="${size * 0.015}" stroke-linecap="round"/>`;
        }).join('')}
      </g>
      
      <!-- Water drops -->
      <g transform="translate(${size * 0.5}, ${size * 0.7})">
        <ellipse cx="0" cy="0" rx="${size * 0.2}" ry="${size * 0.25}" fill="#3b82f6" opacity="0.9"/>
        <ellipse cx="0" cy="-${size * 0.05}" rx="${size * 0.15}" ry="${size * 0.18}" fill="#60a5fa" opacity="0.7"/>
        <ellipse cx="0" cy="-${size * 0.08}" rx="${size * 0.08}" ry="${size * 0.1}" fill="#93c5fd" opacity="0.5"/>
      </g>
      
      <!-- Letter N stylized -->
      <text x="${size * 0.5}" y="${size * 0.85}" 
            font-family="Arial Black, sans-serif" 
            font-size="${size * 0.15}" 
            font-weight="bold"
            fill="white" 
            text-anchor="middle">N</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
  
  console.log(`✅ Generated ${outputPath} (${size}x${size})`);
}

async function main() {
  const publicDir = path.join(__dirname, 'public');
  
  // Generate required icon sizes
  await generateIcon(192, path.join(publicDir, 'icon-192.png'));
  await generateIcon(512, path.join(publicDir, 'icon-512.png'));
  
  console.log('\n✅ All icons generated successfully!');
  console.log('📦 Ready for PWABuilder packaging\n');
}

main().catch(console.error);
