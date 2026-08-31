import React, { useState } from "react";
import { supabase } from "../supabaseClient.js";

// Vraie connexion (Supabase Auth) — remplace l'ancien mot de passe partagé. L'accès n'est
// accordé qu'aux comptes dont le rôle (vérifié côté base de données, pas ici) est admin ou
// super_admin ; onUnlock n'est appelé qu'après cette vérification par le composant parent.
export function LoginScreen({ onUnlock }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setLoading(false);
      setError("Email ou mot de passe incorrect.");
      return;
    }

    const { data: profile, error: profileError } = await supabase.from("profiles").select("role, active").eq("id", data.user.id).single();
    setLoading(false);

    if (profileError || !profile || !["admin", "super_admin"].includes(profile.role)) {
      await supabase.auth.signOut();
      setError("Ce compte n'a pas accès à la plateforme de gestion.");
      return;
    }

    if (profile.active === false) {
      await supabase.auth.signOut();
      setError("Ce compte a été bloqué.");
      return;
    }

    onUnlock();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={submit} style={{ width: "320px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <h1 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "28px", margin: 0 }}>
          <span style={{ color: "#F2F2E8" }}>Bibamus</span> <span style={{ color: "#39FF66" }}>Gestion</span>
        </h1>
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
        {error && <p style={{ color: "#FF3B4E", fontSize: "13px", margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
