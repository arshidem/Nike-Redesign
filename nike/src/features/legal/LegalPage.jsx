import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../user/components/Navbar";
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
  return (
    <div className="storefront legal-page">
      <Navbar />
      <main id="main-content">
        <header className="legal-hero">
          <p className="store-eyebrow">
            TRIODE STUDIO / STOREFRONT INFORMATION
          </p>
          <h1>{document.title}</h1>
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
            <section className="legal-contact" id="contact">
              <p className="store-eyebrow">LET’S TALK</p>
              <h2>Questions? We’re here.</h2>
              <a href={`mailto:${legalContact}`}>{legalContact} ↗</a>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
