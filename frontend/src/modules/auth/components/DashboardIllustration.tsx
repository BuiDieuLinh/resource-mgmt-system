export function DashboardIllustration() {
  const rings = [100, 148, 196, 244];
  const orbiters = [
    { r: 148, size: 7, color: '#a855f7', duration: 8, start: 0 },
    { r: 196, size: 5, color: '#60a5fa', duration: 12, start: 60 },
    { r: 244, size: 6, color: '#34d399', duration: 16, start: 120 },
    { r: 148, size: 4, color: '#f472b6', duration: 10, start: 200 },
    { r: 196, size: 8, color: '#fbbf24', duration: 14, start: 300 },
  ];

  return (
    <svg
      viewBox="0 0 420 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 380 }}
    >
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="210" cy="210" r="210" fill="url(#bgGlow)" />

      {rings.map((r) => (
        <circle
          key={r}
          cx="210"
          cy="210"
          r={r}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
          fill="none"
        />
      ))}

      <circle
        cx="210"
        cy="210"
        r="244"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth="1"
        strokeDasharray="4 8"
        fill="none"
      />

      <circle cx="210" cy="210" r="80" fill="url(#centerGlow)" />

      <rect
        x="186"
        y="186"
        width="48"
        height="48"
        rx="14"
        fill="rgba(109,40,217,0.5)"
        stroke="rgba(168,85,247,0.4)"
        strokeWidth="1"
      />
      <g>
        <rect x="206" y="196" width="8" height="8" rx="2" fill="white" opacity="0.9" />
        <rect x="197" y="210" width="8" height="8" rx="2" fill="white" opacity="0.6" />
        <rect x="215" y="210" width="8" height="8" rx="2" fill="white" opacity="0.6" />
        <line x1="210" y1="204" x2="201" y2="210" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <line x1="210" y1="204" x2="219" y2="210" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      </g>

      {orbiters.map((o, i) => (
        <circle
          key={i}
          cx={210 + o.r}
          cy="210"
          r={o.size}
          fill={o.color}
          opacity="0.85"
          transform={`rotate(${o.start} 210 210)`}
        />
      ))}

      {orbiters.map((o, i) => (
        <circle
          key={`halo-${i}`}
          cx={210 + o.r}
          cy="210"
          r={o.size + 4}
          fill={o.color}
          opacity="0.15"
          transform={`rotate(${o.start} 210 210)`}
        />
      ))}

      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const r = 196;
        const x1 = 210 + (r - 6) * Math.cos(rad);
        const y1 = 210 + (r - 6) * Math.sin(rad);
        const x2 = 210 + (r + 6) * Math.cos(rad);
        const y2 = 210 + (r + 6) * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
