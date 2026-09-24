import React, { useState, useEffect, useMemo } from "react";
import { loadClaims, approveClaim, rejectClaim } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES } from "../constants.js";
import { CountryFlagImg } from "./icons.jsx";
import { NewBusinessForm } from "./NewBusinessForm.jsx";

const ENTITY_TYPE_LABELS = { venue: "Lieu", drink: "Produit", brand: "Marque", producer: "Producteur" };

export function ClaimsScreen({ onOpenEntity }) {
  const [claims, setClaims] = useState(null);
  const [rejectedClaims, setRejectedClaims] = useState(null);
  const [viewMode, setViewMode] = useState("pending"); // "pending" | "rejected"
  const [typeFilter, setTypeFilter] = useState("all");
  const [creatingNewFor, setCreatingNewFor] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);

  const refresh = () => {
    loadClaims("pending").then(setClaims);
    loadClaims("rejected").then(setRejectedClaims);
  };
  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (viewMode === "rejected") return rejectedClaims;
    if (!claims) return null;
    let list = typeFilter === "all" ? claims : claims.filter((c) => c.entity_type === typeFilter);
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = sortKey === "entity_type" ? ENTITY_TYPE_LABELS[a.entity_type] || a.entity_type : a.created_at || "";
        const bv = sortKey === "entity_type" ? ENTITY_TYPE_LABELS[b.entity_type] || b.entity_type : b.created_at || "";
        return String(av).localeCompare(String(bv)) * sortDir;
      });
    }
    return list;
  }, [claims, rejectedClaims, viewMode, typeFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => -d);
    else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const handleReject = async (claim) => {
    const reason = prompt("Raison du refus (optionnel) :") || "";
    setBusyId(claim.id);
    await rejectClaim(claim.id, reason);
    setBusyId(null);
    refresh();
  };

  const TYPE_FILTERS = [
    { key: "all", label: "Tout" },
    { key: "venue", label: "Lieux" },
    { key: "drink", label: "Produits" },
    { key: "brand", label: "Marques" },
    { key: "producer", label: "Producteurs" },
  ];

  const cellStyle = { padding: "10px 12px", fontSize: "14px", color: "#F2F2E8", verticalAlign: "top", borderBottom: "1px solid #16273D", borderRight: "1px solid #16273D" };
  const headerCellStyle = { padding: "10px 12px", fontSize: "12.5px", color: "#8792A6", textAlign: "center", whiteSpace: "nowrap", borderRight: "1px solid #28405C" };

  return (
    <div>
      <PageTitle>Revendications</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>Demandes de propriétaires souhaitant gérer leur propre fiche.</p>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {TYPE_FILTERS.map((t) => {
          const count = claims ? (t.key === "all" ? claims.length : claims.filter((c) => c.entity_type === t.key).length) : 0;
          const active = viewMode === "pending" && typeFilter === t.key;
          return (
            <div
              key={t.key}
              onClick={() => {
                setViewMode("pending");
                setTypeFilter(t.key);
              }}
              style={{
                background: active ? "#1D3450" : "#16273D",
                borderRadius: "10px",
                padding: "8px 16px",
                minWidth: "110px",
                textAlign: "center",
                border: active ? "2px solid #39FF66" : "none",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "11.5px", color: "#8792A6", marginBottom: "4px" }}>{t.label}</div>
              <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "20px", color: "#39FF66" }}>{count}</div>
            </div>
          );
        })}
        {(() => {
          const active = viewMode === "rejected";
          return (
            <div
              onClick={() => setViewMode("rejected")}
              style={{
                background: active ? "#1D3450" : "#16273D",
                borderRadius: "10px",
                padding: "8px 16px",
                minWidth: "110px",
                textAlign: "center",
                border: active ? "2px solid #ef007c" : "none",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "11.5px", color: "#8792A6", marginBottom: "4px" }}>Refus</div>
              <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "20px", color: "#ef007c" }}>{rejectedClaims ? rejectedClaims.length : 0}</div>
            </div>
          );
        })()}
      </div>

      {!filtered ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>{viewMode === "rejected" ? "Aucune revendication refusée." : "Aucune revendication en attente dans cette catégorie."}</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderTop: "2px solid #28405C", borderBottom: "2px solid #28405C" }}>
              <th style={{ ...headerCellStyle, width: "1%" }}>#</th>
              <th
                style={{ ...headerCellStyle, width: "1%", cursor: "pointer", userSelect: "none", color: sortKey === "entity_type" ? "#39FF66" : headerCellStyle.color }}
                onClick={() => toggleSort("entity_type")}
              >
                Type {sortKey === "entity_type" ? (sortDir === 1 ? "▲" : "▼") : ""}
              </th>
              <th style={headerCellStyle}>Nom de la fiche</th>
              <th style={headerCellStyle}>Nom de l'utilisateur</th>
              <th style={headerCellStyle}>Adresse email utilisateur</th>
              <th style={{ ...headerCellStyle, width: "1%" }}>Texte</th>
              <th
                style={{ ...headerCellStyle, width: "1%", cursor: "pointer", userSelect: "none", color: sortKey === "created_at" ? "#39FF66" : headerCellStyle.color }}
                onClick={() => toggleSort("created_at")}
              >
                Date {sortKey === "created_at" ? (sortDir === 1 ? "▲" : "▼") : ""}
              </th>
              <th style={{ ...headerCellStyle, width: "1%", borderRight: "none" }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <React.Fragment key={c.id}>
                <tr style={{ borderBottom: "1px solid #16273D" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#16273D")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap" }}>{String(i + 1).padStart(2, "0")}</td>
                  <td style={cellStyle}>{ENTITY_TYPE_LABELS[c.entity_type] || c.entity_type}</td>
                  <td style={cellStyle}>
                    {onOpenEntity ? (
                      <button onClick={() => onOpenEntity(c.entity_type, c.entity_id)} style={{ background: "none", border: "none", padding: 0, fontSize: "14px", color: "#39FF66", fontWeight: 700, cursor: "pointer" }}>
                        {c.entity_name}
                      </button>
                    ) : (
                      c.entity_name
                    )}
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {c.claimant_country && <CountryFlagImg isoCode={c.claimant_country.toLowerCase()} size={14} />}
                      {c.claimant ? `${c.claimant.name || ""} ${c.claimant.last_name || ""}`.trim() : "(compte inconnu)"}
                    </div>
                  </td>
                  <td style={cellStyle}>{c.claimant?.email || "—"}</td>
                  <td style={{ ...cellStyle, textAlign: "center" }} title={c.justification}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8792A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: "help" }}>
                      <line x1="4" y1="6" x2="20" y2="6" />
                      <line x1="4" y1="12" x2="16" y2="12" />
                      <line x1="4" y1="18" x2="12" y2="18" />
                    </svg>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap" }}>{c.created_at ? c.created_at.slice(0, 10) : ""}</td>
                  <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap", borderRight: "none" }}>
                    {viewMode === "rejected" ? (
                      <span style={{ fontSize: "11.5px", color: "#ef007c", fontWeight: 700 }}>Refusée</span>
                    ) : (
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          onClick={() => setCreatingNewFor(creatingNewFor === c.id ? null : c.id)}
                          disabled={busyId === c.id}
                          title="Approuver"
                          aria-label="Approuver"
                          style={{
                            width: "28px",
                            height: "28px",
                            background: creatingNewFor === c.id ? "#39FF66" : "none",
                            border: "2px solid #39FF66",
                            borderRadius: "6px",
                            fontWeight: 800,
                            fontSize: "13px",
                            color: creatingNewFor === c.id ? "#0D1B2A" : "#39FF66",
                            cursor: "pointer",
                          }}
                        >
                          V
                        </button>
                        <button
                          onClick={() => handleReject(c)}
                          disabled={busyId === c.id}
                          title="Refuser"
                          aria-label="Refuser"
                          style={{ width: "28px", height: "28px", background: "none", border: "2px solid #FF3B4E", borderRadius: "6px", fontWeight: 800, fontSize: "13px", color: "#FF3B4E", cursor: "pointer" }}
                        >
                          X
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {creatingNewFor === c.id && (
                  <tr>
                    <td colSpan={8} style={{ padding: "0 8px 12px", borderBottom: "1px solid #28405C" }}>
                      <NewBusinessForm
                        claim={c}
                        onCreated={() => {
                          setCreatingNewFor(null);
                          refresh();
                        }}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
