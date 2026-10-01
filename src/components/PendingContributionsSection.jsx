import React, { useState, useEffect } from "react";
import { loadContributionsForEntity, approveContribution, rejectContribution } from "../data/sharedDirectories.js";

const FIELD_LABELS = {
  abv: "Taux d'alcool",
  name: "Nom",
  phone: "Téléphone",
  email: "Email",
  address: "Adresse",
  nationality: "Pays d'origine",
};

function formatValue(v) {
  if (v === null || v === undefined || v === "") return "(vide)";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// N'affiche RIEN du tout tant qu'aucune contribution n'est en attente pour cette fiche — pas de
// bruit visuel sur les fiches jamais concernées. Dès qu'une vraie décision (accepter/rejeter) est
// prise, prévient le parent via onApplied pour qu'il puisse recharger la fiche affichée, puisque
// "Accepter" modifie la vraie valeur directement en base, pas seulement cette liste.
export function PendingContributionsSection({ entityType, entityId, reviewerId, onApplied }) {
  const [contributions, setContributions] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const refresh = () => {
    if (!entityId) {
      setContributions([]);
      return;
    }
    loadContributionsForEntity(entityType, entityId).then(setContributions);
  };

  useEffect(refresh, [entityType, entityId]);

  if (!contributions || contributions.length === 0) return null;

  const decide = async (contribution, approve) => {
    setBusyId(contribution.id);
    if (approve) await approveContribution(contribution, reviewerId);
    else await rejectContribution(contribution, reviewerId);
    setBusyId(null);
    refresh();
    if (approve) onApplied?.(contribution);
  };

  return (
    <div style={{ background: "#2A1F0D", border: "2px solid #FF9500", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
      <div style={{ fontSize: "11px", letterSpacing: "1px", color: "#FF9500", fontWeight: 800, marginBottom: "8px" }}>
        MODIFICATION{contributions.length > 1 ? "S" : ""} SUGGÉRÉE{contributions.length > 1 ? "S" : ""} ({contributions.length})
      </div>
      {contributions.map((c) => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#16273D", borderRadius: "8px", padding: "8px 12px", marginBottom: "6px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#F2F2E8" }}>{FIELD_LABELS[c.fieldPath] || c.fieldPath}</div>
            <div style={{ fontSize: "11.5px", color: "#8792A6" }}>
              {formatValue(c.previousValue)} <span style={{ color: "#39FF66" }}>→</span> {formatValue(c.proposedValue)}
            </div>
          </div>
          <button
            onClick={() => decide(c, true)}
            disabled={busyId === c.id}
            title="Accepter"
            style={{ background: "#39FF66", border: "none", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}
          >
            ✓
          </button>
          <button
            onClick={() => decide(c, false)}
            disabled={busyId === c.id}
            title="Rejeter"
            style={{ background: "none", border: "none", color: "#FF3B4E", cursor: "pointer", fontSize: "14px", width: "30px", flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
