import React from "react";
import { Link } from "react-router-dom";

/** Presentation shell only; each child owns its original form and auth flow. */
export default function AuthFrame({ children }) {
  return (
    <main className="auth-frame">
      <aside className="auth-editorial" aria-label="Nike membership">
        <Link
          to="/home"
          className="auth-brand"
          aria-label="Return to Nike home"
        >
          <img src="/assets/logo/nikeLogo.png" alt="Nike" />
          <span>NIKE / MEMBERSHIP</span>
          <span aria-hidden="true">↗</span>
        </Link>
        <div className="auth-editorial-copy">
          <p className="store-eyebrow">YOUR EVERYDAY. YOUR WAY.</p>
          <h2>
            YOUR NEXT
            <br />
            <span>MOVE.</span>
          </h2>
          <p>
            A space for your favourites, your next pair, and everything that
            moves you.
          </p>
        </div>
        <img
          className="auth-editorial-shoe"
          src="/assets/editorial/dunk.png"
          alt=""
        />
        <div className="auth-editorial-footer">
          <span>EVERYDAY ICONS / VOL. 01</span>
          <span>NEVER DONE. ↗</span>
        </div>
      </aside>
      <section className="auth-form-space">
        <Link to="/home" className="auth-back">
          ← Back to the collection
        </Link>
        <div className="auth-form-content">{children}</div>
        <p className="auth-caption">NIKE / INDEPENDENT STOREFRONT CONCEPT</p>
      </section>
    </main>
  );
}
