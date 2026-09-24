import React, { useState, useEffect } from "react";
import { loadReports, loadClaims } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const ENTITY_TYPE_LABELS = { venue: "Lieu", drink: "Produit", brand: "Marque", producer: "Producteur" };
const REASON_LABELS = {
  suggestion: "Suggestion de modification",
  closed_permanently: "Établissement fermé définitivement",
  wrong_info: "Information(s) incorrecte(s)",
  duplicate: "Fiche en double",
  inappropriate: "Contenu inapproprié",
  other: "Autre raison",
};

// Section centrale des notifications — vue d'ensemble de tout ce qui attend une action, tous
// vrais types confondus : signalements et revendications en attente pour l'instant, d'autres
// vraies sources pourront s'ajouter ici au même titre plus tard.
export function NotificationsScreen({ onOpenReports, onOpenClaims }) {
  const [reports, setReports] = useState(null);
  const [claims, setClaims] = useState(null);

  useEffect(() => {
    loadReports("pending").then(setReports);
    loadClaims("pending").then(setClaims);
  }, []);

  return (
    <div>
      <PageTitle>Notifications</PageTitle>

      <p style={{ fontSize: "13px", fontWeight: 700, color: "#8792A6", margin: "16px 0 8px" }}>Signalements</p>
      {!reports ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : reports.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucun signalement en attente.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={onOpenReports}
              style={{
                textAlign: "left",
                background: "#16273D",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                width: "320px",
                cursor: "pointer",
                color: "#F2F2E8",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.entityName}</span>
                <span style={{ fontSize: "10px", color: "#8792A6", flexShrink: 0 }}>{r.created_at ? r.created_at.slice(0, 10) : ""}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginTop: "14px" }}>
                <span style={{ fontSize: "11px", color: "#39FF66", fontWeight: 700 }}>{REASON_LABELS[r.reason] || r.reason}</span>
                <span style={{ fontSize: "10px", color: "#8792A6", textTransform: "uppercase", fontWeight: 700, flexShrink: 0 }}>{ENTITY_TYPE_LABELS[r.entity_type] || r.entity_type}</span>
              </div>
              {r.comment && <p style={{ fontSize: "11px", color: "#8792A6", margin: "2px 0 0", fontStyle: "italic" }}>"{r.comment}"</p>}
            </button>
          ))}
        </div>
      )}

      <p style={{ fontSize: "13px", fontWeight: 700, color: "#8792A6", margin: "24px 0 8px" }}>Revendications</p>
      {!claims ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : claims.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucune revendication en attente.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
          {claims.map((c) => (
            <button
              key={c.id}
              onClick={onOpenClaims}
              style={{
                textAlign: "left",
                background: "#16273D",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                width: "320px",
                cursor: "pointer",
                color: "#F2F2E8",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.entity_name}</span>
                <span style={{ fontSize: "10px", color: "#8792A6", flexShrink: 0 }}>{c.created_at ? c.created_at.slice(0, 10) : ""}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginTop: "14px" }}>
                <span style={{ fontSize: "11px", color: "#39FF66", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.claimant ? `${c.claimant.name || ""} ${c.claimant.last_name || ""}`.trim() : "(compte inconnu)"}
                </span>
                <span style={{ fontSize: "10px", color: "#8792A6", textTransform: "uppercase", fontWeight: 700, flexShrink: 0 }}>{ENTITY_TYPE_LABELS[c.entity_type] || c.entity_type}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
