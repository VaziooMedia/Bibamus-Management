import React, { useState, useEffect, useCallback } from "react";
import { loadDrinksPage, countDrinks, countDrinksByType } from "../data/sharedDirectories.js";
import { ServerDataTable } from "./ServerDataTable.jsx";
import { StatusBadge } from "./DataTable.jsx";
import { DrinkDetailPanel } from "./DrinkDetailPanel.jsx";
import { StatsCounterBar } from "./StatsCounterBar.jsx";
import { ProductCategoryBar } from "./ProductCategoryBar.jsx";
import { PageTitle } from "./PageTitle.jsx";

const allColumns = [
  { key: "name", label: "Nom" },
  { key: "type", label: "Type" },
  { key: "brand", label: "Marque" },
  { key: "brewery", label: "Brasserie" },
  { key: "nationality", label: "Origine" },
  { key: "abv", label: "Degré", render: (d) => (d.abv != null ? `${d.abv}%` : "—") },
  { key: "kcalPer100ml", label: "Kcal/100ml" },
  { key: "volumeCl", label: "Volume (cl)" },
  { key: "status", label: "Statut", render: (d) => <StatusBadge status={d.status} /> },
];

export function DrinksScreen() {
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [statCounts, setStatCounts] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Les statistiques (total/certifiés/etc.) et la répartition par catégorie utilisent de
  // simples comptages côté serveur — jamais un chargement complet du répertoire, qui pourrait
  // représenter des dizaines ou centaines de milliers de lignes.
  const refreshCounts = useCallback(async () => {
    const [total, certified, reviewed, pending, byType] = await Promise.all([
      countDrinks({ type: selectedType === "__other__" ? "__other__" : selectedType }),
      countDrinks({ type: selectedType === "__other__" ? "__other__" : selectedType, status: "certified" }),
      countDrinks({ type: selectedType === "__other__" ? "__other__" : selectedType, status: "reviewed" }),
      countDrinks({ type: selectedType === "__other__" ? "__other__" : selectedType, status: "pending" }),
      countDrinksByType(),
    ]);
    setStatCounts({ total, certified, reviewed, pending });
    setCategoryCounts(byType);
  }, [selectedType]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts, refreshKey]);

  const fetchPage = useCallback(
    (params) => loadDrinksPage({ ...params, type: selectedType === "__other__" ? "__other__" : selectedType }),
    [selectedType]
  );

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle>Produits</PageTitle>
        <button onClick={triggerRefresh} style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 14px", color: "#F2F2E8", cursor: "pointer", fontSize: "13px" }}>
          ⟳ Rafraîchir
        </button>
      </div>

      {statCounts ? <StatsCounterBar counts={statCounts} /> : <p style={{ color: "#8792A6" }}>Chargement des statistiques...</p>}
      <div style={{ borderBottom: "2px solid #39FF66", margin: "0 0 24px 0" }} />
      <ProductCategoryBar counts={categoryCounts} selectedType={selectedType} onSelect={setSelectedType} />

      <ServerDataTable
        allColumns={allColumns}
        forcedKeys={["name", "status"]}
        defaultVisibleKeys={["name", "type", "brand", "brewery", "abv", "status"]}
        fetchPage={fetchPage}
        onRowClick={setSelected}
        onAdd={() => setCreating(true)}
        searchPlaceholder="Rechercher un produit par nom..."
        refreshKey={`${refreshKey}-${selectedType}`}
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
