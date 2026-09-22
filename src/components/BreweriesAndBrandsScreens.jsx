import React, { useState, useEffect } from "react";
import { loadBreweriesDirectory, loadBrandsDirectory } from "../data/sharedDirectories.js";
import { DataTable, StatusBadge, VisibilityDot } from "./DataTable.jsx";
import { BreweryDetailPanel } from "./BreweryDetailPanel.jsx";
import { BrandDetailPanel } from "./BrandDetailPanel.jsx";
import { DetailedStatsCounterBar, applyStatFilter } from "./DetailedStatsCounterBar.jsx";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES, PRODUCER_TYPES, PRODUCER_PROFILES, BRAND_CLASSIFICATIONS, BRAND_TYPES } from "../constants.js";
import { CertificationIcon } from "./CertificationIcon.jsx";

// Les données stockent désormais des codes techniques — les tableaux doivent résoudre le
// libellé français pour l'affichage.
const labelFromList = (list) => {
  const map = {};
  list.forEach((o) => (map[o.code] = o.fr));
  return (code) => map[code] || code || "—";
};
const countryLabel = labelFromList(COUNTRIES);
const producerTypeLabel = labelFromList(PRODUCER_TYPES);
const producerProfileLabel = labelFromList(PRODUCER_PROFILES);
const classificationLabel = labelFromList(BRAND_CLASSIFICATIONS);
const brandTypeLabel = labelFromList(BRAND_TYPES);

const breweryColumns = [
  { key: "name", label: "Nom" },
  { key: "country", label: "Pays", render: (b) => countryLabel(b.country) },
  { key: "city", label: "Ville" },
  { key: "producerTypes", label: "Type", render: (b) => (b.producerTypes || []).map(producerTypeLabel).join(", ") },
  { key: "producerProfiles", label: "Profil du Producteur", render: (b) => (b.producerProfiles || []).map(producerProfileLabel).join(", ") },
  { key: "status", label: "Statut", render: (b) => <StatusBadge status={b.status} /> },
  { key: "visible", label: "Visible", render: (b) => <VisibilityDot status={b.status} /> },
  { key: "certificationLevel", label: "Certification", render: (b) => <CertificationIcon level={b.certificationLevel} /> },
];

const getBrandColumns = (breweriesDirectory) => {
  const producerName = (id) => breweriesDirectory.find((b) => b.id === id)?.name || "—";
  return [
    { key: "name", label: "Nom" },
    { key: "originCountry", label: "Origine", render: (b) => countryLabel(b.originCountry) },
    { key: "classifications", label: "Classification", render: (b) => (b.classifications || []).map(classificationLabel).join(", ") },
    { key: "brandTypes", label: "Type de marque", render: (b) => (b.brandTypes || []).map(brandTypeLabel).join(", ") },
    { key: "producerId", label: "Producteur actuel", render: (b) => (b.producerId ? producerName(b.producerId) : "—") },
    { key: "status", label: "Statut", render: (b) => <StatusBadge status={b.status} /> },
    { key: "visible", label: "Visible", render: (b) => <VisibilityDot status={b.status} /> },
    { key: "certificationLevel", label: "Certification", render: (b) => <CertificationIcon level={b.certificationLevel} /> },
  ];
};

export function BreweriesScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState("total");

  const refresh = async () => {
    setLoading(true);
    setItems(await loadBreweriesDirectory());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle>Producteurs</PageTitle>
        <button onClick={refresh} title="Rafraîchir" aria-label="Rafraîchir" style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 14px", color: "#F2F2E8", cursor: "pointer", fontSize: "26px", lineHeight: 1, display: "flex", alignItems: "center" }}>
          ⟳
        </button>
      </div>
      {loading ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <>
          <DetailedStatsCounterBar items={items} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <DataTable
            items={applyStatFilter(items, activeFilter)}
            allColumns={breweryColumns}
            forcedKeys={["name", "status"]}
            defaultVisibleKeys={["name", "country", "city", "producerTypes", "producerProfiles", "status", "visible", "certificationLevel"]}
            storageKey="producteurs"
            onRowClick={setSelected}
            onAdd={() => setCreating(true)}
            searchPlaceholder="Rechercher Producteurs"
          />
        </>
      )}
      {(selected || creating) && (
        <BreweryDetailPanel
          brewery={selected}
          onClose={() => {
            setSelected(null);
            setCreating(false);
          }}
          onSaved={(updated) => {
            const wasCreating = creating;
            setSelected(null);
            setCreating(false);
            if (updated) setItems((prev) => (wasCreating ? [...prev, updated] : prev.map((i) => (i.id === updated.id ? updated : i))));
            else setItems((prev) => prev.filter((i) => i.id !== selected.id));
          }}
        />
      )}
    </div>
  );
}

export function BrandsScreen() {
  const [items, setItems] = useState([]);
  const [breweriesDirectory, setBreweriesDirectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState("total");

  const refresh = async () => {
    setLoading(true);
    setItems(await loadBrandsDirectory());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    loadBreweriesDirectory().then(setBreweriesDirectory);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle>Marques</PageTitle>
        <button onClick={refresh} title="Rafraîchir" aria-label="Rafraîchir" style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 14px", color: "#F2F2E8", cursor: "pointer", fontSize: "26px", lineHeight: 1, display: "flex", alignItems: "center" }}>
          ⟳
        </button>
      </div>
      {loading ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <>
          <DetailedStatsCounterBar items={items} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <DataTable
            items={applyStatFilter(items, activeFilter)}
            allColumns={getBrandColumns(breweriesDirectory)}
            forcedKeys={["name", "status"]}
            defaultVisibleKeys={["name", "originCountry", "brandTypes", "producerId", "status", "visible", "certificationLevel"]}
            storageKey="marques"
            onRowClick={setSelected}
            onAdd={() => setCreating(true)}
            searchPlaceholder="Rechercher Marques"
          />
        </>
      )}
      {(selected || creating) && (
        <BrandDetailPanel
          brand={selected}
          onClose={() => {
            setSelected(null);
            setCreating(false);
          }}
          onSaved={(updated) => {
            const wasCreating = creating;
            setSelected(null);
            setCreating(false);
            if (updated) setItems((prev) => (wasCreating ? [...prev, updated] : prev.map((i) => (i.id === updated.id ? updated : i))));
            else setItems((prev) => prev.filter((i) => i.id !== selected.id));
          }}
        />
      )}
    </div>
  );
}
