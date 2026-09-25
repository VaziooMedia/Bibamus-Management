import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { updateCollaboratorProfile, uploadAdminAvatar, updateOwnPassword } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { NavIcon } from "./icons.jsx";
import { LANGUAGES } from "./AdministratorDetailPanel.jsx";

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%", color: "#F2F2E8", background: "#0D1B2A", boxSizing: "border-box" };
const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };
const separatorStyle = { borderBottom: "1px solid #28405C", margin: "24px 0" };

function SectionTitle({ children }) {
  return (
    <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, color: "#F2F2E8", margin: "0 0 14px" }}>
      <span style={{ width: "4px", height: "16px", borderRadius: "2px", background: "#39FF66", flexShrink: 0 }} />
      {children}
    </h3>
  );
}

export function SettingsScreen({ myUserId, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [mainLanguage, setMainLanguage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [languageSaved, setLanguageSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (!myUserId) return;
    supabase
      .from("profiles")
      .select("name, last_name, email, role, main_language, avatar_url")
      .eq("id", myUserId)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setMainLanguage(data.main_language || "");
          setAvatarUrl(data.avatar_url || null);
        }
      });
  }, [myUserId]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const url = await uploadAdminAvatar(myUserId, file);
    setUploadingAvatar(false);
    if (!url) return;
    setAvatarUrl(url);
    await updateCollaboratorProfile(myUserId, {
      firstName: profile.name,
      lastName: profile.last_name,
      role: profile.role,
      active: true,
      avatarUrl: url,
      mainLanguage,
    });
    onProfileUpdated?.({ avatarUrl: url });
  };

  const handleSaveLanguage = async () => {
    setSavingLanguage(true);
    setLanguageSaved(false);
    await updateCollaboratorProfile(myUserId, {
      firstName: profile.name,
      lastName: profile.last_name,
      role: profile.role,
      active: true,
      avatarUrl,
      mainLanguage,
    });
    setSavingLanguage(false);
    setLanguageSaved(true);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les 2 mots de passe ne correspondent pas.");
      return;
    }
    setSavingPassword(true);
    const result = await updateOwnPassword(newPassword);
    setSavingPassword(false);
    if (result.error) {
      setPasswordError(result.error);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
  };

  if (!profile) return <p style={{ color: "#8792A6" }}>Chargement...</p>;

  return (
    <div>
      <PageTitle>Paramètres</PageTitle>
      <div style={{ maxWidth: "420px", marginTop: "20px" }}>
        <SectionTitle>Mon profil</SectionTitle>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: avatarUrl ? `url(${avatarUrl}) center/cover` : "#28405C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {!avatarUrl && <NavIcon name="default-avatar" size={32} color="#8792A6" />}
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#F2F2E8" }}>
              {profile.name} {profile.last_name}
            </div>
            <div style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "8px" }}>{profile.email}</div>
            <label style={{ fontSize: "12.5px", color: "#39FF66", cursor: "pointer", fontWeight: 700 }}>
              {uploadingAvatar ? "Envoi..." : "Changer la photo"}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} disabled={uploadingAvatar} />
            </label>
          </div>
        </div>

        <label style={labelStyle}>Langue principale</label>
        <select
          value={mainLanguage}
          onChange={(e) => {
            setMainLanguage(e.target.value);
            setLanguageSaved(false);
          }}
          style={{ ...fieldStyle, marginBottom: "10px" }}
        >
          <option value="">—</option>
          {LANGUAGES.map((l) => (
            <option key={l.label} value={l.label}>
              {l.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleSaveLanguage}
          disabled={savingLanguage}
          style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "9px 16px", fontWeight: 700, fontSize: "12.5px", color: "#0D1B2A", cursor: "pointer", opacity: savingLanguage ? 0.6 : 1 }}
        >
          {savingLanguage ? "Enregistrement..." : "Enregistrer"}
        </button>
        {languageSaved && <span style={{ marginLeft: "10px", fontSize: "12.5px", color: "#39FF66" }}>Enregistré ✓</span>}

        <div style={separatorStyle} />

        <SectionTitle>Mot de passe</SectionTitle>
        <label style={labelStyle}>Nouveau mot de passe</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setPasswordSaved(false);
          }}
          style={{ ...fieldStyle, marginBottom: "12px" }}
        />
        <label style={labelStyle}>Confirmer le mot de passe</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setPasswordSaved(false);
          }}
          style={{ ...fieldStyle, marginBottom: "12px" }}
        />
        {passwordError && <p style={{ color: "#FF3B4E", fontSize: "12.5px", marginBottom: "10px" }}>{passwordError}</p>}
        <button
          onClick={handleChangePassword}
          disabled={savingPassword || !newPassword || !confirmPassword}
          style={{
            background: "#39FF66",
            border: "none",
            borderRadius: "8px",
            padding: "9px 16px",
            fontWeight: 700,
            fontSize: "12.5px",
            color: "#0D1B2A",
            cursor: "pointer",
            opacity: savingPassword || !newPassword || !confirmPassword ? 0.6 : 1,
          }}
        >
          {savingPassword ? "Enregistrement..." : "Changer le mot de passe"}
        </button>
        {passwordSaved && <span style={{ marginLeft: "10px", fontSize: "12.5px", color: "#39FF66" }}>Mot de passe changé ✓</span>}
      </div>
    </div>
  );
}
