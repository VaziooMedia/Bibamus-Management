import React, { useState } from "react";
import { updatePublicVenue, deletePublicVenue } from "../data/sharedDirectories.js";
import { StatusSelector } from "./StatusSelector.jsx";

export function VenueDetailPanel({ venue, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: venue.name || "",
    streetName: venue.streetName || "",
    streetNumber: venue.streetNumber || "",
    postalCode: venue.postalCode || "",
    city: venue.city || "",
    country: venue.country || "",
    phone: venue.phone || "",
    email: venue.email || "",
    website: venue.website || "",
  });
  const [status, setStatus] = useState(venue.status || "pending");
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const save = async () => {
    setSaving(true);
    const patch = {
      name: form.name.trim(),
      streetName: form.streetName.trim(),
      streetNumber: form.streetNumber.trim(),
      postalCode: form.postalCode.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      status,
    };
    await updatePublicVenue(venue.id, patch);
    setSaving(false);
    onSaved({ ...venue, ...patch });
  };

  const remove = async () => {
    if (!confirm(`Supprimer définitivement "${venue.name}" ?`)) return;
    await deletePublicVenue(venue.id);
    onSaved(null);
  };

  const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%" };
  const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
      <div style={{ width: "480px", background: "#0D1B2A", height: "100%", overflowY: "auto", padding: "28px", borderLeft: "2px solid #28405C" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", margin: 0 }}>Vérifier l'établissement</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <label style={labelStyle}>Nom — vérifier orthographe et majuscules</label>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }} />

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Rue</label>
            <input value={form.streetName} onChange={(e) => set("streetName", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Numéro</label>
            <input value={form.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} style={fieldStyle} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Code postal</label>
            <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Ville</label>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} style={fieldStyle} />
          </div>
        </div>

        <label style={labelStyle}>Pays</label>
        <input value={form.country} onChange={(e) => set("country", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={form.email} onChange={(e) => set("email", e.target.value)} style={fieldStyle} />
          </div>
        </div>

        <label style={labelStyle}>Site web</label>
        <input value={form.website} onChange={(e) => set("website", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }} />

        <label style={labelStyle}>Statut</label>
        <div style={{ marginBottom: "20px" }}>
          <StatusSelector value={status} onChange={setStatus} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
          <button
            onClick={save}
            disabled={saving}
            style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer" }}
          >
            ✓ Enregistrer
          </button>
          <button onClick={remove} style={{ background: "none", border: "none", color: "#FF3B4E", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
