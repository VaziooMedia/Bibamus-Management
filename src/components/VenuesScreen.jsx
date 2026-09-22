import React, { useState, useEffect } from "react";
import { loadPublicVenues, loadDrinksDirectory } from "../data/sharedDirectories.js";
import { DataTable, StatusBadge, VisibilityDot } from "./DataTable.jsx";
import { VenueDetailPanel } from "./VenueDetailPanel.jsx";
import { DetailedStatsCounterBar } from "./DetailedStatsCounterBar.jsx";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES } from "../constants.js";
import { CertificationIcon } from "./CertificationIcon.jsx";

// Les données stockent désormais des codes techniques (ex. "belgique") — le tableau doit
// résoudre le libellé français pour l'affichage.
const countryMap = {};
COUNTRIES.forEach((c) => (countryMap[c.code] = c.fr));
const countryLabel = (code) => countryMap[code] || code || "—";

const allColumns = [
  { key: "name", label: "Nom" },
  { key: "country", label: "Pays", render: (v) => countryLabel(v.country) },
  { key: "city", label: "Commune" },
  { key: "status", label: "Statut", render: (v) => <StatusBadge status={v.status} /> },
  { key: "visible", label: "Visible", render: (v) => <VisibilityDot status={v.status} /> },
  { key: "certificationLevel", label: "Certification", render: (v) => <CertificationIcon level={v.certificationLevel} /> },
];

export function VenuesScreen() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [drinksDirectory, setDrinksDirectory] = useState([]);

  const refresh = async () => {
    setLoading(true);
    setVenues(await loadPublicVenues());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    loadDrinksDirectory().then(setDrinksDirectory);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle>Lieux</PageTitle>
        <button onClick={refresh} title="Rafraîchir" aria-label="Rafraîchir" style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 14px", color: "#F2F2E8", cursor: "pointer", fontSize: "16px" }}>
          ⟳
        </button>
      </div>
      {loading ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <>
          <DetailedStatsCounterBar items={venues} />
          <DataTable
            items={venues}
            allColumns={allColumns}
            forcedKeys={["name", "status"]}
            defaultVisibleKeys={["name", "country", "city", "status", "visible", "certificationLevel"]}
            storageKey="etablissements"
            onRowClick={setSelected}
            onAdd={() => setCreating(true)}
            searchPlaceholder="Rechercher Lieux"
          />
        </>
      )}
      {(selected || creating) && (
        <VenueDetailPanel
          venue={selected}
          drinksDirectory={drinksDirectory}
          onClose={() => {
            setSelected(null);
            setCreating(false);
          }}
          onSaved={(updated) => {
            const wasCreating = creating;
            setSelected(null);
            setCreating(false);
            if (updated) setVenues((prev) => (wasCreating ? [...prev, updated] : prev.map((v) => (v.id === updated.id ? updated : v))));
            else setVenues((prev) => prev.filter((v) => v.id !== selected.id));
          }}
        />
      )}
    </div>
  );
}
