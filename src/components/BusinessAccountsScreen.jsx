import React, { useState, useEffect } from "react";
import { loadBusinessAccountsFull, loadBusinessEntityCounts } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES } from "../constants.js";

const normalize = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function BusinessAccountsScreen({ onOpenAccount }) {
  const [accounts, setAccounts] = useState(null);
  const [entityCounts, setEntityCounts] = useState({});
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadBusinessAccountsFull().then(setAccounts);
    loadBusinessEntityCounts().then(setEntityCounts);
  }, []);

  const q = normalize(query.trim());
  const filtered = accounts ? accounts.filter((a) => !q || [a.company_name, a.email].some((field) => normalize(field).includes(q))) : null;

  // Même vrai style que les autres vrais tableaux de la plateforme (Lieux, Produits,
  // Revendications...) — vraie bordure épaisse sur l'en-tête, vrai survol des lignes, vraies
  // bordures fines entre colonnes sur le corps.
  const cellStyle = { padding: "10px 12px", fontSize: "14px", color: "#F2F2E8", verticalAlign: "top", borderBottom: "1px solid #16273D", borderRight: "1px solid #16273D" };
  const headerCellStyle = { padding: "10px 12px", fontSize: "12.5px", color: "#8792A6", textAlign: "center", whiteSpace: "nowrap", borderRight: "1px solid #28405C" };

  return (
    <div>
      <PageTitle>Comptes Business</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "16px" }}>Comptes créés suite à une revendication approuvée.</p>

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
                <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap" }}>{COUNTRIES.find((c) => c.code === a.company_country)?.fr || "—"}</td>
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
    </div>
  );
}
