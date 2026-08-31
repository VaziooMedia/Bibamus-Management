import React, { useState, useEffect } from "react";
import { loadMyBusinessEntities, loadEntityDetail } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { STATUSES } from "./StatusSelector.jsx";
import { VenueDetailPanel } from "./VenueDetailPanel.jsx";
import { DrinkDetailPanel } from "./DrinkDetailPanel.jsx";
import { BreweryDetailPanel } from "./BreweryDetailPanel.jsx";
import { BrandDetailPanel } from "./BrandDetailPanel.jsx";

const statusLabel = (key) => STATUSES.find((s) => s.key === key)?.label || key;

export function MyBusinessEntitiesScreen({ myUserId }) {
  const [entities, setEntities] = useState(null);
  const [openEntity, setOpenEntity] = useState(null);

  const refresh = () => loadMyBusinessEntities(myUserId).then(setEntities);
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myUserId]);

  const handleOpen = async (entity) => {
    const data = await loadEntityDetail(entity.entityType, entity.id);
    if (!data) {
      alert("Impossible de charger cette fiche.");
      return;
    }
    setOpenEntity({ entityType: entity.entityType, data });
  };

  const handleSaved = () => {
    setOpenEntity(null);
    refresh();
  };

  return (
    <div>
      <PageTitle>Mes fiches</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>Les fiches liées à votre compte — vous pouvez les consulter et les mettre à jour.</p>

      {!entities ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : entities.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucune fiche ne vous est encore liée.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "560px" }}>
          {entities.map((e) => (
            <button
              key={`${e.entityType}-${e.id}`}
              onClick={() => handleOpen(e)}
              style={{
                background: "#16273D",
                border: "none",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", color: "#8792A6", textTransform: "uppercase", fontWeight: 700 }}>{e.entityTypeLabel}</span>
                <p style={{ margin: "2px 0 0", fontSize: "14.5px", color: "#F2F2E8", fontWeight: 700 }}>{e.name}</p>
              </div>
              <span style={{ fontSize: "12px", color: "#8792A6" }}>{statusLabel(e.status)}</span>
            </button>
          ))}
        </div>
      )}

      {openEntity?.entityType === "venue" && (
        <VenueDetailPanel venue={openEntity.data} onClose={() => setOpenEntity(null)} onSaved={handleSaved} onManageMenu={() => {}} />
      )}
      {openEntity?.entityType === "drink" && <DrinkDetailPanel drink={openEntity.data} onClose={() => setOpenEntity(null)} onSaved={handleSaved} />}
      {openEntity?.entityType === "producer" && <BreweryDetailPanel brewery={openEntity.data} onClose={() => setOpenEntity(null)} onSaved={handleSaved} />}
      {openEntity?.entityType === "brand" && <BrandDetailPanel brand={openEntity.data} onClose={() => setOpenEntity(null)} onSaved={handleSaved} />}
    </div>
  );
}
