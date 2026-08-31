import React, { useState, useEffect } from "react";
import { loadReports, resolveReport, dismissReport, archiveReportedEntity, confirmDuplicate, loadEntityDetail } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { STATUSES } from "./StatusSelector.jsx";
import { DRINK_TYPES } from "./DrinkDetailPanel.jsx";
import { VenueDetailPanel } from "./VenueDetailPanel.jsx";
import { DrinkDetailPanel } from "./DrinkDetailPanel.jsx";
import { BreweryDetailPanel } from "./BreweryDetailPanel.jsx";
import { BrandDetailPanel } from "./BrandDetailPanel.jsx";

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

// Aperçu compact d'une fiche (photo + nom + détails spécifiques au type) — juste pour situer le
// signalement d'un coup d'œil. L'action se fait via "Ouvrir la fiche complète" (le vrai
// panneau d'édition, identique à celui de la Database), pas ici.
function EntityPreview({ entityType, details, onOpen }) {
  if (!details) {
    return <p style={{ fontSize: "12.5px", color: "#8792A6", fontStyle: "italic" }}>Fiche introuvable (peut-être déjà supprimée).</p>;
  }
  const photo = details.cover_photo_url || details.profile_photo_url || details.main_photo_url || details.logo_url;
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px", background: "#0D1B2A", borderRadius: "8px" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "#28405C", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#8792A6", fontSize: "18px" }}>—</span>}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
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
      {onOpen && (
        <button onClick={onOpen} style={{ background: "none", border: "none", color: "#39FF66", fontSize: "12px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          Ouvrir la fiche complète
        </button>
      )}
    </div>
  );
}

const TABS = [
  { key: "pending", label: "À traiter" },
  { key: "archived", label: "Archivés" },
  { key: "resolved", label: "Traités" },
  { key: "dismissed", label: "Ignorés" },
];

export function ReportsScreen() {
  const [tab, setTab] = useState("pending");
  const [reports, setReports] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  // Fiche complète actuellement ouverte en édition — { entityType, data } ou null.
  const [openEntity, setOpenEntity] = useState(null);

  const refresh = () => loadReports(tab).then(setReports);
  useEffect(() => {
    setReports(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

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

  const handleOpenEntity = async (entityType, entityId) => {
    const data = await loadEntityDetail(entityType, entityId);
    if (!data) {
      alert("Impossible de charger cette fiche.");
      return;
    }
    setOpenEntity({ entityType, data });
  };

  const handleEntitySaved = () => {
    setOpenEntity(null);
    refresh();
  };

  return (
    <div>
      <PageTitle>Signalements</PageTitle>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: `2px solid ${tab === t.key ? "#39FF66" : "#28405C"}`,
              background: tab === t.key ? "#39FF66" : "none",
              color: tab === t.key ? "#0D1B2A" : "#F2F2E8",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!reports ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : reports.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucun signalement dans cette catégorie.</p>
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
                    <EntityPreview entityType={r.entity_type} details={r.entityDetails} onOpen={() => handleOpenEntity(r.entity_type, r.entity_id)} />
                    {r.reason === "duplicate" && (
                      <>
                        <p style={{ fontSize: "11px", color: "#8792A6", margin: 0, textAlign: "center" }}>signalée comme doublon de</p>
                        <EntityPreview entityType={r.entity_type} details={r.duplicateDetails} onOpen={() => handleOpenEntity(r.entity_type, r.duplicate_of_id)} />
                      </>
                    )}
                  </div>
                )}

                {tab === "pending" ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    {r.reason === "duplicate" && r.duplicate_of_id && (
                      <button
                        onClick={() => handleConfirmDuplicate(r)}
                        disabled={busyId === r.id}
                        style={{ flex: 1, background: "#00C8FF", border: "none", borderRadius: "8px", padding: "9px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: busyId === r.id ? 0.6 : 1, fontSize: "12.5px" }}
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
                ) : (
                  <p style={{ fontSize: "11px", color: "#8792A6", margin: 0 }}>{r.resolved_at ? `Traité le ${r.resolved_at.slice(0, 10)}` : ""}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {openEntity?.entityType === "venue" && (
        <VenueDetailPanel venue={openEntity.data} onClose={() => setOpenEntity(null)} onSaved={handleEntitySaved} onManageMenu={() => {}} />
      )}
      {openEntity?.entityType === "drink" && <DrinkDetailPanel drink={openEntity.data} onClose={() => setOpenEntity(null)} onSaved={handleEntitySaved} />}
      {openEntity?.entityType === "producer" && <BreweryDetailPanel brewery={openEntity.data} onClose={() => setOpenEntity(null)} onSaved={handleEntitySaved} />}
      {openEntity?.entityType === "brand" && <BrandDetailPanel brand={openEntity.data} onClose={() => setOpenEntity(null)} onSaved={handleEntitySaved} />}
    </div>
  );
}
