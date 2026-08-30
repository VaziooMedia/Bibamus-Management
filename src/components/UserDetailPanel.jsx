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

function EyeIcon({ crossed }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="#8792A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="#8792A6" strokeWidth="1.8" />
      {crossed && <line x1="2" y1="2" x2="22" y2="22" stroke="#8792A6" strokeWidth="1.8" strokeLinecap="round" />}
    </svg>
  );
}

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
  const [passwordVisible, setPasswordVisible] = useState(false);
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
                <svg width="38" height="44" viewBox="0 0 879 1048" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    fill="#39FF66"
                    d="M 18.00,900.00 L 16.00,922.00 L 18.00,951.00 L 23.00,967.00 L 33.00,986.00 L 54.00,1009.00 L 64.00,1016.00 L 87.00,1027.00 L 107.00,1031.00 L 771.00,1031.00 L 792.00,1027.00 L 810.00,1019.00 L 827.00,1007.00 L 839.00,995.00 L 851.00,977.00 L 857.00,963.00 L 862.00,937.00 L 861.00,910.00 L 856.00,875.00 L 850.00,850.00 L 839.00,815.00 L 821.00,777.00 L 808.00,754.00 L 794.00,733.00 L 770.00,703.00 L 754.00,686.00 L 728.00,663.00 L 712.00,651.00 L 680.00,631.00 L 644.00,614.00 L 614.00,604.00 L 584.00,597.00 L 551.00,593.00 L 335.00,593.00 L 312.00,595.00 L 275.00,602.00 L 239.00,613.00 L 205.00,628.00 L 187.00,638.00 L 157.00,658.00 L 125.00,685.00 L 91.00,723.00 L 70.00,753.00 L 48.00,793.00 L 34.00,829.00 L 24.00,865.00 Z M 79.00,926.00 L 83.00,893.00 L 92.00,855.00 L 106.00,819.00 L 124.00,785.00 L 136.00,767.00 L 153.00,746.00 L 185.00,715.00 L 217.00,692.00 L 246.00,677.00 L 264.00,670.00 L 287.00,663.00 L 320.00,657.00 L 346.00,655.00 L 537.00,655.00 L 562.00,657.00 L 586.00,661.00 L 608.00,667.00 L 634.00,677.00 L 659.00,690.00 L 676.00,701.00 L 701.00,721.00 L 730.00,751.00 L 754.00,785.00 L 779.00,835.00 L 788.00,861.00 L 794.00,885.00 L 798.00,910.00 L 799.00,937.00 L 794.00,950.00 L 783.00,962.00 L 776.00,966.00 L 763.00,969.00 L 115.00,969.00 L 103.00,966.00 L 90.00,957.00 L 84.00,949.00 L 81.00,942.00 Z M 418.00,17.00 L 395.00,20.00 L 368.00,26.00 L 341.00,35.00 L 313.00,48.00 L 294.00,59.00 L 270.00,76.00 L 234.00,110.00 L 217.00,131.00 L 202.00,154.00 L 185.00,188.00 L 179.00,204.00 L 170.00,237.00 L 165.00,276.00 L 165.00,310.00 L 173.00,358.00 L 178.00,375.00 L 193.00,410.00 L 219.00,451.00 L 230.00,464.00 L 258.00,492.00 L 270.00,502.00 L 298.00,521.00 L 328.00,537.00 L 371.00,552.00 L 396.00,557.00 L 422.00,560.00 L 471.00,559.00 L 505.00,553.00 L 522.00,548.00 L 552.00,537.00 L 575.00,525.00 L 596.00,512.00 L 617.00,496.00 L 649.00,465.00 L 662.00,449.00 L 680.00,422.00 L 696.00,390.00 L 704.00,367.00 L 710.00,344.00 L 714.00,318.00 L 714.00,266.00 L 711.00,242.00 L 703.00,211.00 L 696.00,190.00 L 679.00,155.00 L 658.00,124.00 L 645.00,108.00 L 617.00,81.00 L 598.00,66.00 L 574.00,51.00 L 550.00,39.00 L 517.00,27.00 L 475.00,18.00 L 449.00,16.00 Z M 416.00,80.00 L 456.00,79.00 L 479.00,82.00 L 504.00,88.00 L 543.00,105.00 L 570.00,123.00 L 595.00,146.00 L 607.00,160.00 L 621.00,180.00 L 638.00,214.00 L 646.00,239.00 L 650.00,258.00 L 652.00,296.00 L 650.00,320.00 L 646.00,340.00 L 634.00,375.00 L 619.00,401.00 L 609.00,415.00 L 586.00,440.00 L 567.00,456.00 L 536.00,475.00 L 505.00,488.00 L 470.00,496.00 L 421.00,497.00 L 386.00,491.00 L 355.00,480.00 L 335.00,470.00 L 316.00,458.00 L 300.00,445.00 L 276.00,421.00 L 254.00,390.00 L 239.00,358.00 L 230.00,320.00 L 228.00,289.00 L 231.00,255.00 L 239.00,223.00 L 255.00,188.00 L 271.00,164.00 L 303.00,130.00 L 317.00,119.00 L 341.00,104.00 L 379.00,88.00 Z"
                  />
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
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <input
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...fieldStyle, paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((v) => !v)}
                aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}
              >
                <EyeIcon crossed={passwordVisible} />
              </button>
            </div>
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
