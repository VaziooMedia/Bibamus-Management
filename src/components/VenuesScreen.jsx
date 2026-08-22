import React, { useState, useEffect } from "react";
import { loadPublicVenues } from "../data/sharedDirectories.js";
import { DataTable, StatusBadge } from "./DataTable.jsx";
import { VenueDetailPanel } from "./VenueDetailPanel.jsx";

const columns = [
  { key: "name", label: "Nom" },
  { key: "city", label: "Ville" },
  { key: "country", label: "Pays" },
  { key: "phone", label: "Téléphone" },
  { key: "status", label: "Statut", render: (v) => <StatusBadge status={v.status} /> },
];

export function VenuesScreen() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setVenues(await loadPublicVenues());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "26px", margin: 0 }}>Établissements</h1>
        <button onClick={refresh} style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 14px", color: "#F2F2E8", cursor: "pointer", fontSize: "13px" }}>
          ⟳ Rafraîchir
        </button>
      </div>
      {loading ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <DataTable items={venues} columns={columns} onRowClick={setSelected} searchPlaceholder="Rechercher un établissement, une ville..." />
      )}
      {selected && (
        <VenueDetailPanel
          venue={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setSelected(null);
            if (updated) setVenues((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
            else setVenues((prev) => prev.filter((v) => v.id !== selected.id));
          }}
        />
      )}
    </div>
  );
}
