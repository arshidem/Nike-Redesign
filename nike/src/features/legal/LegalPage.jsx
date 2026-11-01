import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppBar from "../../shared/ui/AppBar";
import Footer from "../user/components/Footer";
import {
  legalContact,
  legalUpdated,
  privacyPolicy,
  termsOfService,
} from "./documents";
import "../../css/legal.css";

export default function LegalPage({ documentType }) {
  const privacy = documentType === "privacy";
  const document = privacy ? privacyPolicy : termsOfService;
  const [collapsed, setCollapsed] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    let frameId = null;
    const update = () => {
      frameId = null;
      if (!titleRef.current) return;
      const bottom = titleRef.current.getBoundingClientRect().bottom;
      setCollapsed(bottom < 56);
    };

    const onScroll = () => {
      if (frameId == null) frameId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameId != null) cancelAnimationFrame(frameId);
    };
  }, [documentType]);

  return (
    <div className="storefront legal-page">
      <AppBar
        fallback="/account"
        title={document.title}
        isScrolled={collapsed}
      />
      <main id="main-content">
        <header className="legal-hero">
          <p className="store-eyebrow">
            TRIODE STUDIO / STOREFRONT INFORMATION
          </p>
          <h1 ref={titleRef}>{document.title}</h1>
          <div className="legal-intro">
            <p>{document.intro}</p>
            <span>UPDATED {legalUpdated.toUpperCase()}</span>
          </div>
        </header>
        <div className="legal-layout">
          <aside className="legal-index">
            <p className="store-eyebrow">ON THIS PAGE</p>
            <nav aria-label="Document contents">
              {document.sections.map((section) => (
                <a key={section.id} href={`#${section.id}`}>
                  {section.title}
                </a>
              ))}
            </nav>
            <Link
              className="legal-other-document"
              to={privacy ? "/terms-of-service" : "/privacy-policy"}
            >
              {privacy ? "Terms of Service" : "Privacy Policy"} ↗
            </Link>
          </aside>
          <article
            className="legal-article"
            aria-label={privacy ? "Privacy Policy" : "Terms of Service"}
          >
            {document.sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </section>
            ))}
            <section id="contact">
              <h2>Contact Triode Studio</h2>
              <p>
                For questions regarding {privacy ? "this policy" : "these terms"},
                reach our privacy and compliance desk:
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${legalContact.email}`}>
                  {legalContact.email}
                </a>
                <br />
                <strong>Address:</strong> {legalContact.address}
              </p>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
