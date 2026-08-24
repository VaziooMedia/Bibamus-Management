import React, { useState } from "react";
import { updateBrewery, deleteBrewery, createBrewery, updateBrand, deleteBrand, createBrand } from "../data/sharedDirectories.js";
import { StatusSelector } from "./StatusSelector.jsx";

// entity === null → mode création
export function SimpleEntityPanel({ entity, kind, onClose, onSaved }) {
  const isBrewery = kind === "brewery";
  const isNew = !entity;
  const [form, setForm] = useState({ name: entity?.name || "", country: entity?.country || "" });
  const [status, setStatus] = useState(entity?.status || (isNew ? "certified" : "pending"));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const patch = { name: form.name.trim(), ...(isBrewery ? { country: form.country.trim() } : {}), status };
    if (isNew) {
      const id = `${isBrewery ? "brewery" : "brand"}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const created = isBrewery ? await createBrewery({ id, ...patch }) : await createBrand({ id, ...patch });
      setSaving(false);
      onSaved(created);
    } else {
      if (isBrewery) await updateBrewery(entity.id, patch);
      else await updateBrand(entity.id, patch);
      setSaving(false);
      onSaved({ ...entity, ...patch });
    }
  };

  const remove = async () => {
    if (!confirm(`Supprimer définitivement "${entity.name}" ?`)) return;
    if (isBrewery) await deleteBrewery(entity.id);
    else await deleteBrand(entity.id);
    onSaved(null);
  };

  const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%" };
  const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
      <div style={{ width: "420px", background: "#0D1B2A", height: "100%", overflowY: "auto", padding: "28px", borderLeft: "2px solid #28405C" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", margin: 0 }}>
            {isNew ? (isBrewery ? "Ajouter un producteur" : "Ajouter une marque") : isBrewery ? "Vérifier le producteur" : "Vérifier la marque"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <label style={labelStyle}>Nom — vérifier orthographe et majuscules</label>
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ ...fieldStyle, marginBottom: "14px" }} />

        {isBrewery && (
          <>
            <label style={labelStyle}>Pays d'origine</label>
            <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} style={{ ...fieldStyle, marginBottom: "14px" }} />
          </>
        )}

        <label style={labelStyle}>Statut</label>
        <div style={{ marginBottom: "20px" }}>
          <StatusSelector value={status} onChange={setStatus} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
          <button
            onClick={save}
            disabled={saving || !form.name.trim()}
            style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: form.name.trim() ? 1 : 0.5 }}
          >
            ✓ {isNew ? "Créer" : "Enregistrer"}
          </button>
          {!isNew && (
            <button onClick={remove} style={{ background: "none", border: "none", color: "#FF3B4E", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
