import React from "react";

// Même badge ✓ que dans l'app, juste la couleur change — aucun badge pour "utilisateur".
export const CERTIFICATION_LEVELS = [
  { key: "utilisateur", label: "Utilisateur (non certifié)", color: "#8792A6" },
  { key: "bibamus", label: "Certifié par Bibamus", color: "#39FF66" },
  { key: "producteur", label: "Confirmé par le producteur", color: "#FFC145" },
];

export function CertificationLevelSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {CERTIFICATION_LEVELS.map((c) => {
        const active = value === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            title={c.label}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "9px 6px",
              borderRadius: "8px",
              border: `2px solid ${active ? c.color : "#28405C"}`,
              background: active ? c.color : "none",
              color: active ? "#0D1B2A" : "#F2F2E8",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {c.key !== "utilisateur" && "✓"} {c.label.split(" ")[0]}
          </button>
        );
      })}
    </div>
  );
}
