import React, { useState, useEffect } from "react";
import { loadClaims, loadBusinessAccounts, approveClaim, rejectClaim, createCollaborator } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const ENTITY_TYPE_LABELS = { venue: "Établissement", drink: "Produit", brand: "Marque", producer: "Producteur" };

const TABS = [
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Approuvées" },
  { key: "rejected", label: "Refusées" },
];

const fieldStyle = { padding: "9px 10px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13px", width: "100%", color: "#F2F2E8", background: "#0D1B2A", boxSizing: "border-box" };
const labelStyle = { fontSize: "11.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };

// Formulaire de création d'un nouveau compte Business, affiché en ligne sous une revendication
// lorsque l'admin choisit de ne pas lier à un compte déjà existant.
function NewBusinessForm({ claim, onCreated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState(claim.company_name || "");
  const [vatNumber, setVatNumber] = useState(claim.vat_number || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canSave = email.trim() && password.trim().length >= 6 && firstName.trim() && lastName.trim() && companyName.trim();

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    const result = await createCollaborator(email.trim(), password, firstName.trim(), lastName.trim(), null, "business", false, companyName.trim(), vatNumber.trim());
    if (result.error) {
      setSaving(false);
      setError(result.error);
      return;
    }
    const linkResult = await approveClaim(claim.id, claim.entity_type, claim.entity_id, result.userId);
    setSaving(false);
    if (linkResult.error) {
      setError("Compte créé, mais la liaison a échoué : " + linkResult.error);
      return;
    }
    onCreated();
  };

  return (
    <div style={{ marginTop: "10px", padding: "12px", background: "#0D1B2A", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Prénom (contact)</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={fieldStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Nom (contact)</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={fieldStyle} />
        </div>
      </div>
      <label style={labelStyle}>Nom de la société</label>
      <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={fieldStyle} />
      <label style={labelStyle}>Numéro d'entreprise / TVA</label>
      <input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} style={fieldStyle} />
      <label style={labelStyle}>Email professionnel (différent du compte personnel)</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={fieldStyle} />
      <label style={labelStyle}>Mot de passe provisoire</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={fieldStyle} />
      {error && <p style={{ color: "#FF3B4E", fontSize: "12px", margin: 0 }}>{error}</p>}
      <button
        onClick={handleCreate}
        disabled={!canSave || saving}
        style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "9px", fontWeight: 700, fontSize: "12.5px", color: "#0D1B2A", cursor: "pointer", opacity: !canSave || saving ? 0.5 : 1 }}
      >
        {saving ? "Création..." : "Créer le compte et lier la fiche"}
      </button>
    </div>
  );
}

export function ClaimsScreen() {
  const [tab, setTab] = useState("pending");
  const [claims, setClaims] = useState(null);
  const [businessAccounts, setBusinessAccounts] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [creatingNewFor, setCreatingNewFor] = useState(null);
  const [selectedBusinessFor, setSelectedBusinessFor] = useState({});
  const [busyId, setBusyId] = useState(null);

  const refresh = () => loadClaims(tab).then(setClaims);
  useEffect(() => {
    setClaims(null);
    refresh();
    loadBusinessAccounts().then(setBusinessAccounts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleLinkExisting = async (claim) => {
    const businessId = selectedBusinessFor[claim.id];
    if (!businessId) return;
    setBusyId(claim.id);
    const result = await approveClaim(claim.id, claim.entity_type, claim.entity_id, businessId);
    setBusyId(null);
    if (result.error) {
      alert("Erreur : " + result.error);
      return;
    }
    refresh();
  };

  const handleReject = async (claim) => {
    const reason = prompt("Raison du refus (optionnel) :") || "";
    setBusyId(claim.id);
    await rejectClaim(claim.id, reason);
    setBusyId(null);
    refresh();
  };

  return (
    <div>
      <PageTitle>Revendications</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>Demandes de propriétaires souhaitant gérer leur propre fiche.</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: `2px solid ${tab === t.key ? "#39FF66" : "#28405C"}`,
              background: tab === t.key ? "#39FF66" : "none",
              color: tab === t.key ? "#0D1B2A" : "#F2F2E8",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!claims ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : claims.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucune revendication dans cette catégorie.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {claims.map((c) => {
            const expanded = expandedId === c.id;
            return (
              <div key={c.id} style={{ background: "#16273D", borderRadius: "10px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#8792A6", textTransform: "uppercase", fontWeight: 700 }}>{ENTITY_TYPE_LABELS[c.entity_type] || c.entity_type}</span>
                    <p style={{ fontSize: "15px", color: "#F2F2E8", fontWeight: 700, margin: "2px 0 0" }}>{c.entity_name}</p>
                  </div>
                  <span style={{ fontSize: "11px", color: "#8792A6" }}>{c.created_at ? c.created_at.slice(0, 10) : ""}</span>
                </div>

                <p style={{ fontSize: "13.5px", color: "#F2F2E8", margin: "0 0 4px" }}>
                  <strong>{c.company_name}</strong>
                  {c.vat_number ? ` · ${c.vat_number}` : ""}
                </p>
                {c.officers && <p style={{ fontSize: "12.5px", color: "#8792A6", margin: "0 0 8px" }}>Administrateurs déclarés : {c.officers}</p>}
                <p style={{ fontSize: "13px", color: "#F2F2E8", fontStyle: "italic", margin: "0 0 8px" }}>"{c.justification}"</p>
                <p style={{ fontSize: "11px", color: "#8792A6", marginBottom: "12px" }}>Demandé par le compte : {c.claimant_bibro_code || "(inconnu)"}</p>

                {c.status === "rejected" && c.rejection_reason && <p style={{ fontSize: "12.5px", color: "#FF3B4E", marginBottom: "10px" }}>Refusée : {c.rejection_reason}</p>}

                {tab === "pending" && (
                  <>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <select
                        value={selectedBusinessFor[c.id] || ""}
                        onChange={(e) => setSelectedBusinessFor((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        style={{ ...fieldStyle, flex: 1 }}
                      >
                        <option value="">— Lier à un compte Business existant —</option>
                        {businessAccounts.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.company_name || `${b.name} ${b.last_name}`} ({b.email})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleLinkExisting(c)}
                        disabled={!selectedBusinessFor[c.id] || busyId === c.id}
                        style={{ background: "#00C8FF", border: "none", borderRadius: "8px", padding: "9px 14px", fontWeight: 700, fontSize: "12.5px", color: "#0D1B2A", cursor: "pointer", opacity: !selectedBusinessFor[c.id] || busyId === c.id ? 0.5 : 1 }}
                      >
                        Lier
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => setCreatingNewFor(creatingNewFor === c.id ? null : c.id)}
                        style={{ flex: 1, background: "none", border: "2px solid #39FF66", borderRadius: "8px", padding: "9px", fontWeight: 700, fontSize: "12.5px", color: "#39FF66", cursor: "pointer" }}
                      >
                        {creatingNewFor === c.id ? "Annuler" : "Créer un nouveau compte Business"}
                      </button>
                      <button
                        onClick={() => handleReject(c)}
                        disabled={busyId === c.id}
                        style={{ flex: 1, background: "none", border: "2px solid #FF3B4E", borderRadius: "8px", padding: "9px", fontWeight: 700, fontSize: "12.5px", color: "#FF3B4E", cursor: "pointer" }}
                      >
                        Refuser
                      </button>
                    </div>

                    {creatingNewFor === c.id && (
                      <NewBusinessForm
                        claim={c}
                        onCreated={() => {
                          setCreatingNewFor(null);
                          refresh();
                          loadBusinessAccounts().then(setBusinessAccounts);
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
