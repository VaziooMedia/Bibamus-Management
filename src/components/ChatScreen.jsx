import React, { useState, useEffect, useRef, useCallback } from "react";
import { loadAdminChatMessages, sendAdminChatMessage, loadSupportMessages, loadCollaborators } from "../data/sharedDirectories.js";
import { supabase } from "../supabaseClient.js";
import { PageTitle } from "./PageTitle.jsx";

const SUPPORT_TYPE_LABELS = { contact: "Nous écrire", report: "Signaler un problème" };

const ADMIN_ROLES = [
  { key: "editor", label: "Éditeur" },
  { key: "super_editor", label: "Super éditeur" },
  { key: "moderator", label: "Modérateur" },
  { key: "business", label: "Business" },
  { key: "admin", label: "Admin" },
  { key: "super_admin", label: "Super admin" },
];
const roleLabel = (key) => ADMIN_ROLES.find((r) => r.key === key)?.label || key;

// Clé stable identifiant une vraie conversation : soit un vrai rôle ciblé (tout le monde ayant
// ce rôle la voit), soit un vrai groupe de personnes précises (identifiants triés pour que le
// même groupe, choisi dans n'importe quel ordre, retombe toujours sur la même vraie clé).
function conversationKey(m) {
  if (m.recipientRole) return `role:${m.recipientRole}`;
  return `people:${[...(m.recipientIds || [])].sort().join(",")}`;
}

// Un vrai message m'est visible si je suis l'auteur, si mon rôle correspond au rôle ciblé, ou
// si je fais partie des vraies personnes ciblées.
function isVisibleToMe(m, myUserId, myRole) {
  if (m.senderId === myUserId) return true;
  if (m.recipientRole) return m.recipientRole === myRole;
  return (m.recipientIds || []).includes(myUserId);
}

// Vrai sélecteur de destinataire(s) — soit une ou plusieurs vraies personnes précises, soit un
// vrai type d'administration entier.
function RecipientPicker({ collaborators, myUserId, onConfirm, onCancel }) {
  const [mode, setMode] = useState("people");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  const togglePerson = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const canConfirm = mode === "people" ? selectedIds.length > 0 : !!selectedRole;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#16273D", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "420px", maxHeight: "80vh", overflowY: "auto" }}>
        <h3 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "18px", margin: "0 0 16px" }}>Nouvelle conversation</h3>

        <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
          <button
            onClick={() => setMode("people")}
            style={{ flex: 1, padding: "9px", borderRadius: "8px", border: `2px solid ${mode === "people" ? "#39FF66" : "#28405C"}`, background: mode === "people" ? "#39FF66" : "none", color: mode === "people" ? "#0D1B2A" : "#F2F2E8", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
          >
            Par personne
          </button>
          <button
            onClick={() => setMode("role")}
            style={{ flex: 1, padding: "9px", borderRadius: "8px", border: `2px solid ${mode === "role" ? "#39FF66" : "#28405C"}`, background: mode === "role" ? "#39FF66" : "none", color: mode === "role" ? "#0D1B2A" : "#F2F2E8", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
          >
            Par type d'administration
          </button>
        </div>

        {mode === "people" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
            {collaborators
              .filter((c) => c.id !== myUserId)
              .map((c) => {
                const checked = selectedIds.includes(c.id);
                return (
                  <label key={c.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", background: checked ? "#0D1B2A" : "none", cursor: "pointer" }}>
                    <input type="checkbox" checked={checked} onChange={() => togglePerson(c.id)} />
                    <span style={{ fontSize: "13.5px", color: "#F2F2E8" }}>
                      {[c.name, c.last_name].filter(Boolean).join(" ")} <span style={{ color: "#8792A6", fontSize: "11.5px" }}>({roleLabel(c.role)})</span>
                    </span>
                  </label>
                );
              })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
            {ADMIN_ROLES.map((r) => (
              <label key={r.key} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", background: selectedRole === r.key ? "#0D1B2A" : "none", cursor: "pointer" }}>
                <input type="radio" name="role" checked={selectedRole === r.key} onChange={() => setSelectedRole(r.key)} />
                <span style={{ fontSize: "13.5px", color: "#F2F2E8" }}>{r.label}</span>
              </label>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "2px solid #28405C", background: "none", color: "#F2F2E8", fontWeight: 700, cursor: "pointer" }}>
            Annuler
          </button>
          <button
            onClick={() => onConfirm(mode === "people" ? { ids: selectedIds } : { role: selectedRole })}
            disabled={!canConfirm}
            style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "none", background: "#39FF66", color: "#0D1B2A", fontWeight: 800, cursor: "pointer", opacity: canConfirm ? 1 : 0.5 }}
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatTeamScreen({ myUserId, myRole }) {
  const [allMessages, setAllMessages] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const refresh = useCallback(async () => {
    setAllMessages(await loadAdminChatMessages());
  }, []);

  useEffect(() => {
    refresh();
    loadCollaborators().then(setCollaborators);
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
  }, [activeKey, allMessages]);

  const visibleMessages = (allMessages || []).filter((m) => isVisibleToMe(m, myUserId, myRole));

  // Une vraie conversation par clé distincte trouvée parmi les vrais messages visibles —
  // avec un vrai libellé lisible et son vrai dernier message pour la vraie liste de gauche.
  const conversationsByKey = {};
  visibleMessages.forEach((m) => {
    const key = conversationKey(m);
    if (!conversationsByKey[key]) conversationsByKey[key] = { key, recipientRole: m.recipientRole, recipientIds: m.recipientIds, messages: [] };
    conversationsByKey[key].messages.push(m);
  });
  const conversations = Object.values(conversationsByKey).sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1]?.createdAt || "";
    const bLast = b.messages[b.messages.length - 1]?.createdAt || "";
    return bLast.localeCompare(aLast);
  });

  const conversationLabel = (c) => {
    if (c.recipientRole) return roleLabel(c.recipientRole);
    const names = (c.recipientIds || [])
      .filter((id) => id !== myUserId)
      .map((id) => {
        const p = collaborators.find((col) => col.id === id);
        return p ? [p.name, p.last_name].filter(Boolean).join(" ") : "?";
      });
    return names.length > 0 ? names.join(", ") : "Moi-même";
  };

  const activeConversation = conversations.find((c) => c.key === activeKey);

  const [pendingRecipient, setPendingRecipient] = useState(null);

  const handleStartConversation = (recipient) => {
    setPickerOpen(false);
    const key = recipient.role ? `role:${recipient.role}` : `people:${[...recipient.ids, myUserId].sort().join(",")}`;
    setActiveKey(key);
    // Vraie conversation pas encore commencée (aucun message envoyé) — on la garde "en attente"
    // via un vrai brouillon de destinataire tant qu'aucun message n'est réellement envoyé.
    setPendingRecipient(recipient);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    const recipient = activeConversation
      ? activeConversation.recipientRole
        ? { role: activeConversation.recipientRole }
        : { ids: (activeConversation.recipientIds || []).filter((id) => id !== myUserId) }
      : pendingRecipient;
    if (!recipient) return;
    setSending(true);
    setDraft("");
    await sendAdminChatMessage(myUserId, text, recipient);
    setSending(false);
  };

  return (
    <div>
      <PageTitle>Chat Team</PageTitle>
      <div style={{ display: "flex", gap: "20px", height: "calc(100vh - 180px)", marginTop: "16px" }}>
        <div style={{ width: "260px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            onClick={() => setPickerOpen(true)}
            style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "10px", color: "#0D1B2A", fontWeight: 800, cursor: "pointer", fontSize: "13px" }}
          >
            + Nouvelle conversation
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
            {conversations.map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  setActiveKey(c.key);
                  setPendingRecipient(null);
                }}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: activeKey === c.key ? "#28405C" : "none",
                  color: "#F2F2E8",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: activeKey === c.key ? 700 : 500,
                }}
              >
                {conversationLabel(c)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {!activeConversation && !pendingRecipient ? (
            <p style={{ color: "#8792A6", fontSize: "13px" }}>Choisissez une conversation à gauche, ou démarrez-en une nouvelle.</p>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", padding: "4px" }}>
                {(activeConversation?.messages || []).map((m) => {
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
                      <span style={{ fontSize: "10px", color: "#8792A6", marginTop: "2px" }}>
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Écrire un message..."
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
            </>
          )}
        </div>
      </div>

      {pickerOpen && <RecipientPicker collaborators={collaborators} myUserId={myUserId} onConfirm={handleStartConversation} onCancel={() => setPickerOpen(false)} />}
    </div>
  );
}

// Vrais balbutiements pour l'instant — juste une vraie lecture des messages déjà envoyés
// depuis l'app ("Nous écrire" / "Signaler un problème"), pas encore de vraie réponse depuis la
// plateforme de gestion.
export function ChatClientsScreen() {
  const [messages, setMessages] = useState(null);

  useEffect(() => {
    loadSupportMessages().then(setMessages);
  }, []);

  return (
    <div>
      <PageTitle>Chat clients</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", margin: "16px 0" }}>
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

// Vraie ébauche également — aucune vraie source de données n'existe encore pour un vrai
// échange dédié aux comptes Business (distinct des messages clients ci-dessus). Posé ici comme
// vrai point de départ pour la suite.
export function ChatBusinessScreen() {
  return (
    <div>
      <PageTitle>Chat Business</PageTitle>
      <div style={{ background: "#16273D", borderRadius: "12px", padding: "24px", color: "#8792A6", fontSize: "14px", marginTop: "16px" }}>
        Vraie ébauche — rien n'est encore branché ici. À construire : un vrai échange dédié avec les comptes Business, distinct du chat clients général.
      </div>
    </div>
  );
}
