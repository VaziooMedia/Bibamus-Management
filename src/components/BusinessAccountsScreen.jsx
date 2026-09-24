import React, { useState, useEffect } from "react";
import { loadBusinessAccountsFull } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const normalize = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function BusinessAccountsScreen({ onOpenAccount }) {
  const [accounts, setAccounts] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadBusinessAccountsFull().then(setAccounts);
  }, []);

  const q = normalize(query.trim());
  const filtered = accounts
    ? accounts.filter((a) => !q || [a.company_name, a.email, a.business_label, a.business_status].some((field) => normalize(field).includes(q)))
    : null;

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
        placeholder="Rechercher : société, email, étiquette, statut..."
        style={{ padding: "10px 14px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13px", color: "#F2F2E8", background: "#16273D", width: "100%", maxWidth: "420px", boxSizing: "border-box", marginBottom: "20px" }}
      />

      {!filtered ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>{accounts.length === 0 ? "Aucun compte Business pour l'instant." : "Aucun compte ne correspond à cette recherche."}</p>
      ) : (
        <table style={{ width: "100%", maxWidth: "900px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderTop: "2px solid #28405C", borderBottom: "2px solid #28405C" }}>
              <th style={headerCellStyle}>Société</th>
              <th style={headerCellStyle}>Email de connexion</th>
              <th style={headerCellStyle}>Étiquette</th>
              <th style={{ ...headerCellStyle, width: "1%" }}>Statut</th>
              <th style={{ ...headerCellStyle, width: "1%", borderRight: "none" }}>État</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr
                key={a.id}
                onClick={() => onOpenAccount(a.id)}
                style={{ borderBottom: "1px solid #16273D", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#16273D")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ ...cellStyle, fontWeight: 700 }}>{a.company_name || "—"}</td>
                <td style={cellStyle}>{a.email}</td>
                <td style={cellStyle}>{a.business_label || "—"}</td>
                <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap" }}>{a.business_status || "—"}</td>
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
