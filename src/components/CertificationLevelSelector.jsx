import React from "react";
import { CertificationIcon, CERTIFICATION_TOOLTIP } from "./CertificationIcon.jsx";

export const CERTIFICATION_LEVELS = [
  { key: "utilisateur", label: "Utilisateur (non certifié)", color: "#8792A6" },
  { key: "bibamus", label: "Certifié par Bibamus", color: "#39FF66" },
  { key: "producteur", label: "Confirmé par le producteur", color: "#FFC145" },
];

// Icônes compactes (personnage / rosette verte / rosette ambrée) plutôt que des boutons pleine
// largeur avec le texte en toutes lettres — gagne beaucoup de place dans les fiches.
export function CertificationLevelSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      {CERTIFICATION_LEVELS.map((c) => {
        const active = value === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            title={CERTIFICATION_TOOLTIP[c.key]}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              border: `2px solid ${active ? c.color : "#28405C"}`,
              background: active ? "rgba(255,255,255,0.05)" : "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <CertificationIcon level={c.key} size={20} />
          </button>
        );
      })}
    </div>
  );
}
