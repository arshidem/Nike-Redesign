import React from "react";
import "./wishlist-spinner.css";

export default function WishlistSpinner() {
  return (
    <svg
      className="wishlist-spinner"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.2"
      />
      <path
        d="M12 4a8 8 0 0 1 8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
