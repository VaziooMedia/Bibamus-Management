import React, { useState } from "react";
import { validateNewStyle, uniqueStyleCode, allStyleCodes, describeStyleError } from "../data/customStyles.js";

// Ajout manuel d'un style de bière / cidre (Niveau 1 → Style(s)). Le style est enregistré une fois
// pour toutes (table custom_beer_cider_styles) : il rejoint son groupe pour TOUS les produits, puis
// est sélectionné pour celui en cours d'édition.
//   groups   : les groupes de la liste figée (pour le choix du groupe et la détection des doublons)
//   custom   : les styles déjà ajoutés à la main
//   onCreate : async ({ code, fr, groupTitle }) -> { style } ou { error }
//   onCreated: (style) -> void

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13px" };
const outlineButton = (color) => ({ background: "none", border: `2px solid ${color}`, borderRadius: "8px", padding: "0 14px", height: "40px", color, cursor: "pointer", fontSize: "12.5px", fontWeight: 700 });

export function StyleAdder({ groups, custom, onCreate, onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const close = () => {
    setOpen(false);
    setName("");
    setGroupTitle("");
  };

  const submit = async () => {
    if (busy) return;
    const problem = validateNewStyle(name, groupTitle, groups, custom);
    if (problem) {
      setMessage({ kind: "error", text: problem });
      return;
    }
    setBusy(true);
    const fr = name.trim().replace(/\s+/g, " ");
    const code = uniqueStyleCode(fr, allStyleCodes(groups, custom));
    const res = await onCreate({ code, fr, groupTitle });
    setBusy(false);
    if (res.error) {
      setMessage({ kind: "error", text: describeStyleError(res.error) });
      return;
    }
    onCreated(res.style);
    close();
    setMessage({ kind: "ok", text: `« ${res.style.fr} » ajouté au groupe « ${res.style.groupTitle} » et sélectionné pour ce produit.` });
  };

  return (
    <div style={{ marginTop: "12px" }}>
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
            setMessage(null);
          }}
          style={{ background: "none", border: "2px dashed #28405C", borderRadius: "8px", padding: "0 14px", height: "38px", color: "#39FF66", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
        >
          + Ajouter un style
        </button>
      ) : (
        <div style={{ border: "2px solid #28405C", borderRadius: "8px", padding: "12px", background: "#16273D" }}>
          <p style={{ fontSize: "11.5px", color: "#8792A6", fontStyle: "italic", marginTop: 0, marginBottom: "10px" }}>
            Ce style rejoindra la liste pour tous les produits : vérifiez l'orthographe avant d'ajouter.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Nom du style (ex. Lambic Fruité)"
              style={{ ...fieldStyle, flex: 1, minWidth: "200px" }}
            />
            <select value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} style={{ ...fieldStyle, flex: 1, minWidth: "200px" }}>
              <option value="">Groupe…</option>
              {groups.map((g) => (
                <option key={g.title} value={g.title}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button onClick={submit} disabled={busy} style={outlineButton("#39FF66")}>
              {busy ? "Ajout…" : "Ajouter"}
            </button>
            <button onClick={() => { close(); setMessage(null); }} style={outlineButton("#8792A6")}>
              Annuler
            </button>
          </div>
        </div>
      )}
      {message && (
        <p style={{ fontSize: "12px", marginTop: "8px", marginBottom: 0, color: message.kind === "error" ? "#FF3B4E" : "#39FF66" }}>{message.text}</p>
      )}
    </div>
  );
}
