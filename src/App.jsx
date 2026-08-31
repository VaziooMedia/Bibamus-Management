import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient.js";
import { LoginScreen } from "./components/LoginScreen.jsx";
import { Layout } from "./components/Layout.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { VenuesScreen } from "./components/VenuesScreen.jsx";
import { DrinksScreen } from "./components/DrinksScreen.jsx";
import { BreweriesScreen, BrandsScreen } from "./components/BreweriesAndBrandsScreens.jsx";
import { ComingSoon } from "./components/ComingSoon.jsx";
import { DataBaseOverviewScreen } from "./components/DataBaseOverviewScreen.jsx";
import { CollaboratorsScreen } from "./components/CollaboratorsScreen.jsx";
import { UsersScreen } from "./components/UsersScreen.jsx";
import { ReportsScreen } from "./components/ReportsScreen.jsx";
import { AuditLogScreen } from "./components/AuditLogScreen.jsx";
import { CountryRulesScreen } from "./components/CountryRulesScreen.jsx";
import { FeatureFlagsScreen } from "./components/FeatureFlagsScreen.jsx";
import { MyActivityScreen } from "./components/MyActivityScreen.jsx";

const SUPABASE_PROJECT_URL = "https://supabase.com/dashboard/project/rkmmrzkqzqpntgiguajz";

export default function App() {
  // authChecked distingue "en cours de vérification" de "vérifié, pas connecté" — évite un
  // flash de l'écran de connexion pendant la vérification initiale de session.
  const [authChecked, setAuthChecked] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [myRole, setMyRole] = useState(null);
  const [myCanModerate, setMyCanModerate] = useState(false);
  const [screen, setScreen] = useState("dashboard");

  // Vérifie une session déjà active (ex. après un rafraîchissement de page) — revérifie le
  // rôle à chaque fois, pas seulement à la connexion, au cas où il aurait changé depuis.
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setAuthChecked(true);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role, active, blocked_until, can_moderate").eq("id", data.session.user.id).single();
      const stillBlocked = profile && profile.active === false && (!profile.blocked_until || new Date(profile.blocked_until) > new Date());
      if (profile && ["editor", "super_editor", "moderator", "admin", "super_admin"].includes(profile.role) && !stillBlocked) {
        setUnlocked(true);
        setMyRole(profile.role);
        setMyCanModerate(!!profile.can_moderate);
        if (profile.role === "moderator") setScreen("reports");
        else if (["editor", "super_editor"].includes(profile.role)) setScreen("database");
      } else {
        await supabase.auth.signOut();
      }
      setAuthChecked(true);
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUnlocked(false);
    setMyRole(null);
    setMyCanModerate(false);
  };

  const handleUnlock = (role, canModerate) => {
    setUnlocked(true);
    setMyRole(role);
    setMyCanModerate(!!canModerate);
    if (role === "moderator") setScreen("reports");
    else if (["editor", "super_editor"].includes(role)) setScreen("database");
  };

  if (!authChecked) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#F2F2E8" }}>Chargement...</div>;
  }

  if (!unlocked) {
    return <LoginScreen onUnlock={handleUnlock} />;
  }

  return (
    <Layout current={screen} onNavigate={setScreen} onLogout={handleLogout} myRole={myRole} myCanModerate={myCanModerate}>
      {screen === "dashboard" && <Dashboard />}
      {screen === "database" && <DataBaseOverviewScreen onNavigate={setScreen} supabaseUrl={SUPABASE_PROJECT_URL} />}
      {screen === "venues" && <VenuesScreen />}
      {screen === "drinks" && <DrinksScreen />}
      {screen === "breweries" && <BreweriesScreen />}
      {screen === "brands" && <BrandsScreen />}
      {screen === "chat" && <ComingSoon title="Chat" />}
      {screen === "stats" && <ComingSoon title="Statistiques" />}
      {screen === "finances" && <ComingSoon title="Finances" />}
      {screen === "business" && <ComingSoon title="Business" />}
      {screen === "notifications" && <ComingSoon title="Notifications" />}
      {screen === "admins" && <CollaboratorsScreen />}
      {screen === "users" && <UsersScreen />}
      {screen === "reports" && <ReportsScreen />}
      {screen === "audit" && <AuditLogScreen />}
      {screen === "countryRules" && <CountryRulesScreen />}
      {screen === "featureFlags" && <FeatureFlagsScreen />}
      {screen === "myActivity" && <MyActivityScreen />}
      {screen === "settings" && <ComingSoon title="Paramètres" />}
    </Layout>
  );
}
