import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { updateCollaboratorProfile, uploadAdminAvatar, updateOwnPassword, updateNotificationPrefs } from "../data/sharedDirectories.js";
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
  const [activeTab, setActiveTab] = useState("profile");
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

  const [mfaFactor, setMfaFactor] = useState(undefined); // undefined = pas encore chargé, null = aucun, objet = actif
  const [enrolling, setEnrolling] = useState(null); // { factorId, qrCode, secret } | null
  const [verifyCode, setVerifyCode] = useState("");
  const [mfaSaving, setMfaSaving] = useState(false);
  const [mfaError, setMfaError] = useState(null);

  const [notificationPrefs, setNotificationPrefs] = useState({ reports: true, claims: true });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationsSaved, setNotificationsSaved] = useState(false);

  const refreshMfaFactor = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setMfaFactor(data?.totp?.find((f) => f.status === "verified") || null);
  };

  useEffect(() => {
    refreshMfaFactor();
  }, []);

  useEffect(() => {
    if (!myUserId) return;
    supabase
      .from("profiles")
      .select("name, last_name, email, role, main_language, avatar_url, notification_prefs")
      .eq("id", myUserId)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setNotificationPrefs(data.notification_prefs || { reports: true, claims: true });
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

  const handleStartEnroll = async () => {
    setMfaError(null);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) {
      setMfaError(error.message);
      return;
    }
    setEnrolling({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  };

  const handleVerifyEnroll = async () => {
    setMfaError(null);
    setMfaSaving(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrolling.factorId });
    if (challengeError) {
      setMfaSaving(false);
      setMfaError(challengeError.message);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: enrolling.factorId, challengeId: challenge.id, code: verifyCode.trim() });
    setMfaSaving(false);
    if (verifyError) {
      setMfaError("Code incorrect. Réessayez.");
      return;
    }
    setEnrolling(null);
    setVerifyCode("");
    await refreshMfaFactor();
  };

  const handleCancelEnroll = async () => {
    if (enrolling) await supabase.auth.mfa.unenroll({ factorId: enrolling.factorId });
    setEnrolling(null);
    setVerifyCode("");
    setMfaError(null);
  };

  const handleUnenroll = async () => {
    setMfaSaving(true);
    setMfaError(null);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactor.id });
    setMfaSaving(false);
    if (error) {
      setMfaError(error.message);
      return;
    }
    await refreshMfaFactor();
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    setNotificationsSaved(false);
    await updateNotificationPrefs(myUserId, notificationPrefs);
    setSavingNotifications(false);
    setNotificationsSaved(true);
  };

  if (!profile) return <p style={{ color: "#8792A6" }}>Chargement...</p>;

  return (
    <div>
      <PageTitle>Paramètres</PageTitle>
      <div style={{ display: "flex", gap: "4px", borderBottom: "2px solid #28405C", marginBottom: "24px", marginTop: "8px" }}>
        {[
          { key: "profile", label: "Mon profil" },
          { key: "security", label: "Sécurité" },
          { key: "notifications", label: "Notifications" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: "none",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab.key ? "#39FF66" : "transparent"}`,
              marginBottom: "-2px",
              padding: "8px 12px",
              fontSize: "13px",
              fontWeight: 700,
              color: activeTab === tab.key ? "#39FF66" : "#8792A6",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ maxWidth: "420px" }}>
        {activeTab === "profile" && (
          <>
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
          </>
        )}

        {activeTab === "security" && (
          <>
        <SectionTitle>Sécurité</SectionTitle>
        {mfaFactor === undefined ? (
          <p style={{ color: "#8792A6", fontSize: "12.5px" }}>Chargement...</p>
        ) : mfaFactor ? (
          <>
            <p style={{ fontSize: "13px", color: "#F2F2E8", margin: "0 0 12px" }}>
              <span style={{ color: "#39FF66", fontWeight: 700 }}>✓ Activée</span> — une vraie application d'authentification (Google Authenticator, Authy...) est demandée à chaque connexion.
            </p>
            {mfaError && <p style={{ color: "#FF3B4E", fontSize: "12.5px", marginBottom: "10px" }}>{mfaError}</p>}
            <button
              onClick={handleUnenroll}
              disabled={mfaSaving}
              style={{ background: "none", border: "2px solid #FF3B4E", borderRadius: "8px", padding: "9px 16px", fontWeight: 700, fontSize: "12.5px", color: "#FF3B4E", cursor: "pointer", opacity: mfaSaving ? 0.6 : 1 }}
            >
              {mfaSaving ? "Désactivation..." : "Désactiver"}
            </button>
          </>
        ) : enrolling ? (
          <>
            <p style={{ fontSize: "12.5px", color: "#8792A6", margin: "0 0 12px" }}>
              Scannez ce code avec une vraie application d'authentification (Google Authenticator, Authy...), puis entrez le vrai code à 6 chiffres qu'elle affiche.
            </p>
            <img src={enrolling.qrCode} alt="QR code" style={{ width: "160px", height: "160px", background: "#fff", borderRadius: "8px", marginBottom: "10px" }} />
            <p style={{ fontSize: "11px", color: "#8792A6", marginBottom: "12px", wordBreak: "break-all" }}>Ou entrez ce code manuellement : {enrolling.secret}</p>
            <label style={labelStyle}>Code à 6 chiffres</label>
            <input
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              maxLength={6}
              style={{ ...fieldStyle, marginBottom: "10px", maxWidth: "140px" }}
            />
            {mfaError && <p style={{ color: "#FF3B4E", fontSize: "12.5px", marginBottom: "10px" }}>{mfaError}</p>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleVerifyEnroll}
                disabled={mfaSaving || verifyCode.trim().length !== 6}
                style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "9px 16px", fontWeight: 700, fontSize: "12.5px", color: "#0D1B2A", cursor: "pointer", opacity: mfaSaving || verifyCode.trim().length !== 6 ? 0.6 : 1 }}
              >
                {mfaSaving ? "Vérification..." : "Valider"}
              </button>
              <button onClick={handleCancelEnroll} style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "9px 16px", color: "#F2F2E8", cursor: "pointer" }}>
                Annuler
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: "13px", color: "#8792A6", margin: "0 0 12px" }}>Non activée — ajoutez une vraie étape de vérification en plus du mot de passe à chaque connexion.</p>
            {mfaError && <p style={{ color: "#FF3B4E", fontSize: "12.5px", marginBottom: "10px" }}>{mfaError}</p>}
            <button
              onClick={handleStartEnroll}
              style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "9px 16px", fontWeight: 700, fontSize: "12.5px", color: "#0D1B2A", cursor: "pointer" }}
            >
              Activer la double authentification
            </button>
          </>
        )}
          </>
        )}

        {activeTab === "notifications" && (
          <>
        <SectionTitle>Notifications</SectionTitle>
        <p style={{ fontSize: "12.5px", color: "#8792A6", margin: "0 0 16px" }}>
          Détermine quels vrais événements comptent dans le vrai total affiché sur la cloche, en haut de la plateforme. La plateforme n'envoie pas encore de vrais emails ou de vraies notifications push.
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={notificationPrefs.reports}
            onChange={(e) => {
              setNotificationPrefs((prev) => ({ ...prev, reports: e.target.checked }));
              setNotificationsSaved(false);
            }}
          />
          <span style={{ fontSize: "13px", color: "#F2F2E8" }}>Signalements en attente</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={notificationPrefs.claims}
            onChange={(e) => {
              setNotificationPrefs((prev) => ({ ...prev, claims: e.target.checked }));
              setNotificationsSaved(false);
            }}
          />
          <span style={{ fontSize: "13px", color: "#F2F2E8" }}>Revendications en attente</span>
        </label>
        <button
          onClick={handleSaveNotifications}
          disabled={savingNotifications}
          style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "9px 16px", fontWeight: 700, fontSize: "12.5px", color: "#0D1B2A", cursor: "pointer", opacity: savingNotifications ? 0.6 : 1 }}
        >
          {savingNotifications ? "Enregistrement..." : "Enregistrer"}
        </button>
        {notificationsSaved && <span style={{ marginLeft: "10px", fontSize: "12.5px", color: "#39FF66" }}>Enregistré ✓</span>}
          </>
        )}
      </div>
    </div>
  );
}
