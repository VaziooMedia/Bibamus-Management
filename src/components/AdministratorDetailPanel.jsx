import React, { useState } from "react";
import { updateCollaboratorProfile, uploadAdminAvatar, createCollaborator, deleteCollaborator } from "../data/sharedDirectories.js";

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%", color: "#F2F2E8", background: "#0D1B2A", boxSizing: "border-box" };
const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };
const separatorStyle = { borderBottom: "1px solid #28405C", margin: "20px 0" };

const ROLES = [
  { key: "editor", label: "Éditeur" },
  { key: "super_editor", label: "Super éditeur" },
  { key: "moderator", label: "Modérateur" },
  { key: "admin", label: "Admin" },
  { key: "super_admin", label: "Super admin" },
];

// administrator=null → mode création (fiche vide, email/mot de passe demandés). Sinon → mode
// édition (email figé, un bouton de suppression sécurisé apparaît).
export function AdministratorDetailPanel({ administrator, onClose, onSaved }) {
  const isNew = !administrator;
  const [email, setEmail] = useState(administrator?.email || "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(administrator?.name || "");
  const [lastName, setLastName] = useState(administrator?.last_name || "");
  const [birthDate, setBirthDate] = useState(administrator?.birth_date || "");
  const [role, setRole] = useState(administrator?.role || "admin");
  const [canModerate, setCanModerate] = useState(administrator?.can_moderate || false);
  const [active, setActive] = useState(administrator?.active !== false);
  const [avatarUrl, setAvatarUrl] = useState(administrator?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isNew) return; // pas d'upload possible avant que le compte existe (pas d'id)
    setUploadingAvatar(true);
    const url = await uploadAdminAvatar(administrator.id, file);
    if (url) setAvatarUrl(url);
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    if (isNew) {
      const result = await createCollaborator(email, password, firstName, lastName, birthDate, role, canModerate);
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      const result = await updateCollaboratorProfile(administrator.id, { firstName, lastName, birthDate, role, active, canModerate });
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    }
    onSaved();
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteCollaborator(administrator.id, deletePassword);
    setDeleting(false);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    onSaved();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", zIndex: 50, overflowY: "auto" }}>
      <div style={{ background: "#16273D", borderRadius: "14px", padding: "28px", width: "480px", maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", color: "#F2F2E8", margin: 0 }}>{isNew ? "Nouvel administrateur" : "Fiche administrateur"}</h2>
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
                background: avatarUrl ? `url(${avatarUrl}) center/cover` : "#28405C",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                color: "#8792A6",
              }}
            >
              {!avatarUrl && "👤"}
            </div>
            <label style={{ fontSize: "12.5px", color: "#39FF66", cursor: "pointer", fontWeight: 700 }}>
              {uploadingAvatar ? "Envoi..." : "Changer la photo"}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} disabled={uploadingAvatar} />
            </label>
          </div>
        )}

        <label style={labelStyle}>Prénom</label>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />

        <label style={labelStyle}>Nom</label>
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />

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

        <label style={labelStyle}>Date de naissance</label>
        <input type="date" value={birthDate || ""} onChange={(e) => setBirthDate(e.target.value)} style={{ ...fieldStyle, marginBottom: "12px", colorScheme: "dark" }} />

        <label style={labelStyle}>Rôle</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }}>
          {ROLES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>

        {(role === "editor" || role === "super_editor") && (
          <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", cursor: "pointer" }}>
            <input type="checkbox" checked={canModerate} onChange={(e) => setCanModerate(e.target.checked)} />
            <span style={{ fontSize: "13px", color: "#F2F2E8" }}>Peut aussi modérer les signalements</span>
          </label>
        )}

        <label style={labelStyle}>Statut</label>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button
            onClick={() => setActive(true)}
            style={{
              flex: 1,
              padding: "9px",
              borderRadius: "8px",
              border: `2px solid ${active ? "#39FF66" : "#28405C"}`,
              background: active ? "#39FF66" : "none",
              color: active ? "#0D1B2A" : "#F2F2E8",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Actif
          </button>
          <button
            onClick={() => setActive(false)}
            style={{
              flex: 1,
              padding: "9px",
              borderRadius: "8px",
              border: `2px solid ${!active ? "#FF3B4E" : "#28405C"}`,
              background: !active ? "#FF3B4E" : "none",
              color: !active ? "#0D1B2A" : "#F2F2E8",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Non actif
          </button>
        </div>

        {error && <p style={{ color: "#FF3B4E", fontSize: "12.5px", marginBottom: "12px" }}>{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: "100%", background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Enregistrement..." : isNew ? "Créer le compte" : "Enregistrer"}
        </button>

        {!isNew && (
          <>
            <div style={separatorStyle} />
            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                style={{ width: "100%", background: "none", border: "2px solid #FF3B4E", borderRadius: "8px", padding: "10px", fontWeight: 700, color: "#FF3B4E", cursor: "pointer" }}
              >
                Supprimer ce compte administrateur
              </button>
            ) : (
              <div>
                <p style={{ fontSize: "12.5px", color: "#F2F2E8", marginBottom: "8px" }}>
                  Pour confirmer la suppression, entrez <strong>votre propre</strong> mot de passe (le compte super_admin actuellement connecté) :
                </p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  style={{ ...fieldStyle, marginBottom: "10px" }}
                />
                {deleteError && <p style={{ color: "#FF3B4E", fontSize: "12.5px", marginBottom: "10px" }}>{deleteError}</p>}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setConfirmingDelete(false);
                      setDeletePassword("");
                      setDeleteError(null);
                    }}
                    style={{ flex: 1, background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "10px", color: "#F2F2E8", cursor: "pointer" }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || !deletePassword}
                    style={{ flex: 1, background: "#FF3B4E", border: "none", borderRadius: "8px", padding: "10px", fontWeight: 700, color: "#fff", cursor: "pointer", opacity: deleting || !deletePassword ? 0.6 : 1 }}
                  >
                    {deleting ? "Suppression..." : "Confirmer la suppression"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
