import React from "react";
import { LANGUAGES } from "./AdministratorDetailPanel.jsx";

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%", color: "#F2F2E8", background: "#0D1B2A", boxSizing: "border-box" };
const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };

// Vraie refonte unifiée des "autres noms" — jusqu'ici chaque type de fiche avait ses propres
// libellés incohérents (Alias/traductions, Nom alternatif/ancien nom, ...) pour des vrais
// concepts qui se recoupaient sans être vraiment distingués. 3 vrais blocs clairs, communs aux
// 4 types de fiche : un vrai alias (synonyme courant), une vraie ancienne appellation
// (historique), et de vraies traductions (une par langue, réutilisant les mêmes 9 langues que
// "Langue principale" côté Administrateurs).
export function AlternateNamesFields({ aliasesText, onAliasesTextChange, alternateName, onAlternateNameChange, translations, onTranslationsChange }) {
  const addTranslation = () => {
    const usedLangs = new Set(translations.map((t) => t.lang));
    const nextLang = LANGUAGES.find((l) => !usedLangs.has(l.label))?.label || LANGUAGES[0].label;
    onTranslationsChange([...translations, { lang: nextLang, value: "" }]);
  };
  const updateTranslation = (index, patch) => onTranslationsChange(translations.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  const removeTranslation = (index) => onTranslationsChange(translations.filter((_, i) => i !== index));

  return (
    <>
      <label style={labelStyle}>Alias (séparés par une virgule)</label>
      <input
        value={aliasesText}
        onChange={(e) => onAliasesTextChange(e.target.value)}
        placeholder="Ex. surnoms, abréviations courantes..."
        style={{ ...fieldStyle, marginBottom: "14px" }}
      />

      <label style={labelStyle}>Ancienne appellation</label>
      <input value={alternateName} onChange={(e) => onAlternateNameChange(e.target.value)} placeholder="Ex. nom porté avant un changement" style={{ ...fieldStyle, marginBottom: "14px" }} />

      <label style={labelStyle}>Traduction</label>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
        {translations.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: "8px" }}>
            <select
              value={t.lang}
              onChange={(e) => updateTranslation(i, { lang: e.target.value })}
              style={{ ...fieldStyle, width: "auto", flexShrink: 0 }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.label} value={l.label}>
                  {l.prefix}
                </option>
              ))}
            </select>
            <input value={t.value} onChange={(e) => updateTranslation(i, { value: e.target.value })} style={{ ...fieldStyle, flex: 1 }} />
            <button
              onClick={() => removeTranslation(i)}
              title="Retirer cette traduction"
              style={{ flexShrink: 0, background: "none", border: "2px solid #FF3B4E", borderRadius: "8px", width: "40px", color: "#FF3B4E", cursor: "pointer", fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addTranslation}
        style={{ background: "none", border: "2px solid #39FF66", borderRadius: "8px", padding: "7px 14px", fontWeight: 700, fontSize: "12.5px", color: "#39FF66", cursor: "pointer", marginBottom: "14px" }}
      >
        + Ajouter une traduction
      </button>
    </>
  );
}
