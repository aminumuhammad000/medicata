import React from 'react';

interface MedicalWallpaperProps {
  isDark?: boolean;
  opacity?: number;
}

export const MedicalWallpaper: React.FC<MedicalWallpaperProps> = ({ 
  isDark = false,
  opacity: customOpacity
}) => {
  // Subtle WhatsApp-style doodle colors
  const strokeColor = isDark ? '%23ffffff' : '%230f172a';
  const accentColor = isDark ? '%2338bdf8' : '%232563eb';
  const fillDotColor = isDark ? '%2338bdf8' : '%232563eb';
  
  // Very low watermark-style opacity to feel like a subtle textured wallpaper
  const defaultOpacity = isDark ? '0.04' : '0.065';
  const opacity = customOpacity !== undefined ? customOpacity.toString() : defaultOpacity;

  // Crisp SVG pattern with healthcare & medical telemetry icons
  const patternSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320' viewBox='0 0 320 320' fill='none' stroke='${strokeColor}' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round' opacity='${opacity}'>
    <!-- 1. Stethoscope (top left) -->
    <g transform='translate(30, 25) rotate(-10)'>
      <path d='M4 3v5a4 4 0 0 0 8 0V3'/>
      <path d='M8 12v6a5 5 0 0 0 10 0v-3'/>
      <circle cx='18' cy='15' r='3' fill='${fillDotColor}' fill-opacity='0.25'/>
      <circle cx='4' cy='3' r='1.8' fill='${fillDotColor}'/>
      <circle cx='12' cy='3' r='1.8' fill='${fillDotColor}'/>
    </g>

    <!-- 2. Heart with EKG pulse (top center) -->
    <g transform='translate(145, 20) rotate(6)'>
      <path d='M16 4.5c-2.5-3-7-3-9.5 0-2.5 3-2.5 8 0 11l9.5 9.5 9.5-9.5c2.5-3 2.5-8 0-11-2.5-3-7-3-9.5 0z' fill='${fillDotColor}' fill-opacity='0.15'/>
      <path d='M6 13h4l2-5 3 9 2-4h5' stroke='${accentColor}' stroke-width='2'/>
    </g>

    <!-- 3. Pill Capsule (top right) -->
    <g transform='translate(250, 28) rotate(35)'>
      <rect x='2' y='2' width='12' height='24' rx='6' fill='${fillDotColor}' fill-opacity='0.2'/>
      <line x1='2' y1='14' x2='14' y2='14' stroke='${accentColor}' stroke-width='2'/>
      <circle cx='8' cy='8' r='1.5' fill='${strokeColor}'/>
    </g>

    <!-- 4. Medical Cross in Rounded Box (mid left) -->
    <g transform='translate(35, 120) rotate(4)'>
      <rect x='2' y='2' width='24' height='24' rx='6' fill='${fillDotColor}' fill-opacity='0.15'/>
      <path d='M14 7v14M7 14h14' stroke='${accentColor}' stroke-width='2.2'/>
    </g>

    <!-- 5. DNA Helix (center) -->
    <g transform='translate(150, 115) rotate(-15)'>
      <path d='M4 4c5 5 5 12 0 17s-5 12 0 17' stroke='${accentColor}' stroke-width='2'/>
      <path d='M16 4c-5 5-5 12 0 17s5 12 0 17'/>
      <line x1='5' y1='8' x2='15' y2='8'/>
      <line x1='4' y1='21' x2='16' y2='21'/>
      <line x1='5' y1='34' x2='15' y2='34'/>
      <circle cx='10' cy='14' r='1.5' fill='${fillDotColor}'/>
      <circle cx='10' cy='28' r='1.5' fill='${fillDotColor}'/>
    </g>

    <!-- 6. Syringe (mid right) -->
    <g transform='translate(255, 125) rotate(-40)'>
      <path d='m15 4 5 5-10 10-5-5z' fill='${fillDotColor}' fill-opacity='0.15'/>
      <line x1='14' y1='1' x2='19' y2='6' stroke-width='2'/>
      <line x1='5' y1='19' x2='1' y2='23' stroke-width='2'/>
      <line x1='8' y1='11' x2='11' y2='14'/>
      <line x1='10' y1='9' x2='13' y2='12'/>
    </g>

    <!-- 7. Shield Security Check (bottom left) -->
    <g transform='translate(35, 215) rotate(8)'>
      <path d='M14 26s10-5 10-12V6l-10-4-10 4v8c0 7 10 12 10 12z' fill='${fillDotColor}' fill-opacity='0.15'/>
      <path d='m10 14 3 3 5-5' stroke='${accentColor}' stroke-width='2.2'/>
    </g>

    <!-- 8. Thermometer (bottom center) -->
    <g transform='translate(150, 225) rotate(40)'>
      <path d='M12 15V4a3 3 0 0 0-6 0v11a5 5 0 1 0 6 0z' fill='${fillDotColor}' fill-opacity='0.2'/>
      <circle cx='9' cy='19' r='2.5' fill='${strokeColor}'/>
      <line x1='9' y1='8' x2='9' y2='14' stroke-width='2'/>
    </g>

    <!-- 9. Bandage / Plaster (bottom right) -->
    <g transform='translate(250, 220) rotate(-15)'>
      <rect x='2' y='6' width='26' height='12' rx='6' fill='${fillDotColor}' fill-opacity='0.2'/>
      <rect x='10' y='6' width='10' height='12' fill='${fillDotColor}' fill-opacity='0.3'/>
      <circle cx='12' cy='12' r='1' fill='${strokeColor}'/>
      <circle cx='15' cy='12' r='1' fill='${strokeColor}'/>
      <circle cx='18' cy='12' r='1' fill='${strokeColor}'/>
    </g>

    <!-- 10. Microscope / Lab Flask (interstitial) -->
    <g transform='translate(95, 75) rotate(-5)'>
      <path d='M6 2v6l-4 8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l-4-8V2' fill='${fillDotColor}' fill-opacity='0.15'/>
      <line x1='5' y1='2' x2='13' y2='2' stroke-width='2'/>
      <circle cx='9' cy='13' r='1.5' fill='${fillDotColor}'/>
    </g>

    <!-- 11. Pulse Wave & Sparkles (accents) -->
    <g transform='translate(205, 80)'>
      <path d='M0 6h4l2-4 3 8 2-4h5' stroke='${accentColor}' stroke-width='1.8'/>
    </g>
    <g transform='translate(95, 175)'>
      <path d='M4 0v8M0 4h8' stroke='${accentColor}' stroke-width='1.8'/>
    </g>
    <g transform='translate(205, 180)'>
      <circle cx='3' cy='3' r='2.5' fill='${fillDotColor}' fill-opacity='0.6'/>
    </g>
    <g transform='translate(100, 275)'>
      <path d='M10 2a3 3 0 0 0-3 3c0 2 3 5 3 5s3-3 3-5a3 3 0 0 0-3-3z' fill='${fillDotColor}' fill-opacity='0.3'/>
    </g>
    <g transform='translate(205, 275)'>
      <path d='M3 0v6M0 3h6' stroke='${accentColor}' stroke-width='1.8'/>
    </g>
  </svg>`;

  const bgDataUri = `url("data:image/svg+xml;utf8,${patternSvg.replace(/[\n\r\t]/g, '').replace(/"/g, "'")}")`;

  return (
    <div
      className="fixed inset-0 pointer-events-none transition-all duration-700 z-[-1]"
      style={{
        backgroundImage: bgDataUri,
        backgroundRepeat: 'repeat',
        backgroundSize: '320px 320px'
      }}
    />
  );
};
