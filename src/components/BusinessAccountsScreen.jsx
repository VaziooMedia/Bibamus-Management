import React, { useState, useEffect } from "react";
import { loadBusinessAccountsFull, loadBusinessEntityCounts } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES } from "../constants.js";
import { NewBusinessForm } from "./NewBusinessForm.jsx";

const normalize = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const COUNTRY_BLOCKS = ["Belgique", "France", "Pays-Bas", "Allemagne", "Luxembourg", "Espagne"];
const CONTINENT_BLOCKS = ["Europe", "Amérique du Nord", "Amérique du Sud", "Afrique", "Asie", "Océanie"];

// Même vrai principe que Database/Utilisateurs — chaque vrai pays connu de l'app est rattaché
// à son vrai continent, pour filtrer à ce niveau sans vrai champ dédié en base.
const COUNTRY_TO_CONTINENT = {
  Belgique: "Europe",
  France: "Europe",
  "Pays-Bas": "Europe",
  Allemagne: "Europe",
  Luxembourg: "Europe",
  Espagne: "Europe",
  Italie: "Europe",
  Portugal: "Europe",
  Suisse: "Europe",
  "Royaume-Uni": "Europe",
  Irlande: "Europe",
  Autriche: "Europe",
  "États-Unis": "Amérique du Nord",
  Canada: "Amérique du Nord",
  Mexique: "Amérique du Nord",
  Brésil: "Amérique du Sud",
  Argentine: "Amérique du Sud",
  Chili: "Amérique du Sud",
  Maroc: "Afrique",
  Algérie: "Afrique",
  Tunisie: "Afrique",
  Sénégal: "Afrique",
  "Côte d'Ivoire": "Afrique",
  Chine: "Asie",
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

export function BusinessAccountsScreen({ onOpenAccount }) {
  const [accounts, setAccounts] = useState(null);
  const [entityCounts, setEntityCounts] = useState({});
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState(null);
  const [continentFilter, setContinentFilter] = useState(null);
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    loadBusinessAccountsFull().then(setAccounts);
    loadBusinessEntityCounts().then(setEntityCounts);
  };
  useEffect(() => {
    refresh();
  }, []);

  // company_country est un vrai code (ex. "belgique"), pas un vrai nom français direct — on le
  // résout d'abord, comme pour la vraie colonne "Pays" déjà affichée.
  const countryNameOf = (a) => COUNTRIES.find((c) => c.code === a.company_country)?.fr || null;

  const q = normalize(query.trim());
  const filtered = accounts
    ? accounts.filter((a) => {
        if (countryFilter && countryNameOf(a) !== countryFilter) return false;
        if (continentFilter && COUNTRY_TO_CONTINENT[countryNameOf(a)] !== continentFilter) return false;
        return !q || [a.company_name, a.email].some((field) => normalize(field).includes(q));
      })
    : null;

  // Même vrai style que les autres vrais tableaux de la plateforme (Lieux, Produits,
  // Revendications...) — vraie bordure épaisse sur l'en-tête, vrai survol des lignes, vraies
  // bordures fines entre colonnes sur le corps.
  const cellStyle = { padding: "10px 12px", fontSize: "14px", color: "#F2F2E8", verticalAlign: "top", borderBottom: "1px solid #16273D", borderRight: "1px solid #16273D" };
  const headerCellStyle = { padding: "10px 12px", fontSize: "12.5px", color: "#8792A6", textAlign: "center", whiteSpace: "nowrap", borderRight: "1px solid #28405C" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <PageTitle>Comptes Business</PageTitle>
        <button
          onClick={() => setCreating(true)}
          title="Ajouter un compte Business"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#39FF66",
            border: "none",
            color: "#0D1B2A",
            fontSize: "20px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "16px" }}>Comptes créés suite à une revendication approuvée, ou ajoutés manuellement.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "8px" }}>
        {COUNTRY_BLOCKS.map((c) => (
          <FilterBlock
            key={c}
            label={c}
            count={(accounts || []).filter((a) => countryNameOf(a) === c).length}
            active={countryFilter === c}
            onClick={() => {
              setCountryFilter((prev) => (prev === c ? null : c));
              setContinentFilter(null);
            }}
          />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "20px" }}>
        {CONTINENT_BLOCKS.map((c) => (
          <FilterBlock
            key={c}
            label={c}
            count={(accounts || []).filter((a) => COUNTRY_TO_CONTINENT[countryNameOf(a)] === c).length}
            active={continentFilter === c}
            onClick={() => {
              setContinentFilter((prev) => (prev === c ? null : c));
              setCountryFilter(null);
            }}
          />
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher : société, email..."
        style={{ padding: "10px 14px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13px", color: "#F2F2E8", background: "#16273D", width: "100%", maxWidth: "420px", boxSizing: "border-box", marginBottom: "20px" }}
      />

      {!filtered ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>{accounts.length === 0 ? "Aucun compte Business pour l'instant." : "Aucun compte ne correspond à cette recherche."}</p>
      ) : (
        <table style={{ width: "100%", maxWidth: "1100px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderTop: "2px solid #28405C", borderBottom: "2px solid #28405C" }}>
              <th style={{ ...headerCellStyle, width: "1%" }}>#</th>
              <th style={headerCellStyle}>Société</th>
              <th style={{ ...headerCellStyle, width: "1%" }}>Pays</th>
              <th style={{ ...headerCellStyle, width: "1%" }}>Email contact</th>
              <th style={{ ...headerCellStyle, width: "1%" }}>Plan</th>
              <th style={{ ...headerCellStyle, width: "1%" }}>Nbre fiches</th>
              <th style={{ ...headerCellStyle, width: "1%", borderRight: "none" }}>État</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr
                key={a.id}
                onClick={() => onOpenAccount(a.id)}
                style={{ borderBottom: "1px solid #16273D", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#16273D")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap" }}>{String(i + 1).padStart(2, "0")}</td>
                <td style={{ ...cellStyle, fontWeight: 700 }}>{a.company_name || "—"}</td>
                <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap" }}>{countryNameOf(a) || "—"}</td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  {a.contact_email ? (
                    <a href={`mailto:${a.contact_email}`} onClick={(e) => e.stopPropagation()} title={a.contact_email} style={{ display: "inline-flex" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#39FF66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m2 7 10 6 10-6" />
                      </svg>
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap" }}>Gratuit</td>
                <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap", cursor: "help" }} title={(entityCounts[a.id] || []).join("\n") || "Aucune fiche liée"}>
                  {(entityCounts[a.id] || []).length}
                </td>
                <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap", borderRight: "none" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: a.active !== false ? "#39FF66" : "#FF3B4E", display: "inline-block" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", zIndex: 50, overflowY: "auto" }}>
          <div style={{ background: "#16273D", borderRadius: "14px", padding: "28px", width: "480px", maxWidth: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", color: "#F2F2E8", margin: 0 }}>
                <span style={{ width: "4px", height: "20px", borderRadius: "2px", background: "#39FF66", flexShrink: 0 }} />
                Nouveau compte Business
              </h2>
              <button onClick={() => setCreating(false)} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
                ✕
              </button>
            </div>
            <NewBusinessForm
              onCreated={() => {
                setCreating(false);
                refresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
