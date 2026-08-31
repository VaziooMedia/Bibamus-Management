import React, { useState, useEffect } from "react";
import { loadClaims, loadBusinessAccounts, approveClaim, rejectClaim, createCollaborator } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES } from "../constants.js";

const ENTITY_TYPE_LABELS = { venue: "Établissement", drink: "Produit", brand: "Marque", producer: "Producteur" };

const TABS = [
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Approuvées" },
  { key: "rejected", label: "Refusées" },
];

const LANGUAGE_OPTIONS = [
  { code: "fr", label: "Français" },
  { code: "nl", label: "Néerlandais" },
  { code: "en", label: "Anglais" },
  { code: "de", label: "Allemand" },
];

const fieldStyle = { padding: "9px 10px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13px", width: "100%", color: "#F2F2E8", background: "#0D1B2A", boxSizing: "border-box" };
const labelStyle = { fontSize: "11.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };
const sectionTitleStyle = { fontSize: "11px", color: "#39FF66", fontWeight: 700, textTransform: "uppercase", margin: "14px 0 6px", paddingTop: "10px", borderTop: "1px solid #28405C" };

function EyeIcon({ crossed }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="#8792A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="#8792A6" strokeWidth="1.8" />
      {crossed && <line x1="2" y1="2" x2="22" y2="22" stroke="#8792A6" strokeWidth="1.8" strokeLinecap="round" />}
    </svg>
  );
}

// Formulaire de création d'un nouveau compte Business, affiché en ligne sous une revendication
// lorsque l'admin choisit de ne pas lier à un compte déjà existant. 3 sections : société,
// personne de contact, et le compte de connexion lui-même (3 adresses email possibles, qui
// peuvent être identiques pour un petit indépendant ou distinctes pour une grande entreprise).
function NewBusinessForm({ claim, onCreated }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [companyName, setCompanyName] = useState(claim.company_name || "");
  const [vatNumber, setVatNumber] = useState(claim.vat_number || "");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyStreet, setCompanyStreet] = useState("");
  const [companyStreetNumber, setCompanyStreetNumber] = useState("");
  const [companyAddressLine2, setCompanyAddressLine2] = useState("");
  const [companyPostalCode, setCompanyPostalCode] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyCountry, setCompanyCountry] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactFunction, setContactFunction] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactLanguages, setContactLanguages] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const toggleLanguage = (code) => setContactLanguages((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const canSave = loginEmail.trim() && password.trim().length >= 6 && firstName.trim() && lastName.trim() && companyName.trim();

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    const result = await createCollaborator(loginEmail.trim(), password, firstName.trim(), lastName.trim(), null, "business", false, {
      companyName: companyName.trim(),
      vatNumber: vatNumber.trim(),
      companyEmail: companyEmail.trim(),
      companyPhone: companyPhone.trim(),
      companyStreet: companyStreet.trim(),
      companyStreetNumber: companyStreetNumber.trim(),
      companyAddressLine2: companyAddressLine2.trim(),
      companyPostalCode: companyPostalCode.trim(),
      companyCity: companyCity.trim(),
      companyCountry,
      contactFunction: contactFunction.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      contactLanguages: contactLanguages.join(","),
    });
    if (result.error) {
      setSaving(false);
      setError(result.error);
      return;
    }
    const linkResult = await approveClaim(claim.id, claim.entity_type, claim.entity_id, result.userId, claim.entity_name);
    setSaving(false);
    if (linkResult.error) {
      setError("Compte créé, mais la liaison a échoué : " + linkResult.error);
      return;
    }
    onCreated();
  };

  return (
    <div style={{ marginTop: "10px", padding: "12px", background: "#0D1B2A", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <p style={{ ...sectionTitleStyle, marginTop: 0, paddingTop: 0, borderTop: "none" }}>Société</p>
      <label style={labelStyle}>Nom de la société *</label>
      <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={fieldStyle} />
      <label style={labelStyle}>Numéro d'entreprise</label>
      <input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} style={fieldStyle} />
      <label style={labelStyle}>Email</label>
      <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} style={fieldStyle} />
      <label style={labelStyle}>Téléphone</label>
      <input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} style={fieldStyle} />

      <label style={labelStyle}>Siège social</label>
      <div style={{ display: "flex", gap: "8px" }}>
        <input value={companyStreet} onChange={(e) => setCompanyStreet(e.target.value)} placeholder="Adresse" style={{ ...fieldStyle, flex: 3 }} />
        <input value={companyStreetNumber} onChange={(e) => setCompanyStreetNumber(e.target.value)} placeholder="Numéro" style={{ ...fieldStyle, flex: 1 }} />
      </div>
      <input value={companyAddressLine2} onChange={(e) => setCompanyAddressLine2(e.target.value)} placeholder="Complément d'adresse" style={fieldStyle} />
      <div style={{ display: "flex", gap: "8px" }}>
        <input value={companyPostalCode} onChange={(e) => setCompanyPostalCode(e.target.value)} placeholder="Code postal" style={{ ...fieldStyle, flex: 1 }} />
        <input value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} placeholder="Ville" style={{ ...fieldStyle, flex: 2 }} />
      </div>
      <select value={companyCountry} onChange={(e) => setCompanyCountry(e.target.value)} style={fieldStyle}>
        <option value="">Pays —</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.fr}
          </option>
        ))}
      </select>

      <p style={sectionTitleStyle}>Personne de contact</p>
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Prénom *</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={fieldStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Nom *</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={fieldStyle} />
        </div>
      </div>
      <label style={labelStyle}>Fonction</label>
      <input value={contactFunction} onChange={(e) => setContactFunction(e.target.value)} style={fieldStyle} />
      <label style={labelStyle}>Email Pro</label>
      <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={fieldStyle} />
      <label style={labelStyle}>Téléphone</label>
      <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} style={fieldStyle} />
      <label style={labelStyle}>Langue(s) parlée(s)</label>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
        {LANGUAGE_OPTIONS.map((l) => {
          const selected = contactLanguages.includes(l.code);
          return (
            <button
              key={l.code}
              onClick={() => toggleLanguage(l.code)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: `2px solid ${selected ? "#39FF66" : "#28405C"}`,
                background: selected ? "#39FF66" : "none",
                color: selected ? "#0D1B2A" : "#F2F2E8",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {l.label}
            </button>
          );
        })}
      </div>

      <p style={sectionTitleStyle}>Compte (identifiants de connexion)</p>
      <p style={{ fontSize: "11.5px", color: "#8792A6", margin: "0 0 4px" }}>
        Doit être différente de l'adresse email du compte personnel ayant fait la revendication. Peut être la même que les emails ci-dessus, ou différente selon la taille de l'entreprise.
      </p>
      <label style={labelStyle}>Email de connexion *</label>
      <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={fieldStyle} />
      <label style={labelStyle}>Mot de passe provisoire *</label>
      <div style={{ position: "relative" }}>
        <input type={passwordVisible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...fieldStyle, paddingRight: "38px" }} />
        <button
          type="button"
          onClick={() => setPasswordVisible((v) => !v)}
          style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}
        >
          <EyeIcon crossed={passwordVisible} />
        </button>
      </div>

      {error && <p style={{ color: "#FF3B4E", fontSize: "12px", margin: 0 }}>{error}</p>}
      <button
        onClick={handleCreate}
        disabled={!canSave || saving}
        style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "9px", fontWeight: 700, fontSize: "12.5px", color: "#0D1B2A", cursor: "pointer", opacity: !canSave || saving ? 0.5 : 1, marginTop: "6px" }}
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
    const result = await approveClaim(claim.id, claim.entity_type, claim.entity_id, businessId, claim.entity_name);
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
                <p style={{ fontSize: "11px", color: "#8792A6", marginBottom: "12px" }}>
                  Demandé par : {c.claimant ? `${c.claimant.name || ""} ${c.claimant.last_name || ""}`.trim() : "(compte inconnu)"}
                  {c.claimant?.email ? ` — ${c.claimant.email}` : ""}
                </p>

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
