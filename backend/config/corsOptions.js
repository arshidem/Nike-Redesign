// Vercel preview hosts are scoped to this project and account, rather than
// allowing every application hosted on vercel.app.
const previewHost =
  /^nike-redesign-[a-z0-9-]+-arshids-projects-54081a2e\.vercel\.app$/;
const defaults = [
  "https://nike-redesign-six.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];
function configuredOrigin(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}
function isAllowedOrigin(origin, env = process.env) {
  if (!origin) return true; // Health checks and server-to-server requests.
  const configured = [
    env.FRONTEND_URL,
    env.FRONTEND_URL_HOST,
    ...(env.FRONTEND_URLS || "").split(","),
  ];
  const allowed = new Set([
    ...defaults,
    ...configured
      .map((value) => configuredOrigin(value?.trim()))
      .filter(Boolean),
  ]);
  if (allowed.has(origin)) return true;
  try {
    const url = new URL(origin);
    return (
      url.origin === origin &&
      url.protocol === "https:" &&
      !url.port &&
      previewHost.test(url.hostname)
    );
  } catch {
    return false;
  }
}
module.exports = {
  isAllowedOrigin,
  corsOptions: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  },
};
