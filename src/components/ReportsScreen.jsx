import React, { useState, useEffect } from "react";
import { loadReports, resolveReport, dismissReport } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const REASON_LABELS = {
  closed_permanently: "Établissement fermé définitivement",
  wrong_info: "Information incorrecte",
  duplicate: "Fiche en double",
  inappropriate: "Contenu inapproprié",
  other: "Autre raison",
};

const ENTITY_TYPE_LABELS = { venue: "Établissement", drink: "Produit", brand: "Marque", producer: "Producteur" };

export function ReportsScreen() {
  const [reports, setReports] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const refresh = () => loadReports().then(setReports);
  useEffect(() => {
    refresh();
  }, []);

  const handleResolve = async (id) => {
    setBusyId(id);
    await resolveReport(id);
    setBusyId(null);
    refresh();
  };

  const handleDismiss = async (id) => {
    setBusyId(id);
    await dismissReport(id);
    setBusyId(null);
    refresh();
  };

  return (
    <div>
      <PageTitle>Signalements</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>Signalements en attente de traitement, envoyés par les utilisateurs de l'app.</p>

      {!reports ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : reports.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucun signalement en attente.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reports.map((r) => (
            <div key={r.id} style={{ background: "#16273D", borderRadius: "10px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#8792A6", textTransform: "uppercase", fontWeight: 700 }}>{ENTITY_TYPE_LABELS[r.entity_type] || r.entity_type}</span>
                  <p style={{ fontSize: "15px", color: "#F2F2E8", fontWeight: 700, margin: "2px 0 0" }}>{r.entityName}</p>
                </div>
                <span style={{ fontSize: "11px", color: "#8792A6" }}>{r.created_at ? r.created_at.slice(0, 10) : ""}</span>
              </div>

              <p style={{ fontSize: "13.5px", color: "#39FF66", fontWeight: 700, margin: "0 0 6px" }}>{REASON_LABELS[r.reason] || r.reason}</p>
              {r.comment && <p style={{ fontSize: "13px", color: "#F2F2E8", margin: "0 0 10px", fontStyle: "italic" }}>"{r.comment}"</p>}
              <p style={{ fontSize: "11px", color: "#8792A6", marginBottom: "12px" }}>Signalé par : {r.reported_by || "(anonymisé)"}</p>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleResolve(r.id)}
                  disabled={busyId === r.id}
                  style={{ flex: 1, background: "#39FF66", border: "none", borderRadius: "8px", padding: "9px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: busyId === r.id ? 0.6 : 1 }}
                >
                  Traité
                </button>
                <button
                  onClick={() => handleDismiss(r.id)}
                  disabled={busyId === r.id}
                  style={{ flex: 1, background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "9px", fontWeight: 700, color: "#F2F2E8", cursor: "pointer", opacity: busyId === r.id ? 0.6 : 1 }}
                >
                  Ignorer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
