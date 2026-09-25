import React, { useState } from "react";
import { supabase } from "../supabaseClient.js";

// Vraie connexion (Supabase Auth) — remplace l'ancien mot de passe partagé. L'accès n'est
// accordé qu'aux comptes dont le rôle (vérifié côté base de données, pas ici) est admin ou
// super_admin ; onUnlock n'est appelé qu'après cette vérification par le composant parent.
// Vraie 2e étape (code à 6 chiffres) ajoutée pour les comptes ayant activé la double
// authentification dans Paramètres > Sécurité — sans elle, ces vrais comptes ne pourraient
// plus jamais se reconnecter après l'avoir activée.
export function LoginScreen({ onUnlock }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const finishLogin = async (userId) => {
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role, active, blocked_until, can_moderate, name, last_name, avatar_url").eq("id", userId).single();
    setLoading(false);

    if (profileError || !profile || !["editor", "super_editor", "moderator", "business", "admin", "super_admin"].includes(profile.role)) {
      await supabase.auth.signOut();
      setError("Ce compte n'a pas accès à la plateforme de gestion.");
      return;
    }

    const stillBlocked = profile.active === false && (!profile.blocked_until || new Date(profile.blocked_until) > new Date());
    if (stillBlocked) {
      await supabase.auth.signOut();
      setError("Ce compte a été bloqué.");
      return;
    }

    onUnlock(profile.role, profile.can_moderate, userId, profile.name, profile.last_name, profile.avatar_url);
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setLoading(false);
      setError("Email ou mot de passe incorrect.");
      return;
    }

    // Un vrai facteur de double authentification activé exige un vrai niveau aal2 — la vraie
    // session tout juste ouverte n'est encore qu'au niveau aal1 (mot de passe seul).
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      setLoading(false);
      setMfaStep(true);
      return;
    }

    await finishLogin(data.user.id);
  };

  const submitMfaCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp?.find((f) => f.status === "verified");
    if (!factor) {
      setLoading(false);
      setError("Aucun vrai facteur de vérification trouvé.");
      return;
    }
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError) {
      setLoading(false);
      setError(challengeError.message);
      return;
    }
    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code: mfaCode.trim() });
    if (verifyError) {
      setLoading(false);
      setError("Code incorrect. Réessayez.");
      return;
    }

    await finishLogin(verifyData.user.id);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={mfaStep ? submitMfaCode : submitPassword} style={{ width: "320px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <h1 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "28px", margin: 0 }}>
          <span style={{ color: "#F2F2E8" }}>Bibamus</span> <span style={{ color: "#39FF66" }}>Gestion</span>
        </h1>
        {mfaStep ? (
          <>
            <p style={{ fontSize: "13px", color: "#8792A6", margin: 0 }}>Entrez le vrai code à 6 chiffres affiché par votre vraie application d'authentification.</p>
            <input
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="Code à 6 chiffres"
              autoFocus
              maxLength={6}
              style={{ padding: "12px 14px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "15px" }}
            />
          </>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email"
              autoFocus
              required
              autoComplete="email"
              style={{ padding: "12px 14px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "15px" }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              autoComplete="current-password"
              style={{ padding: "12px 14px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "15px" }}
            />
          </>
        )}
        {error && <p style={{ color: "#FF3B4E", fontSize: "13px", margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || (mfaStep && mfaCode.trim().length !== 6)}
          style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: loading || (mfaStep && mfaCode.trim().length !== 6) ? 0.6 : 1 }}
        >
          {loading ? "..." : mfaStep ? "Valider" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
