import React, { useState, useEffect } from "react";
import { loadDrinksDirectory } from "../data/sharedDirectories.js";
import { DataTable, StatusBadge } from "./DataTable.jsx";
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
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setDrinks(await loadDrinksDirectory());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle>Produits</PageTitle>
        <button onClick={refresh} style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 14px", color: "#F2F2E8", cursor: "pointer", fontSize: "13px" }}>
          ⟳ Rafraîchir
        </button>
      </div>
      {loading ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <>
          <StatsCounterBar items={drinks} />
          <div style={{ borderBottom: "2px solid #39FF66", margin: "0 0 24px 0" }} />
          <ProductCategoryBar items={drinks} />
          <DataTable
            items={drinks}
            allColumns={allColumns}
            forcedKeys={["name", "status"]}
            defaultVisibleKeys={["name", "type", "brand", "brewery", "abv", "status"]}
            onRowClick={setSelected}
            onAdd={() => setCreating(true)}
            searchPlaceholder="Rechercher un produit, une marque, une brasserie..."
          />
        </>
      )}
      {(selected || creating) && (
        <DrinkDetailPanel
          drink={selected}
          onClose={() => {
            setSelected(null);
            setCreating(false);
          }}
          onSaved={(updated) => {
            const wasCreating = creating;
            setSelected(null);
            setCreating(false);
            if (updated) setDrinks((prev) => (wasCreating ? [...prev, updated] : prev.map((d) => (d.id === updated.id ? updated : d))));
            else setDrinks((prev) => prev.filter((d) => d.id !== selected.id));
          }}
        />
      )}
    </div>
  );
}
