const fs = require('fs');
const path = require('path');

const cardsDir = path.join(__dirname, 'public', 'assets', 'cards');
if (!fs.existsSync(cardsDir)) {
  fs.mkdirSync(cardsDir, { recursive: true });
}

// Card definitions with symbolic colors and motifs
const cards = [
  { name: 'the_fool.png', title: 'THE FOOL', num: '0', symbol: '🐾', color1: '#6366f1', color2: '#a855f7', desc: 'New Beginnings & Wonder' },
  { name: 'the_magician.png', title: 'THE MAGICIAN', num: 'I', symbol: '🪄', color1: '#ec4899', color2: '#8b5cf6', desc: 'Manifestation & Willpower' },
  { name: 'the_high_priestess.png', title: 'HIGH PRIESTESS', num: 'II', symbol: '🌙', color1: '#3b82f6', color2: '#1e1b4b', desc: 'Intuition & Secrets' },
  { name: 'the_empress.png', title: 'THE EMPRESS', num: 'III', symbol: '👑', color1: '#f59e0b', color2: '#10b981', desc: 'Abundance & Care' },
  { name: 'the_emperor.png', title: 'THE EMPEROR', num: 'IV', symbol: '🏛️', color1: '#ef4444', color2: '#7f1d1d', desc: 'Structure & Authority' },
  { name: 'the_hierophant.png', title: 'THE HIEROPHANT', num: 'V', symbol: '🗝️', color1: '#8b5cf6', color2: '#4c1d95', desc: 'Wisdom & Tradition' },
  { name: 'the_lovers.png', title: 'THE LOVERS', num: 'VI', symbol: '💖', color1: '#ec4899', color2: '#f43f5e', desc: 'Harmony & Choices' },
  { name: 'the_chariot.png', title: 'THE CHARIOT', num: 'VII', symbol: '⚔️', color1: '#0ea5e9', color2: '#0369a1', desc: 'Victory & Momentum' },
  { name: 'strength.png', title: 'STRENGTH', num: 'VIII', symbol: '🦁', color1: '#f97316', color2: '#b45309', desc: 'Gentle Inner Courage' },
  { name: 'the_hermit.png', title: 'THE HERMIT', num: 'IX', symbol: '🏮', color1: '#64748b', color2: '#1e293b', desc: 'Soul Searching Solitude' },
  { name: 'wheel_of_fortune.png', title: 'WHEEL OF FORTUNE', num: 'X', symbol: '☸️', color1: '#eab308', color2: '#ca8a04', desc: 'Cycles & Destiny' },
  { name: 'justice.png', title: 'JUSTICE', num: 'XI', symbol: '⚖️', color1: '#14b8a6', color2: '#0f766e', desc: 'Truth & Karma' },
  { name: 'the_hanged_man.png', title: 'THE HANGED MAN', num: 'XII', symbol: '🔮', color1: '#06b6d4', color2: '#0891b2', desc: 'Surrender & Clarity' },
  { name: 'death.png', title: 'DEATH & REBIRTH', num: 'XIII', symbol: '🦋', color1: '#475569', color2: '#0f172a', desc: 'Endings & New Dawn' },
  { name: 'temperance.png', title: 'TEMPERANCE', num: 'XIV', symbol: '🏺', color1: '#8b5cf6', color2: '#3b82f6', desc: 'Harmony & Balance' },
  { name: 'the_star.png', title: 'THE STAR', num: 'XVII', symbol: '⭐', color1: '#38bdf8', color2: '#1d4ed8', desc: 'Hope & Blessings' },
  { name: 'the_moon.png', title: 'THE MOON', num: 'XVIII', symbol: '🌕', color1: '#a855f7', color2: '#312e81', desc: 'Dreams & Intuition' },
  { name: 'the_sun.png', title: 'THE SUN', num: 'XIX', symbol: '☀️', color1: '#fbbf24', color2: '#f97316', desc: 'Joy & Radiance' },
  { name: 'judgement.png', title: 'JUDGEMENT', num: 'XX', symbol: '🎺', color1: '#c084fc', color2: '#7e22ce', desc: 'Calling & Awakening' },
  { name: 'the_world.png', title: 'THE WORLD', num: 'XXI', symbol: '🪐', color1: '#22c55e', color2: '#15803d', desc: 'Fulfillment & Completion' },
  { name: 'queen_of_wands.png', title: 'QUEEN OF WANDS', num: 'W', symbol: '🌻', color1: '#f59e0b', color2: '#d97706', desc: 'Vibrant Leadership' },
  { name: 'ace_of_cups.png', title: 'ACE OF CUPS', num: 'C', symbol: '🏆', color1: '#06b6d4', color2: '#0284c7', desc: 'Pure Affection & Peace' }
];

function generateCardSVG(c) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="480" viewBox="0 0 300 480">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.color1}"/>
      <stop offset="100%" stop-color="${c.color2}"/>
    </linearGradient>
    <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffd700"/>
      <stop offset="50%" stop-color="#fff275"/>
      <stop offset="100%" stop-color="#cca01d"/>
    </linearGradient>
    <radialGradient id="celestialGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Outer Card Frame -->
  <rect x="5" y="5" width="290" height="470" rx="18" fill="#1b122c" stroke="url(#goldBorder)" stroke-width="6"/>
  <!-- Inner Ornamental Inset -->
  <rect x="15" y="15" width="270" height="450" rx="14" fill="url(#bgGrad)" opacity="0.92"/>
  <rect x="22" y="22" width="256" height="436" rx="10" fill="none" stroke="url(#goldBorder)" stroke-width="1.8" stroke-dasharray="4,3"/>

  <!-- Mystic Header Number -->
  <text x="150" y="48" font-family="'Cinzel', Georgia, serif" font-size="20" font-weight="bold" fill="#fff275" text-anchor="middle" letter-spacing="3">${c.num}</text>

  <!-- Central Celestial Sphere -->
  <circle cx="150" cy="210" r="95" fill="url(#celestialGlow)"/>
  <circle cx="150" cy="210" r="85" fill="#120b22" stroke="url(#goldBorder)" stroke-width="2"/>

  <!-- Central Symbol / Cat Icon -->
  <text x="150" y="200" font-size="54" text-anchor="middle" dominant-baseline="middle">${c.symbol}</text>
  <text x="150" y="245" font-family="'Cinzel', Georgia, serif" font-size="12" fill="#ffd700" text-anchor="middle" letter-spacing="1">MEOW TAROT</text>

  <!-- Corner Ornamental Stars -->
  <text x="35" y="42" font-size="16" fill="#ffd700">✦</text>
  <text x="265" y="42" font-size="16" fill="#ffd700" text-anchor="end">✦</text>
  <text x="35" y="445" font-size="16" fill="#ffd700">✦</text>
  <text x="265" y="445" font-size="16" fill="#ffd700" text-anchor="end">✦</text>

  <!-- Title Banner -->
  <rect x="30" y="340" width="240" height="45" rx="8" fill="#110c1f" stroke="url(#goldBorder)" stroke-width="2"/>
  <text x="150" y="368" font-family="'Cinzel', Georgia, serif" font-size="16" font-weight="bold" fill="#fff275" text-anchor="middle" letter-spacing="2">${c.title}</text>

  <!-- Subtitle / Keyword -->
  <text x="150" y="415" font-family="'Quicksand', sans-serif" font-size="12" fill="#f3e8ff" text-anchor="middle" font-weight="500">${c.desc}</text>
</svg>`;
}

cards.forEach(c => {
  const filePath = path.join(cardsDir, c.name.replace('.png', '.svg'));
  fs.writeFileSync(filePath, generateCardSVG(c), 'utf8');
});

// Generate Card Back SVG
const cardBackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="480" viewBox="0 0 300 480">
  <defs>
    <linearGradient id="backGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#24143d"/>
      <stop offset="50%" stop-color="#140b24"/>
      <stop offset="100%" stop-color="#0a0512"/>
    </linearGradient>
    <linearGradient id="goldBack" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffd700"/>
      <stop offset="50%" stop-color="#ffe680"/>
      <stop offset="100%" stop-color="#b8860b"/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="290" height="470" rx="18" fill="url(#backGrad)" stroke="url(#goldBack)" stroke-width="6"/>
  <rect x="18" y="18" width="264" height="444" rx="12" fill="none" stroke="url(#goldBack)" stroke-width="2" stroke-dasharray="6,4"/>
  
  <!-- Sacred Geometry Sun & Moon Pattern -->
  <circle cx="150" cy="240" r="80" fill="none" stroke="url(#goldBack)" stroke-width="2"/>
  <circle cx="150" cy="240" r="60" fill="none" stroke="url(#goldBack)" stroke-width="1.5" stroke-dasharray="3,3"/>
  
  <!-- Cat eyes & Crescent Motif -->
  <path d="M 150 175 Q 195 240 150 305 Q 105 240 150 175 Z" fill="none" stroke="url(#goldBack)" stroke-width="2"/>
  <text x="150" y="248" font-size="44" text-anchor="middle" dominant-baseline="middle" fill="#ffd700">🐱</text>
  
  <text x="150" y="130" font-size="20" fill="#ffd700" text-anchor="middle">✧ ✦ ✧</text>
  <text x="150" y="355" font-size="20" fill="#ffd700" text-anchor="middle">✧ ✦ ✧</text>
  <text x="150" y="390" font-family="'Cinzel', Georgia, serif" font-size="13" font-weight="bold" fill="#fff275" text-anchor="middle" letter-spacing="3">MEOW MEOW</text>
  <text x="150" y="410" font-family="'Cinzel', Georgia, serif" font-size="11" fill="#dfc067" text-anchor="middle" letter-spacing="4">TAROT</text>
</svg>`;

fs.writeFileSync(path.join(cardsDir, 'card_back.svg'), cardBackSvg, 'utf8');

console.log('Generated all tarot cards and card back SVG successfully!');

