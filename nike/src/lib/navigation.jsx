import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

const NavigationContext = createContext({ state: null, setState: () => {} });
export function NavigationProvider({ children }) {
  const [state, setState] = useState(null);
  return <NavigationContext.Provider value={{ state, setState }}>{children}</NavigationContext.Provider>;
}
export function Link({ to, children, ...props }) {
  return <NextLink href={to || '/'} {...props}>{children}</NextLink>;
}
export function useNavigate() {
  const router = useRouter();
  const { setState } = useContext(NavigationContext);
  return useCallback((to, options = {}) => {
    if (typeof to === 'number') { if (to === -1) router.back(); else window.history.go(to); return; }
    setState(options.state || null);
    const href = typeof to === 'string' ? to : `${to.pathname || ''}${to.search || ''}${to.hash || ''}`;
    return options.replace ? router.replace(href) : router.push(href);
  }, [router, setState]);
}
export function useLocation() {
  const router = useRouter();
  const { state } = useContext(NavigationContext);
  const [pathAndSearch, hash = ''] = (router.asPath || '/').split('#');
  const [pathname, search = ''] = pathAndSearch.split('?');
  return { pathname, search: search ? `?${search}` : '', hash: hash ? `#${hash}` : '', state, key: router.asPath };
}
export function useParams() { return useRouter().query; }
export function Navigate({ to, replace = false }) {
  const navigate = useNavigate();
  useEffect(() => { navigate(to, { replace }); }, [navigate, to, replace]);
  return null;
}
