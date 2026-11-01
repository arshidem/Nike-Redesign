import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import useAccountService from "../services/accountServices";
import useAuthService from "../services/authServices";
import {
  Field,
  Resource,
  SettingsDialog,
  message,
  useSettingsResource,
  useSignOut,
} from "./SettingsUI";
const money = (value) => `₹${Number(value).toLocaleString("en-IN")}`;
export function Security() {
  const { user } = useAppContext(),
    { busy, signOut } = useSignOut();
  return (
    <section className="settings-card settings-prose">
      <h2>Your email is your sign-in key.</h2>
      <p>
        We send a one-time code to your email when you sign in. This account
        does not use a password.
      </p>
      <dl>
        <dt>Sign-in email</dt>
        <dd>{user?.email}</dd>
        <dt>Last sign-in</dt>
        <dd>
          {user?.lastLogin
            ? new Date(user.lastLogin).toLocaleString()
            : "Not available"}
        </dd>
      </dl>
      <p>
        Keep your email account secure and never share a sign-in code. Signing
        out below ends access on this device.
      </p>
      <button className="settings-secondary" disabled={busy} onClick={signOut}>
        {busy ? "Signing out…" : "Sign out on this device"}
      </button>
    </section>
  );
}
export function Payments() {
  return (
    <section className="settings-card settings-prose">
      <h2>Secure payments at checkout.</h2>
      <p>
        Your available payment options appear in Razorpay when you continue to
        payment. This store does not save your card numbers or banking
        credentials.
      </p>
      <p>
        Saved payment methods are not managed in this account. Review your
        payment details in the secure checkout window before paying.
      </p>
      <Link className="settings-primary" to="/bag">
        Go to bag →
      </Link>
      <Link className="settings-text-link" to="/orders">
        View payments in your orders
      </Link>
    </section>
  );
}
export function Offers() {
  const api = useAccountService(),
    resource = useSettingsResource(api.getOffers),
    [notice, setNotice] = useState("");
  async function copy(code) {
    try {
      await navigator.clipboard.writeText(code);
      setNotice(`${code} copied. Apply it at checkout.`);
    } catch {
      setNotice(`Your code is ${code}. Enter it at checkout.`);
    }
  }
  return (
    <Resource value={resource}>
      {notice && (
        <p role="status" className="settings-success">
          {notice}
        </p>
      )}
      <div className="settings-card-grid">
        {resource.data?.map((offer) => (
          <article className="settings-card settings-offer" key={offer._id}>
            <span className="settings-tag">
              {offer.discountType === "percent"
                ? `${offer.discountValue}% OFF`
                : `${money(offer.discountValue)} OFF`}
            </span>
            <h2>{offer.code}</h2>
            <p>Minimum order: {money(offer.minOrderAmount || 0)}</p>
            <p>
              {offer.expiresAt
                ? `Expires ${new Date(offer.expiresAt).toLocaleDateString()}`
                : "No expiry date"}
            </p>
            <button
              className="settings-secondary"
              onClick={() => copy(offer.code)}
            >
              Copy code
            </button>
          </article>
        ))}
      </div>
      {!resource.data?.length && (
        <section className="settings-card settings-prose">
          <h2>No offers right now.</h2>
          <p>
            Check back for available codes. Discounts are validated against your
            cart at checkout.
          </p>
          <Link to="/products">Explore products →</Link>
        </section>
      )}
    </Resource>
  );
}
export function Notifications() {
  const api = useAccountService(),
    { setUser } = useAppContext(),
    resource = useSettingsResource(api.getPreferences),
    [email, setEmail] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    if (resource.data) setEmail(resource.data.notifications.email);
  }, [resource.data]);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const prefs = await api.savePreferences({ notifications: { email } });
      resource.setData(prefs);
      setUser((previous) => ({ ...previous, preferences: prefs }));
      setNotice("Preferences saved.");
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Resource value={resource}>
      <form className="settings-card settings-prose" onSubmit={save}>
        <h2>Stay in the loop.</h2>
        <label className="settings-toggle-row">
          <span>
            <strong>Offers & news by email</strong>
            <small>Save your preference for promotional emails.</small>
          </span>
          <input
            type="checkbox"
            checked={email}
            onChange={(event) => setEmail(event.target.checked)}
          />
        </label>
        <div className="settings-toggle-row">
          <span>
            <strong>Order & account messages</strong>
            <small>Essential confirmations and sign-in codes.</small>
          </span>
          <span className="settings-tag">Always on</span>
        </div>
        {notice && (
          <p role="status" className="settings-success">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="settings-error">
            {error}
          </p>
        )}
        <button className="settings-primary" disabled={busy}>
          {busy ? "Saving…" : "Save preferences"}
        </button>
      </form>
    </Resource>
  );
}
export function Help() {
  const api = useAccountService(),
    { token } = useAppContext(),
    resource = useSettingsResource(api.getSupport, { enabled: !!token }),
    [form, setForm] = useState({
      category: "order",
      subject: "",
      message: "",
      orderReference: "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const ticket = await api.submitSupport(form);
      resource.setData((previous) => [ticket, ...(previous || [])]);
      setForm({
        category: "order",
        subject: "",
        message: "",
        orderReference: "",
      });
      setNotice("Request sent. You can track its status below.");
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="settings-card settings-prose">
        <h2>A little help for your next move.</h2>
        <details>
          <summary>Where is my order?</summary>
          <p>
            Open <Link to="/orders">My Orders</Link> and choose an order to see
            its current status and delivery details.
          </p>
        </details>
        <details>
          <summary>How do I change my delivery address?</summary>
          <p>
            Manage <Link to="/account/addresses">saved addresses</Link> for
            future checkouts. Changing a saved address does not update an order
            already placed. Send a request below about an existing order.
          </p>
        </details>
        <details>
          <summary>My payment failed. What should I do?</summary>
          <p>
            Check your order history before trying again. If you were charged
            but cannot find your order, send the order or payment reference
            below. Never include card details, passwords or OTP codes.
          </p>
        </details>
        <details>
          <summary>How do offers work?</summary>
          <p>
            Find available codes in{" "}
            <Link to="/account/offers">Coupons & Offers</Link> and apply a code
            at checkout. Eligibility is checked against your order.
          </p>
        </details>
      </section>
      {token ? (
        <>
          <form className="settings-card settings-form" onSubmit={submit}>
            <h2>Send a support request.</h2>
            <Field label="Topic">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {["order", "payment", "account", "other"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Subject"
              required
              minLength={3}
              maxLength={120}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <Field
              label="Order / payment reference (optional)"
              maxLength={80}
              value={form.orderReference}
              onChange={(e) =>
                setForm({ ...form, orderReference: e.target.value })
              }
            />
            <Field label="How can we help?">
              <textarea
                required
                minLength={10}
                maxLength={3000}
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </Field>
            <p>Do not share card numbers, passwords or sign-in codes.</p>
            {error && (
              <p role="alert" className="settings-error">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="settings-success">
                {notice}
              </p>
            )}
            <button className="settings-primary" disabled={busy}>
              {busy ? "Sending…" : "Send request →"}
            </button>
          </form>
          <section>
            <h2 className="settings-section-label">Your requests</h2>
            <Resource value={resource}>
              {resource.data?.length ? (
                resource.data.map((ticket) => (
                  <article
                    className="settings-card settings-prose"
                    key={ticket._id}
                  >
                    <span className="settings-tag">
                      {ticket.status.replace("-", " ")}
                    </span>
                    <h3>{ticket.subject}</h3>
                    <p>{ticket.message}</p>
                    <small>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </small>
                  </article>
                ))
              ) : (
                <p>No support requests yet.</p>
              )}
            </Resource>
          </section>
        </>
      ) : (
        <Link className="settings-primary" to="/signin">
          Sign in to send a request
        </Link>
      )}
    </>
  );
}
export function Privacy() {
  const api = useAccountService(),
    auth = useAuthService(),
    { logout } = useAppContext(),
    navigate = useNavigate(),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false),
    [word, setWord] = useState("");
  async function download() {
    setBusy("export");
    setError("");
    try {
      const data = await api.exportData(),
        url = URL.createObjectURL(
          new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          }),
        ),
        anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "my-account-data.json";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy("");
    }
  }
  async function remove(event) {
    event.preventDefault();
    if (word !== "DELETE") return;
    setBusy("delete");
    setError("");
    try {
      await auth.deleteUser();
      logout();
      navigate("/home", { replace: true });
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <section className="settings-card settings-prose">
        <h2>Your data. Your choice.</h2>
        <p>
          Download your profile, saved addresses, order history and wishlist as
          a JSON file.
        </p>
        <button
          className="settings-primary"
          disabled={!!busy}
          onClick={download}
        >
          {busy === "export" ? "Preparing download…" : "Download my data ↓"}
        </button>
        <Link className="settings-text-link" to="/privacy">
          Read the privacy policy
        </Link>
      </section>
      <section className="settings-card settings-prose">
        <h2>Delete your account.</h2>
        <p>
          This permanently removes your account profile and signs you out. Past
          order records may be retained. You will lose access to account
          features.
        </p>
        <button
          className="settings-danger"
          disabled={!!busy}
          onClick={() => {
            setError("");
            setConfirm(true);
          }}
        >
          Delete account
        </button>
      </section>
      {error && !confirm && (
        <p role="alert" className="settings-error">
          {error}
        </p>
      )}
      {confirm && (
        <SettingsDialog
          title="Delete your account?"
          busy={!!busy}
          onClose={() => {
            setConfirm(false);
            setWord("");
          }}
        >
          <form className="settings-form" onSubmit={remove}>
            <p>This action cannot be undone. Type DELETE to confirm.</p>
            <Field
              label="Confirmation"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              autoComplete="off"
            />
            {error && (
              <p role="alert" className="settings-error">
                {error}
              </p>
            )}
            <button
              className="settings-danger"
              disabled={!!busy || word !== "DELETE"}
            >
              {busy === "delete" ? "Deleting…" : "Permanently delete account"}
            </button>
            <button
              type="button"
              className="settings-secondary"
              disabled={!!busy}
              onClick={() => setConfirm(false)}
            >
              Keep my account
            </button>
          </form>
        </SettingsDialog>
      )}
    </>
  );
}
export function Legal({ type }) {
  return (
    <article className="settings-card settings-prose">
      {type === "terms" ? (
        <>
          <h2>Using this storefront</h2>
          <p>
            This is an independent Nike-inspired store concept. Product
            availability, prices and eligible discounts are confirmed at
            checkout. Adding a product to your bag does not reserve its stock.
          </p>
          <h2>Orders & payments</h2>
          <p>
            Review your items, sizes, quantities, delivery address and total
            before paying. Payments are processed through Razorpay. An order is
            paid only after payment verification succeeds.
          </p>
          <h2>Account & support</h2>
          <p>
            Provide accurate contact details, protect your email sign-in codes
            and use the store responsibly. For order changes, delivery questions
            or return requests, contact the store through{" "}
            <Link to="/account/help">Help & Support</Link>. Availability of a
            change depends on the order’s status.
          </p>
        </>
      ) : (
        <>
          <h2>Information your account holds</h2>
          <p>
            We use your name, email, optional profile details, addresses, bag,
            wishlist and order information to provide account and shopping
            features. Support requests include the topic, message and reference
            you submit.
          </p>
          <h2>Payments & sign-in</h2>
          <p>
            Razorpay processes payment details. This store does not save card
            numbers or banking credentials. Email one-time codes are used for
            sign-in. Your browser stores an authentication token and shopping
            state.
          </p>
          <h2>Your controls</h2>
          <p>
            You can update your profile and addresses, save your email
            preference, download your account data or delete your account in{" "}
            <Link to="/account/privacy">Privacy & Data</Link>. Account deletion
            removes your profile; past order records may remain.
          </p>
          <h2>Questions about your data</h2>
          <p>
            Use <Link to="/account/help">Help & Support</Link> for privacy
            questions. Avoid sending sensitive payment details or sign-in codes.
          </p>
        </>
      )}
    </article>
  );
}
