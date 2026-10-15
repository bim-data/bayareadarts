// Minimalist "Dart" Golf Logo (Slate, Emerald, White, Red)
const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
  </defs>
  <!-- Background -->
  <circle cx="200" cy="200" r="200" fill="url(#bg)"/>
  
  <!-- Bullseye Green -->
  <circle cx="200" cy="270" r="120" fill="#064e3b"/>
  <circle cx="200" cy="270" r="85" fill="#059669"/>
  <circle cx="200" cy="270" r="50" fill="#10b981"/>
  <circle cx="200" cy="270" r="20" fill="#34d399"/>
  
  <!-- The Hole -->
  <circle cx="200" cy="270" r="12" fill="#0f172a"/>
  
  <!-- The Pin -->
  <rect x="196" y="80" width="8" height="190" fill="#f8fafc" rx="4"/>
  <path d="M204 90 L290 125 L204 160 Z" fill="#ef4444"/>
  
  <!-- Ball Flight Trail -->
  <path d="M50 70 Q 110 150 145 240" fill="none" stroke="#f8fafc" stroke-width="6" stroke-dasharray="12 12" stroke-linecap="round"/>
  
  <!-- The Golf Ball -->
  <circle cx="152" cy="255" r="16" fill="#ffffff"/>
  <circle cx="148" cy="251" r="4" fill="#e2e8f0"/>
</svg>
`;

// Minimalist Bay Area Fairway Banner (Slate, Amber, Emerald, Deep Green)
const bannerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
  </defs>
  
  <!-- Sky Background -->
  <rect width="1200" height="400" fill="url(#sky)"/>
  
  <!-- Sunset -->
  <circle cx="600" cy="240" r="140" fill="#f59e0b" opacity="0.8"/>
  <circle cx="600" cy="240" r="100" fill="#fbbf24" opacity="0.9"/>
  
  <!-- Minimalist Bridge Silhouette -->
  <g opacity="0.4" fill="#0f172a">
    <!-- Bridge Deck -->
    <rect x="0" y="250" width="1200" height="10" />
    <!-- Left Tower -->
    <rect x="230" y="140" width="20" height="110" />
    <!-- Right Tower -->
    <rect x="950" y="140" width="20" height="110" />
  </g>
  <g opacity="0.4" fill="none" stroke="#0f172a" stroke-width="6">
    <!-- Cables -->
    <path d="M0 140 Q 240 260 240 140" />
    <path d="M240 140 Q 600 270 960 140" />
    <path d="M960 140 Q 1200 260 1200 140" />
  </g>

  <!-- Rolling Fairway Hills -->
  <path d="M-100 280 Q 300 210 700 320 T 1300 260 L 1300 400 L -100 400 Z" fill="#064e3b"/>
  <path d="M-100 330 Q 400 270 800 370 T 1300 310 L 1300 400 L -100 400 Z" fill="#059669"/>
  <path d="M-100 400 Q 500 320 1000 420 L -100 420 Z" fill="#10b981"/>
  
  <!-- Minimalist Pin on the Fairway -->
  <rect x="800" y="270" width="4" height="60" fill="#f8fafc" rx="2"/>
  <path d="M804 275 L840 290 L804 305 Z" fill="#ef4444"/>
</svg>
`;

// Minimalist Dart Sniper Badge
const sniperBadgeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
  </defs>
  <circle cx="200" cy="200" r="200" fill="url(#bg)"/>
  
  <!-- Target Rings -->
  <circle cx="200" cy="200" r="140" fill="none" stroke="#ef4444" stroke-width="8" stroke-dasharray="20 10"/>
  <circle cx="200" cy="200" r="90" fill="none" stroke="#10b981" stroke-width="12"/>
  <circle cx="200" cy="200" r="30" fill="#ef4444"/>
  
  <!-- Crosshairs -->
  <path d="M200 20 L200 100 M200 300 L200 380 M20 200 L100 200 M300 200 L380 200" stroke="#f8fafc" stroke-width="8" stroke-linecap="round"/>
</svg>
`;

export const dartsLogo = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg.trim())}`;
export const fairwayBanner = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(bannerSvg.trim())}`;
export const sniperBadge = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sniperBadgeSvg.trim())}`;
