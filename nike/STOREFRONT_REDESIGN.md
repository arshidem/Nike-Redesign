# Nike application design

The application uses the homepage's warm-white, black, sage, and lime palette, locally hosted Anton typography, shared content edges, and square panel styling.

## Coverage

- Homepage, navigation, footer, department cards, featured products, and icon collections.
- Product lists and model collections, filters, product details, suggestions, reviews, and rating summaries.
- Bag, wishlist, checkout, orders, order details, profile, account details, and delivery addresses.
- Sign-in, both OTP screens, and registration completion, using a shared editorial membership shell.
- Admin dashboard/sidebar, product and user management, order tables, coupons, analytics, reports, product creation and editing, and detail pages.
- Shared loading skeletons, spinner, empty/error states, search overlay, inputs, buttons, panels, tables, and dialogs.

The logo loader remains disabled. The Reports view remains a presentation-only empty workspace; no reports service was introduced.

## Behavior boundaries

The full application styling pass changes presentation classes, static markup, chart display colors, and stylesheet imports. It does not change existing hooks, handlers, validation, calculations, API requests, database models, workflow conditions, or service code. AuthFrame is a presentation wrapper; each auth screen continues to own its original form logic.

Editorial shoe images are copied from the repository's existing backend/uploads assets to public/assets/editorial. They are collection artwork, not inventory or pricing promises. Product collections and prices still use the existing backend.

## Validation

From nike/, install dependencies with npm install --legacy-peer-deps. The existing repository ignores package-lock.json. Run:

- npm run build
- npm run test:storefront
- node scripts/verify-presentation.cjs ec02e200655c3b45d74fc7902d7d797eedc170b7

The seven DOM interaction tests mock APIs. They cover navigation/search, featured-product links and failure recovery, sign-in validation and the exact OTP request/navigation, and reusable filter selection. The presentation verification compares non-render code and non-style JSX expressions against the first merged redesign, detecting changes to existing behavioral expressions. It excludes the stylesheet entry import and the new AuthFrame presentation file.

Browser visual QA was unavailable in the execution environment. Before merging, review representative customer, membership, and admin screens on the deployment preview at mobile, tablet, and desktop widths. Pay particular attention to long tables, dialogs, OTP fields, account navigation, and chart sizing. Live backend, inventory, authentication delivery, and checkout/payment integration were not exercised. No orders or payments were created.
