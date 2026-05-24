import React, { useState, useEffect } from 'react';
import AppLayout from './components/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Planning from './pages/planning/index.jsx';
import LessonCatalog from './pages/LessonCatalog.jsx';
import AIToolsPage from './pages/AIToolsPage.jsx';
import MyDocuments from './pages/MyDocuments.jsx';
import Placeholder from './pages/Placeholder.jsx';

// Map nav href → page key for AppLayout's activePath
const ROUTES = {
  '/dashboard':                   { key: 'dashboard',   Page: Dashboard },
  '/planning-select':             { key: 'planning',    Page: Planning },
  '/lesson-catalog':              { key: 'catalog',     Page: LessonCatalog },
  '/ai-tools':                    { key: 'ai-tools',    Page: AIToolsPage },
  '/my-documents':                { key: 'documents',   Page: MyDocuments },
  '/profile-update':              { key: 'students',    Page: Placeholder, props: { title: 'Estudiantes' } },
  '/teacher-groups':              { key: 'groups',      Page: Placeholder, props: { title: 'Grupos' } },
  '/record':                      { key: 'progress',    Page: Placeholder, props: { title: 'Progreso' } },
  '/pending-teacher-assignments': { key: 'pending',     Page: Placeholder, props: { title: 'Pendientes' } },
  '/invitations':                 { key: 'invitations', Page: Placeholder, props: { title: 'Invitaciones' } },
  '/chat':                        { key: 'chat',        Page: Placeholder, props: { title: 'Chat' } },
  '/messages':                    { key: 'messages',    Page: Placeholder, props: { title: 'Mensajería' } },
  '/teams':                       { key: 'teams',       Page: Placeholder, props: { title: 'Teams' } },
};

function getInitialPath() {
  const p = window.location.pathname;
  return ROUTES[p] ? p : '/dashboard';
}

function getToken() {
  try {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    return auth.Token || null;
  } catch { return null; }
}

export default function App() {
  const [path, setPath] = useState(getInitialPath());
  const [token] = useState(getToken());

  useEffect(() => {
    const onPop = () => setPath(getInitialPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function navigate(to) {
    const route = to.split('?')[0];
    if (!ROUTES[route]) return;
    window.history.pushState({}, '', to);
    setPath(route);
  }

  const route = ROUTES[path] || ROUTES['/dashboard'];
  const PageComponent = route.Page;
  const pageProps = { token, onNavigate: navigate, ...(route.props || {}) };

  return (
    <AppLayout activePath={path} onNavigate={navigate} userName="José Maestro">
      <PageComponent {...pageProps} />
    </AppLayout>
  );
}
