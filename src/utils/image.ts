/**
 * Converts Google Drive shareable URLs into direct viewing URLs
 */
export function formatImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }

  const clean = url.trim();

  // Match /file/d/FILE_ID
  const matchFileD = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    return `https://drive.google.com/thumbnail?id=${matchFileD[1]}&sz=w800`;
  }

  // Match id=FILE_ID
  const matchId = clean.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) {
    return `https://drive.google.com/thumbnail?id=${matchId[1]}&sz=w800`;
  }

  return clean;
}

/**
 * Returns an inline SVG placeholder when no asset image is provided
 */
export function getCategoryPlaceholder(category: string): string {
  const cat = (category || '').toLowerCase();

  if (cat.includes('furniture')) {
    // Desk & chair silhouette placeholder
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="100%" height="100%">
        <rect width="160" height="120" fill="#f0f0f0" />
        <rect x="25" y="45" width="110" height="8" rx="2" fill="#888888" />
        <rect x="35" y="53" width="6" height="50" fill="#aaaaaa" />
        <rect x="119" y="53" width="6" height="50" fill="#aaaaaa" />
        <rect x="65" y="25" width="30" height="35" rx="3" fill="#666666" />
        <rect x="70" y="60" width="20" height="25" fill="#999999" />
        <text x="80" y="112" font-size="10" font-family="sans-serif" text-anchor="middle" fill="#555555">FURNITURE</text>
      </svg>
    `);
  }

  if (cat.includes('fixture')) {
    // Lamp / wall fixture placeholder
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="100%" height="100%">
        <rect width="160" height="120" fill="#f0f0f0" />
        <polygon points="80,25 55,55 105,55" fill="#777777" />
        <rect x="77" y="55" width="6" height="40" fill="#aaaaaa" />
        <ellipse cx="80" cy="95" rx="22" ry="6" fill="#888888" />
        <text x="80" y="112" font-size="10" font-family="sans-serif" text-anchor="middle" fill="#555555">FIXTURE</text>
      </svg>
    `);
  }

  // Equipment (Monitor / Tech)
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="100%" height="100%">
      <rect width="160" height="120" fill="#f0f0f0" />
      <rect x="35" y="25" width="90" height="55" rx="4" fill="#555555" />
      <rect x="42" y="32" width="76" height="41" fill="#ffffff" />
      <rect x="76" y="80" width="8" height="16" fill="#777777" />
      <rect x="58" y="96" width="44" height="6" rx="2" fill="#777777" />
      <text x="80" y="112" font-size="10" font-family="sans-serif" text-anchor="middle" fill="#555555">EQUIPMENT</text>
    </svg>
  `);
}

/**
 * Extracts initials from an employee name for avatar display
 */
export function getInitials(name: string | undefined | null): string {
  if (!name || typeof name !== 'string') return 'EM';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'EM';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
