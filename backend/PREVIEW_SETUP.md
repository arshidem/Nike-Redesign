# Vercel preview API access

The frontend and backend deploy separately. A frontend preview can render its
static campaign images while live catalog requests are blocked by backend CORS.

## Allow the current preview without changing backend branches

The existing backend supports an explicit preview origin. In Render's backend
service environment, set:

```
FRONTEND_URL_HOST=https://nike-redesign-8iealwh4e-arshids-projects-54081a2e.vercel.app
```

Save and redeploy/restart the backend. Use the exact origin, without a trailing
slash. Retain `FRONTEND_URL` for the production storefront.

## Automatic previews after deploying this backend change

`config/corsOptions.js` also allows HTTPS Vercel previews scoped to the
`nike-redesign` project and `arshids-projects-54081a2e` account. It does not allow
arbitrary vercel.app websites. The production origin and existing explicit
`FRONTEND_URL` / `FRONTEND_URL_HOST` configuration remain supported. Additional
explicit origins can be supplied as comma-separated `FRONTEND_URLS` values.

This code must be deployed on the backend to take effect; deploying the Vercel
frontend alone does not update Render. Keep work on `new-features` until an
explicit merge is requested.

## Check the frontend too

Set `VITE_BACKEND_URL` in Vercel's Preview environment to the backend's HTTPS
origin. Rebuild the preview after changing a Vite environment variable. Verify
`/api/products/filter-options` and `/api/products?page=1&limit=100` in the
browser Network panel. Successful responses must be JSON, and the API's
`Access-Control-Allow-Origin` response header must match the preview's origin.
