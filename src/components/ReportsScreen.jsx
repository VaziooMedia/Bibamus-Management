import React, { useState, useEffect } from "react";
import { loadReports, resolveReport, dismissReport, archiveReportedEntity, confirmDuplicate } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { STATUSES } from "./StatusSelector.jsx";
import { DRINK_TYPES } from "./DrinkDetailPanel.jsx";

const statusLabel = (key) => STATUSES.find((s) => s.key === key)?.label || key;
const drinkTypeLabel = (key) => DRINK_TYPES.find((t) => t.code === key)?.fr || key;

const REASON_LABELS = {
  closed_permanently: "Établissement fermé définitivement",
  wrong_info: "Information(s) incorrecte(s)",
  duplicate: "Fiche en double",
  inappropriate: "Contenu inapproprié",
  other: "Autre raison",
};

const ENTITY_TYPE_LABELS = { venue: "Établissement", drink: "Produit", brand: "Marque", producer: "Producteur" };

// Aperçu compact d'une fiche (photo + nom + détails spécifiques au type) — permet de juger un
// signalement sans avoir à sortir de cet écran (indispensable pour un modérateur, qui n'a
// accès à aucun autre écran).
function EntityPreview({ entityType, details }) {
  if (!details) {
    return <p style={{ fontSize: "12.5px", color: "#8792A6", fontStyle: "italic" }}>Fiche introuvable (peut-être déjà supprimée).</p>;
  }
  const photo = details.cover_photo_url || details.profile_photo_url || details.main_photo_url || details.logo_url;
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px", background: "#0D1B2A", borderRadius: "8px" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "#28405C", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#8792A6", fontSize: "18px" }}>—</span>}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontWeight: 700, color: "#F2F2E8", margin: 0, fontSize: "13.5px" }}>{details.name}</p>
        {entityType === "venue" && (
          <p style={{ fontSize: "11.5px", color: "#8792A6", margin: "2px 0 0" }}>
            {[details.street_name, details.street_number].filter(Boolean).join(" ")}
            {details.city ? `, ${details.city}` : ""}
          </p>
        )}
        {entityType === "drink" && <p style={{ fontSize: "11.5px", color: "#8792A6", margin: "2px 0 0" }}>{drinkTypeLabel(details.type)}</p>}
        {entityType === "producer" && <p style={{ fontSize: "11.5px", color: "#8792A6", margin: "2px 0 0" }}>{details.country}</p>}
        <p style={{ fontSize: "11px", color: "#8792A6", margin: "2px 0 0" }}>Statut : {statusLabel(details.status)}</p>
      </div>
    </div>
  );
}

export function ReportsScreen() {
  const [reports, setReports] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

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

  const handleArchive = async (report) => {
    setBusyId(report.id);
    const result = await archiveReportedEntity(report.id, report.entity_type, report.entity_id);
    setBusyId(null);
    if (result.error) {
      alert("Erreur : " + result.error);
      return;
    }
    refresh();
  };

  const handleConfirmDuplicate = async (report) => {
    setBusyId(report.id);
    const result = await confirmDuplicate(report.id, report.entity_type, report.entity_id, report.duplicate_of_id);
    setBusyId(null);
    if (result.error) {
      alert("Erreur : " + result.error);
      return;
    }
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
          {reports.map((r) => {
            const expanded = expandedId === r.id;
            return (
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
                <p style={{ fontSize: "11px", color: "#8792A6", marginBottom: "10px" }}>Signalé par : {r.reported_by || "(anonymisé)"}</p>

                <button
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                  style={{ background: "none", border: "none", color: "#39FF66", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: "12px" }}
                >
                  {expanded ? "▼ Masquer la fiche" : "▶ Voir la fiche"}
                </button>

                {expanded && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                    <EntityPreview entityType={r.entity_type} details={r.entityDetails} />
                    {r.reason === "duplicate" && (
                      <>
                        <p style={{ fontSize: "11px", color: "#8792A6", margin: 0, textAlign: "center" }}>signalée comme doublon de</p>
                        <EntityPreview entityType={r.entity_type} details={r.duplicateDetails} />
                      </>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  {r.reason === "duplicate" && r.duplicate_of_id && (
                    <button
                      onClick={() => handleConfirmDuplicate(r)}
                      disabled={busyId === r.id}
                      style={{ flex: 1, background: "#C74B4B", border: "none", borderRadius: "8px", padding: "9px", fontWeight: 700, color: "#fff", cursor: "pointer", opacity: busyId === r.id ? 0.6 : 1, fontSize: "12.5px" }}
                    >
                      Confirmer le doublon
                    </button>
                  )}
                  <button
                    onClick={() => handleArchive(r)}
                    disabled={busyId === r.id}
                    style={{ flex: 1, background: "#FF3B4E", border: "none", borderRadius: "8px", padding: "9px", fontWeight: 700, color: "#fff", cursor: "pointer", opacity: busyId === r.id ? 0.6 : 1, fontSize: "12.5px" }}
                  >
                    Archiver la fiche
                  </button>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
