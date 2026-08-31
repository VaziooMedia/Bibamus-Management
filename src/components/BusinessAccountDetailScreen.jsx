import React, { useState, useEffect } from "react";
import { loadBusinessAccountById, updateBusinessAccount, loadMyBusinessEntities } from "../data/sharedDirectories.js";
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
const sectionTitleStyle = { fontSize: "12px", color: "#39FF66", fontWeight: 700, textTransform: "uppercase", margin: "24px 0 10px", paddingTop: "18px", borderTop: "1px solid #28405C" };

function ReadRow({ label, value }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <p style={{ ...labelStyle, marginBottom: "2px" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "14px", color: value ? "#F2F2E8" : "#8792A6" }}>{value || "—"}</p>
    </div>
  );
}

const countryLabel = (code) => COUNTRIES.find((c) => c.code === code)?.fr || code;

export function BusinessAccountDetailScreen({ accountId, onBack }) {
  const [account, setAccount] = useState(null);
  const [entities, setEntities] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const refresh = () => {
    loadBusinessAccountById(accountId).then((a) => {
      setAccount(a);
      setForm(null);
    });
    loadMyBusinessEntities(accountId).then(setEntities);
  };
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const startEdit = () => {
    setForm({
      firstName: account.name || "",
      lastName: account.last_name || "",
      businessLabel: account.business_label || "",
      businessStatus: account.business_status || "",
      companyName: account.company_name || "",
      vatNumber: account.vat_number || "",
      companyEmail: account.company_email || "",
      companyPhone: account.company_phone || "",
      companyStreet: account.company_street || "",
      companyStreetNumber: account.company_street_number || "",
      companyAddressLine2: account.company_address_line2 || "",
      companyPostalCode: account.company_postal_code || "",
      companyCity: account.company_city || "",
      companyCountry: account.company_country || "",
      contactFunction: account.contact_function || "",
      contactEmail: account.contact_email || "",
      contactPhone: account.contact_phone || "",
      contactLanguages: account.contact_languages ? account.contact_languages.split(",").filter(Boolean) : [],
    });
    setEditing(true);
  };

  const toggleLanguage = (code) =>
    setForm((prev) => ({ ...prev, contactLanguages: prev.contactLanguages.includes(code) ? prev.contactLanguages.filter((c) => c !== code) : [...prev.contactLanguages, code] }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await updateBusinessAccount(accountId, { ...form, contactLanguages: form.contactLanguages.join(",") });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    refresh();
  };

  if (!account) return <p style={{ color: "#8792A6" }}>Chargement...</p>;

  const languages = account.contact_languages ? account.contact_languages.split(",").filter(Boolean).map((c) => LANGUAGE_OPTIONS.find((l) => l.code === c)?.label || c) : [];
  const addressParts = [
    [account.company_street, account.company_street_number].filter(Boolean).join(" "),
    account.company_address_line2,
    [account.company_postal_code, account.company_city].filter(Boolean).join(" "),
    account.company_country ? countryLabel(account.company_country) : null,
  ].filter(Boolean);

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#39FF66", fontSize: "13px", fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: "16px" }}>
        ← Comptes Business
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <PageTitle>{account.company_name || "(société non renseignée)"}</PageTitle>
        {!editing && (
          <button
            onClick={startEdit}
            style={{ background: "none", border: "2px solid #39FF66", borderRadius: "8px", padding: "8px 16px", fontWeight: 700, fontSize: "12.5px", color: "#39FF66", cursor: "pointer" }}
          >
            Modifier
          </button>
        )}
      </div>
      {account.business_label && <p style={{ fontSize: "13px", color: "#8792A6", marginBottom: "24px" }}>{account.business_label}</p>}

      {!editing ? (
        <div style={{ maxWidth: "560px" }}>
          <div style={{ ...sectionTitleStyle, marginTop: 0, paddingTop: 0, borderTop: "none" }}>Aperçu</div>
          <ReadRow label="Étiquette" value={account.business_label} />
          <ReadRow label="Statut" value={account.business_status} />
          <ReadRow label="État" value={account.active !== false ? "Actif" : "Bloqué"} />
          <ReadRow label="Email de connexion" value={account.email} />

          <p style={sectionTitleStyle}>Société</p>
          <ReadRow label="Nom de la société" value={account.company_name} />
          <ReadRow label="Numéro d'entreprise" value={account.vat_number} />
          <ReadRow label="Email" value={account.company_email} />
          <ReadRow label="Téléphone" value={account.company_phone} />
          <ReadRow label="Siège social" value={addressParts.length > 0 ? addressParts.join(", ") : null} />

          <p style={sectionTitleStyle}>Personne de contact</p>
          <ReadRow label="Nom" value={[account.name, account.last_name].filter(Boolean).join(" ")} />
          <ReadRow label="Fonction" value={account.contact_function} />
          <ReadRow label="Email Pro" value={account.contact_email} />
          <ReadRow label="Téléphone" value={account.contact_phone} />
          <ReadRow label="Langue(s) parlée(s)" value={languages.length > 0 ? languages.join(", ") : null} />

          <p style={sectionTitleStyle}>Fiches liées</p>
          {!entities ? (
            <p style={{ color: "#8792A6", fontSize: "13px" }}>Chargement...</p>
          ) : entities.length === 0 ? (
            <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucune fiche liée pour l'instant.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {entities.map((e) => (
                <div key={`${e.entityType}-${e.id}`} style={{ background: "#16273D", borderRadius: "8px", padding: "10px 14px" }}>
                  <span style={{ fontSize: "11px", color: "#8792A6", textTransform: "uppercase", fontWeight: 700 }}>{e.entityTypeLabel}</span>
                  <p style={{ margin: "2px 0 0", fontSize: "13.5px", color: "#F2F2E8", fontWeight: 700 }}>{e.name}</p>
                </div>
              ))}
            </div>
          )}

          <p style={sectionTitleStyle}>À venir</p>
          <p style={{ fontSize: "13px", color: "#8792A6" }}>Comptabilité (en cas de Business payant), projets publicitaires, et autres informations — chantiers séparés à construire plus tard.</p>
        </div>
      ) : (
        <div style={{ maxWidth: "480px" }}>
          <p style={{ ...sectionTitleStyle, marginTop: 0, paddingTop: 0, borderTop: "none" }}>Identification</p>
          <label style={labelStyle}>Étiquette personnalisable</label>
          <input value={form.businessLabel} onChange={(e) => setForm({ ...form, businessLabel: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />
          <label style={labelStyle}>Statut</label>
          <input value={form.businessStatus} onChange={(e) => setForm({ ...form, businessStatus: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />

          <p style={sectionTitleStyle}>Société</p>
          <label style={labelStyle}>Nom de la société</label>
          <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />
          <label style={labelStyle}>Numéro d'entreprise</label>
          <input value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />
          <label style={labelStyle}>Email</label>
          <input type="email" value={form.companyEmail} onChange={(e) => setForm({ ...form, companyEmail: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />
          <label style={labelStyle}>Téléphone</label>
          <input value={form.companyPhone} onChange={(e) => setForm({ ...form, companyPhone: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />

          <label style={labelStyle}>Siège social</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input value={form.companyStreet} onChange={(e) => setForm({ ...form, companyStreet: e.target.value })} placeholder="Adresse" style={{ ...fieldStyle, flex: 3 }} />
            <input value={form.companyStreetNumber} onChange={(e) => setForm({ ...form, companyStreetNumber: e.target.value })} placeholder="Numéro" style={{ ...fieldStyle, flex: 1 }} />
          </div>
          <input
            value={form.companyAddressLine2}
            onChange={(e) => setForm({ ...form, companyAddressLine2: e.target.value })}
            placeholder="Complément d'adresse"
            style={{ ...fieldStyle, marginBottom: "8px" }}
          />
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input value={form.companyPostalCode} onChange={(e) => setForm({ ...form, companyPostalCode: e.target.value })} placeholder="Code postal" style={{ ...fieldStyle, flex: 1 }} />
            <input value={form.companyCity} onChange={(e) => setForm({ ...form, companyCity: e.target.value })} placeholder="Ville" style={{ ...fieldStyle, flex: 2 }} />
          </div>
          <select value={form.companyCountry} onChange={(e) => setForm({ ...form, companyCountry: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }}>
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
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={fieldStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Nom</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={fieldStyle} />
            </div>
          </div>
          <label style={labelStyle}>Fonction</label>
          <input value={form.contactFunction} onChange={(e) => setForm({ ...form, contactFunction: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />
          <label style={labelStyle}>Email Pro</label>
          <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />
          <label style={labelStyle}>Téléphone</label>
          <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />
          <label style={labelStyle}>Langue(s) parlée(s)</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
            {LANGUAGE_OPTIONS.map((l) => {
              const selected = form.contactLanguages.includes(l.code);
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
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setEditing(false)}
              style={{ flex: 1, background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "12px", color: "#F2F2E8", cursor: "pointer" }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 1, background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
