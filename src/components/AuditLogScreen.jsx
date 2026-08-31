import React, { useState, useEffect } from "react";
import { loadAuditLog } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const ACTION_LABELS = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  block: "Blocage",
  unblock: "Déblocage",
  role_change: "Changement de rôle",
  ownership_granted: "Fiche liée à un compte Business",
  ownership_revoked: "Fiche déliée d'un compte Business",
  ownership_transferred: "Fiche transférée à un autre compte Business",
};

const ACTION_COLORS = {
  create: "#39FF66",
  update: "#00C8FF",
  delete: "#FF3B4E",
  block: "#FF3B4E",
  unblock: "#39FF66",
  role_change: "#FFC145",
  ownership_granted: "#39FF66",
  ownership_revoked: "#FF3B4E",
  ownership_transferred: "#FFC145",
};

const ENTITY_TYPE_LABELS = { venue: "Établissement", drink: "Produit", brand: "Marque", producer: "Producteur", user: "Utilisateur" };

const ACTION_FILTERS = [
  { key: null, label: "Toutes les actions" },
  { key: "create", label: "Création" },
  { key: "update", label: "Modification" },
  { key: "delete", label: "Suppression" },
  { key: "block", label: "Blocage" },
  { key: "unblock", label: "Déblocage" },
  { key: "role_change", label: "Changement de rôle" },
  { key: "ownership_granted", label: "Fiche liée" },
  { key: "ownership_revoked", label: "Fiche déliée" },
  { key: "ownership_transferred", label: "Fiche transférée" },
];

function formatDetails(action, details) {
  if (!details) return null;
  if (action === "update") {
    const parts = [];
    if (details.status_from !== undefined && details.status_from !== details.status_to) parts.push(`statut : ${details.status_from || "—"} → ${details.status_to || "—"}`);
    if (details.certification_from !== undefined && details.certification_from !== details.certification_to) parts.push(`certification : ${details.certification_from || "—"} → ${details.certification_to || "—"}`);
    return parts.length > 0 ? parts.join(" · ") : null;
  }
  if (action === "role_change") {
    return `${details.from || "—"} → ${details.to || "—"}`;
  }
  if (action === "block") {
    return [details.reason, details.until ? `jusqu'au ${details.until.slice(0, 10)}` : null].filter(Boolean).join(" — ");
  }
  if (action === "ownership_transferred") {
    return "vers un autre compte Business";
  }
  return null;
}

export function AuditLogScreen() {
  const [entries, setEntries] = useState(null);
  const [actionFilter, setActionFilter] = useState(null);

  useEffect(() => {
    loadAuditLog({ action: actionFilter }).then(setEntries);
  }, [actionFilter]);

  return (
    <div>
      <PageTitle>Audit</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>Historique des actions sensibles sur la plateforme — création, statut, certification, suppression, blocage, rôles.</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {ACTION_FILTERS.map((f) => (
          <button
            key={f.key || "all"}
            onClick={() => setActionFilter(f.key)}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: `2px solid ${actionFilter === f.key ? "#39FF66" : "#28405C"}`,
              background: actionFilter === f.key ? "#39FF66" : "none",
              color: actionFilter === f.key ? "#0D1B2A" : "#F2F2E8",
              fontWeight: 700,
              fontSize: "12.5px",
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!entries ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : entries.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucune action enregistrée pour ce filtre.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {entries.map((e) => {
            const detailText = formatDetails(e.action, e.details);
            return (
              <div key={e.id} style={{ background: "#16273D", borderRadius: "10px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: ACTION_COLORS[e.action] || "#8792A6", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13.5px", color: "#F2F2E8" }}>
                      <strong>{ACTION_LABELS[e.action] || e.action}</strong> — {ENTITY_TYPE_LABELS[e.entity_type] || e.entity_type} <strong>{e.entity_name || "(sans nom)"}</strong>
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#8792A6" }}>
                      par {e.actor_name || e.actor_bibro_code || "(compte supprimé)"}
                      {detailText ? ` · ${detailText}` : ""}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: "11px", color: "#8792A6", flexShrink: 0 }}>{e.created_at ? new Date(e.created_at).toLocaleString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
