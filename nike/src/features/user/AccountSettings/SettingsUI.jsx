import React, { useEffect, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "../../../context/AppContext";
import useAuthService from "../services/authServices";
export const message = (error) =>
  error?.response?.data?.message ||
  error.message ||
  "Something went wrong. Please try again.";
export function useSettingsResource(load, { enabled = true } = {}) {
  const latest = useRef(load);
  latest.current = load;
  const { token, backendUrl } = useAppContext();
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(enabled),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    Promise.resolve()
      .then(() => latest.current())
      .then((value) => {
        if (active) setData(value);
      })
      .catch((err) => {
        if (active) setError(message(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, backendUrl, enabled, attempt]);
  return {
    data,
    setData,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
export function Resource({ value, children }) {
  if (value.loading)
    return (
      <div className="settings-loading" role="status">
        Loading your account…
      </div>
    );
  if (value.error)
    return (
      <div className="settings-notice" role="alert">
        <p>{value.error}</p>
        <button type="button" onClick={value.retry}>
          Try again
        </button>
      </div>
    );
  return children;
}
export function Field({ label, children, ...props }) {
  const id = useId();
  return (
    <label className="settings-field" htmlFor={id}>
      <span>{label}</span>
      {children ? (
        React.cloneElement(children, { id })
      ) : (
        <input id={id} {...props} />
      )}
    </label>
  );
}
export function SettingsDialog({ title, onClose, busy = false, children }) {
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (
      panel.current?.querySelector("button:not(:disabled),input") ||
      panel.current
    )?.focus({ preventScroll: true });
    const key = (event) => {
      if (event.key === "Escape" && !busy) onClose();
      if (event.key === "Tab") {
        const nodes = [
          ...panel.current.querySelectorAll(
            "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)",
          ),
        ];
        if (!nodes.length) {
          event.preventDefault();
          return;
        }
        if (event.shiftKey && document.activeElement === nodes[0]) {
          event.preventDefault();
          nodes.at(-1).focus();
        } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) {
          event.preventDefault();
          nodes[0].focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [busy]);
  return createPortal(
    <div className="settings-dialog-layer">
      <div
        className="settings-dialog-backdrop"
        onClick={() => !busy && onClose()}
        aria-hidden="true"
      />
      <section
        className="settings-dialog"
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button
            type="button"
            aria-label="Close dialog"
            disabled={busy}
            onClick={onClose}
          >
            <XMarkIcon />
          </button>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  );
}
export function useSignOut() {
  const { logout } = useAppContext(),
    auth = useAuthService(),
    navigate = useNavigate(),
    lock = useRef(false);
  const [busy, setBusy] = useState(false);
  return {
    busy,
    signOut: async () => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      try {
        await auth.logoutUser();
      } catch {
        /* Local sign-out still works when the server is unreachable. */
      } finally {
        logout();
        navigate("/home", { replace: true });
        lock.current = false;
        setBusy(false);
      }
    },
  };
}
