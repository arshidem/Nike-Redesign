import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** A client-side page change should start like a fresh document navigation. */
export default function RouteScrollReset() {
  const { pathname, search, hash } = useLocation();
  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);
  useLayoutEffect(() => {
    // Ordinary content anchors keep their native jump. Admin hashes are pages.
    if (hash && !pathname.startsWith("/admin")) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search, hash]);
  return null;
}
