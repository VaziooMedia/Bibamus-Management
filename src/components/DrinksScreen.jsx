import React, { useState, useEffect } from "react";
import { loadDrinksDirectory } from "../data/sharedDirectories.js";
import { DataTable, StatusBadge } from "./DataTable.jsx";
import { DrinkDetailPanel } from "./DrinkDetailPanel.jsx";
import { StatsCounterBar } from "./StatsCounterBar.jsx";
import { PageTitle } from "./PageTitle.jsx";

const columns = [
  { key: "name", label: "Nom" },
  { key: "type", label: "Type" },
  { key: "brand", label: "Marque" },
  { key: "brewery", label: "Brasserie" },
  { key: "abv", label: "Degré", render: (d) => (d.abv != null ? `${d.abv}%` : "—") },
  { key: "status", label: "Statut", render: (d) => <StatusBadge status={d.status} /> },
];

export function DrinksScreen() {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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
          <DataTable items={drinks} columns={columns} onRowClick={setSelected} searchPlaceholder="Rechercher un produit, une marque, une brasserie..." />
        </>
      )}
      {selected && (
        <DrinkDetailPanel
          drink={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setSelected(null);
            if (updated) setDrinks((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            else setDrinks((prev) => prev.filter((d) => d.id !== selected.id));
          }}
        />
      )}
    </div>
  );
}
