import NikeSelect from "../../../shared/ui/NikeSelect";
import React, { useState } from "react";
import useAccountService from "../../user/services/accountServices";
import {
  Resource,
  message,
  useSettingsResource,
} from "../../user/AccountSettings/SettingsUI";
import "../../../css/settings.css";
export default function SupportRequests() {
  const api = useAccountService(),
    resource = useSettingsResource(api.getAdminSupport),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  async function update(id, status) {
    setBusy(id);
    setError("");
    try {
      const ticket = await api.updateSupport(id, status);
      resource.setData((previous) =>
        previous.map((item) => (item._id === id ? ticket : item)),
      );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="support-inbox">
      <h1>Customer Support</h1>
      <p>
        Review the latest 100 requests and keep customers informed of their
        status.
      </p>
      {error && (
        <p role="alert" className="settings-error">
          {error}
        </p>
      )}
      <Resource value={resource}>
        {resource.data?.length ? (
          resource.data.map((ticket) => (
            <article className="settings-card" key={ticket._id}>
              <div className="support-ticket-head">
                <div>
                  <span className="settings-tag">{ticket.category}</span>
                  <h2>{ticket.subject}</h2>
                  <p>
                    {ticket.user?.name || "Deleted account"} ·{" "}
                    {ticket.user?.email || "Email unavailable"}
                  </p>
                </div>
                <label>
                  Status{" "}
                  <NikeSelect
                    aria-label={`Status for ${ticket.subject}`}
                    disabled={!!busy}
                    value={ticket.status}
                    onChange={(e) => update(ticket._id, e.target.value)}
                  >
                    {["open", "in-progress", "closed"].map((status) => (
                      <option key={status} value={status}>
                        {status.replace("-", " ")}
                      </option>
                    ))}
                  </NikeSelect>
                </label>
              </div>
              <p>{ticket.message}</p>
              {ticket.orderReference && (
                <p>Reference: {ticket.orderReference}</p>
              )}
              <small>{new Date(ticket.createdAt).toLocaleString()}</small>
            </article>
          ))
        ) : (
          <div className="settings-card">No support requests yet.</div>
        )}
      </Resource>
    </section>
  );
}
