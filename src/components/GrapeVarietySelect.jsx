import React, { useState, useRef, useEffect } from "react";

const SPECIAL_VALUES = [
  { id: "special:assemblage_inconnu", name: "Assemblage inconnu" },
  { id: "special:non_renseigne", name: "Non renseigné" },
];

// Sélecteur multiple de cépages — recherche + autocomplétion depuis la vraie base partagée
// (grape_varieties), avec possibilité d'ajouter un cépage absent ("+ Ajouter..."), et deux
// valeurs spéciales mutuellement exclusives avec de vrais cépages. showPercentage active un
// petit champ % à côté de chaque tag (utilisé en édition complète, pas dans l'Ajout rapide).
export function GrapeVarietySelect({ selected, onChange, options, onCreateOption, showPercentage = false, placeholder = "Chercher un cépage..." }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectedIds = selected.map((s) => s.id);
  const isSpecialSelected = selected.some((s) => s.id.startsWith("special:"));

  const allOptions = [...options, ...SPECIAL_VALUES];
  const q = query.trim().toLowerCase();
  const filtered = q ? allOptions.filter((o) => o.name.toLowerCase().includes(q)) : allOptions;
  const exactMatch = allOptions.some((o) => o.name.toLowerCase() === q);

  const addVariety = (option) => {
    if (option.id.startsWith("special:")) {
      // Une valeur spéciale remplace toute sélection existante — mutuellement exclusive.
      onChange([{ id: option.id, name: option.name, percentage: null }]);
    } else {
      const withoutSpecials = selected.filter((s) => !s.id.startsWith("special:"));
      if (selectedIds.includes(option.id)) return;
      onChange([...withoutSpecials, { id: option.id, name: option.name, percentage: null }]);
    }
    setOpen(false);
    setQuery("");
  };

  const handleCreate = async () => {
    if (!query.trim()) return;
    setCreating(true);
    const created = await onCreateOption(query.trim());
    setCreating(false);
    if (created) addVariety(created);
  };

  const removeVariety = (id) => onChange(selected.filter((s) => s.id !== id));
  const updatePercentage = (id, value) => onChange(selected.map((s) => (s.id === id ? { ...s, percentage: value === "" ? null : value } : s)));

  return (
    <div>
      {selected.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
          {selected.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: s.id.startsWith("special:") ? "#28405C" : "#39FF66",
                color: s.id.startsWith("special:") ? "#F2F2E8" : "#0D1B2A",
                borderRadius: "999px",
                padding: "5px 6px 5px 12px",
                fontSize: "12.5px",
                fontWeight: 700,
                width: "fit-content",
              }}
            >
              {s.name}
              {showPercentage && !s.id.startsWith("special:") && (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={s.percentage ?? ""}
                  onChange={(e) => updatePercentage(s.id, e.target.value)}
                  placeholder="%"
                  style={{
                    width: "48px",
                    padding: "2px 6px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#0D1B2A",
                  }}
                />
              )}
              <button
                onClick={() => removeVariety(s.id)}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "2px", fontWeight: 800, display: "flex" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {isSpecialSelected ? (
        <p style={{ fontSize: "11.5px", color: "#8792A6", fontStyle: "italic", margin: 0 }}>
          Retirez cette valeur pour pouvoir sélectionner de vrais cépages.
        </p>
      ) : (
        <div ref={ref} style={{ position: "relative" }}>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            style={{ padding: "9px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13px", width: "100%", boxSizing: "border-box", background: "#0D1B2A", color: "#F2F2E8" }}
          />
          {open && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "4px",
                background: "#16273D",
                border: "2px solid #28405C",
                borderRadius: "8px",
                zIndex: 20,
                maxHeight: "260px",
                overflowY: "auto",
              }}
            >
              {filtered
                .filter((o) => !selectedIds.includes(o.id))
                .map((o) => (
                  <button
                    key={o.id}
                    onClick={() => addVariety(o)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", background: "none", border: "none", color: "#F2F2E8", fontSize: "13px", cursor: "pointer" }}
                  >
                    {o.name}
                  </button>
                ))}
              {query.trim() && !exactMatch && (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", background: "none", border: "none", borderTop: "2px solid #28405C", color: "#39FF66", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                >
                  {creating ? "Ajout..." : `+ Ajouter "${query.trim()}"`}
                </button>
              )}
              {filtered.length === 0 && !query.trim() && (
                <div style={{ padding: "10px 12px", color: "#8792A6", fontSize: "12.5px", fontStyle: "italic" }}>Aucun cépage.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
