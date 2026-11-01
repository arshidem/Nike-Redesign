import { useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "../css/scroll-header.css";

/** Keep bars visible by default; Home opts into hiding on downward scroll. */
export function useScrollHeader({
  enabled = true,
  autoHide = false,
  locked = false,
  elementRef,
} = {}) {
  const ownRef = useRef(null),
    ref = elementRef || ownRef;
  const active = enabled && autoHide;
  const [hidden, setHidden] = useState(false);
  const { pathname, search, hash } = useLocation();
  useLayoutEffect(() => {
    setHidden(false);
    if (!active) return;
    let previous = Math.max(0, window.scrollY),
      distance = 0,
      direction = 0,
      frame = null;
    const pinned = () =>
      locked ||
      document.body.style.overflow === "hidden" ||
      ref.current?.querySelector("details[open], :focus-visible");
    const update = () => {
      frame = null;
      const max = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const y = Math.max(0, Math.min(window.scrollY, max));
      const delta = y - previous;
      previous = y;
      if (pinned() || y <= 16) {
        distance = 0;
        direction = 0;
        setHidden(false);
        return;
      }
      if (!delta) return;
      const next = delta > 0 ? 1 : -1;
      distance =
        next === direction ? distance + Math.abs(delta) : Math.abs(delta);
      direction = next;
      if (direction < 0 && distance >= 8) setHidden(false);
      if (
        direction > 0 &&
        distance >= 12 &&
        y > (ref.current?.offsetHeight || 56) + 20
      )
        setHidden(true);
    };
    const scroll = () => {
      if (frame == null) frame = requestAnimationFrame(update);
    };
    const reveal = () => {
      setHidden(false);
      previous = Math.max(0, window.scrollY);
      distance = 0;
      direction = 0;
    };
    const keydown = (event) => {
      if (event.key === "Tab") reveal();
    };
    const observer = new MutationObserver(() => {
      if (pinned()) reveal();
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", reveal);
    document.addEventListener("keydown", keydown);
    ref.current?.addEventListener("focusin", reveal);
    ref.current?.addEventListener("toggle", reveal, true);
    const element = ref.current;
    return () => {
      if (frame != null) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", reveal);
      document.removeEventListener("keydown", keydown);
      element?.removeEventListener("focusin", reveal);
      element?.removeEventListener("toggle", reveal, true);
    };
  }, [active, locked, pathname, search, hash, ref]);
  return { ref, hidden: active && !locked && hidden };
}
