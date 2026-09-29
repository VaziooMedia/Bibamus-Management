import React, { useState, useEffect } from "react";
import { loadDrinkVintages, createDrinkVintage, updateDrinkVintage, deleteDrinkVintage } from "../data/sharedDirectories.js";
import { CONTAINER_TYPES, COMMON_VOLUMES_CL } from "../data/beerCiderStyles.js";

const fieldStyle = { padding: "8px 10px", borderRadius: "6px", border: "2px solid #28405C", fontSize: "12.5px" };
const currentYear = new Date().getFullYear();

function VintageRow({ vintage, onSave, onDelete }) {
  const [nonMillesime, setNonMillesime] = useState(vintage.year == null);
  const [year, setYear] = useState(vintage.year ?? currentYear);
  const [container, setContainer] = useState(vintage.container || CONTAINER_TYPES[0].code);
  const [volumeCl, setVolumeCl] = useState(vintage.volumeMl ? vintage.volumeMl / 10 : "");
  const [abv, setAbv] = useState(vintage.abv ?? "");
  const [barcode, setBarcode] = useState(vintage.barcode || "");
  const [dirty, setDirty] = useState(false);

  const save = () => {
    onSave(vintage.id, {
      year: nonMillesime ? null : year === "" ? null : parseInt(year, 10),
      container,
      volumeMl: volumeCl === "" ? null : parseFloat(volumeCl) * 10,
      abv: abv === "" ? null : parseFloat(abv),
      barcode,
    });
    setDirty(false);
  };
  // Quitter un champ (y compris pour cliquer sur "Enregistrer" tout en bas, qui ferme toute la
  // fiche) sauvegarde déjà cette ligne — le petit ✓ reste utilisable, mais n'est plus le SEUL
  // moyen de ne pas perdre ce qui vient d'être tapé ici.
  const onBlur = () => dirty && save();

  return (
    <div style={{ padding: "8px", background: "#16273D", borderRadius: "8px", marginBottom: "6px" }}>
      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
        <input
          type="number"
          min="1900"
          max="2100"
          value={nonMillesime ? "" : year}
          disabled={nonMillesime}
          onChange={(e) => {
            setYear(e.target.value);
            setDirty(true);
          }}
          onBlur={onBlur}
          placeholder={nonMillesime ? "—" : "Année"}
          style={{ ...fieldStyle, width: "70px", flexShrink: 0, opacity: nonMillesime ? 0.5 : 1 }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#8792A6", flexShrink: 0, cursor: "pointer", whiteSpace: "nowrap" }}>
          <input
            type="checkbox"
            checked={nonMillesime}
            onChange={(e) => {
              setNonMillesime(e.target.checked);
              setDirty(true);
            }}
            onBlur={onBlur}
          />
          Non millésimé
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={abv}
          onChange={(e) => {
            setAbv(e.target.value);
            setDirty(true);
          }}
          onBlur={onBlur}
          placeholder="Taux d'alcool (%)"
          style={{ ...fieldStyle, width: "100px", flexShrink: 0 }}
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
      <div style={{ display: "flex", gap: "6px" }}>
        <select
          value={container}
          onChange={(e) => {
            setContainer(e.target.value);
            setDirty(true);
          }}
          onBlur={onBlur}
          style={{ ...fieldStyle, flex: 1 }}
        >
          {CONTAINER_TYPES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.fr}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.5"
          min="0"
          max="999"
          list="common-volumes-cl-vintage"
          value={volumeCl}
          onChange={(e) => {
            setVolumeCl(e.target.value);
            setDirty(true);
          }}
          onBlur={onBlur}
          title="Volume (cl)"
          style={{ ...fieldStyle, width: "56px", padding: "8px 4px", textAlign: "center", flexShrink: 0 }}
        />
        <input
          value={barcode}
          onChange={(e) => {
            setBarcode(e.target.value);
            setDirty(true);
          }}
          onBlur={onBlur}
          placeholder="Code-barres"
          style={{ ...fieldStyle, flex: 1 }}
        />
      </div>
    </div>
  );
}

// Liste des millésimes d'un vin — indépendante des conditionnements/codes-barres (voir
// VariantManager) : une année (ou "Non millésimé") + son propre taux d'alcool et son propre
// code-barre, qui peuvent différer d'un millésime à l'autre pour un même vin. Remplace
// l'ancien champ "Millésime" unique du produit (retiré de l'écran, devenu redondant).
// Trie toujours par année — "Non millésimé" (sans année) en dernier. Appliqué après chaque
// chargement ou sauvegarde (le petit ✓ d'une ligne, notamment), pour qu'une année modifiée
// retrouve tout de suite sa vraie place plutôt que de rester où elle était affichée avant.
function sortVintages(list) {
  return [...list].sort((a, b) => {
    if (a.year == null && b.year == null) return 0;
    if (a.year == null) return 1;
    if (b.year == null) return -1;
    return a.year - b.year;
  });
}

export function VintageManager({ drinkId }) {
  const [vintages, setVintages] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    loadDrinkVintages(drinkId).then((list) => {
      setVintages(sortVintages(list));
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
    const created = await createDrinkVintage({ drinkId, year: currentYear, abv: null, container: CONTAINER_TYPES[0].code, volumeMl: 750, barcode: null });
    if (created) setVintages((prev) => sortVintages([...prev, created]));
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
      <datalist id="common-volumes-cl-vintage">
        {COMMON_VOLUMES_CL.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
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
