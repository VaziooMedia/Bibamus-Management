import React, { useState, useEffect } from "react";
import { loadBusinessAccountById, updateBusinessAccount, loadMyBusinessEntities, unlinkEntityFromBusiness, linkEntityToBusiness, searchEntitiesByName, loadOrganizationForProfile } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES } from "../constants.js";
import { CountryFlagImg } from "./icons.jsx";

const LANGUAGE_OPTIONS = [
  { code: "fr", label: "Français" },
  { code: "nl", label: "Néerlandais" },
  { code: "en", label: "Anglais" },
  { code: "de", label: "Allemand" },
];

// Vrai code ISO (pour le vrai drapeau) de chaque vrai slug de COUNTRIES qui a réellement un
// drapeau importé côté plateforme de gestion — les 2 seuls pays sans correspondance
// (Nouvelle-Zélande, International) n'affichent simplement aucun drapeau.
const COUNTRY_ISO_BY_SLUG = {
  belgique: "be",
  france: "fr",
  pays_bas: "nl",
  allemagne: "de",
  luxembourg: "lu",
  algerie: "dz",
  autriche: "at",
  bulgarie: "bg",
  canada: "ca",
  chypre: "cy",
  cote_d_ivoire: "ci",
  croatie: "hr",
  cuba: "cu",
  danemark: "dk",
  espagne: "es",
  estonie: "ee",
  etats_unis: "us",
  finlande: "fi",
  grece: "gr",
  hongrie: "hu",
  irlande: "ie",
  islande: "is",
  italie: "it",
  lettonie: "lv",
  lituanie: "lt",
  malte: "mt",
  maroc: "ma",
  mexique: "mx",
  norvege: "no",
  pologne: "pl",
  portugal: "pt",
  republique_tcheque: "cz",
  roumanie: "ro",
  royaume_uni: "gb",
  senegal: "sn",
  slovaquie: "sk",
  slovenie: "si",
  suede: "se",
  suisse: "ch",
  tunisie: "tn",
  venezuela: "ve",
};

// Vrai préfixe téléphonique international (pas le code ISO à 2 lettres) — pour les vrais
// champs Téléphone spécifiquement, indexé par le vrai code ISO déjà résolu ci-dessus.
const CALLING_CODE_BY_ISO = {
  be: "+32",
  fr: "+33",
  nl: "+31",
  de: "+49",
  lu: "+352",
  dz: "+213",
  at: "+43",
  bg: "+359",
  ca: "+1",
  cy: "+357",
  ci: "+225",
  hr: "+385",
  cu: "+53",
  dk: "+45",
  es: "+34",
  ee: "+372",
  us: "+1",
  fi: "+358",
  gr: "+30",
  hu: "+36",
  ie: "+353",
  is: "+354",
  it: "+39",
  lv: "+371",
  lt: "+370",
  mt: "+356",
  ma: "+212",
  mx: "+52",
  no: "+47",
  pl: "+48",
  pt: "+351",
  cz: "+420",
  ro: "+40",
  gb: "+44",
  sn: "+221",
  sk: "+421",
  si: "+386",
  se: "+46",
  ch: "+41",
  tn: "+216",
  ve: "+58",
};

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%", color: "#F2F2E8", background: "#0D1B2A", boxSizing: "border-box" };
const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };

function SectionTitle({ children, first }) {
  return (
    <p style={{ fontSize: "12px", color: "#39FF66", fontWeight: 700, textTransform: "uppercase", margin: first ? "0 0 10px" : "24px 0 10px", paddingTop: first ? 0 : "18px", borderTop: first ? "none" : "1px solid #28405C" }}>
      {children}
    </p>
  );
}

// Vraie petite barre verte devant chaque vrai sous-sous-titre (les vrais labels de champ), pas
// devant les vrais titres de section eux-mêmes.
function Label({ children }) {
  return (
    <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ width: "3px", height: "10px", borderRadius: "2px", background: "#39FF66", flexShrink: 0 }} />
      {children}
    </label>
  );
}

// Vrai mini préfixe pays compact (drapeau + code), collé devant un vrai champ — même vrai
// principe que côté app web (revendication d'une fiche) : un vrai menu déroulant personnalisé,
// vu qu'un select natif ne peut pas afficher de vrai drapeau dans ses options.
function CountryPrefix({ value, onChange, fullName, calling }) {
  const [open, setOpen] = useState(false);
  const iso = COUNTRY_ISO_BY_SLUG[value];
  const label = fullName ? countryLabel(value) || "Pays —" : calling ? CALLING_CODE_BY_ISO[iso] || "—" : iso ? iso.toUpperCase() : "—";
  return (
    <div style={{ position: "relative", flexShrink: 0, width: fullName ? "100%" : "auto" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          height: "100%",
          width: fullName ? "100%" : "auto",
          padding: "10px 8px",
          borderRadius: "8px",
          border: "2px solid #28405C",
          fontSize: "13px",
          color: "#F2F2E8",
          background: "#0D1B2A",
          boxSizing: "border-box",
          cursor: "pointer",
        }}
      >
        {iso ? <CountryFlagImg isoCode={iso} size={15} /> : null}
        {label}
        <span style={{ color: "#8792A6", fontSize: "10px", marginLeft: fullName ? "auto" : 0 }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "190px",
            maxHeight: "220px",
            overflowY: "auto",
            background: "#16273D",
            border: "2px solid #28405C",
            borderRadius: "8px",
            zIndex: 20,
          }}
        >
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onChange(c.code);
                setOpen(false);
              }}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px", background: "none", border: "none", fontSize: "13px", color: "#F2F2E8", cursor: "pointer", textAlign: "left", whiteSpace: "nowrap" }}
            >
              {COUNTRY_ISO_BY_SLUG[c.code] ? <CountryFlagImg isoCode={COUNTRY_ISO_BY_SLUG[c.code]} size={14} /> : <span style={{ width: "14px" }} />}
              {c.fr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ENTITY_TYPE_OPTIONS = [
  { key: "venue", label: "Établissement" },
  { key: "drink", label: "Produit" },
  { key: "brand", label: "Marque" },
  { key: "producer", label: "Producteur" },
];

function ReadRow({ label, value, email }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <p style={{ ...labelStyle, marginBottom: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "3px", height: "10px", borderRadius: "2px", background: "#39FF66", flexShrink: 0 }} />
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "14px", color: value ? "#F2F2E8" : "#8792A6", display: "flex", alignItems: "center", gap: "8px" }}>
        {value || "—"}
        {email && value && (
          <a href={`mailto:${value}`} title={value} style={{ display: "inline-flex" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#39FF66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m2 7 10 6 10-6" />
            </svg>
          </a>
        )}
      </p>
    </div>
  );
}

// Vraie liste (une vraie ligne par élément, vrai tiret blanc devant) plutôt qu'une vraie
// concaténation par virgules — pour les vraies langues parlées et les vraies fiches liées.
function ReadRowList({ label, items }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <p style={{ ...labelStyle, marginBottom: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "3px", height: "10px", borderRadius: "2px", background: "#39FF66", flexShrink: 0 }} />
        {label}
      </p>
      {!items || items.length === 0 ? (
        <p style={{ margin: 0, fontSize: "14px", color: "#8792A6" }}>—</p>
      ) : (
        <div style={{ fontSize: "14px", color: "#F2F2E8" }}>
          {items.map((item, i) => (
            <p key={i} style={{ margin: 0, display: "flex", gap: "6px" }}>
              <span style={{ color: "#F2F2E8" }}>-</span>
              {item}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Même vrai préfixe (drapeau + code pays) que celui posé dans la page d'édition, devant le
// numéro d'entreprise et le téléphone de la société.
function ReadRowWithFlag({ label, countryCode, value, calling }) {
  const iso = COUNTRY_ISO_BY_SLUG[countryCode];
  const prefixLabel = calling ? CALLING_CODE_BY_ISO[iso] : iso ? iso.toUpperCase() : null;
  return (
    <div style={{ marginBottom: "12px" }}>
      <p style={{ ...labelStyle, marginBottom: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "3px", height: "10px", borderRadius: "2px", background: "#39FF66", flexShrink: 0 }} />
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "14px", color: value ? "#F2F2E8" : "#8792A6", display: "flex", alignItems: "center", gap: "6px" }}>
        {value ? (
          <>
            {iso && <CountryFlagImg isoCode={iso} size={14} />}
            {prefixLabel && <span style={{ color: "#8792A6" }}>{prefixLabel}</span>}
            {value}
          </>
        ) : (
          "—"
        )}
      </p>
    </div>
  );
}

// Vraie adresse du siège social sur 3 vraies lignes : rue+numéro, code postal+ville, drapeau+
// pays — plutôt qu'un vrai ReadRow générique à une vraie seule ligne concaténée.
function ReadRowAddress({ account }) {
  const iso = COUNTRY_ISO_BY_SLUG[account.company_country];
  const line1 = [account.company_street, account.company_street_number].filter(Boolean).join(", ");
  const line2 = [account.company_postal_code, account.company_city].filter(Boolean).join(" ");
  const hasAny = line1 || account.company_address_line2 || line2 || account.company_country;
  return (
    <div style={{ marginBottom: "12px" }}>
      <p style={{ ...labelStyle, marginBottom: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "3px", height: "10px", borderRadius: "2px", background: "#39FF66", flexShrink: 0 }} />
        Siège social
      </p>
      {!hasAny ? (
        <p style={{ margin: 0, fontSize: "14px", color: "#8792A6" }}>—</p>
      ) : (
        <div style={{ fontSize: "14px", color: "#F2F2E8" }}>
          {line1 && <p style={{ margin: 0 }}>{line1}</p>}
          {account.company_address_line2 && <p style={{ margin: 0 }}>{account.company_address_line2}</p>}
          {line2 && <p style={{ margin: 0 }}>{line2}</p>}
          {account.company_country && (
            <p style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              {iso && <CountryFlagImg isoCode={iso} size={14} />}
              {countryLabel(account.company_country)}
            </p>
          )}
        </div>
      )}
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
  const [addingEntity, setAddingEntity] = useState(false);
  const [searchType, setSearchType] = useState("venue");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [linkBusy, setLinkBusy] = useState(false);
  const [orgInfo, setOrgInfo] = useState(null);

  const refresh = () => {
    loadBusinessAccountById(accountId).then((a) => {
      setAccount(a);
      setForm(null);
    });
    loadMyBusinessEntities(accountId).then(setEntities);
    loadOrganizationForProfile(accountId).then(setOrgInfo);
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
      active: account.active !== false,
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

  const handleUnlink = async (entity) => {
    if (!confirm(`Délier "${entity.name}" de ce compte Business ?`)) return;
    setLinkBusy(true);
    await unlinkEntityFromBusiness(entity.entityType, entity.id, entity.name);
    setLinkBusy(false);
    refresh();
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const results = await searchEntitiesByName(searchType, query);
    setSearchResults(results);
  };

  const handleLink = async (entity) => {
    setLinkBusy(true);
    await linkEntityToBusiness(searchType, entity.id, accountId, entity.name);
    setLinkBusy(false);
    setAddingEntity(false);
    setSearchQuery("");
    setSearchResults([]);
    refresh();
  };

  if (!account) return <p style={{ color: "#8792A6" }}>Chargement...</p>;

  const languages = account.contact_languages ? account.contact_languages.split(",").filter(Boolean).map((c) => LANGUAGE_OPTIONS.find((l) => l.code === c)?.label || c) : [];

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
      <div style={{ height: "1px", background: "#28405C", margin: "20px 0" }} />

      {!editing ? (
        <div style={{ maxWidth: "900px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px", marginBottom: "24px" }}>
            <div>
              <SectionTitle first>Aperçu</SectionTitle>
              <ReadRow label="État" value={account.active !== false ? "Actif" : "Non actif"} />
              <ReadRow label="Email de connexion" value={account.email} />
              <ReadRow label="Plan" value={orgInfo?.subscription ? `${orgInfo.subscription.plan === "pro" ? "Pro" : "Gratuit"} (${orgInfo.subscription.status === "active" ? "actif" : orgInfo.subscription.status})` : null} />
              <ReadRowList
                label={
                  <>
                    Fiches liées <span style={{ color: "#8792A6" }}>(</span>
                    <span style={{ color: "#39FF66" }}>{entities ? entities.length : 0}</span>
                    <span style={{ color: "#8792A6" }}>)</span>
                  </>
                }
                items={entities ? entities.map((e) => `${e.name} (${e.entityTypeLabel})`) : []}
              />
            </div>

            <div style={{ borderLeft: "1px solid #28405C", paddingLeft: "32px" }}>
              <SectionTitle first>Société</SectionTitle>
              <ReadRow label="Dénomination" value={account.company_name} />
              <ReadRowWithFlag label="Numéro d'entreprise" countryCode={account.company_country} value={account.vat_number} />
              <ReadRow label="Email" value={account.company_email} email />
              <ReadRowWithFlag label="Téléphone" countryCode={account.company_country} value={account.company_phone} calling />
              <ReadRowAddress account={account} />
            </div>

            <div style={{ borderLeft: "1px solid #28405C", paddingLeft: "32px" }}>
              <SectionTitle first>Personne de contact</SectionTitle>
              <ReadRow label="Prénom / Nom" value={[account.name, account.last_name].filter(Boolean).join(" ")} />
              <ReadRow label="Fonction" value={account.contact_function} />
              <ReadRow label="Email Pro" value={account.contact_email} email />
              <ReadRowWithFlag label="Téléphone" countryCode={account.company_country} value={account.contact_phone} calling />
              <ReadRowList label="Langue(s) parlée(s)" items={languages} />
            </div>
          </div>

          <SectionTitle>
            Fiches liées <span style={{ color: "#8792A6" }}>( </span>
            <span style={{ color: "#39FF66" }}>{entities ? entities.length : 0}</span>
            <span style={{ color: "#8792A6" }}> )</span>
          </SectionTitle>
          {!entities ? (
            <p style={{ color: "#8792A6", fontSize: "13px" }}>Chargement...</p>
          ) : entities.length === 0 ? (
            <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucune fiche liée pour l'instant.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px", maxWidth: "400px" }}>
              {entities.map((e) => (
                <div key={`${e.entityType}-${e.id}`} style={{ background: "#16273D", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#8792A6", textTransform: "uppercase", fontWeight: 700 }}>{e.entityTypeLabel}</span>
                    <p style={{ margin: "2px 0 0", fontSize: "13.5px", color: "#F2F2E8", fontWeight: 700 }}>{e.name}</p>
                  </div>
                  <button
                    onClick={() => handleUnlink(e)}
                    disabled={linkBusy}
                    style={{ background: "none", border: "2px solid #FF3B4E", borderRadius: "6px", padding: "6px 12px", fontWeight: 700, fontSize: "11.5px", color: "#FF3B4E", cursor: "pointer" }}
                  >
                    Délier
                  </button>
                </div>
              ))}
            </div>
          )}

          {!addingEntity ? (
            <button
              onClick={() => setAddingEntity(true)}
              style={{ background: "none", border: "2px solid #39FF66", borderRadius: "8px", padding: "9px 16px", fontWeight: 700, fontSize: "12.5px", color: "#39FF66", cursor: "pointer" }}
            >
              + Lier une fiche
            </button>
          ) : (
            <div style={{ background: "#16273D", borderRadius: "10px", padding: "14px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                {ENTITY_TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      setSearchType(t.key);
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: `2px solid ${searchType === t.key ? "#39FF66" : "#28405C"}`,
                      background: searchType === t.key ? "#39FF66" : "none",
                      color: searchType === t.key ? "#0D1B2A" : "#F2F2E8",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Rechercher par nom..."
                autoFocus
                style={{ ...fieldStyle, marginBottom: "8px" }}
              />
              {searchResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}>
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleLink(r)}
                      disabled={linkBusy}
                      style={{ textAlign: "left", padding: "9px 12px", borderRadius: "8px", border: "1px solid #28405C", background: "none", color: "#F2F2E8", fontSize: "13px", cursor: "pointer" }}
                    >
                      {r.name}
                      {r.business_owner_id && r.business_owner_id !== accountId && (
                        <span style={{ color: "#FFC145", fontSize: "11px" }}> — déjà liée à un autre compte, sera transférée</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setAddingEntity(false)} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "12px", cursor: "pointer", padding: 0 }}>
                Annuler
              </button>
            </div>
          )}

          <SectionTitle>À venir</SectionTitle>
          <p style={{ fontSize: "13px", color: "#8792A6" }}>Comptabilité (en cas de Business payant), projets publicitaires, et autres informations — chantiers séparés à construire plus tard.</p>
        </div>
      ) : (
        <div style={{ maxWidth: "480px" }}>
          <div style={{ height: "1px", background: "#28405C", margin: "20px 0" }} />
          <SectionTitle first>Société</SectionTitle>
          <Label>Dénomination</Label>
          <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />

          <Label>Numéro d'entreprise</Label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <CountryPrefix value={form.companyCountry} onChange={(code) => setForm({ ...form, companyCountry: code })} />
            <input value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} style={{ ...fieldStyle, flex: 1 }} />
          </div>

          <Label>Email</Label>
          <input type="email" value={form.companyEmail} onChange={(e) => setForm({ ...form, companyEmail: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />

          <Label>Téléphone</Label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <CountryPrefix value={form.companyCountry} onChange={(code) => setForm({ ...form, companyCountry: code })} calling />
            <input value={form.companyPhone} onChange={(e) => setForm({ ...form, companyPhone: e.target.value })} style={{ ...fieldStyle, flex: 1 }} />
          </div>

          <Label>Siège social</Label>
          <div style={{ marginBottom: "8px" }}>
            <CountryPrefix value={form.companyCountry} onChange={(code) => setForm({ ...form, companyCountry: code })} fullName />
          </div>
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
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input value={form.companyPostalCode} onChange={(e) => setForm({ ...form, companyPostalCode: e.target.value })} placeholder="Code postal" style={{ ...fieldStyle, flex: 1 }} />
            <input value={form.companyCity} onChange={(e) => setForm({ ...form, companyCity: e.target.value })} placeholder="Ville" style={{ ...fieldStyle, flex: 2 }} />
          </div>

          <SectionTitle>Personne de contact</SectionTitle>
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <Label>Prénom</Label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={fieldStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Nom</Label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={fieldStyle} />
            </div>
          </div>
          <Label>Fonction</Label>
          <input value={form.contactFunction} onChange={(e) => setForm({ ...form, contactFunction: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />
          <Label>Email Pro</Label>
          <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} style={{ ...fieldStyle, marginBottom: "12px" }} />
          <Label>Téléphone</Label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <CountryPrefix value={form.companyCountry} onChange={(code) => setForm({ ...form, companyCountry: code })} calling />
            <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} style={{ ...fieldStyle, flex: 1 }} />
          </div>
          <Label>Langue(s) parlée(s)</Label>
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

          <div style={{ height: "1px", background: "#28405C", margin: "16px 0" }} />

          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <button
              onClick={() => setForm({ ...form, active: true })}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: `2px solid ${form.active ? "#39FF66" : "#28405C"}`,
                background: form.active ? "#39FF66" : "none",
                color: form.active ? "#0D1B2A" : "#F2F2E8",
                fontWeight: 700,
                fontSize: "11.5px",
                cursor: "pointer",
              }}
            >
              Actif
            </button>
            <button
              onClick={() => setForm({ ...form, active: false })}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: `2px solid ${!form.active ? "#FF3B4E" : "#28405C"}`,
                background: !form.active ? "#FF3B4E" : "none",
                color: !form.active ? "#0D1B2A" : "#F2F2E8",
                fontWeight: 700,
                fontSize: "11.5px",
                cursor: "pointer",
              }}
            >
              Non actif
            </button>
          </div>

          {error && <p style={{ color: "#FF3B4E", fontSize: "12.5px", marginBottom: "12px" }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px", paddingTop: "16px", borderTop: "1px solid #28405C" }}>
            <button
              onClick={() => setEditing(false)}
              style={{ flex: 1, background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "8px", fontSize: "12.5px", color: "#F2F2E8", cursor: "pointer" }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 1, background: "#39FF66", border: "none", borderRadius: "8px", padding: "8px", fontWeight: 700, fontSize: "12.5px", color: "#0D1B2A", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
