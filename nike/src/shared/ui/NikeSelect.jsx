import React, { useState, useRef, useEffect, useId } from "react";
import "./nike-select.css";

/**
 * NikeSelect — Shared Dropdown Component
 *
 * Props:
 * @param {string} label - Top floating label (e.g. "Size", "State", "Sort By", "Status")
 * @param {string} outsideLabel - Optional external label above the input box
 * @param {string|number} value - Active value
 * @param {Function} onChange - (value, selectedOption) => void
 * @param {Array} options - Array of objects [{ value, label, subtext, icon }] or primitives ['Men', 'Women'] or [ [value, label] ]
 * @param {string} placeholder - Displayed when nothing is selected (default: "Select Option")
 * @param {React.ReactNode} icon - Leading icon inside the control
 * @param {string} size - "sm" | "md" (default) | "lg"
 * @param {string} variant - "standard" (default) | "line" | "pill"
 * @param {string} indicatorType - "radio" (default in design spec) | "check"
 * @param {boolean} disabled - Whether the dropdown is disabled
 * @param {string} className - Additional CSS class for the wrapper
 * @param {string} name - Form field name (for native form compatibility)
 * @param {string} id - HTML ID
 * @param {string} ariaLabel - Accessibility label
 */
export default function NikeSelect({
  label,
  outsideLabel,
  value,
  onChange,
  options = [],
  placeholder = "Select Option",
  icon,
  size = "md",
  variant = "standard",
  indicatorType = "radio",
  disabled = false,
  className = "",
  name,
  id,
  ariaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Normalize options to [{ value, label, subtext, icon }]
  const normalizedOptions = options.map((opt) => {
    if (opt == null) return { value: "", label: "" };
    if (Array.isArray(opt)) {
      return { value: opt[0], label: opt[1] ?? opt[0] };
    }
    if (typeof opt === "object") {
      return {
        value: opt.value ?? "",
        label: opt.label ?? opt.name ?? String(opt.value ?? ""),
        subtext: opt.subtext,
        icon: opt.icon,
      };
    }
    return { value: opt, label: String(opt) };
  });

  // Find currently selected option object
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && normalizedOptions[highlightedIndex]) {
        selectOption(normalizedOptions[highlightedIndex]);
      } else {
        setIsOpen((prev) => !prev);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) =>
          prev < normalizedOptions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(normalizedOptions.length - 1);
      } else {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : normalizedOptions.length - 1
        );
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      setIsOpen(false);
    }
  };

  const selectOption = (opt) => {
    if (onChange) {
      onChange(opt.value, opt);
    }
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && menuRef.current && highlightedIndex >= 0) {
      const activeEl = menuRef.current.children[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div
      ref={wrapperRef}
      className={`nike-select-wrapper nike-select-size-${size} nike-select-variant-${variant} ${
        isOpen ? "is-open" : ""
      } ${isFocused ? "is-focused" : ""} ${className}`}
    >
      {outsideLabel && (
        <label htmlFor={selectId} className="nike-select-outside-label">
          {outsideLabel}
        </label>
      )}

      {/* Hidden input for HTML form submissions */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value ?? ""}
          disabled={disabled}
        />
      )}

      {/* Control Button */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || label || outsideLabel || placeholder}
        className={`nike-select-control ${disabled ? "is-disabled" : ""}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setIsFocused(true);
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          if (!isOpen) setIsFocused(false);
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="nike-select-content-box">
          {label && <span className="nike-select-floating-label">{label}</span>}
          <div className="nike-select-value-row">
            {(selectedOption?.icon || icon) && (
              <span className="nike-select-leading-icon">
                {selectedOption?.icon || icon}
              </span>
            )}
            <span
              className={`nike-select-value ${
                !selectedOption ? "nike-select-placeholder" : ""
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
        </div>

        {/* Chevron Icon */}
        <span className="nike-select-chevron" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={selectId}
          className="nike-select-menu"
        >
          {normalizedOptions.map((opt, idx) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={`${opt.value}-${idx}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`nike-select-option ${
                  isSelected ? "is-selected" : ""
                } ${highlightedIndex === idx ? "is-highlighted" : ""}`}
                onClick={() => selectOption(opt)}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                <div className="nike-select-option-content">
                  {opt.icon && (
                    <span className="nike-select-leading-icon">{opt.icon}</span>
                  )}
                  <span className="nike-select-option-text">{opt.label}</span>
                  {opt.subtext && (
                    <span className="nike-select-option-subtext">
                      {opt.subtext}
                    </span>
                  )}
                </div>

                <div className="nike-select-indicator" aria-hidden="true">
                  {indicatorType === "check" ? (
                    isSelected ? (
                      <svg
                        className="nike-select-check-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : null
                  ) : (
                    <span className="nike-select-radio" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

