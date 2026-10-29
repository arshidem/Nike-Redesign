import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import LegalPage from "../src/features/legal/LegalPage";

jest.mock("../src/features/user/components/Navbar", () => ({
  Navbar: () => <nav aria-label="Main navigation" />,
}));
let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

test.each([
  ["privacy", "PRIVACY POLICY.", "/terms-of-service"],
  ["terms", "TERMS OF SERVICE.", "/privacy-policy"],
])(
  "%s document renders valid contents anchors and links to the other policy",
  async (documentType, heading, otherRoute) => {
    await act(async () =>
      root.render(
        <MemoryRouter>
          <LegalPage documentType={documentType} />
        </MemoryRouter>,
      ),
    );
    expect(container.querySelector("h1").textContent).toBe(heading);
    const anchors = [
      ...container.querySelectorAll('[aria-label="Document contents"] a'),
    ];
    expect(anchors.length).toBeGreaterThan(5);
    for (const anchor of anchors)
      expect(
        container.querySelector(anchor.getAttribute("href")),
      ).not.toBeNull();
    expect(container.querySelector(`a[href="${otherRoute}"]`)).not.toBeNull();
    expect(
      container.querySelector('a[href="mailto:triodewebstudio@gmail.com"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[aria-label="Legal"] a[href="/privacy-policy"]'),
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[aria-label="Legal"] a[href="/terms-of-service"]',
      ),
    ).not.toBeNull();
  },
);
