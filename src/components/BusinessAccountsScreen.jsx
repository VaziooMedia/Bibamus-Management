import React, { useState, useEffect } from "react";
import { loadBusinessAccountsFull, updateBusinessAccount } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES } from "../constants.js";

const LANGUAGE_OPTIONS = [
  { code: "fr", label: "Français" },
  { code: "nl", label: "Néerlandais" },
  { code: "en", label: "Anglais" },
  { code: "de", label: "Allemand" },
];

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%", color: "#F2F2E8", background: "#0D1B2A", boxSizing: "border-box" };
const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };
const sectionTitleStyle = { fontSize: "12px", color: "#39FF66", fontWeight: 700, textTransform: "uppercase", margin: "18px 0 8px", paddingTop: "14px", borderTop: "1px solid #28405C" };

function BusinessDetailPanel({ account, onClose, onSaved }) {
  const [firstName, setFirstName] = useState(account.name || "");
  const [lastName, setLastName] = useState(account.last_name || "");
  const [companyName, setCompanyName] = useState(account.company_name || "");
  const [vatNumber, setVatNumber] = useState(account.vat_number || "");
  const [companyEmail, setCompanyEmail] = useState(account.company_email || "");
  const [companyPhone, setCompanyPhone] = useState(account.company_phone || "");
  const [companyStreet, setCompanyStreet] = useState(account.company_street || "");
  const [companyStreetNumber, setCompanyStreetNumber] = useState(account.company_street_number || "");
  const [companyAddressLine2, setCompanyAddressLine2] = useState(account.company_address_line2 || "");
  const [companyPostalCode, setCompanyPostalCode] = useState(account.company_postal_code || "");
  const [companyCity, setCompanyCity] = useState(account.company_city || "");
  const [companyCountry, setCompanyCountry] = useState(account.company_country || "");
  const [contactFunction, setContactFunction] = useState(account.contact_function || "");
  const [contactEmail, setContactEmail] = useState(account.contact_email || "");
  const [contactPhone, setContactPhone] = useState(account.contact_phone || "");
  const [contactLanguages, setContactLanguages] = useState(account.contact_languages ? account.contact_languages.split(",").filter(Boolean) : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const toggleLanguage = (code) => setContactLanguages((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await updateBusinessAccount(account.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
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
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", zIndex: 50, overflowY: "auto" }}>
      <div style={{ background: "#16273D", borderRadius: "14px", padding: "28px", width: "480px", maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", color: "#F2F2E8", margin: 0 }}>Fiche Business</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <p style={{ ...labelStyle, marginBottom: "16px" }}>Compte : {account.email}</p>

        <p style={{ ...sectionTitleStyle, marginTop: 0, paddingTop: 0, borderTop: "none" }}>Société</p>
        <label style={labelStyle}>Nom de la société</label>
        <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Numéro d'entreprise</label>
        <input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Email</label>
        <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Téléphone</label>
        <input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />

        <label style={labelStyle}>Siège social</label>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input value={companyStreet} onChange={(e) => setCompanyStreet(e.target.value)} placeholder="Adresse" style={{ ...fieldStyle, flex: 3 }} />
          <input value={companyStreetNumber} onChange={(e) => setCompanyStreetNumber(e.target.value)} placeholder="Numéro" style={{ ...fieldStyle, flex: 1 }} />
        </div>
        <input value={companyAddressLine2} onChange={(e) => setCompanyAddressLine2(e.target.value)} placeholder="Complément d'adresse" style={{ ...fieldStyle, marginBottom: "8px" }} />
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input value={companyPostalCode} onChange={(e) => setCompanyPostalCode(e.target.value)} placeholder="Code postal" style={{ ...fieldStyle, flex: 1 }} />
          <input value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} placeholder="Ville" style={{ ...fieldStyle, flex: 2 }} />
        </div>
        <select value={companyCountry} onChange={(e) => setCompanyCountry(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }}>
          <option value="">Pays —</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.fr}
            </option>
          ))}
        </select>

        <p style={sectionTitleStyle}>Personne de contact</p>
        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Prénom</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={fieldStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Nom</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={fieldStyle} />
          </div>
        </div>
        <label style={labelStyle}>Fonction</label>
        <input value={contactFunction} onChange={(e) => setContactFunction(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Email Pro</label>
        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Téléphone</label>
        <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Langue(s) parlée(s)</label>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
          {LANGUAGE_OPTIONS.map((l) => {
            const selected = contactLanguages.includes(l.code);
            return (
              <button
                key={l.code}
                onClick={() => toggleLanguage(l.code)}
                style={{
                  padding: "7px 13px",
                  borderRadius: "8px",
                  border: `2px solid ${selected ? "#39FF66" : "#28405C"}`,
                  background: selected ? "#39FF66" : "none",
                  color: selected ? "#0D1B2A" : "#F2F2E8",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  cursor: "pointer",
                }}
              >
                {l.label}
              </button>
            );
          })}
        </div>

        {error && <p style={{ color: "#FF3B4E", fontSize: "12.5px", marginBottom: "12px" }}>{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: "100%", background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

export function BusinessAccountsScreen() {
  const [accounts, setAccounts] = useState(null);
  const [selected, setSelected] = useState(null);

  const refresh = () => loadBusinessAccountsFull().then(setAccounts);
  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <PageTitle>Comptes Business</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>Comptes créés suite à une revendication approuvée — société, contact, coordonnées.</p>

      {!accounts ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : accounts.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucun compte Business pour l'instant.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "560px" }}>
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              style={{
                background: "#16273D",
                border: "none",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: "14.5px", color: "#F2F2E8", fontWeight: 700 }}>{a.company_name || "(société non renseignée)"}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#8792A6" }}>
                  {a.name} {a.last_name} · {a.email}
                </p>
              </div>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: a.active !== false ? "#39FF66" : "#FF3B4E", flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}

      {selected && (
        <BusinessDetailPanel
          account={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
