import React, { useState } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import useAddressService from "../services/addressServices";
import {
  Field,
  Resource,
  SettingsDialog,
  message,
  useSettingsResource,
} from "./SettingsUI";
const blank = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};
export default function DeliveryAddresses() {
  const api = useAddressService(),
    resource = useSettingsResource(() => api.getAddresses());
  const [form, setForm] = useState(null),
    [editId, setEditId] = useState(null),
    [deleteId, setDeleteId] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const addresses = Array.isArray(resource.data) ? resource.data : [];
  const open = (address) => {
    setError("");
    setEditId(address?._id || null);
    setForm(address ? { ...blank, ...address } : { ...blank });
  };
  const commit = (address) =>
    resource.setData((previous) => {
      const list = Array.isArray(previous) ? previous : [],
        next = list.some((row) => row._id === address._id)
          ? list.map((row) => (row._id === address._id ? address : row))
          : [...list, address];
      return address.isDefault
        ? next.map((row) => ({ ...row, isDefault: row._id === address._id }))
        : next;
    });
  const save = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (!/^\+?[\d\s().-]{7,20}$/.test(form.phone)) {
      setError("Enter a valid phone number.");
      return;
    }
    if (
      form.country.trim().toLowerCase() === "india" &&
      !/^\d{6}$/.test(form.postalCode)
    ) {
      setError("Enter a valid 6-digit PIN code.");
      return;
    }
    setBusy(true);
    try {
      const data = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [
          key,
          typeof value === "string" ? value.trim() : value,
        ]),
      );
      const result = editId
        ? await api.updateAddress(editId, data)
        : await api.addAddress(data);
      commit(result);
      setForm(null);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api.deleteAddress(deleteId);
      resource.setData(addresses.filter((row) => row._id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };
  const makeDefault = async (address) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      commit(
        await api.updateAddress(address._id, { ...address, isDefault: true }),
      );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="settings-section-actions">
        <span>
          {addresses.length} saved{" "}
          {addresses.length === 1 ? "address" : "addresses"}
        </span>
        <button
          type="button"
          className="settings-primary"
          disabled={busy}
          onClick={() => open(null)}
        >
          <PlusIcon />
          Add address
        </button>
      </div>
      <Resource value={resource}>
        {!addresses.length ? (
          <section className="settings-card settings-empty">
            <MapPinIcon />
            <h2>A place for your next delivery.</h2>
            <p>Add an address to make checkout quicker.</p>
          </section>
        ) : (
          <div className="settings-address-grid">
            {addresses.map((address) => (
              <article
                className="settings-card settings-address-card"
                key={address._id}
              >
                {address.isDefault && (
                  <span className="settings-tag">Default</span>
                )}
                <strong>{address.fullName}</strong>
                <p>
                  {address.street}
                  <br />
                  {address.city}, {address.state} – {address.postalCode}
                  <br />
                  {address.country}
                </p>
                <span>{address.phone}</span>
                <footer>
                  {!address.isDefault && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => makeDefault(address)}
                    >
                      Set as default
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Edit address for ${address.fullName}`}
                    onClick={() => open(address)}
                  >
                    <PencilSquareIcon />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Delete address for ${address.fullName}`}
                    onClick={() => {
                      setError("");
                      setDeleteId(address._id);
                    }}
                  >
                    <TrashIcon />
                    Delete
                  </button>
                </footer>
              </article>
            ))}
          </div>
        )}
      </Resource>
      {error && !form && !deleteId && (
        <p role="alert" className="settings-error">
          {error}
        </p>
      )}
      {form && (
        <SettingsDialog
          title={editId ? "Edit address" : "New address"}
          busy={busy}
          onClose={() => setForm(null)}
        >
          <form onSubmit={save} className="settings-dialog-form">
            <div className="settings-fields">
              {[
                ["fullName", "Full name", "text"],
                ["phone", "Phone number", "tel"],
                ["street", "Address line", "text"],
                ["city", "Town / City", "text"],
                ["state", "State / Province", "text"],
                ["postalCode", "PIN / Postal code", "text"],
                ["country", "Country", "text"],
              ].map(([key, label, type]) => (
                <Field
                  key={key}
                  label={label}
                  name={key}
                  type={type}
                  required
                  value={form[key]}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      [key]: event.target.value,
                    }))
                  }
                />
              ))}
              <label className="settings-check">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      isDefault: event.target.checked,
                    }))
                  }
                />
                Use as default address
              </label>
            </div>
            {error && (
              <p role="alert" className="settings-error">
                {error}
              </p>
            )}
            <footer>
              <button
                type="button"
                className="settings-secondary"
                disabled={busy}
                onClick={() => setForm(null)}
              >
                Cancel
              </button>
              <button
                className="settings-primary"
                disabled={busy}
                type="submit"
              >
                {busy ? "Saving…" : "Save address"}
              </button>
            </footer>
          </form>
        </SettingsDialog>
      )}
      {deleteId && (
        <SettingsDialog
          title="Delete address?"
          busy={busy}
          onClose={() => setDeleteId(null)}
        >
          <div className="settings-dialog-form">
            <p>
              This removes the address from your saved delivery addresses.
              Existing orders keep their delivery details.
            </p>
            {error && (
              <p role="alert" className="settings-error">
                {error}
              </p>
            )}
            <footer>
              <button
                type="button"
                className="settings-secondary"
                disabled={busy}
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="settings-danger"
                disabled={busy}
                onClick={remove}
              >
                {busy ? "Deleting…" : "Delete address"}
              </button>
            </footer>
          </div>
        </SettingsDialog>
      )}
    </>
  );
}
