import React, { useState, useEffect } from "react";
import { loadCountryRules, updateCountryRule } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES } from "../constants.js";

const countryLabel = (code) => COUNTRIES.find((c) => c.code === code)?.fr || code;

export function CountryRulesScreen() {
  const [rules, setRules] = useState(null);
  const [editingCode, setEditingCode] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = () => loadCountryRules().then(setRules);
  useEffect(() => {
    refresh();
  }, []);

  const startEdit = (r) => {
    setEditingCode(r.country_code);
    setEditValue(String(r.minimum_age));
  };

  const save = async (code) => {
    const age = parseInt(editValue, 10);
    if (!age || age < 0 || age > 99) return;
    setSaving(true);
    await updateCountryRule(code, age);
    setSaving(false);
    setEditingCode(null);
    refresh();
  };

  const sorted = rules ? [...rules].sort((a, b) => countryLabel(a.country_code).localeCompare(countryLabel(b.country_code))) : null;

  return (
    <div>
      <PageTitle>Configuration pays</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>
        Âge minimum requis pour s'inscrire, par pays — Bibamus concerne des boissons alcoolisées. Modifiable ici sans déploiement de code.
      </p>

      {!sorted ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "480px" }}>
          {sorted.map((r) => {
            const isEditing = editingCode === r.country_code;
            return (
              <div key={r.country_code} style={{ background: "#16273D", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13.5px", color: "#F2F2E8" }}>{countryLabel(r.country_code)}</span>
                {isEditing ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      style={{ width: "60px", padding: "6px 8px", borderRadius: "6px", border: "2px solid #28405C", background: "#0D1B2A", color: "#F2F2E8", fontSize: "13px", textAlign: "center" }}
                    />
                    <button
                      onClick={() => save(r.country_code)}
                      disabled={saving}
                      style={{ background: "#39FF66", border: "none", borderRadius: "6px", padding: "6px 12px", fontWeight: 700, fontSize: "12px", color: "#0D1B2A", cursor: "pointer" }}
                    >
                      OK
                    </button>
                    <button onClick={() => setEditingCode(null)} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "12px", cursor: "pointer" }}>
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(r)}
                    style={{ background: "none", border: "2px solid #28405C", borderRadius: "6px", padding: "6px 12px", fontWeight: 700, fontSize: "13px", color: "#39FF66", cursor: "pointer" }}
                  >
                    {r.minimum_age} ans
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
