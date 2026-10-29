import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from '../context/AppContext';
import { NavigationProvider } from './navigation';

class AppErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <main className="empty-state"><h1>Something went wrong.</h1><button onClick={() => window.location.reload()}>Reload the page</button></main> : this.props.children;
  }
}
export default function ClientRoot({ Component, pageProps }) {
  const [queryClient] = useState(() => new QueryClient());
  useEffect(() => {
    // Retire the old Vite service worker so it cannot serve stale routes after migration.
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(registrations => registrations.forEach(registration => {
      const url = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL;
      if (url === `${location.origin}/sw.js`) registration.unregister();
    })).catch(() => {});
  }, []);
  return <AppErrorBoundary><QueryClientProvider client={queryClient}><NavigationProvider><AppProvider><Toaster position="top-center" /><Component {...pageProps} /></AppProvider></NavigationProvider></QueryClientProvider></AppErrorBoundary>;
}
