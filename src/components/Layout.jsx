import React, { useState } from "react";
import { TopBar } from "./TopBar.jsx";
import { usePendingReportsCount } from "../data/usePendingReportsCount.js";
import { useUnreadChatCounts } from "../data/useUnreadChatCounts.js";

const COMMUNICATION_ITEMS = [
  { key: "chatTeam", label: "Chat Team" },
  { key: "chatUsers", label: "Chats Users" },
  { key: "chatBusiness", label: "Chat Business" },
  { key: "notifications", label: "Notifications" },
];

const DATABASE_ITEMS = [
  { key: "venues", label: "Lieux" },
  { key: "drinks", label: "Produits" },
  { key: "brands", label: "Marques" },
  { key: "breweries", label: "Producteurs" },
  { key: "users", label: "Utilisateurs" },
  { key: "reports", label: "Signalements" },
  // Absent de la vraie liste donnée par l'utilisateur, mais gardé ici pour ne pas perdre l'accès
  // à cet écran existant — à retirer explicitement si l'omission était volontaire.
  { key: "officialStories", label: "Stories officielles" },
];

const BUSINESS_ITEMS = [
  { key: "businessAccounts", label: "Comptes Business" },
  { key: "claims", label: "Revendications" },
  { key: "finances", label: "Finances" },
];

const ANALYTICS_ITEMS = [{ key: "stats", label: "Analytics" }];

const SYSTEM_ITEMS = [
  { key: "audit", label: "Audit" },
  { key: "countryRules", label: "Configuration pays" },
  { key: "featureFlags", label: "Feature flags" },
  { key: "crashReports", label: "Crash reports" },
  { key: "admins", label: "Administrateurs" },
];

// En-tête de section cliquable — replie/déplie ses propres items indépendamment des autres
// sections, tout déplié par défaut (même principe que les lignes de blocs de comptage).
function SectionHeader({ title, expanded, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "16px 20px 6px 20px",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: "9px", color: "#8792A6", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
      <span style={{ fontSize: "10px", fontWeight: 800, color: "#8792A6", letterSpacing: "1px", textTransform: "uppercase" }}>{title}</span>
    </button>
  );
}

function NavButton({ item, current, onNavigate, indent, badge }) {
  const active = current === item.key;
  return (
    <button
      key={item.key}
      onClick={() => onNavigate(item.key)}
      style={{
        textAlign: "left",
        background: active ? "#28405C" : "none",
        border: "none",
        borderLeft: active ? "3px solid #39FF66" : "3px solid transparent",
        padding: indent ? "10px 20px 10px 20px" : "12px 20px",
        fontSize: indent ? "11px" : "12px",
        fontWeight: active ? 700 : 500,
        color: active ? "#39FF66" : "#F2F2E8",
        cursor: "pointer",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span
        style={
          indent
            ? { color: "#39FF66", fontWeight: 800, fontSize: "13px", flexShrink: 0 }
            : { width: "4px", height: "16px", background: "#39FF66", borderRadius: "2px", display: "inline-block", flexShrink: 0 }
        }
      >
        {indent ? "–" : ""}
      </span>
      {item.label}
      {!!badge && (
        <span
          style={{
            minWidth: "18px",
            height: "18px",
            padding: "0 5px",
            borderRadius: "999px",
            background: "#ef007c",
            color: "#F2F2E8",
            fontSize: "11px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

function SettingsIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#39FF66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ef007c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function Layout({ current, onNavigate, onLogout, myRole, myCanModerate, myUserId, children }) {
  const isDatabaseScreen = DATABASE_ITEMS.some((i) => i.key === current) || current === "database";
  const [databaseOpen, setDatabaseOpen] = useState(isDatabaseScreen);
  const isModerator = myRole === "moderator";
  const isEditorTier = myRole === "editor" || myRole === "super_editor";
  const isBusiness = myRole === "business";
  const pendingReportsCount = usePendingReportsCount();
  const unreadChatCounts = useUnreadChatCounts(myUserId, myRole);

  const [communicationOpen, setCommunicationOpen] = useState(true);
  const [databaseSectionOpen, setDatabaseSectionOpen] = useState(true);
  const [businessSectionOpen, setBusinessSectionOpen] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ width: "220px", flexShrink: 0, background: "#16273D", padding: "24px 0", display: "flex", flexDirection: "column" }}>
        <button
          onClick={() => onNavigate(isModerator ? "reports" : isBusiness ? "myEntities" : isEditorTier ? "database" : "dashboard")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "0 20px 28px 20px", textAlign: "left" }}
        >
          <img src="/bibamus-logo.svg" alt="Bibamus" style={{ height: "26px", display: "block" }} />
          <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "12px", color: "#39FF66", letterSpacing: "1px", marginTop: "4px" }}>
            Management
          </div>
        </button>

        {isModerator ? (
          // Accès volontairement restreint — un modérateur ne voit que les signalements, pas
          // la Database ni les autres utilisateurs.
          <NavButton item={{ key: "reports", label: "Signalements" }} current={current} onNavigate={onNavigate} badge={pendingReportsCount} />
        ) : isBusiness ? (
          // Un compte Business ne voit que ses propres fiches liées, rien d'autre.
          <NavButton item={{ key: "myEntities", label: "Mes fiches" }} current={current} onNavigate={onNavigate} />
        ) : isEditorTier ? (
          // Un éditeur/super éditeur voit la Database (création/modification de fiches), et
          // aussi les Signalements si la case "peut modérer" est cochée sur son compte.
          <>
            <button
              onClick={() => {
                onNavigate("database");
                setDatabaseOpen(true);
              }}
              style={{
                textAlign: "left",
                background: isDatabaseScreen ? "#28405C" : "none",
                border: "none",
                borderLeft: isDatabaseScreen ? "3px solid #39FF66" : "3px solid transparent",
                padding: "12px 20px",
                fontSize: "12px",
                fontWeight: isDatabaseScreen ? 700 : 500,
                color: isDatabaseScreen ? "#39FF66" : "#F2F2E8",
                cursor: "pointer",
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "4px", height: "16px", background: "#39FF66", borderRadius: "2px", display: "inline-block", flexShrink: 0 }} />
                DataBase
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setDatabaseOpen((o) => !o);
                }}
                style={{ fontSize: "11px", color: "#39FF66", padding: "4px", display: "inline-block" }}
              >
                {databaseOpen ? "▼" : "▶"}
              </span>
            </button>
            {databaseOpen && (
              <div style={{ paddingLeft: "14px" }}>
                {DATABASE_ITEMS.map((item) => (
                  <NavButton key={item.key} item={item} current={current} onNavigate={onNavigate} indent />
                ))}
              </div>
            )}
            {myCanModerate && <NavButton item={{ key: "reports", label: "Signalements" }} current={current} onNavigate={onNavigate} badge={pendingReportsCount} />}
            <NavButton item={{ key: "myActivity", label: "Mon activité" }} current={current} onNavigate={onNavigate} />
          </>
        ) : (
          <>
            <NavButton item={{ key: "dashboard", label: "Tableau de bord" }} current={current} onNavigate={onNavigate} />

            <SectionHeader title="Communication" expanded={communicationOpen} onToggle={() => setCommunicationOpen((o) => !o)} />
            {communicationOpen &&
              COMMUNICATION_ITEMS.map((item) => {
                const badge =
                  item.key === "notifications"
                    ? pendingReportsCount
                    : item.key === "chatTeam"
                    ? unreadChatCounts.chatTeam
                    : item.key === "chatUsers"
                    ? unreadChatCounts.chatUsers
                    : item.key === "chatBusiness"
                    ? unreadChatCounts.chatBusiness
                    : undefined;
                return <NavButton key={item.key} item={item} current={current} onNavigate={onNavigate} badge={badge} />;
              })}

            <SectionHeader title="DataBase" expanded={databaseSectionOpen} onToggle={() => setDatabaseSectionOpen((o) => !o)} />
            {databaseSectionOpen &&
              DATABASE_ITEMS.map((item) => (
                <NavButton key={item.key} item={item} current={current} onNavigate={onNavigate} badge={item.key === "reports" ? pendingReportsCount : undefined} />
              ))}

            <SectionHeader title="Business" expanded={businessSectionOpen} onToggle={() => setBusinessSectionOpen((o) => !o)} />
            {businessSectionOpen && BUSINESS_ITEMS.map((item) => <NavButton key={item.key} item={item} current={current} onNavigate={onNavigate} />)}

            <SectionHeader title="Analytics" expanded={analyticsOpen} onToggle={() => setAnalyticsOpen((o) => !o)} />
            {analyticsOpen && ANALYTICS_ITEMS.map((item) => <NavButton key={item.key} item={item} current={current} onNavigate={onNavigate} />)}

            <SectionHeader title="Système" expanded={systemOpen} onToggle={() => setSystemOpen((o) => !o)} />
            {systemOpen && SYSTEM_ITEMS.map((item) => <NavButton key={item.key} item={item} current={current} onNavigate={onNavigate} />)}
          </>
        )}

        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "8px 20px 8px" }}>
          <button onClick={() => onNavigate("settings")} title="Paramètres" aria-label="Paramètres" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}>
            <SettingsIcon />
          </button>
          <button onClick={onLogout} title="Se déconnecter" aria-label="Se déconnecter" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}>
            <LogoutIcon />
          </button>
        </div>
        <div style={{ padding: "0 20px 16px", fontSize: "10px", color: "#8792A6" }}>VaziooMedia - 2026</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar
          pendingReportsCount={pendingReportsCount}
          onOpenReports={() => onNavigate("notifications")}
          unreadMessagesCount={unreadChatCounts.chatTeam + unreadChatCounts.chatUsers + unreadChatCounts.chatBusiness}
          onOpenMessages={() => onNavigate("chatTeam")}
        />
        <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}
