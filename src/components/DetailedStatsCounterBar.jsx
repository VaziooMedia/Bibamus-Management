import React from "react";
import { STATUSES } from "./StatusSelector.jsx";
import { CERTIFICATION_LEVELS } from "./CertificationLevelSelector.jsx";

function Stat({ label, value, color = "#39FF66" }) {
  return (
    <div style={{ background: "#16273D", borderRadius: "10px", padding: "14px 16px", flex: 1, minWidth: "110px", textAlign: "center" }}>
      <div style={{ fontSize: "11.5px", color: "#8792A6", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "26px", color }}>{value}</div>
    </div>
  );
}

const rowStyle = { display: "flex", gap: "12px", flexWrap: "wrap" };
const separatorStyle = { borderBottom: "1px solid #28405C", margin: "16px 0" };
const rowTitleStyle = { fontSize: "12px", fontWeight: 700, color: "#8792A6", margin: "0 0 10px 0" };

// Remplace StatsCounterBar (5 blocs, ancien système de statut) pour les répertoires migrés vers
// le nouveau modèle à 7 statuts — lieux en premier, puis produits/producteurs/marques à terme.
// Ligne 1 : Total + Nouvelles contributions. Ligne 2 (Statut) : les 7 statuts du cycle de vie,
// chacun dans sa propre couleur déjà définie par STATUSES. Ligne 3 (Niveau de certification) :
// les 3 niveaux, chacun dans sa propre couleur déjà définie par CERTIFICATION_LEVELS.
export function DetailedStatsCounterBar({ items }) {
  const total = items.length;
  const newContributions = items.filter((i) => (i.pendingContributionsCount || 0) > 0).length;

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={rowStyle}>
        <Stat label="Total" value={total} />
        <Stat label="Nouvelles contributions" value={newContributions} />
      </div>

      <div style={separatorStyle} />
      <p style={rowTitleStyle}>Statut</p>
      <div style={rowStyle}>
        {STATUSES.map((s) => (
          <Stat key={s.key} label={s.label} value={items.filter((i) => i.status === s.key).length} color={s.color} />
        ))}
      </div>

      <div style={separatorStyle} />
      <p style={rowTitleStyle}>Niveau de certification</p>
      <div style={rowStyle}>
        <Stat label="Utilisateurs" value={items.filter((i) => i.certificationLevel === "utilisateur").length} color={CERTIFICATION_LEVELS[0].color} />
        <Stat label="Bibamus" value={items.filter((i) => i.certificationLevel === "bibamus").length} color={CERTIFICATION_LEVELS[1].color} />
        <Stat label="Producteur" value={items.filter((i) => i.certificationLevel === "producteur").length} color={CERTIFICATION_LEVELS[2].color} />
      </div>
    </div>
  );
}
