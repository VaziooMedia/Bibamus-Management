import React, { useState, useEffect } from "react";
import { loadBreweriesDirectory, loadBrandsDirectory } from "../data/sharedDirectories.js";
import { DataTable, StatusBadge } from "./DataTable.jsx";
import { SimpleEntityPanel } from "./SimpleEntityPanel.jsx";

const breweryColumns = [
  { key: "name", label: "Nom" },
  { key: "country", label: "Pays" },
  { key: "status", label: "Statut", render: (b) => <StatusBadge status={b.status} /> },
];

const brandColumns = [
  { key: "name", label: "Nom" },
  { key: "status", label: "Statut", render: (b) => <StatusBadge status={b.status} /> },
];

export function BreweriesScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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
        <h1 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "26px", margin: 0 }}>Brasseries & Producteurs</h1>
        <button onClick={refresh} style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 14px", color: "#F2F2E8", cursor: "pointer", fontSize: "13px" }}>
          ⟳ Rafraîchir
        </button>
      </div>
      {loading ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <DataTable items={items} columns={breweryColumns} onRowClick={setSelected} searchPlaceholder="Rechercher une brasserie..." />
      )}
      {selected && (
        <SimpleEntityPanel
          entity={selected}
          kind="brewery"
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setSelected(null);
            if (updated) setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            else setItems((prev) => prev.filter((i) => i.id !== selected.id));
          }}
        />
      )}
    </div>
  );
}

export function BrandsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setItems(await loadBrandsDirectory());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "26px", margin: 0 }}>Marques</h1>
        <button onClick={refresh} style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 14px", color: "#F2F2E8", cursor: "pointer", fontSize: "13px" }}>
          ⟳ Rafraîchir
        </button>
      </div>
      {loading ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <DataTable items={items} columns={brandColumns} onRowClick={setSelected} searchPlaceholder="Rechercher une marque..." />
      )}
      {selected && (
        <SimpleEntityPanel
          entity={selected}
          kind="brand"
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setSelected(null);
            if (updated) setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            else setItems((prev) => prev.filter((i) => i.id !== selected.id));
          }}
        />
      )}
    </div>
  );
}
