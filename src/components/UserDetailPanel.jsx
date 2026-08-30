import React, { useState } from "react";
import { updateAppUserProfile, createAppUser } from "../data/sharedDirectories.js";
import { COUNTRIES } from "../constants.js";

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%", color: "#F2F2E8", background: "#0D1B2A", boxSizing: "border-box" };
const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };
const separatorStyle = { borderBottom: "1px solid #28405C", margin: "20px 0" };

const APP_LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "nl", label: "Néerlandais" },
  { code: "en", label: "Anglais" },
  { code: "de", label: "Allemand" },
];

function ageFromBirthDate(dateStr) {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export function UserDetailPanel({ user, onClose, onSaved }) {
  const isNew = !user;
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(user?.name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [username, setUsername] = useState(user?.username || "");
  const [birthDate, setBirthDate] = useState(user?.birth_date || "");
  const [country, setCountry] = useState(user?.country || "");
  const [region, setRegion] = useState(user?.region || "");
  const [city, setCity] = useState(user?.city || "");
  const [facebookUrl, setFacebookUrl] = useState(user?.facebook_url || "");
  const [instagramUrl, setInstagramUrl] = useState(user?.instagram_url || "");
  const [tiktokUrl, setTiktokUrl] = useState(user?.tiktok_url || "");
  const [snapchatUrl, setSnapchatUrl] = useState(user?.snapchat_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || "");
  const [appLanguage, setAppLanguage] = useState(user?.app_language || "fr");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const age = ageFromBirthDate(birthDate);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    if (isNew) {
      const result = await createAppUser(email, password, firstName, lastName, nickname, username, birthDate);
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      onSaved();
      return;
    }

    const result = await updateAppUserProfile(user.id, {
      firstName,
      lastName,
      nickname,
      username,
      birthDate,
      country,
      region,
      city,
      facebookUrl,
      instagramUrl,
      tiktokUrl,
      snapchatUrl,
      linkedinUrl,
      appLanguage,
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", color: "#F2F2E8", margin: 0 }}>{isNew ? "Nouvel utilisateur" : "Fiche utilisateur"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        {!isNew && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "50%",
                background: "#28405C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {user.avatar_emoji ? (
                <span style={{ fontSize: "40px" }}>{user.avatar_emoji}</span>
              ) : (
                <svg width="44" height="44" viewBox="0 0 1024 1024" fill="none">
                  <g fill="none" stroke="#39FF66" strokeWidth="60" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="176" cy="410" r="92" />
                    <path d="M 36 786 C 36 666, 122 596, 222 596 C 258 596, 291 605, 318 622" />
                    <circle cx="848" cy="410" r="92" />
                    <path d="M 706 622 C 733 605, 766 596, 802 596 C 902 596, 988 666, 988 786" />
                    <circle cx="512" cy="286" r="194" />
                    <path d="M 235 926 C 183 926, 153 894, 162 842 C 188 690, 320 579, 512 579 C 704 579, 836 690, 862 842 C 871 894, 841 926, 789 926 Z" />
                  </g>
                </svg>
              )}
            </div>
            <p style={{ fontSize: "11px", color: "#8792A6", marginTop: "8px", textAlign: "center" }}>
              Photo choisie par l'utilisateur dans l'app
              <br />
              Non modifiable ici.
            </p>
          </div>
        )}

        <label style={labelStyle}>Prénom</label>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />

        <label style={labelStyle}>Nom</label>
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />

        <label style={labelStyle}>Surnom</label>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />

        <label style={labelStyle}>Nom d'utilisateur</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />

        <label style={labelStyle}>Email</label>
        {isNew ? (
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        ) : (
          <p style={{ ...fieldStyle, marginBottom: "12px", color: "#8792A6" }}>{email}</p>
        )}

        {isNew && (
          <>
            <label style={labelStyle}>Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
          </>
        )}

        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Date de naissance</label>
            <input type="date" value={birthDate || ""} onChange={(e) => setBirthDate(e.target.value)} style={{ ...fieldStyle, colorScheme: "dark" }} />
          </div>
          <div style={{ width: "80px" }}>
            <label style={labelStyle}>Âge</label>
            <p style={{ ...fieldStyle, margin: 0, color: "#8792A6", textAlign: "center" }}>{age != null ? age : "—"}</p>
          </div>
        </div>

        <div style={separatorStyle} />

        <label style={labelStyle}>Pays</label>
        <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }}>
          <option value="">—</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.fr}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Région</label>
            <input value={region} onChange={(e) => setRegion(e.target.value)} style={fieldStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Ville de résidence</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} style={fieldStyle} />
          </div>
        </div>

        <div style={separatorStyle} />

        <label style={labelStyle}>Lien Facebook</label>
        <input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Lien Instagram</label>
        <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Lien TikTok</label>
        <input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Lien Snapchat</label>
        <input value={snapchatUrl} onChange={(e) => setSnapchatUrl(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Lien LinkedIn</label>
        <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />

        <div style={separatorStyle} />

        <label style={labelStyle}>Langue utilisée sur l'app</label>
        <select value={appLanguage} onChange={(e) => setAppLanguage(e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }}>
          {APP_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>

        {!isNew && (
          <>
            <label style={labelStyle}>Statut</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: user.active !== false ? "#39FF66" : "#FF3B4E" }} />
              <span style={{ color: "#F2F2E8", fontSize: "13.5px" }}>{user.active !== false ? "Actif" : "Non actif"}</span>
              <span style={{ color: "#8792A6", fontSize: "11px" }}>(les actions de modération arriveront avec le chantier dédié)</span>
            </div>
          </>
        )}

        {error && <p style={{ color: "#FF3B4E", fontSize: "12.5px", marginBottom: "12px" }}>{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: "100%", background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Enregistrement..." : isNew ? "Créer le compte" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
