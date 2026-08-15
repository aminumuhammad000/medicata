import React from 'react';

interface MedicalWallpaperProps {
  isDark?: boolean;
}

export const MedicalWallpaper: React.FC<MedicalWallpaperProps> = ({ isDark = false }) => {
  const strokeColor = isDark ? '%23ffffff' : '%232875d8';
  const opacity = isDark ? '0.045' : '0.055';

  // Crisp SVG pattern with WhatsApp-style health icons (stethoscope, pills, heartbeat, DNA, medical cross, thermometer, syringe, bandage, shield, sparkles)
  const patternSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280' fill='none' stroke='${strokeColor}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' opacity='${opacity}'>
    <!-- 1. Stethoscope (top left) -->
    <g transform='translate(25, 25) rotate(-12)'>
      <path d='M4 3v4a4 4 0 0 0 8 0V3'/>
      <path d='M8 11v6a5 5 0 0 0 10 0v-2'/>
      <circle cx='18' cy='13' r='2'/>
      <circle cx='4' cy='3' r='1.5'/>
      <circle cx='12' cy='3' r='1.5'/>
    </g>

    <!-- 2. Heart with EKG pulse (top center) -->
    <g transform='translate(120, 20) rotate(8)'>
      <path d='M16 4.5c-2.5-3-7-3-9.5 0-2.5 3-2.5 8 0 11l9.5 9.5 9.5-9.5c2.5-3 2.5-8 0-11-2.5-3-7-3-9.5 0z'/>
      <path d='M7 13h4l2-4 3 8 2-4h4'/>
    </g>

    <!-- 3. Pill Capsule (top right) -->
    <g transform='translate(220, 30) rotate(35)'>
      <rect x='2' y='2' width='10' height='20' rx='5'/>
      <line x1='2' y1='12' x2='12' y2='12'/>
      <circle cx='7' cy='7' r='1' fill='${strokeColor}'/>
    </g>

    <!-- 4. Medical Cross / First Aid (mid left) -->
    <g transform='translate(35, 110) rotate(5)'>
      <rect x='2' y='2' width='20' height='20' rx='4'/>
      <path d='M12 7v10M7 12h10'/>
    </g>

    <!-- 5. DNA Helix (center) -->
    <g transform='translate(130, 105) rotate(-20)'>
      <path d='M3 3c4 4 4 10 0 14s-4 10 0 14'/>
      <path d='M13 3c-4 4-4 10 0 14s4 10 0 14'/>
      <line x1='4' y1='7' x2='12' y2='7'/>
      <line x1='3' y1='17' x2='13' y2='17'/>
      <line x1='4' y1='27' x2='12' y2='27'/>
    </g>

    <!-- 6. Syringe (mid right) -->
    <g transform='translate(225, 115) rotate(-40)'>
      <path d='m14 4 4 4-9 9-4-4z'/>
      <line x1='13' y1='1' x2='17' y2='5'/>
      <line x1='5' y1='17' x2='1' y2='21'/>
      <line x1='8' y1='10' x2='10' y2='12'/>
    </g>

    <!-- 7. Shield Check (bottom left) -->
    <g transform='translate(25, 195) rotate(10)'>
      <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/>
      <path d='m9 12 2 2 4-4'/>
    </g>

    <!-- 8. Thermometer (bottom center) -->
    <g transform='translate(125, 205) rotate(45)'>
      <path d='M10 13.5V4a2 2 0 0 0-4 0v9.5a4 4 0 1 0 4 0z'/>
      <circle cx='8' cy='17' r='1.5' fill='${strokeColor}'/>
    </g>

    <!-- 9. Bandage / Plaster (bottom right) -->
    <g transform='translate(220, 200) rotate(-15)'>
      <rect x='2' y='6' width='22' height='10' rx='5'/>
      <circle cx='10' cy='11' r='0.8' fill='${strokeColor}'/>
      <circle cx='13' cy='11' r='0.8' fill='${strokeColor}'/>
      <circle cx='16' cy='11' r='0.8' fill='${strokeColor}'/>
    </g>

    <!-- 10. Little Sparkles & Drops (faint accents) -->
    <g transform='translate(80, 70)'>
      <path d='M4 0v8M0 4h8'/>
    </g>
    <g transform='translate(190, 75)'>
      <circle cx='3' cy='3' r='2'/>
    </g>
    <g transform='translate(80, 160)'>
      <circle cx='2' cy='2' r='1.5'/>
    </g>
    <g transform='translate(180, 165)'>
      <path d='M3 0v6M0 3h6'/>
    </g>
    <g transform='translate(85, 245)'>
      <path d='M12 2a4 4 0 0 0-4 4c0 3 4 7 4 7s4-4 4-7a4 4 0 0 0-4-4z' transform='scale(0.7)'/>
    </g>
  </svg>`;

  const bgDataUri = `url("data:image/svg+xml;utf8,${patternSvg.replace(/[\n\r\t]/g, '').replace(/"/g, "'")}")`;

  return (
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-700"
      style={{
        backgroundImage: bgDataUri,
        backgroundRepeat: 'repeat',
        backgroundSize: '280px 280px'
      }}
    />
  );
};
