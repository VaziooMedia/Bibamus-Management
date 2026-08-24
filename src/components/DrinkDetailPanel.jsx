import React, { useState } from "react";
import { updateDrink, deleteDrink } from "../data/sharedDirectories.js";
import { StatusSelector } from "./StatusSelector.jsx";

const DRINK_TYPES = ["Bières", "Vins & bulles", "Spiritueux", "Cocktails / Mocktails", "Softs & eaux", "Boissons chaudes", "Snacks"];

export function DrinkDetailPanel({ drink, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: drink.name || "",
    type: drink.type || "",
    brand: drink.brand || "",
    brewery: drink.brewery || "",
    nationality: drink.nationality || "",
    abv: drink.abv ?? "",
    kcalPer100ml: drink.kcalPer100ml ?? "",
    volumeCl: drink.volumeCl ?? "",
    glutenFree: !!drink.glutenFree,
    bio: !!drink.bio,
    avatarEmoji: drink.avatarEmoji || "",
  });
  const [status, setStatus] = useState(drink.status || "pending");
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const buildPatch = () => ({
    name: form.name.trim(),
    type: form.type,
    brand: form.brand.trim(),
    brewery: form.brewery.trim(),
    nationality: form.nationality.trim(),
    abv: form.abv === "" ? null : parseFloat(form.abv),
    kcalPer100ml: form.kcalPer100ml === "" ? null : parseFloat(form.kcalPer100ml),
    volumeCl: form.volumeCl === "" ? null : parseFloat(form.volumeCl),
    glutenFree: form.glutenFree,
    bio: form.bio,
    avatarEmoji: form.avatarEmoji.trim(),
  });

  const save = async () => {
    setSaving(true);
    const patch = { ...buildPatch(), status };
    await updateDrink(drink.id, patch);
    setSaving(false);
    onSaved({ ...drink, ...patch });
  };

  const remove = async () => {
    if (!confirm(`Supprimer définitivement "${drink.name}" ?`)) return;
    await deleteDrink(drink.id);
    onSaved(null);
  };

  const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%" };
  const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
      <div style={{ width: "480px", background: "#0D1B2A", height: "100%", overflowY: "auto", padding: "28px", borderLeft: "2px solid #28405C" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", margin: 0 }}>Vérifier le produit</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px", padding: "12px", background: "#16273D", borderRadius: "8px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#28405C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
            {form.avatarEmoji || "🍺"}
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Photo (emoji provisoire, à remplacer par un vrai upload plus tard)</label>
            <input value={form.avatarEmoji} onChange={(e) => set("avatarEmoji", e.target.value)} style={fieldStyle} placeholder="🍺" />
          </div>
        </div>

        <label style={labelStyle}>Nom du produit — vérifier orthographe et majuscules</label>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }} />

        <label style={labelStyle}>Type</label>
        <select value={form.type} onChange={(e) => set("type", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }}>
          {DRINK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Marque — vérifier orthographe</label>
            <input value={form.brand} onChange={(e) => set("brand", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Brasserie / Producteur</label>
            <input value={form.brewery} onChange={(e) => set("brewery", e.target.value)} style={fieldStyle} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Degré (%)</label>
            <input type="number" step="0.1" value={form.abv} onChange={(e) => set("abv", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Kcal /100ml</label>
            <input type="number" value={form.kcalPer100ml} onChange={(e) => set("kcalPer100ml", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Volume (cl)</label>
            <input type="number" step="0.1" value={form.volumeCl} onChange={(e) => set("volumeCl", e.target.value)} style={fieldStyle} />
          </div>
        </div>

        <label style={labelStyle}>Nationalité / origine</label>
        <input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }} />

        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
            <input type="checkbox" checked={form.glutenFree} onChange={(e) => set("glutenFree", e.target.checked)} />
            Sans gluten
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
            <input type="checkbox" checked={form.bio} onChange={(e) => set("bio", e.target.checked)} />
            Bio
          </label>
        </div>

        <label style={labelStyle}>Statut</label>
        <div style={{ marginBottom: "20px" }}>
          <StatusSelector value={status} onChange={setStatus} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={save}
            disabled={saving}
            style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer" }}
          >
            ✓ Enregistrer
          </button>
          <button onClick={remove} style={{ background: "none", border: "none", color: "#FF3B4E", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
            Supprimer ce produit
          </button>
        </div>
      </div>
    </div>
  );
}
