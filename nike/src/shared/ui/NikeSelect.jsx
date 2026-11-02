import React, { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./NikeSelect.css";

function flattenOptions(children, result = [], group = "") {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === "option") {
      const label = child.props.children;
      result.push({ value: String(child.props.value ?? (typeof label === "string" ? label : "")), label, disabled: !!child.props.disabled, group });
    } else if (child.props.children) {
      flattenOptions(child.props.children, result, child.type === "optgroup" ? child.props.label : group);
    }
  });
  return result;
}

/** Drop-in replacement for native single-select controls. Keeps existing value/onChange contracts. */
export default function NikeSelect({
  children, value, defaultValue, onChange, onBlur, name, id, disabled = false,
  required, className = "", style, "aria-label": ariaLabel, "aria-invalid": ariaInvalid,
  ...rest
}) {
  const generatedId = useId();
  const listId = `${id || generatedId}-list`;
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState(null);
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ""));
  const options = useMemo(() => flattenOptions(children), [children]);
  const selected = String(value ?? internalValue);
  const chosen = options.find((option) => option.value === selected);
  const placeholder = options.find((option) => option.value === "")?.label || "Select option";
  const display = chosen?.label ?? placeholder;
  const isPlaceholder = !chosen || chosen.value === "";

  const measure = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    const maxHeight = Math.min(300, Math.max(120, (below >= 180 || below >= above ? below : above) - 12));
    const upwards = below < 180 && above > below;
    setPlacement({ left: rect.left, width: rect.width, top: upwards ? undefined : rect.bottom + 5, bottom: upwards ? window.innerHeight - rect.top + 5 : undefined, maxHeight });
  };

  useEffect(() => {
    if (!open) return;
    measure();
    const handlePointer = (event) => {
      if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const handleReposition = () => setOpen(false);
    document.addEventListener("pointerdown", handlePointer);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const choose = (option) => {
    if (option.disabled) return;
    if (value === undefined) setInternalValue(option.value);
    onChange?.({ target: { name, value: option.value, type: "select-one" }, currentTarget: { name, value: option.value } });
    setOpen(false);
    rootRef.current?.querySelector("button")?.focus();
  };

  const enabledIndices = options.map((option, index) => !option.disabled ? index : -1).filter((index) => index >= 0);
  const move = (delta) => {
    if (!enabledIndices.length) return;
    const current = enabledIndices.indexOf(active);
    const next = enabledIndices[(Math.max(0, current) + delta + enabledIndices.length) % enabledIndices.length];
    setActive(next);
    document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" });
  };
  const onKeyDown = (event) => {
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(event.key)) event.preventDefault();
    if (event.key === "Escape") setOpen(false);
    else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!open) { setActive(Math.max(0, options.findIndex((option) => option.value === selected))); measure(); setOpen(true); }
      else move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home") setActive(enabledIndices[0] ?? 0);
    else if (event.key === "End") setActive(enabledIndices[enabledIndices.length - 1] ?? 0);
    else if (event.key === "Enter" || event.key === " ") {
      if (!open) { setActive(Math.max(0, options.findIndex((option) => option.value === selected))); measure(); setOpen(true); }
      else choose(options[active]);
    } else if (event.key === "Tab") setOpen(false);
  };

  return (
    <div ref={rootRef} className={`nike-select ${className}`} style={style}>
      <select tabIndex={-1} aria-hidden="true" name={name} value={selected} required={required} disabled={disabled}
        onChange={(event) => choose(options.find((option) => option.value === event.target.value) || { value: event.target.value })} className="nike-select-native" {...(rest.autoComplete ? { autoComplete: rest.autoComplete } : {})}>
        {children}
      </select>
      <button type="button" id={id} className={`nike-select-trigger ${open ? "is-open" : ""} ${ariaInvalid ? "is-invalid" : ""}`}
        aria-label={ariaLabel || (typeof display === "string" ? display : "Select option")}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined}
        aria-invalid={ariaInvalid} disabled={disabled} onBlur={onBlur} onKeyDown={onKeyDown}
        onClick={() => { if (!open) { setActive(Math.max(0, options.findIndex((option) => option.value === selected))); measure(); } setOpen(!open); }}>
        <span className={`nike-select-value ${isPlaceholder ? "is-placeholder" : ""}`}>{display}</span>
        <svg className="nike-select-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && placement && createPortal(
        <div ref={menuRef} id={listId} role="listbox" aria-label={ariaLabel || name || "Options"}
          className="nike-select-menu" style={{ position: "fixed", ...placement }}>
          {options.map((option, index) => (
            <button type="button" role="option" id={`${listId}-${index}`} key={`${option.value}-${index}`}
              aria-selected={option.value === selected} disabled={option.disabled}
              className={`nike-select-option ${option.value === selected ? "is-selected" : ""} ${index === active ? "is-active" : ""}`}
              onMouseEnter={() => setActive(index)} onClick={() => choose(option)}>
              <span>{option.label}</span>
              {option.value === selected && <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>}
            </button>
          ))}
        </div>, document.body
      )}
    </div>
  );
}
