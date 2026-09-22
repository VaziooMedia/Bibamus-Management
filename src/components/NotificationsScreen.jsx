import React, { useState, useEffect } from "react";
import { loadReports } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const ENTITY_TYPE_LABELS = { venue: "Établissement", drink: "Produit", brand: "Marque", producer: "Producteur" };
const REASON_LABELS = {
  suggestion: "Suggestion de modification",
  closed_permanently: "Établissement fermé définitivement",
  wrong_info: "Information(s) incorrecte(s)",
  duplicate: "Fiche en double",
  inappropriate: "Contenu inapproprié",
  other: "Autre raison",
};

// Section centrale des notifications — vue d'ensemble de tout ce qui attend une action, tous
// vrais types confondus. Pour l'instant, une seule vraie source existe (les signalements en
// attente) ; d'autres pourront s'ajouter ici au même titre plus tard (nouvelles contributions,
// nouveaux ajouts de fiches, etc.) sans changer la vraie structure de cet écran.
export function NotificationsScreen({ onOpenReports }) {
  const [reports, setReports] = useState(null);

  useEffect(() => {
    loadReports("pending").then(setReports);
  }, []);

  return (
    <div>
      <PageTitle>Notifications</PageTitle>

      <p style={{ fontSize: "12px", fontWeight: 700, color: "#8792A6", margin: "0 0 10px 0" }}>Signalements en attente</p>

      {!reports ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : reports.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucun signalement en attente.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={onOpenReports}
              style={{
                textAlign: "left",
                background: "#16273D",
                border: "none",
                borderRadius: "10px",
                padding: "14px 16px",
                cursor: "pointer",
                color: "#F2F2E8",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#8792A6", textTransform: "uppercase", fontWeight: 700 }}>{ENTITY_TYPE_LABELS[r.entity_type] || r.entity_type}</span>
                <span style={{ fontSize: "11px", color: "#8792A6" }}>{r.created_at ? r.created_at.slice(0, 10) : ""}</span>
              </div>
              <p style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>{r.entityName}</p>
              <p style={{ fontSize: "12.5px", color: "#39FF66", fontWeight: 700, margin: 0 }}>{REASON_LABELS[r.reason] || r.reason}</p>
              {r.comment && <p style={{ fontSize: "12.5px", color: "#8792A6", margin: 0, fontStyle: "italic" }}>"{r.comment}"</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
