import React, { useState, useEffect } from "react";
import { loadCollaborators, createCollaborator } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { AdministratorDetailPanel } from "./AdministratorDetailPanel.jsx";

// Seuls les rôles utiles à CETTE plateforme (admin.bibamus.app) — contributor/business/user
// seront gérés par les futures plateformes séparées (bibamus.app, business.bibamus.app).
const ROLES = [
  { key: "moderator", label: "Modérateur" },
  { key: "admin", label: "Admin" },
  { key: "super_admin", label: "Super admin" },
];
const roleLabel = (key) => ROLES.find((r) => r.key === key)?.label || key;

const fieldStyle = { padding: "9px 10px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13px", color: "#F2F2E8", background: "#0D1B2A", outline: "none" };

function CreateAdministratorForm({ onCreated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [role, setRole] = useState("admin");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await createCollaborator(email, password, firstName, lastName, birthDate, role);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setBirthDate("");
    setRole("admin");
    onCreated();
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap", background: "#16273D", borderRadius: "10px", padding: "16px", marginBottom: "24px" }}>
      <div>
        <label style={{ fontSize: "11px", color: "#8792A6", display: "block", marginBottom: "4px" }}>Prénom</label>
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={fieldStyle} />
      </div>
      <div>
        <label style={{ fontSize: "11px", color: "#8792A6", display: "block", marginBottom: "4px" }}>Nom</label>
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} required style={fieldStyle} />
      </div>
      <div>
        <label style={{ fontSize: "11px", color: "#8792A6", display: "block", marginBottom: "4px" }}>Date de naissance</label>
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{ ...fieldStyle, colorScheme: "dark" }} />
      </div>
      <div>
        <label style={{ fontSize: "11px", color: "#8792A6", display: "block", marginBottom: "4px" }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={fieldStyle} />
      </div>
      <div>
        <label style={{ fontSize: "11px", color: "#8792A6", display: "block", marginBottom: "4px" }}>Mot de passe</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={fieldStyle} />
      </div>
      <div>
        <label style={{ fontSize: "11px", color: "#8792A6", display: "block", marginBottom: "4px" }}>Rôle</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={fieldStyle}>
          {ROLES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={saving}
        style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Création..." : "+ Créer le compte"}
      </button>
      {error && <p style={{ color: "#FF3B4E", fontSize: "12.5px", margin: 0, width: "100%" }}>{error}</p>}
    </form>
  );
}

export function CollaboratorsScreen() {
  const [administrators, setAdministrators] = useState(null);
  const [selected, setSelected] = useState(null);

  const refresh = () => loadCollaborators().then(setAdministrators);
  useEffect(() => {
    refresh();
  }, []);

  const handleSaved = () => {
    setSelected(null);
    refresh();
  };

  return (
    <div>
      <PageTitle>Administrateurs</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>
        Comptes ayant accès à la plateforme de gestion. Seul un super_admin peut créer un compte, changer un rôle, ou activer/désactiver un accès.
      </p>

      <CreateAdministratorForm onCreated={refresh} />

      {!administrators ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : administrators.filter((a) => a.role !== "user").length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucun administrateur pour l'instant.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #28405C" }}>
              <th style={{ textAlign: "left", padding: "10px", color: "#8792A6", fontSize: "12px" }}>Nom</th>
              <th style={{ textAlign: "left", padding: "10px", color: "#8792A6", fontSize: "12px" }}>Prénom</th>
              <th style={{ textAlign: "left", padding: "10px", color: "#8792A6", fontSize: "12px" }}>Email</th>
              <th style={{ textAlign: "left", padding: "10px", color: "#8792A6", fontSize: "12px" }}>Rôle</th>
              <th style={{ textAlign: "left", padding: "10px", color: "#8792A6", fontSize: "12px" }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {administrators
              .filter((a) => a.role !== "user")
              .map((a) => (
                <tr key={a.id} onClick={() => setSelected(a)} style={{ borderBottom: "1px solid #28405C", cursor: "pointer" }}>
                  <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{a.last_name || "—"}</td>
                  <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{a.name || "—"}</td>
                  <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{a.email}</td>
                  <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{roleLabel(a.role)}</td>
                  <td style={{ padding: "10px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        background: a.active !== false ? "#39FF66" : "#FF3B4E",
                        color: "#0D1B2A",
                        fontSize: "11.5px",
                        fontWeight: 700,
                      }}
                    >
                      {a.active !== false ? "Actif" : "Non actif"}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {selected && <AdministratorDetailPanel administrator={selected} onClose={() => setSelected(null)} onSaved={handleSaved} />}
    </div>
  );
}
