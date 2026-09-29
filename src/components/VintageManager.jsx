import React, { useState, useEffect } from "react";
import { loadDrinkVintages, createDrinkVintage, updateDrinkVintage, deleteDrinkVintage } from "../data/sharedDirectories.js";

const fieldStyle = { padding: "8px 10px", borderRadius: "6px", border: "2px solid #28405C", fontSize: "12.5px" };
const currentYear = new Date().getFullYear();

function VintageRow({ vintage, onSave, onDelete }) {
  const [year, setYear] = useState(vintage.year ?? currentYear);
  const [abv, setAbv] = useState(vintage.abv ?? "");
  const [barcode, setBarcode] = useState(vintage.barcode || "");
  const [dirty, setDirty] = useState(false);

  const save = () => {
    onSave(vintage.id, { year: year === "" ? null : parseInt(year, 10), abv: abv === "" ? null : parseFloat(abv), barcode });
    setDirty(false);
  };

  return (
    <div style={{ padding: "8px", background: "#16273D", borderRadius: "8px", marginBottom: "6px" }}>
      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
        <input
          type="number"
          min="1900"
          max="2100"
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setDirty(true);
          }}
          placeholder="Année"
          style={{ ...fieldStyle, width: "80px", flexShrink: 0 }}
        />
        <input
          type="number"
          step="0.1"
          min="0"
          value={abv}
          onChange={(e) => {
            setAbv(e.target.value);
            setDirty(true);
          }}
          placeholder="Taux d'alcool (%)"
          style={{ ...fieldStyle, flex: 1 }}
        />
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {dirty && (
            <button onClick={save} title="Enregistrer" style={{ background: "#39FF66", border: "none", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", fontWeight: 800, fontSize: "14px" }}>
              ✓
            </button>
          )}
          <button onClick={() => onDelete(vintage.id)} title="Supprimer" style={{ background: "none", border: "none", color: "#FF3B4E", cursor: "pointer", fontSize: "14px", width: "30px" }}>
            ✕
          </button>
        </div>
      </div>
      <input
        value={barcode}
        onChange={(e) => {
          setBarcode(e.target.value);
          setDirty(true);
        }}
        placeholder="Code-barre de ce millésime (facultatif)"
        style={{ ...fieldStyle, width: "100%", boxSizing: "border-box" }}
      />
    </div>
  );
}

// Liste des millésimes d'un vin — indépendante des conditionnements/codes-barres (voir
// VariantManager) : une année + son propre taux d'alcool, qui peut différer d'un millésime à
// l'autre pour un même vin. Le champ "Millésime" existant sur le produit lui-même n'est pas
// affecté par cette liste — les deux coexistent.
export function VintageManager({ drinkId }) {
  const [vintages, setVintages] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    loadDrinkVintages(drinkId).then((list) => {
      setVintages(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (drinkId) refresh();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drinkId]);

  if (!drinkId) {
    return <p style={{ fontSize: "12px", color: "#8792A6", fontStyle: "italic" }}>Enregistrez d'abord le produit pour pouvoir ajouter des millésimes.</p>;
  }

  const addVintage = async () => {
    const created = await createDrinkVintage({ drinkId, year: currentYear, abv: null });
    if (created) setVintages((prev) => [...prev, created]);
  };

  const saveVintage = async (id, patch) => {
    await updateDrinkVintage(id, patch);
    refresh();
  };

  const removeVintage = async (id) => {
    await deleteDrinkVintage(id);
    setVintages((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div>
      {loading ? (
        <p style={{ fontSize: "12px", color: "#8792A6" }}>Chargement...</p>
      ) : (
        <>
          {vintages.length === 0 && <p style={{ fontSize: "12px", color: "#8792A6", fontStyle: "italic", marginBottom: "8px" }}>Aucun millésime enregistré pour l'instant.</p>}
          {vintages.map((v) => (
            <VintageRow key={v.id} vintage={v} onSave={saveVintage} onDelete={removeVintage} />
          ))}
        </>
      )}
      <button
        onClick={addVintage}
        style={{ background: "none", border: "2px dashed #28405C", borderRadius: "8px", padding: "9px", width: "100%", color: "#39FF66", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
      >
        + Ajouter un millésime
      </button>
    </div>
  );
}
