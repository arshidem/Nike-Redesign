# Checkout and payment setup

Deploy the Render backend before the Vercel frontend for this update. Both payment endpoints require a signed-in user.

Backend variables:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- Existing MongoDB and email settings

The initiation endpoint now receives the delivery address, reads the authenticated user's cart, and stores a `CheckoutSession` snapshot before returning the Razorpay order and public key ID. The frontend no longer needs a separate `VITE_RAZORPAY_KEY_ID`; the secret key always stays on the backend. Order finalization uses MongoDB transactions, as the previous order implementation did.

Verification checks the signature, account, gateway order, amount, currency and captured status. It creates the paid order, updates the exact variant's stock, and removes only purchased cart quantities in one transaction. Repeated verification returns the existing order. Shipping, tax and discounts come from the same quote used to create the payment.

If payment succeeds but confirmation is interrupted, checkout keeps the payment proof in tab session storage and offers Retry confirmation. It does not start another payment. Account address saving is optional and a failure to save an address does not discard delivery details.

Validation completed with simulated gateway/model responses, actual Mongoose schema validation, and browser-intercepted SDK/API responses. No real payment was made. For a complete deployment check, use matching Razorpay test-mode backend credentials, sign in, add an in-stock item and valid address, and complete a test-mode payment. Verify the order appears once and the purchased items leave the bag. Dismissing the payment window should leave the bag intact.

Checks:
- `npm run test:storefront` from `nike`
- `node backend/tests/checkout.test.js` from the repository root
- `node backend/tests/catalog.test.js` from the repository root
