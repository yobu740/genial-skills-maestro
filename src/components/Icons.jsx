/* Icon set — recreated to echo the visual style of the original sidebar icons (simple, flat, recognizable). */

const Ic = {
  // Sidebar — match original Genial Skills nav glyphs
  inicio: (p) =>
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}>
      <path d="M14.3 3.3a3 3 0 0 0-4.6 0L3.5 10.1c-.3.3-.5.7-.5 1.1V20a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1v-8.8c0-.4-.2-.8-.5-1.1L14.3 3.3z" />
    </svg>,

  estudiante: (p) =>
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}>
      <circle cx="12" cy="7.5" r="4" />
      <path d="M3.5 20.5c.6-4 4.2-7 8.5-7s7.9 3 8.5 7c.1.5-.3 1-.8 1H4.3c-.5 0-.9-.5-.8-1z" />
    </svg>,

  grupos: (p) =>
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" {...p}>
      <circle cx="12" cy="8" r="3" />
      <circle cx="5.5" cy="9.5" r="2.5" />
      <circle cx="18.5" cy="9.5" r="2.5" />
      <path d="M12 12c-3 0-5.5 1.8-6 4.4-.1.6.4 1.1 1 1.1h10c.6 0 1.1-.5 1-1.1-.5-2.6-3-4.4-6-4.4z" />
      <path d="M5.5 13c-2 0-3.7 1.1-4.4 2.7-.3.7.2 1.3.9 1.3h2.7c.2-1 .8-2 1.6-2.7-.2-.9-.5-1.3-.8-1.3zm13 0c-.3 0-.6.4-.8 1.3.8.7 1.4 1.7 1.6 2.7H22c.7 0 1.2-.6.9-1.3-.7-1.6-2.4-2.7-4.4-2.7z" />
    </svg>,

  planificacion: (p) =>
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <rect x="3.5" y="5" width="17" height="4" rx="2" opacity=".55" />
      <rect x="6.5" y="2.5" width="2" height="4" rx="1" />
      <rect x="15.5" y="2.5" width="2" height="4" rx="1" />
      <rect x="6.5" y="12" width="3" height="3" rx=".5" fill="#fff" opacity=".95" />
      <rect x="11" y="12" width="3" height="3" rx=".5" fill="#fff" opacity=".7" />
      <rect x="15.5" y="12" width="3" height="3" rx=".5" fill="#fff" opacity=".95" />
    </svg>,

  progreso: (p) =>
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}>
      <rect x="3" y="13" width="4" height="8" rx="1" />
      <rect x="10" y="9" width="4" height="12" rx="1" />
      <rect x="17" y="5" width="4" height="16" rx="1" />
      <path d="M3 11l6-5 4 3 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
      <path d="M16 3h4v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
    </svg>,

  pendientes: (p) =>
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" fill="#fff" opacity=".95" />
      <path d="M8.2 11.5l2 2 3.6-3.8" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 16.5h8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".75" />
    </svg>,

  invitaciones: (p) =>
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" {...p}>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M2.5 19.2c.5-3.4 3.6-6 7.5-6s7 2.6 7.5 6c.1.6-.3 1.1-.9 1.1H3.4c-.6 0-1-.5-.9-1.1z" />
      <circle cx="18.5" cy="6.5" r="3.5" opacity=".85" />
      <path d="M18.5 4.5v4M16.5 6.5h4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>,

  chat: (p) =>
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}>
      <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <text x="12" y="13.5" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="9" fill="#3DA8A8">G</text>
    </svg>,

  mensajeria: (p) =>
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.5 6.5l8.5 7 8.5-7" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>,

  teams: (p) =>
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" {...p}>
      <rect x="3" y="6" width="8" height="6" rx="1" />
      <rect x="13" y="6" width="8" height="6" rx="1" opacity=".7" />
      <rect x="3" y="14" width="8" height="6" rx="1" opacity=".7" />
      <rect x="13" y="14" width="8" height="6" rx="1" />
      <circle cx="7" cy="9" r="1.4" fill="#fff" />
      <circle cx="17" cy="9" r="1.4" fill="#fff" />
      <circle cx="7" cy="17" r="1.4" fill="#fff" />
      <circle cx="17" cy="17" r="1.4" fill="#fff" />
    </svg>,

  catalogo: (p) =>
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}>
      <path d="M4 4h6a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4V4z" />
      <path d="M20 4h-6a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h7V4z" opacity=".85" />
      <path d="M5.5 8h4M5.5 11h4M14.5 8h4M14.5 11h4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>,


  // Section card icons + utility
  search: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>,
  bell: (p) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>,
  help: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p} style={{ stroke: "rgb(255, 255, 255)" }}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4" /><circle cx="12" cy="17" r=".8" fill="currentColor" /></svg>,
  grid: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  pkg: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v9" /></svg>,
  sparkle: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}><path d="M12 2l1.6 5L19 8.6 14 11l-2 5-2-5L5 8.6 10.4 7 12 2z" /><path d="M19 14l.8 2.4L22 17l-2.4.8L19 20l-.8-2.2L16 17l2.4-.6L19 14z" opacity=".6" /></svg>,
  arrow: (p) => <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 5l7 7-7 7" /></svg>,
  chev: (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 6l6 6-6 6" /></svg>,
  send: (p) => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></svg>,
  clock: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  check: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12.5l4.5 4.5L19 7" /></svg>,
  user: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>,
  trophy: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg>,
  doc: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" /><path d="M14 3v5h5M8 13h8M8 17h5" /></svg>,
  flask: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 1.7 3h12.6A2 2 0 0 0 20 19l-6-10V3" /><path d="M7 14h10" /></svg>,
  brain: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 5a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 1 5 3 3 0 0 0 4 3V5z" /><path d="M15 5a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-1 5 3 3 0 0 1-4 3V5z" /></svg>,
  globe: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>,
  speech: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12c0-4 4-7 9-7s9 3 9 7-4 7-9 7c-1.5 0-3-.3-4.2-.8L3 20l1-4.5C3.4 14.5 3 13.3 3 12z" /></svg>,
  heart: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20s-7-4.5-9-9c-1.7-3.8 2-7 5-6 2 .6 3 2 4 4 1-2 2-3.4 4-4 3-1 6.7 2.2 5 6-2 4.5-9 9-9 9z" /></svg>,
  layers: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 12l9 5 9-5M3 17l9 5 9-5" /></svg>,
  target: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>,
  sliders: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M4 7h10M4 12h6M4 17h13" /><circle cx="17" cy="7" r="2" /><circle cx="13" cy="12" r="2" /><circle cx="20" cy="17" r="2" fill="currentColor" /></svg>,
  cogs: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3" /><path d="M19 12c0 .7-.1 1.3-.3 2l2 1.5-2 3.4-2.3-1c-1 .8-2.1 1.4-3.3 1.7L13 22h-2l-.4-2.4c-1.2-.3-2.3-.9-3.3-1.7l-2.3 1-2-3.4 2-1.5C5 13.3 5 12.7 5 12s.1-1.3.3-2l-2-1.5 2-3.4 2.3 1c1-.8 2.1-1.4 3.3-1.7L11 2h2l.4 2.4c1.2.3 2.3.9 3.3 1.7l2.3-1 2 3.4-2 1.5c.2.7.3 1.3.3 2z" /></svg>,
  book: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 4h7a3 3 0 0 1 3 3v14H7a3 3 0 0 1-3-3V4z" /><path d="M20 4h-7a3 3 0 0 0-3 3v14h7a3 3 0 0 0 3-3V4z" /></svg>,
  abc: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 18l3-9 3 9M4 15h4M12 18V9c1.5 0 3 .5 3 2s-1.5 2-3 2c1.5 0 3 .5 3 2s-1.5 3-3 3M19 14a2.5 2.5 0 1 0 0 4" /></svg>,
  ruler: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="9" width="20" height="6" rx="1" transform="rotate(-15 12 12)" /><path d="M7 9v3M11 8v4M15 7v3M19 6v4" transform="rotate(-15 12 12)" /></svg>,
  calc: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0" /></svg>,
  msg2: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 11.5c0 4.1-3.6 7.5-8 7.5-1.2 0-2.4-.2-3.4-.7L4 20l1.4-4.6C4.5 14.2 4 12.9 4 11.5 4 7.4 7.6 4 12 4s9 3.4 9 7.5z" /></svg>,
  board: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 9h18M9 4v14M15 4v14" /></svg>,
  wave: (p) => <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...p}><path d="M14.5 2.3a.8.8 0 0 0-1.4.4l1 7.6-2.4-6.5a.8.8 0 1 0-1.5.6l2 5.5-3-4.4a.8.8 0 1 0-1.4.9l3.2 5-4-3a.8.8 0 1 0-1 1.2L8 12.5l-2 1c-1.4.7-1.9 2.5-1 3.9 2 3 5.4 4.6 8.9 4.6 4.5 0 8.3-2.7 9-7.2l1-6.4a.8.8 0 0 0-1.6-.4l-.9 4.8-.9-6.6a.8.8 0 1 0-1.6.2l.8 5.8-1.2-9z" /></svg>,
  newuser: (p) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="10" cy="8" r="4" /><path d="M2 21c0-4 3.5-7 8-7s8 3 8 7" /><path d="M19 8v6M16 11h6" /></svg>
};

export default Ic;