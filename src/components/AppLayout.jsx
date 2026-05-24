import React, { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  SVG ICONS — Extraídos directamente de maestros.genialskillsweb.com
//  /static/media/NavMenu-icon-*.svg  +  Header-icon-Logo.svg
//  Usar como: <span dangerouslySetInnerHTML={{ __html: ICONS.home }} />
// ─────────────────────────────────────────────────────────────────────────────
export const ICONS = {

  // Logo del header (85x30 según la app real)
  logo: `<svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  <text x="10" y="42" font-family="Arial Black,Arial" font-weight="900" font-size="36" fill="#6AD8D2">G</text>
  <text x="34" y="42" font-family="Arial Black,Arial" font-weight="900" font-size="36" fill="white">enial</text>
  <rect x="10" y="48" width="80" height="3" fill="#E88B19" rx="1.5"/>
</svg>`,

  // Inicio
  home: `<svg width="73" height="73" viewBox="0 0 73 73" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(13,15)" fill-rule="nonzero">
    <path d="M0 43 L0 0 L19.07 0 L19.07 12.58 L23.47 17.58 C21.47 17.7 19.65 18.78 18.73 20.49 C17.6 22.01 17.02 23.87 17.06 25.78 C17.01 27.66 17.59 29.5 18.71 31.01 C19.63 32.35 21.14 33.16 22.75 33.17 L30.7 33.17 L30.7 27.41 L24.75 27.41 C23.56 27.45 22.37 27.56 21.19 27.76 C20.8 27.8 20.41 27.87 20.02 27.96 L24.91 22.74 L32.63 22.74 C32.83 23.18 33.07 23.59 33.36 23.97 L28.06 0 L47 0 L47 43 Z" fill="#27466C"/>
    <path d="M23.47 0 L23.47 10.39 L13.08 0 Z" fill="#6AD8D2"/>
    <path d="M23.47 0 L33.93 10.39 L23.47 10.39 Z" fill="#E88B19"/>
  </g>
</svg>`,

  // Estudiantes
  students: `<svg width="73" height="73" viewBox="0 0 73 73" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(12,6)" fill-rule="nonzero">
    <circle cx="24.5" cy="18" r="15" fill="#27466C"/>
    <ellipse cx="24.5" cy="15" rx="10" ry="12" fill="#6AD8D2"/>
    <path d="M0 54 C0 40 49 40 49 54 L49 61 L0 61 Z" fill="#27466C"/>
    <path d="M4 54 C4 43 45 43 45 54 L45 58 L4 58 Z" fill="#E88B19" opacity="0.3"/>
  </g>
</svg>`,

  // Grupos
  groups: `<svg width="73" height="73" viewBox="0 0 73 73" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(5,17)" fill-rule="nonzero" stroke="#C1BCB4" stroke-width="0.9">
    <circle cx="15" cy="12" r="9" fill="#27466C" stroke="none"/>
    <circle cx="47" cy="12" r="9" fill="#27466C" stroke="none"/>
    <circle cx="31" cy="10" r="11" fill="#6AD8D2" stroke="none"/>
    <path d="M0 38 C0 28 30 28 30 38 L30 42 L0 42 Z" fill="#27466C"/>
    <path d="M32 38 C32 28 62 28 62 38 L62 42 L32 42 Z" fill="#27466C"/>
    <path d="M14 35 C14 24 48 24 48 35 L48 40 L14 40 Z" fill="#E88B19"/>
  </g>
</svg>`,

  // Planificación
  planning: `<svg width="73" height="73" viewBox="0 0 73 73" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(11,11)" fill-rule="nonzero">
    <rect x="3" y="6" width="40" height="37" fill="white" stroke="#C1BCB4" stroke-width="1"/>
    <rect x="0" y="0" width="46" height="8" fill="#27466C" rx="2"/>
    <rect x="5" y="13" width="8" height="6" fill="#D99289" rx="1.3"/>
    <rect x="16" y="13" width="8" height="6" fill="#D99289" rx="1.3"/>
    <rect x="27" y="13" width="8" height="6" fill="#D99289" rx="1.3"/>
    <rect x="5" y="23" width="8" height="6" fill="#6AD8D2" rx="1.3"/>
    <rect x="16" y="23" width="8" height="6" fill="#27466C" rx="1.3"/>
    <rect x="27" y="23" width="8" height="6" fill="#E88B19" rx="1.3"/>
    <rect x="5" y="33" width="36" height="2" fill="#e4e4e4" rx="1"/>
    <circle cx="38" cy="3" r="4" fill="#E88B19"/>
    <circle cx="8" cy="3" r="4" fill="#6AD8D2"/>
  </g>
</svg>`,

  // Progreso
  progress: `<svg width="73" height="73" viewBox="0 0 73 73" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(12,13)" fill-rule="nonzero">
    <rect x="0" y="0" width="43" height="35" fill="#f8f9fb" stroke="#C1BCB4" stroke-width="1" rx="2"/>
    <rect x="3" y="15" width="7" height="17" fill="#27466C" rx="1"/>
    <rect x="13" y="22" width="7" height="10" fill="#6AD8D2" rx="1"/>
    <rect x="23" y="8" width="7" height="24" fill="#E88B19" rx="1"/>
    <rect x="33" y="18" width="7" height="14" fill="#D99289" rx="1"/>
    <path d="M3 14 L10 10 L20 18 L30 6 L40 12" stroke="#27466C" stroke-width="1.5" fill="none"/>
  </g>
</svg>`,

  // Pendientes
  pending: `<svg width="80" height="69" viewBox="0 0 80 69" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="19" y="10" width="42" height="54" rx="3" fill="#A2A9B3"/>
  <rect x="22" y="14" width="36" height="47" rx="2" fill="white"/>
  <rect x="22" y="14" width="36" height="47" rx="2" fill="#5A6572" opacity="0.1"/>
  <rect x="27" y="20" width="26" height="3" rx="1.5" fill="#27466C"/>
  <rect x="27" y="27" width="22" height="2" rx="1" fill="#C1BCB4"/>
  <rect x="27" y="33" width="24" height="2" rx="1" fill="#C1BCB4"/>
  <rect x="27" y="39" width="20" height="2" rx="1" fill="#C1BCB4"/>
  <circle cx="58" cy="52" r="10" fill="#E88B19"/>
  <text x="54" y="57" font-size="14" font-weight="bold" fill="white">!</text>
</svg>`,

  // Invitaciones
  invitations: `<svg width="73" height="73" viewBox="0 0 73 73" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(8,12)" fill-rule="nonzero">
    <circle cx="17" cy="14" r="12" fill="#27466C"/>
    <circle cx="17" cy="12" r="8" fill="#6AD8D2"/>
    <circle cx="44" cy="18" r="10" fill="#E88B19" opacity="0.8"/>
    <path d="M0 49 C0 36 34 36 34 49 L34 54 L0 54 Z" fill="#27466C"/>
    <path d="M28 44 C28 34 57 34 57 44 L57 49 L28 49 Z" fill="#E88B19" opacity="0.6"/>
    <circle cx="44" cy="40" r="8" fill="#27466C"/>
    <path d="M40 40 L43 43 L49 37" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>
</svg>`,

  // Chat
  chat: `<svg width="80" height="69" viewBox="0 0 80 69" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(13,9)" fill-rule="nonzero">
    <rect x="0" y="0" width="55" height="36" rx="8" fill="#27466C"/>
    <rect x="1" y="1" width="53" height="34" rx="7" fill="#27466C"/>
    <circle cx="16" cy="18" r="3" fill="white" opacity="0.9"/>
    <circle cx="27.5" cy="18" r="3" fill="white" opacity="0.9"/>
    <circle cx="39" cy="18" r="3" fill="white" opacity="0.9"/>
    <path d="M8 36 L8 48 L22 36 Z" fill="#27466C"/>
    <rect x="17" y="20" width="38" height="30" rx="7" fill="#6AD8D2"/>
    <circle cx="28" cy="35" r="3" fill="white" opacity="0.8"/>
    <circle cx="36" cy="35" r="3" fill="white" opacity="0.8"/>
    <circle cx="44" cy="35" r="3" fill="white" opacity="0.8"/>
  </g>
</svg>`,

  // Mensajería
  messages: `<svg width="73" height="73" viewBox="0 0 73 73" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(12,21)" fill-rule="nonzero">
    <rect x="0" y="0" width="49" height="32" rx="4" fill="#27466C"/>
    <path d="M0 2 L24.5 18 L49 2" stroke="white" stroke-width="2" fill="none"/>
    <rect x="2" y="2" width="45" height="28" rx="3" fill="#6AD8D2" opacity="0.15"/>
  </g>
</svg>`,

  // Teams
  teams: `<svg width="80" height="69" viewBox="0 0 80 69" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="15.5" cy="28" r="10" fill="#27466C"/>
  <circle cx="40" cy="24" r="13" fill="#E88B19"/>
  <circle cx="64.5" cy="28" r="10" fill="#27466C"/>
  <path d="M5 52 C5 44 26 44 26 52 L26 57 L5 57 Z" fill="#27466C"/>
  <path d="M54 52 C54 44 75 44 75 52 L75 57 L54 57 Z" fill="#27466C"/>
  <path d="M26 48 C26 39 54 39 54 48 L54 54 L26 54 Z" fill="#E88B19"/>
  <circle cx="40" cy="23" r="8" fill="white" opacity="0.3"/>
</svg>`,

  // Catálogo
  catalog: `<svg width="73" height="73" viewBox="0 0 73 73" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(8,8)" fill-rule="nonzero">
    <rect x="0" y="5" width="42" height="52" rx="3" fill="#27466C"/>
    <rect x="3" y="8" width="36" height="46" rx="2" fill="white"/>
    <rect x="7" y="14" width="28" height="3" rx="1.5" fill="#27466C"/>
    <rect x="7" y="21" width="22" height="2" rx="1" fill="#C1BCB4"/>
    <rect x="7" y="27" width="24" height="2" rx="1" fill="#C1BCB4"/>
    <rect x="7" y="33" width="20" height="2" rx="1" fill="#C1BCB4"/>
    <rect x="7" y="39" width="26" height="2" rx="1" fill="#C1BCB4"/>
    <rect x="7" y="45" width="18" height="2" rx="1" fill="#C1BCB4"/>
    <rect x="30" y="0" width="28" height="36" rx="3" fill="#6AD8D2" opacity="0.9"/>
    <rect x="33" y="4" width="22" height="2" rx="1" fill="white"/>
    <rect x="33" y="10" width="18" height="2" rx="1" fill="white" opacity="0.7"/>
    <rect x="33" y="16" width="20" height="2" rx="1" fill="white" opacity="0.7"/>
  </g>
</svg>`,
};

// ─────────────────────────────────────────────────────────────────────────────
//  NAV ITEMS — Igual al HTML real: wrapper-menu > navigation-menu > li > a
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "dashboard",                  label: "Inicio",         icon: "home",        href: "/dashboard" },
  { key: "profile-update",             label: "Estudiantes",    icon: "students",    href: "/profile-update" },
  { key: "teacher-groups",             label: "Grupos",         icon: "groups",      href: "/teacher-groups" },
  { key: "planning-select",            label: "Planificación",  icon: "planning",    href: "/planning-select" },
  { key: "record",                     label: "Progreso",       icon: "progress",    href: "/record" },
  { key: "pending-teacher-assignments",label: "Pendientes",     icon: "pending",     href: "/pending-teacher-assignments" },
  { key: "invitations",                label: "Invitaciones",   icon: "invitations", href: "/invitations" },
  { key: "chat",                       label: "Chat",           icon: "chat",        href: "/chat" },
  { key: "messages",                   label: "Mensajería",     icon: "messages",    href: "/messages" },
  { key: "teams",                      label: "Teams",          icon: "teams",       href: "/teams" },
  { key: "lesson-catalog",             label: "Catálogo",       icon: "catalog",     href: "/lesson-catalog" },
  { key: "ai-tools",                   label: "Herramientas IA",icon: "ai-tools",    href: "/ai-tools" },
  { key: "documents",                  label: "Mis documentos", icon: "documents",   href: "/my-documents" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ICON — Usa los SVGs reales servidos desde /public/icons/
// ─────────────────────────────────────────────────────────────────────────────
function NavIcon({ name, size = 28 }) {
  return (
    <img
      src={`/icons/${name}.svg`}
      alt=""
      aria-hidden="true"
      style={{ width: size, height: size, display: "block", flexShrink: 0 }}
    />
  );
}

function ChevronDown(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  HEADER — Réplica exacta de .main-header
//  Background: #27466C, logo a la izquierda, user menu a la derecha
// ─────────────────────────────────────────────────────────────────────────────
function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
function HelpIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4" /><circle cx="12" cy="17" r=".8" fill="currentColor" />
    </svg>
  );
}
function PkgIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" />
    </svg>
  );
}

export function AppHeader({
  userName = "José Maestro",
  userRole = "Maestro · 5to grado",
  userInitials = "JM",
  onHelpClick,
  onUserMenuClick,
  onSearch,
}) {
  const [q, setQ] = React.useState("");
  return (
    <header className="app-header" style={s.header}>
      <a href="/dashboard" className="app-header-logo" style={s.logoLink}>
        <img src="/icons/header-logo.svg" alt="Genial Skills" style={{ height: 30, width: "auto", display: "block" }} />
      </a>

      <div className="app-header-search" style={s.searchWrap}>
        <span style={{ color: "#6B7A93", display: "flex" }}><SearchIcon /></span>
        <input
          style={s.searchInput}
          placeholder="Buscar estudiantes, grupos, lecciones, herramientas IA…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && onSearch) onSearch(q); }}
        />
        <kbd style={s.kbd}>⌘K</kbd>
      </div>

      <nav className="app-header-actions" style={s.topBarMenu}>
        <a href="#" className="app-help-link" style={s.helpLink}><PkgIcon /> Cómo utilizar la APP Web</a>
        <a href="#" className="app-help-link" style={s.helpLink}><PkgIcon /> Entregables</a>
        <button className="app-help-btn" style={s.helpBtn} onClick={onHelpClick}><HelpIcon /> AYUDA</button>

        <button className="app-user-pill" style={s.userPill} onClick={onUserMenuClick} aria-label="Menú de usuario">
          <span style={s.avatar}>{userInitials}</span>
          <span className="app-user-name-block" style={s.nameBlock}>
            <span style={s.userName}>{userName}</span>
            <span style={s.userRole}>{userRole}</span>
          </span>
        </button>
      </nav>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SIDEBAR NAV — Réplica exacta de .wrapper-menu.wrapper-menu-teacher
//  En desktop: columna izquierda fija
//  En mobile (≤750px): barra horizontal inferior
// ─────────────────────────────────────────────────────────────────────────────
export function AppNav({ activePath = "/dashboard", onNavigate }) {
  function handleClick(e, href) {
    e.preventDefault();
    if (onNavigate) onNavigate(href);
    else window.location.href = href;
  }

  // Detectar ruta activa por coincidencia parcial
  function isActive(key) {
    if (typeof window !== "undefined") {
      return window.location.pathname.includes(key);
    }
    return activePath.includes(key);
  }

  return (
    <div style={s.wrapperMenu} className="wrapper-menu wrapper-menu-teacher">
      <ul style={s.navList}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.key);
          return (
            <li key={item.key} style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}>
              <a
                href={item.href}
                style={{ ...s.navLink, ...(active ? s.navLinkActive : {}) }}
                onClick={(e) => handleClick(e, item.href)}
              >
                <span style={s.navIconWrap}>
                  <NavIcon name={item.icon} size={48} />
                </span>
                <span style={s.navLabel} className="navigation-menu--item">
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  APP LAYOUT — Wrapper completo: Header + Nav + Content
//  Uso:
//    <AppLayout activePath="/planning-select">
//      <YourPageContent />
//    </AppLayout>
// ─────────────────────────────────────────────────────────────────────────────
export default function AppLayout({
  children,
  activePath,
  userName,
  onNavigate,
  onHelpClick,
  onUserMenuClick,
}) {
  return (
    <div className="app-root" style={s.appRoot}>
      <AppHeader
        userName={userName}
        onHelpClick={onHelpClick}
        onUserMenuClick={onUserMenuClick}
      />
      <div className="app-body" style={s.body}>
        <AppNav activePath={activePath} onNavigate={onNavigate} />
        <main className="app-main" style={s.main}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ESTILOS — Extraídos del CSS real (main.8968a941.css + theme-private.css)
// ─────────────────────────────────────────────────────────────────────────────
const BLUE      = "#27466C";
const TEAL      = "#3DA8A8";   // sidebar (color original que tenía antes)
const TEAL_LIGHT = "#6AD8D2";   // acento active border
const AMBER     = "#E88B19";

const s = {
  // ── Layout raíz: header arriba (full-width navy) + body (sidebar + content) ──
  appRoot: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    fontFamily: "inherit",
    background: "#f4f6f9",
  },
  body: {
    display: "flex",
    flex: 1,
    minHeight: 0,
  },
  main: {
    flex: 1,
    padding: "0",
    overflow: "auto",
    minWidth: 0,
  },

  // ── Header — fondo navy igual a la plataforma real ──
  header: {
    background: BLUE,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 22px",
    height: 56,
    flexShrink: 0,
    zIndex: 50,
  },
  logoLink: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
  },
  topBarMenu: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  searchWrap: {
    flex: 1,
    maxWidth: 460,
    margin: "0 20px",
    background: "#fff",
    border: "1px solid #E4E9F0",
    borderRadius: 10,
    height: 36,
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    gap: 8,
    color: "#6B7A93",
  },
  searchInput: {
    background: "transparent",
    border: 0,
    outline: 0,
    color: "#1A2740",
    fontFamily: "inherit",
    fontSize: 13,
    width: "100%",
  },
  kbd: {
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 10,
    border: "1px solid #E4E9F0",
    background: "#F4F6F9",
    borderRadius: 4,
    padding: "2px 6px",
    color: "#6B7A93",
  },
  helpLink: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    textDecoration: "none",
    padding: "4px 4px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  helpBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 13,
    fontWeight: 600,
    padding: "5px 8px",
    cursor: "pointer",
    letterSpacing: "0.04em",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  // User pill — sobre fondo navy: avatar circular + nombre blanco
  userPill: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "4px 4px 4px 8px",
    borderRadius: 999,
    marginLeft: 4,
    borderLeft: "1px solid rgba(255,255,255,0.18)",
    paddingLeft: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#fff",
    color: "#27466C",
    fontWeight: 700,
    fontSize: 12,
    display: "grid",
    placeItems: "center",
    fontFamily: "Sora, system-ui, sans-serif",
    flexShrink: 0,
    border: "2px solid rgba(255,255,255,0.9)",
  },
  nameBlock: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.15,
    textAlign: "left",
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    fontFamily: "Poppins, system-ui, sans-serif",
  },
  userRole: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: 500,
  },

  // ── Nav sidebar ──
  // Desktop: columna izquierda fija (150px, igual a la app real)
  // Mobile: barra horizontal inferior (via CSS media query en className)
  wrapperMenu: {
    width: 110,
    minWidth: 110,
    background: TEAL,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    padding: "6px 0",
  },
  navList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
  },
  navItem: {
    marginBottom: 0,
  },
  navItemActive: {
    background: "rgba(255,255,255,0.18)",
    borderLeft: `3px solid #fff`,
  },
  navLink: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px 4px 6px",
    textDecoration: "none",
    color: "rgba(255,255,255,0.95)",
    fontSize: 12,
    fontWeight: 500,
    gap: 2,
    transition: "background 0.12s",
    cursor: "pointer",
  },
  navLinkActive: {
    color: "white",
    fontWeight: 700,
  },
  navIconWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
  },
  navLabel: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 1.2,
    maxWidth: 90,
  },
};
