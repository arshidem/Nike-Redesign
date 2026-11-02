import React, { useEffect, useState } from "react";
import NikeSelect from "../../../shared/ui/NikeSelect";
import { Link } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import useAuthService from "../services/authServices";
import { Field, Resource, message, useSettingsResource } from "./SettingsUI";
const fields = {
  name: "",
  phone: "",
  gender: "",
  dob: "",
  country: "",
  state: "",
  city: "",
  postalCode: "",
};
export default function AccountDetails() {
  const auth = useAuthService(),
    { setUser } = useAppContext(),
    resource = useSettingsResource(() => auth.getMe());
  const [form, setForm] = useState(fields),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    if (resource.data)
      setForm(
        Object.fromEntries(
          Object.keys(fields).map((key) => [key, resource.data[key] || ""]),
        ),
      );
  }, [resource.data]);
  const change = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
    setSaved(false);
  };
  const save = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setSaved(false);
    if (form.name.trim().length < 2 || form.name.trim().length > 50) {
      setError("Enter a name between 2 and 50 characters.");
      return;
    }
    if (form.phone && !/^\+?[\d\s().-]{7,20}$/.test(form.phone)) {
      setError("Enter a valid phone number.");
      return;
    }
    setBusy(true);
    try {
      const result = await auth.updateUserData({
        ...form,
        gender: form.gender || undefined,
        name: form.name.trim(),
      });
      resource.setData({ ...resource.data, ...result.user });
      setUser((previous) => ({
        ...previous,
        ...result.user,
        isAuthenticated: true,
      }));
      setSaved(true);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Resource value={resource}>
      <form className="settings-card settings-form" onSubmit={save}>
        <div className="settings-fields">
          <Field
            label="Full name"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={50}
            value={form.name}
            onChange={change}
          />
          <Field
            label="Email address"
            type="email"
            value={resource.data?.email || ""}
            readOnly
          />
          <Field
            label="Phone number"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={change}
          />
          <Field
            label="Date of birth"
            name="dob"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={String(form.dob).slice(0, 10)}
            onChange={change}
          />
          <div className="settings-field-box">
            <NikeSelect
              label="Gender"
              value={form.gender}
              onChange={(val) => {
                setForm((prev) => ({ ...prev, gender: val }));
// dirty tracking
              }}
              options={[
                { value: "", label: "Choose gender" },
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
                { value: "prefer-not-to-say", label: "Prefer not to say" },
              ]}
              placeholder="Choose gender"
            />
          </div>
          <Field
            label="Country / Region"
            name="country"
            autoComplete="country-name"
            value={form.country}
            onChange={change}
          />
          <Field
            label="State / Province"
            name="state"
            autoComplete="address-level1"
            value={form.state}
            onChange={change}
          />
          <Field
            label="Town / City"
            name="city"
            autoComplete="address-level2"
            value={form.city}
            onChange={change}
          />
          <Field
            label="Postcode"
            name="postalCode"
            autoComplete="postal-code"
            value={form.postalCode}
            onChange={change}
          />
        </div>
        <p className="settings-muted">
          Your email is used for OTP sign-in and order confirmations.
        </p>
        {error && (
          <p className="settings-error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="settings-success" role="status">
            Your information is saved.
          </p>
        )}
        <button className="settings-primary" disabled={busy} type="submit">
          {busy ? "Saving…" : "Save Changes"}
        </button>
        <Link className="settings-text-link" to="/account/privacy">
          Privacy and account deletion
        </Link>
      </form>
    </Resource>
  );
}
