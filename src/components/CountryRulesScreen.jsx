import React, { useState, useEffect } from "react";
import { loadCountryRules, updateCountryRule } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES, COUNTRY_ISO_BY_SLUG } from "../constants.js";
import { CountryFlagImg } from "./icons.jsx";

const countryLabel = (code) => COUNTRIES.find((c) => c.code === code)?.fr || code;

const CONTINENT_BLOCKS = ["Europe", "Amérique du Nord", "Amérique du Sud", "Afrique", "Asie", "Océanie"];

// Même vrai principe que Database/Utilisateurs, mais indexé par le vrai slug de COUNTRIES
// (pas le vrai nom français) puisque country_code est stocké sous cette vraie forme ici.
const CONTINENT_BY_SLUG = {
  belgique: "Europe",
  france: "Europe",
  pays_bas: "Europe",
  allemagne: "Europe",
  luxembourg: "Europe",
  autriche: "Europe",
  bulgarie: "Europe",
  chypre: "Europe",
  croatie: "Europe",
  danemark: "Europe",
  espagne: "Europe",
  estonie: "Europe",
  finlande: "Europe",
  grece: "Europe",
  hongrie: "Europe",
  irlande: "Europe",
  islande: "Europe",
  italie: "Europe",
  lettonie: "Europe",
  lituanie: "Europe",
  malte: "Europe",
  norvege: "Europe",
  pologne: "Europe",
  portugal: "Europe",
  republique_tcheque: "Europe",
  roumanie: "Europe",
  royaume_uni: "Europe",
  slovaquie: "Europe",
  slovenie: "Europe",
  suede: "Europe",
  suisse: "Europe",
  canada: "Amérique du Nord",
  etats_unis: "Amérique du Nord",
  mexique: "Amérique du Nord",
  cuba: "Amérique du Nord",
  argentine: "Amérique du Sud",
  chili: "Amérique du Sud",
  venezuela: "Amérique du Sud",
  afrique_du_sud: "Afrique",
  algerie: "Afrique",
  cote_d_ivoire: "Afrique",
  maroc: "Afrique",
  senegal: "Afrique",
  tunisie: "Afrique",
  australie: "Océanie",
  nouvelle_zelande: "Océanie",
};

function FilterBlock({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 4px",
        borderRadius: "8px",
        border: `2px solid ${active ? "#39FF66" : "#28405C"}`,
        background: active ? "#28405C" : "#16273D",
        color: active ? "#39FF66" : "#F2F2E8",
        fontSize: "12.5px",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <span>{label}</span>
      <span style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "15px", color: "#39FF66" }}>{count}</span>
    </button>
  );
}

export function CountryRulesScreen() {
  const [rules, setRules] = useState(null);
  const [editingCode, setEditingCode] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [continentFilter, setContinentFilter] = useState(null);

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

  const sorted = rules
    ? [...rules]
        .filter((r) => !continentFilter || CONTINENT_BY_SLUG[r.country_code] === continentFilter)
        .sort((a, b) => countryLabel(a.country_code).localeCompare(countryLabel(b.country_code)))
    : null;

  return (
    <div>
      <PageTitle>Âge minimum / Pays</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>Âge minimum requis pour l'inscription (politique "alcool")</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "20px", maxWidth: "900px" }}>
        {CONTINENT_BLOCKS.map((c) => (
          <FilterBlock
            key={c}
            label={c}
            count={(rules || []).filter((r) => CONTINENT_BY_SLUG[r.country_code] === c).length}
            active={continentFilter === c}
            onClick={() => setContinentFilter((prev) => (prev === c ? null : c))}
          />
        ))}
      </div>

      {!sorted ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <div style={{ columns: 3, columnGap: "24px", columnRule: "1px solid #28405C", maxWidth: "900px" }}>
          {sorted.map((r) => {
            const isEditing = editingCode === r.country_code;
            const iso = COUNTRY_ISO_BY_SLUG[r.country_code];
            return (
              <div
                key={r.country_code}
                style={{ breakInside: "avoid", background: "#16273D", borderRadius: "8px", padding: "8px 10px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}
              >
                <span style={{ fontSize: "12.5px", color: "#F2F2E8", display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                  {iso && <CountryFlagImg isoCode={iso} size={14} />}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{countryLabel(r.country_code)}</span>
                </span>
                {isEditing ? (
                  <div style={{ display: "flex", gap: "5px", alignItems: "center", flexShrink: 0 }}>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      style={{ width: "42px", padding: "5px 6px", borderRadius: "6px", border: "2px solid #28405C", background: "#0D1B2A", color: "#F2F2E8", fontSize: "12px", textAlign: "center" }}
                    />
                    <button
                      onClick={() => save(r.country_code)}
                      disabled={saving}
                      style={{ background: "#39FF66", border: "none", borderRadius: "6px", padding: "5px 9px", fontWeight: 700, fontSize: "11px", color: "#0D1B2A", cursor: "pointer" }}
                    >
                      OK
                    </button>
                    <button onClick={() => setEditingCode(null)} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "11px", cursor: "pointer" }}>
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(r)}
                    style={{ flexShrink: 0, background: "none", border: "2px solid #28405C", borderRadius: "6px", padding: "5px 9px", fontWeight: 700, fontSize: "12px", color: "#39FF66", cursor: "pointer" }}
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
