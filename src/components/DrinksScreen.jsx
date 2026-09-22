import React, { useState, useEffect, useCallback } from "react";
import { loadDrinksPage, countDrinks, countDrinksByType } from "../data/sharedDirectories.js";
import { ServerDataTable } from "./ServerDataTable.jsx";
import { StatusBadge, VisibilityDot } from "./DataTable.jsx";
import { DrinkDetailPanel, DRINK_TYPES, BEER_CIDER_SUBTYPES } from "./DrinkDetailPanel.jsx";
import { DetailedStatsCounterBar, applyStatFilter } from "./DetailedStatsCounterBar.jsx";
import { STATUSES } from "./StatusSelector.jsx";
import { ProductCategoryBar } from "./ProductCategoryBar.jsx";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES } from "../constants.js";
import { BEER_CIDER_COMMERCIAL_STATUSES } from "../data/beerCiderStyles.js";
import { CertificationIcon } from "./CertificationIcon.jsx";

// Les données stockent désormais des codes techniques (ex. "bieres_cidres") — le tableau doit
// résoudre le libellé français pour l'affichage, la fiche détaillée s'en charge déjà elle-même.
const labelFromList = (list) => {
  const map = {};
  list.forEach((o) => (map[o.code] = o.fr));
  return (code) => map[code] || code || "—";
};
const typeLabel = labelFromList(DRINK_TYPES);
const subtypeLabel = labelFromList(BEER_CIDER_SUBTYPES);
const countryLabel = labelFromList(COUNTRIES);
const productStatusLabel = labelFromList(BEER_CIDER_COMMERCIAL_STATUSES);

const allColumns = [
  { key: "name", label: "Nom" },
  { key: "type", label: "Type", render: (d) => typeLabel(d.type) },
  { key: "beverageSubtype", label: "Bière/Cidre", render: (d) => subtypeLabel(d.beverageSubtype) },
  { key: "brandName", label: "Marque" },
  { key: "producerName", label: "Producteur" },
  { key: "nationality", label: "Origine", render: (d) => countryLabel(d.nationality) },
  { key: "abv", label: "Degré", render: (d) => (d.abv != null ? `${d.abv}%` : "—") },
  { key: "kcalPer100ml", label: "Kcal/100ml" },
  { key: "productStatus", label: "Statut produit", render: (d) => productStatusLabel(d.productStatus) },
  { key: "status", label: "Statut", render: (d) => <StatusBadge status={d.status} /> },
  { key: "visible", label: "Visible", render: (d) => <VisibilityDot status={d.status} /> },
  { key: "certificationLevel", label: "Certification", render: (d) => <CertificationIcon level={d.certificationLevel} /> },
];

// Traduit la clé de filtre générique (partagée avec les répertoires chargés entièrement) vers
// les paramètres attendus par countDrinks/loadDrinksPage, qui filtrent côté serveur — le
// répertoire produits est trop volumineux pour être chargé entièrement puis filtré en mémoire.
function filterKeyToParams(filterKey) {
  if (!filterKey || filterKey === "total") return {};
  if (filterKey === "newContributions") return { hasPendingContributions: true };
  if (filterKey === "suggestedEdits") return { hasPendingEdit: true };
  if (filterKey.startsWith("status:")) return { status: filterKey.slice("status:".length) };
  if (filterKey.startsWith("cert:")) return { certificationLevel: filterKey.slice("cert:".length) };
  return {};
}

export function DrinksScreen() {
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [activeFilter, setActiveFilter] = useState("total");
  const [statCounts, setStatCounts] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Les statistiques (7 statuts + certification + contributions/suggestions) et la répartition
  // par catégorie utilisent de simples comptages côté serveur — jamais un chargement complet du
  // répertoire, qui pourrait représenter des dizaines ou centaines de milliers de lignes.
  const refreshCounts = useCallback(async () => {
    const type = selectedType === "__other__" ? "__other__" : selectedType;
    const [total, newContributions, suggestedEdits, statusResults, certResults, byType] = await Promise.all([
      countDrinks({ type }),
      countDrinks({ type, hasPendingContributions: true }),
      countDrinks({ type, hasPendingEdit: true }),
      Promise.all(STATUSES.map((s) => countDrinks({ type, status: s.key }))),
      Promise.all(["utilisateur", "bibamus", "producteur"].map((c) => countDrinks({ type, certificationLevel: c }))),
      countDrinksByType(),
    ]);
    const byStatus = {};
    STATUSES.forEach((s, i) => (byStatus[s.key] = statusResults[i]));
    const byCertification = { utilisateur: certResults[0], bibamus: certResults[1], producteur: certResults[2] };
    setStatCounts({ total, newContributions, suggestedEdits, byStatus, byCertification });
    setCategoryCounts(byType);
  }, [selectedType]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts, refreshKey]);

  const fetchPage = useCallback(
    (params) => loadDrinksPage({ ...params, type: selectedType === "__other__" ? "__other__" : selectedType, ...filterKeyToParams(activeFilter) }),
    [selectedType, activeFilter]
  );

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle>Produits</PageTitle>
        <button onClick={triggerRefresh} title="Rafraîchir" aria-label="Rafraîchir" style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 14px", color: "#F2F2E8", cursor: "pointer", fontSize: "26px", lineHeight: 1, display: "flex", alignItems: "center" }}>
          ⟳
        </button>
      </div>

      {statCounts ? (
        <DetailedStatsCounterBar counts={statCounts} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      ) : (
        <p style={{ color: "#8792A6" }}>Chargement des statistiques...</p>
      )}
      <ProductCategoryBar counts={categoryCounts} selectedType={selectedType} onSelect={setSelectedType} />

      <ServerDataTable
        allColumns={allColumns}
        forcedKeys={["name", "status"]}
        defaultVisibleKeys={["name", "type", "brandName", "producerName", "status", "visible", "certificationLevel"]}
        storageKey="produits"
        fetchPage={fetchPage}
        onRowClick={setSelected}
        onAdd={() => setCreating(true)}
        searchPlaceholder="Rechercher Produits"
        refreshKey={`${refreshKey}-${selectedType}-${activeFilter}`}
      />

      {(selected || creating) && (
        <DrinkDetailPanel
          drink={selected}
          onClose={() => {
            setSelected(null);
            setCreating(false);
          }}
          onSaved={() => {
            setSelected(null);
            setCreating(false);
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
}
