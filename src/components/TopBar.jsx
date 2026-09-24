import React, { useState, useEffect } from "react";
import { loadAppUsers, loadBusinessAccountsFull } from "../data/sharedDirectories.js";
import { supabase } from "../supabaseClient.js";
import { NavIcon } from "./icons.jsx";

// Se met à jour en temps réel via Supabase Realtime — dès qu'un compte est créé, supprimé, ou
// change de rôle, le compteur se recalcule sans même changer d'écran. Recompte tout à chaque
// changement (plutôt que d'incrémenter/décrémenter) pour rester juste même en cas de
// changement de rôle (ex. utilisateur promu admin, qui doit alors sortir du compte).
function useUserCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const refresh = () => loadAppUsers().then((users) => setCount(users.length));
    refresh();

    const channel = supabase
      .channel("bibax-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}

// Même vrai principe que useUserCount, mais sur les vrais comptes Business — vrai comptage
// séparé, vu que loadAppUsers filtre déjà sur role="user" et ne les inclut donc pas.
function useBusinessCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const refresh = () => loadBusinessAccountsFull().then((accounts) => setCount(accounts.length));
    refresh();

    const channel = supabase
      .channel("business-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}

export function TopBar({ adminName, adminRole, onSearch, pendingReportsCount, openClaimsCount, onOpenReports, unreadMessagesCount, onOpenMessages }) {
  // La cloche regroupe toutes les vraies notifications admin confondues — signalements et
  // revendications en attente, plutôt qu'un badge séparé par type.
  const bellCount = (pendingReportsCount || 0) + (openClaimsCount || 0);
  const userCount = useUserCount();
  const businessCount = useBusinessCount();
  const [query, setQuery] = useState("");

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: "20px",
        padding: "14px 32px",
        background: "#0D1B2A",
        borderBottom: "2px solid #16273D",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "#28405C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <NavIcon name="default-avatar" size={18} color="#8792A6" />
        </div>
        <div>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#F2F2E8" }}>{adminName}</div>
          <div style={{ fontSize: "11px", color: "#39FF66", fontWeight: 600 }}>{adminRole}</div>
        </div>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch && onSearch(query)}
        placeholder="Rechercher sur toute la plateforme..."
        style={{
          flex: 1,
          maxWidth: "720px",
          padding: "11px 16px",
          borderRadius: "8px",
          border: "2px solid #28405C",
          background: "#16273D",
          color: "#F2F2E8",
          fontSize: "14px",
        }}
      />

      <button onClick={onOpenReports} title="Notifications" style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", display: "flex", position: "relative", flexShrink: 0 }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#39FF66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {!!bellCount && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              minWidth: "15px",
              height: "15px",
              padding: "0 3px",
              borderRadius: "999px",
              background: "#ef007c",
              color: "#F2F2E8",
              fontSize: "10px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {bellCount > 99 ? "99+" : bellCount}
          </span>
        )}
      </button>
      <button onClick={onOpenMessages} title="Chat" style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", display: "flex", position: "relative", flexShrink: 0 }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#39FF66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        {!!unreadMessagesCount && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              minWidth: "15px",
              height: "15px",
              padding: "0 3px",
              borderRadius: "999px",
              background: "#ef007c",
              color: "#F2F2E8",
              fontSize: "10px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
          </span>
        )}
      </button>

      <div style={{ flex: 1 }} />

      <div
        style={{
          fontSize: "13px",
          color: "#8792A6",
          whiteSpace: "nowrap",
          border: "2px solid #39FF66",
          borderRadius: "999px",
          padding: "6px 14px",
          minWidth: "108px",
          textAlign: "center",
        }}
      >
        Bibax : <span style={{ color: "#39FF66", fontWeight: 800, fontFamily: "'Urbanist', sans-serif" }}>{userCount != null ? userCount : "…"}</span>
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "#8792A6",
          whiteSpace: "nowrap",
          border: "2px solid #39FF66",
          borderRadius: "999px",
          padding: "6px 14px",
          minWidth: "108px",
          textAlign: "center",
          marginRight: "8px",
        }}
      >
        Business : <span style={{ color: "#39FF66", fontWeight: 800, fontFamily: "'Urbanist', sans-serif" }}>{businessCount != null ? businessCount : "…"}</span>
      </div>
    </div>
  );
}
