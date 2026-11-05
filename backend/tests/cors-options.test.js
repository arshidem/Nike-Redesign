const test = require("node:test");
const assert = require("node:assert/strict");
const { isAllowedOrigin, corsOptions } = require("../config/corsOptions");
test("allows the reported deployment and new-features branch previews for this project/account", () => {
  for (const origin of [
    "https://nike-redesign-8iealwh4e-arshids-projects-54081a2e.vercel.app",
    "https://nike-redesign-git-new-features-arshids-projects-54081a2e.vercel.app",
  ])
    assert.equal(isAllowedOrigin(origin, {}), true);
});
test("rejects other projects/accounts, lookalike domains, HTTP previews and nonstandard ports", () => {
  for (const origin of [
    "https://other-project-8iealwh4e-arshids-projects-54081a2e.vercel.app",
    "https://nike-redesign-8iealwh4e-other-account.vercel.app",
    "https://nike-redesign-8iealwh4e-arshids-projects-54081a2e.vercel.app.evil.test",
    "http://nike-redesign-8iealwh4e-arshids-projects-54081a2e.vercel.app",
    "https://nike-redesign-8iealwh4e-arshids-projects-54081a2e.vercel.app:444",
    "null",
    "not a URL",
  ])
    assert.equal(isAllowedOrigin(origin, {}), false, origin);
});
test("preserves production/local origins and explicit configured origins", () => {
  const env = {
    FRONTEND_URL: "https://store.example/",
    FRONTEND_URL_HOST: "https://preview.example/",
    FRONTEND_URLS: "https://one.example, https://two.example/",
  };
  for (const origin of [
    "https://nike-redesign-six.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "https://store.example",
    "https://preview.example",
    "https://one.example",
    "https://two.example",
  ])
    assert.equal(isAllowedOrigin(origin, env), true, origin);
  assert.equal(isAllowedOrigin("https://unknown.example", env), false);
  assert.equal(isAllowedOrigin(undefined, env), true);
});
test("CORS middleware callback grants matching origin and refuses an unrelated site", () => {
  corsOptions.origin(
    "https://nike-redesign-8iealwh4e-arshids-projects-54081a2e.vercel.app",
    (error, allowed) => {
      assert.equal(error, null);
      assert.equal(allowed, true);
    },
  );
  corsOptions.origin("https://unrelated.example", (error, allowed) => {
    assert.equal(error.message, "Not allowed by CORS");
    assert.equal(allowed, undefined);
  });
  assert.equal(corsOptions.credentials, true);
});
