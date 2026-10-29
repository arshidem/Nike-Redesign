# Storefront redesign

The storefront uses a black, warm-white, sage, and lime palette with locally hosted Anton typography, original repository shoe imagery, department cards, a featured product grid, and responsive navigation. Both / and /home open the storefront directly.

Product lists, model collections, product details, bag, and checkout share the visual styles in src/css/storefront.css. Their filtering, variant selection, wishlist, cart, and checkout handlers remain in the existing pages. The admin and authentication interfaces retain their existing layouts.

Editorial shoe images are copied from the repository's existing backend/uploads assets to public/assets/editorial so the homepage can render without an API request. Featured products, prices, and model collections still use the existing backend. Product cards have explicit loading, empty, and retry states. Editorial category images are illustrations of the collection, not inventory or pricing promises.

## Validation

From nike/, install the existing dependencies with npm install --legacy-peer-deps. The repository currently ignores package-lock.json. Run npm run build and npm run test:storefront. The interaction tests use mocked API responses and cover mobile navigation, search opening, product links and prices, and featured-collection retry behavior. They do not replace a connected backend test.

Before merging, check the Vercel preview at mobile and desktop widths and exercise filters, product variants, wishlist, bag updates, and checkout with the configured VITE_BACKEND_URL. Backend services and payment credentials were not changed or exercised during this redesign. No live orders or payments were created.
