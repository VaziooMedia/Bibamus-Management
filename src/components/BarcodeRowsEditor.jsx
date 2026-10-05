import React from "react";
import { CONTAINER_TYPES } from "../data/beerCiderStyles.js";
import { COUNTRIES } from "../constants.js";
import { emptyRow } from "../data/barcodeRows.js";

// Lignes de codes-barres de l'onglet Ajout rapide. Une ligne validée est VERROUILLÉE (lecture
// seule) : le code-barres est trop facile à modifier par accident dans un formulaire ; on ne le
// change qu'après avoir cliqué "Modifier", et "Valider" le reverrouille. Rien n'est écrit en base
// ici : c'est "Enregistrer" (panneau) qui le fait, via la logique de data/barcodeRows.js.

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px" };
const CONTAINER_LABELS = Object.fromEntries(CONTAINER_TYPES.map((c) => [c.code, c.fr]));
const COUNTRY_LABELS = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.fr]));
const outlineButton = (color) => ({ background: "none", border: `2px solid ${color}`, borderRadius: "8px", padding: "0 12px", height: "40px", color, cursor: "pointer", fontSize: "12.5px", fontWeight: 700, flexShrink: 0 });
const squareButton = (color) => ({ ...outlineButton(color), padding: 0, width: "40px", fontSize: "14px" });

export function BarcodeRowsEditor({ rows, onChange }) {
  const update = (key, patch) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const validate = (r) => {
    const code = r.code.trim();
    update(r.key, { code, locked: true, snapshot: { container: r.container, volume: r.volume, code, market: r.market } });
  };
  const cancel = (r) => update(r.key, { ...r.snapshot, locked: !!r.snapshot.code });
  const remove = (r) => {
    if ((r.locked || r.id) && !window.confirm("Supprimer ce code-barres ?")) return;
    const next = rows.filter((x) => x.key !== r.key);
    onChange(next.length > 0 ? next : [emptyRow()]);
  };

  return (
    <div>
      <p style={{ fontSize: "11.5px", color: "#8792A6", fontStyle: "italic", marginTop: "-6px", marginBottom: "10px" }}>
        Un code-barres ne peut désigner qu'un seul produit. Une ligne validée est verrouillée : cliquez sur « Modifier » pour la changer.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "10px" }}>
        {rows.map((r) =>
          r.locked ? (
            <div key={r.key} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#16273D", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 12px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#F2F2E8", letterSpacing: "0.3px" }}>{r.code}</div>
                <div style={{ fontSize: "11.5px", color: "#8792A6" }}>
                  {[r.container ? CONTAINER_LABELS[r.container] || r.container : null, r.volume ? `${r.volume} cl.` : null, r.market ? COUNTRY_LABELS[r.market] || r.market : null].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <button onClick={() => update(r.key, { locked: false })} style={outlineButton("#39FF66")}>
                Modifier
              </button>
              <button onClick={() => remove(r)} title="Supprimer ce code-barres" style={squareButton("#FF3B4E")}>
                ✕
              </button>
            </div>
          ) : (
            <div key={r.key} style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              <select value={r.container} onChange={(e) => update(r.key, { container: e.target.value })} style={{ ...fieldStyle, width: "130px" }}>
                <option value="">Contenant</option>
                {CONTAINER_TYPES.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.fr}
                  </option>
                ))}
              </select>
              <input value={r.volume} onChange={(e) => update(r.key, { volume: e.target.value })} placeholder="Vol. (cl)" style={{ ...fieldStyle, width: "76px" }} />
              <input value={r.code} onChange={(e) => update(r.key, { code: e.target.value })} placeholder="Code-barres" style={{ ...fieldStyle, width: "170px" }} />
              <select value={r.market} onChange={(e) => update(r.key, { market: e.target.value })} style={{ ...fieldStyle, width: "150px" }}>
                <option value="">Marché — tous</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.fr}
                  </option>
                ))}
              </select>
              {r.code.trim() !== "" && (
                <button onClick={() => validate(r)} style={outlineButton("#39FF66")}>
                  Valider
                </button>
              )}
              {r.snapshot && (
                <button onClick={() => cancel(r)} style={outlineButton("#8792A6")}>
                  Annuler
                </button>
              )}
              <button onClick={() => remove(r)} title="Retirer ce code-barres" style={squareButton("#FF3B4E")}>
                ✕
              </button>
            </div>
          )
        )}
      </div>
      <button
        onClick={() => onChange([...rows, emptyRow()])}
        title="Ajouter un code-barres"
        style={{ background: "none", border: "2px dashed #28405C", borderRadius: "8px", width: "40px", height: "36px", color: "#39FF66", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}
      >
        +
      </button>
    </div>
  );
}
