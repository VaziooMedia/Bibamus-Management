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
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "700px" }}>
          <div style={{ display: "flex", padding: "0 16px", fontSize: "11px", color: "#8792A6", fontWeight: 700, textTransform: "uppercase" }}>
            <span style={{ flex: 2 }}>Société</span>
            <span style={{ flex: 2 }}>Email de connexion</span>
            <span style={{ flex: 2 }}>Étiquette</span>
            <span style={{ flex: 1 }}>Statut</span>
            <span style={{ width: "40px", textAlign: "center" }}>État</span>
          </div>
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => onOpenAccount(a.id)}
              style={{
                background: "#16273D",
                border: "none",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span style={{ flex: 2, fontSize: "13.5px", color: "#F2F2E8", fontWeight: 700 }}>{a.company_name || "—"}</span>
              <span style={{ flex: 2, fontSize: "12.5px", color: "#8792A6" }}>{a.email}</span>
              <span style={{ flex: 2, fontSize: "12.5px", color: "#8792A6" }}>{a.business_label || "—"}</span>
              <span style={{ flex: 1, fontSize: "12.5px", color: "#8792A6" }}>{a.business_status || "—"}</span>
              <span style={{ width: "40px", display: "flex", justifyContent: "center" }}>
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: a.active !== false ? "#39FF66" : "#FF3B4E", display: "inline-block" }} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
