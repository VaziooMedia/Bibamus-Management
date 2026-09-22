import React, { useState, useEffect, useRef, useCallback } from "react";
import { loadAdminChatMessages, sendAdminChatMessage, loadSupportMessages } from "../data/sharedDirectories.js";
import { supabase } from "../supabaseClient.js";
import { PageTitle } from "./PageTitle.jsx";

const SUPPORT_TYPE_LABELS = { contact: "Nous écrire", report: "Signaler un problème" };

function TeamChat({ myUserId }) {
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const refresh = useCallback(async () => {
    setMessages(await loadAdminChatMessages());
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("admin-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_chat_messages" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    await sendAdminChatMessage(myUserId, text);
    setSending(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 220px)" }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", padding: "4px" }}>
        {!messages ? (
          <p style={{ color: "#8792A6" }}>Chargement...</p>
        ) : messages.length === 0 ? (
          <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucun message pour l'instant — soyez le premier à écrire à l'équipe.</p>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === myUserId;
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                {!isMe && <span style={{ fontSize: "11px", color: "#8792A6", marginBottom: "2px", marginLeft: "4px" }}>{m.senderName}</span>}
                <div
                  style={{
                    maxWidth: "60%",
                    background: isMe ? "#39FF66" : "#16273D",
                    color: isMe ? "#0D1B2A" : "#F2F2E8",
                    borderRadius: "14px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    wordBreak: "break-word",
                  }}
                >
                  {m.message}
                </div>
                <span style={{ fontSize: "10px", color: "#8792A6", marginTop: "2px" }}>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Écrire à l'équipe..."
          style={{ flex: 1, padding: "12px 14px", borderRadius: "10px", border: "2px solid #28405C", background: "#0D1B2A", color: "#F2F2E8", fontSize: "14px" }}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          style={{ background: "#39FF66", border: "none", borderRadius: "10px", padding: "0 20px", color: "#0D1B2A", fontWeight: 800, cursor: "pointer", opacity: !draft.trim() || sending ? 0.5 : 1 }}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}

// Vrais balbutiements pour l'instant — juste une vraie lecture des messages déjà envoyés
// depuis l'app, sans réponse possible depuis ici pour le moment.
function ClientMessages() {
  const [messages, setMessages] = useState(null);

  useEffect(() => {
    loadSupportMessages().then(setMessages);
  }, []);

  return (
    <div>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "16px" }}>
        Encore au stade de vraie ébauche — vue en lecture seule des messages envoyés depuis l'app ("Nous écrire" / "Signaler un problème"). Répondre depuis ici viendra ensuite.
      </p>
      {!messages ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : messages.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucun message client pour l'instant.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {messages.map((m) => (
            <div key={m.id} style={{ background: "#16273D", borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: "#39FF66", fontWeight: 700, textTransform: "uppercase" }}>{SUPPORT_TYPE_LABELS[m.type] || m.type}</span>
                <span style={{ fontSize: "11px", color: "#8792A6" }}>{m.created_at ? m.created_at.slice(0, 16).replace("T", " ") : ""}</span>
              </div>
              <p style={{ fontSize: "14px", color: "#F2F2E8", margin: 0 }}>{m.message}</p>
              {m.contact_email && <p style={{ fontSize: "11.5px", color: "#8792A6", margin: "6px 0 0" }}>Réponse souhaitée à : {m.contact_email}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatScreen({ myUserId }) {
  const [tab, setTab] = useState("team");

  return (
    <div>
      <PageTitle>Chat</PageTitle>
      <div style={{ display: "flex", gap: "8px", margin: "16px 0 20px" }}>
        {[
          { key: "team", label: "Équipe" },
          { key: "clients", label: "Clients" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: `2px solid ${tab === t.key ? "#39FF66" : "#28405C"}`,
              background: tab === t.key ? "#39FF66" : "none",
              color: tab === t.key ? "#0D1B2A" : "#F2F2E8",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "team" ? <TeamChat myUserId={myUserId} /> : <ClientMessages />}
    </div>
  );
}
