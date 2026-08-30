import React, { useState, useEffect } from "react";
import { loadCollaborators, createCollaborator, updateCollaboratorRole } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const ROLES = [
  { key: "user", label: "Utilisateur" },
  { key: "contributor", label: "Contributeur" },
  { key: "business", label: "Business" },
  { key: "moderator", label: "Modérateur" },
  { key: "admin", label: "Admin" },
  { key: "super_admin", label: "Super admin" },
];
const roleLabel = (key) => ROLES.find((r) => r.key === key)?.label || key;

const fieldStyle = { padding: "9px 10px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13px", color: "#F2F2E8", background: "#0D1B2A", outline: "none" };

function CreateCollaboratorForm({ onCreated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("admin");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await createCollaborator(email, password, name, role);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEmail("");
    setPassword("");
    setName("");
    setRole("admin");
    onCreated();
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap", background: "#16273D", borderRadius: "10px", padding: "16px", marginBottom: "24px" }}>
      <div>
        <label style={{ fontSize: "11px", color: "#8792A6", display: "block", marginBottom: "4px" }}>Nom</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required style={fieldStyle} />
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
          {ROLES.filter((r) => r.key !== "user").map((r) => (
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
  const [collaborators, setCollaborators] = useState(null);

  const refresh = () => loadCollaborators().then(setCollaborators);
  useEffect(() => {
    refresh();
  }, []);

  const handleRoleChange = async (id, role) => {
    setCollaborators((prev) => prev.map((c) => (c.id === id ? { ...c, role } : c)));
    const result = await updateCollaboratorRole(id, role);
    if (result.error) {
      alert("Erreur : " + result.error);
      refresh();
    }
  };

  return (
    <div>
      <PageTitle>Collaborateurs</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>
        Comptes ayant accès à la plateforme de gestion (ou pouvant y accéder selon leur rôle). Seul un super_admin peut créer un compte ou changer un rôle.
      </p>

      <CreateCollaboratorForm onCreated={refresh} />

      {!collaborators ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #28405C" }}>
              <th style={{ textAlign: "left", padding: "10px", color: "#8792A6", fontSize: "12px" }}>Nom</th>
              <th style={{ textAlign: "left", padding: "10px", color: "#8792A6", fontSize: "12px" }}>Email</th>
              <th style={{ textAlign: "left", padding: "10px", color: "#8792A6", fontSize: "12px" }}>Rôle</th>
            </tr>
          </thead>
          <tbody>
            {collaborators
              .filter((c) => c.role !== "user")
              .map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #28405C" }}>
                  <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{c.name || "—"}</td>
                  <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{c.email}</td>
                  <td style={{ padding: "10px" }}>
                    <select value={c.role} onChange={(e) => handleRoleChange(c.id, e.target.value)} style={fieldStyle}>
                      {ROLES.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
      {collaborators && collaborators.filter((c) => c.role !== "user").length === 0 && (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucun collaborateur pour l'instant.</p>
      )}
    </div>
  );
}
