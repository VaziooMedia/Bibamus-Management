import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  loadAdminChatMessages,
  sendAdminChatMessage,
  loadSupportMessages,
  loadCollaborators,
  loadAppUsers,
  loadBusinessAccounts,
  markAsRead,
  loadArchivedConversationKeys,
  archiveConversation,
  unarchiveConversation,
  deleteConversationMessages,
  loadReactionsForMessages,
  toggleReaction,
} from "../data/sharedDirectories.js";
import { conversationKey, isVisibleToMe } from "../data/chatHelpers.js";
import { supabase } from "../supabaseClient.js";
import { PageTitle } from "./PageTitle.jsx";

const SUPPORT_TYPE_LABELS = { contact: "Nous écrire", report: "Signaler un problème" };

// Vrais types d'administration internes à l'équipe Bibamus — "business"/"user" en sont
// volontairement exclus : ils ont chacun leur propre vrai canal (Chat Business/Chats Users).
const ADMIN_ROLES = [
  { key: "editor", label: "Éditeur" },
  { key: "super_editor", label: "Super éditeur" },
  { key: "moderator", label: "Modérateur" },
  { key: "admin", label: "Admin" },
  { key: "super_admin", label: "Super admin" },
];
const roleLabel = (key) => ADMIN_ROLES.find((r) => r.key === key)?.label || key;
const isTeamMember = (c) => !!c.role && c.role !== "business" && c.role !== "user";

const REACTION_EMOJIS = ["👍", "👌", "😁", "😎", "😆", "😬"];

// Vrai rond profil de base, en attendant un vrai système d'avatars — initiales sur fond de
// couleur stable (dérivée du nom, pas aléatoire, pour rester la même à chaque affichage).
const AVATAR_COLORS = ["#39FF66", "#00C8FF", "#FFC145", "#ef007c", "#8792A6", "#c74b4b"];
function avatarColor(seed) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}
function ProfileCircle({ name, size = 30 }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: avatarColor(name || "?"),
        color: "#0D1B2A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: `${Math.round(size * 0.4)}px`,
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}

// Vrai menu contextuel "•••" — propose Archiver/Supprimer (vue Actives) ou Restaurer/Supprimer
// (vue Archivées). position: fixed calculée depuis le vrai bouton (pas position: absolute) :
// le vrai cadre de choix pouvait déborder du conteneur à défilement/bordures arrondies qui
// l'entourait, position: fixed échappe à ce découpage.
function ConversationMenu({ showArchived, onArchive, onUnarchive, onDelete }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const openMenu = (e) => {
    e.stopPropagation();
    const rect = buttonRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpen((o) => !o);
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !buttonRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div style={{ flexShrink: 0 }}>
      <button
        ref={buttonRef}
        onClick={openMenu}
        title="Options"
        style={{ background: "none", border: "none", color: "#8792A6", cursor: "pointer", padding: "4px 3px", fontSize: "11px", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1 }}
      >
        •••
      </button>
      {open && coords && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            right: `${coords.right}px`,
            background: "#0D1B2A",
            border: "2px solid #28405C",
            borderRadius: "8px",
            zIndex: 500,
            minWidth: "140px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          {showArchived ? (
            <button
              onClick={(e) => {
                setOpen(false);
                onUnarchive(e);
              }}
              style={{ width: "100%", textAlign: "left", padding: "9px 12px", background: "none", border: "none", color: "#39FF66", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}
            >
              Restaurer
            </button>
          ) : (
            <button
              onClick={(e) => {
                setOpen(false);
                onArchive(e);
              }}
              style={{ width: "100%", textAlign: "left", padding: "9px 12px", background: "none", border: "none", color: "#F2F2E8", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}
            >
              Archiver
            </button>
          )}
          <button
            onClick={(e) => {
              setOpen(false);
              onDelete(e);
            }}
            style={{ width: "100%", textAlign: "left", padding: "9px 12px", background: "none", border: "none", color: "#ef007c", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

// Vrai picker de réactions — s'ouvre après un vrai appui long sur une bulle. position: fixed
// calculée depuis les vraies coordonnées de la bulle (passées par MessageBubble), pour échapper
// au découpage du conteneur à défilement qui l'entoure.
function ReactionPicker({ anchorRect, onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: `${anchorRect.top - 44}px`,
        left: `${Math.max(8, Math.min(anchorRect.left, window.innerWidth - 260))}px`,
        background: "#0D1B2A",
        border: "2px solid #28405C",
        borderRadius: "999px",
        padding: "6px 8px",
        display: "flex",
        gap: "4px",
        zIndex: 500,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onPick(emoji)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", padding: "2px 4px", lineHeight: 1 }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// Vrai sélecteur de destinataire(s), générique — options.people : vraie liste de personnes
// sélectionnables (id, label, sublabel) ; options.roles : vraie liste de rôles diffusables
// (facultatif — absent pour Chats Users, qui n'a pas de vrai regroupement par rôle utile).
function RecipientPicker({ people, roles, myUserId, onConfirm, onCancel }) {
  const [mode, setMode] = useState("people");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [query, setQuery] = useState("");

  const togglePerson = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const canConfirm = mode === "people" ? selectedIds.length > 0 : !!selectedRole;
  const filteredPeople = people.filter((p) => p.id !== myUserId && (!query.trim() || p.label.toLowerCase().includes(query.trim().toLowerCase())));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#16273D", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "420px", maxHeight: "80vh", overflowY: "auto" }}>
        <h3 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "18px", margin: "0 0 16px" }}>Nouvelle conversation</h3>

        {roles && (
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
        )}

        {mode === "people" ? (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom..."
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", background: "#0D1B2A", color: "#F2F2E8", fontSize: "13.5px", marginBottom: "10px" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px", maxHeight: "260px", overflowY: "auto" }}>
              {filteredPeople.map((p) => {
                const checked = selectedIds.includes(p.id);
                return (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", background: checked ? "#0D1B2A" : "none", cursor: "pointer" }}>
                    <input type="checkbox" checked={checked} onChange={() => togglePerson(p.id)} />
                    <ProfileCircle name={p.label} size={32} />
                    <span style={{ fontSize: "13.5px", color: "#F2F2E8" }}>
                      {p.label} {p.sublabel && <span style={{ color: "#8792A6", fontSize: "11.5px" }}>({p.sublabel})</span>}
                    </span>
                  </label>
                );
              })}
              {filteredPeople.length === 0 && <p style={{ fontSize: "12.5px", color: "#8792A6" }}>Aucun résultat.</p>}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
            {roles.map((r) => (
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

// Vraie bulle de message, avec vraies réactions (appui long pour ouvrir le vrai picker).
function MessageBubble({ m, isMe, myUserId, reactionsByMessage, onToggleReaction }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const pressTimer = useRef(null);
  const bubbleRef = useRef(null);

  const startPress = () => {
    pressTimer.current = setTimeout(() => {
      setAnchorRect(bubbleRef.current.getBoundingClientRect());
      setPickerOpen(true);
    }, 500);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const reactions = reactionsByMessage[m.id] || [];
  const grouped = {};
  reactions.forEach((r) => {
    grouped[r.emoji] = grouped[r.emoji] || [];
    grouped[r.emoji].push(r.user_id);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
      <div style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "center", gap: "6px", marginBottom: "3px", marginLeft: isMe ? 0 : "4px", marginRight: isMe ? "4px" : 0 }}>
        <ProfileCircle name={m.senderName} size={26} />
        <span style={{ fontSize: "11px", color: "#8792A6" }}>
          {m.senderName}
          {m.senderRole && <span style={{ marginLeft: "6px", fontSize: "10px", color: "#8792A6" }}>{roleLabel(m.senderRole)}</span>}
        </span>
      </div>
      <div style={{ position: "relative" }}>
        {pickerOpen && anchorRect && (
          <ReactionPicker
            anchorRect={anchorRect}
            onPick={(emoji) => {
              setPickerOpen(false);
              onToggleReaction(m.id, emoji, (grouped[emoji] || []).includes(myUserId));
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
        <div
          ref={bubbleRef}
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          style={{
            maxWidth: "420px",
            background: isMe ? "#39FF66" : "#16273D",
            color: isMe ? "#0D1B2A" : "#F2F2E8",
            borderRadius: "14px",
            padding: "10px 14px",
            fontSize: "14px",
            wordBreak: "break-word",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {m.message}
        </div>
      </div>
      {Object.keys(grouped).length > 0 && (
        <div style={{ display: "flex", gap: "4px", marginTop: "3px", flexWrap: "wrap" }}>
          {Object.entries(grouped).map(([emoji, userIds]) => (
            <button
              key={emoji}
              onClick={() => onToggleReaction(m.id, emoji, userIds.includes(myUserId))}
              style={{
                background: userIds.includes(myUserId) ? "#28405C" : "#16273D",
                border: `1px solid ${userIds.includes(myUserId) ? "#39FF66" : "#28405C"}`,
                borderRadius: "999px",
                padding: "1px 7px",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <span>{emoji}</span>
              <span style={{ fontSize: "10.5px", color: "#8792A6" }}>{userIds.length}</span>
            </button>
          ))}
        </div>
      )}
      <span style={{ fontSize: "10px", color: "#8792A6", marginTop: "2px" }}>
        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" }) : ""}
      </span>
    </div>
  );
}

// Vrai panneau de conversations générique — partagé par Chat Team, Chats Users et Chat
// Business. scope distingue les 3 vrais canaux côté données (voir bibamus-schema-admin-chat-
// scope.sql) ; people/roles décrivent qui peut être choisi comme destinataire pour ce vrai
// canal ; resolveInfo construit le vrai nom + sous-titre affichés pour une vraie conversation
// donnée (différent selon qu'on regarde des collègues, des utilisateurs ou des comptes
// Business).
function ChatConversationsPanel({ scope, myUserId, myRole, people, roles, resolveInfo, markerPrefix, initialPersonId }) {
  const [allMessages, setAllMessages] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [archivedKeys, setArchivedKeys] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const refresh = useCallback(async () => {
    const messages = await loadAdminChatMessages(scope);
    setAllMessages(messages);
    setReactions(await loadReactionsForMessages(messages.map((m) => m.id)));
  }, [scope]);

  const refreshArchived = useCallback(async () => {
    setArchivedKeys(await loadArchivedConversationKeys(myUserId));
  }, [myUserId]);

  useEffect(() => {
    refresh();
    refreshArchived();
    const channel = supabase
      .channel(`admin-chat-${scope}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_chat_messages" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_chat_reactions" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, refreshArchived, scope]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [activeKey, allMessages]);

  const reactionsByMessage = {};
  reactions.forEach((r) => {
    reactionsByMessage[r.message_id] = reactionsByMessage[r.message_id] || [];
    reactionsByMessage[r.message_id].push(r);
  });

  const handleToggleReaction = async (messageId, emoji, alreadyReacted) => {
    await toggleReaction(messageId, myUserId, emoji, alreadyReacted);
    refresh();
  };

  const visibleMessages = (allMessages || []).filter((m) => isVisibleToMe(m, myUserId, myRole));

  const conversationsByKey = {};
  visibleMessages.forEach((m) => {
    const key = conversationKey(m);
    if (!conversationsByKey[key]) conversationsByKey[key] = { key, recipientRole: m.recipientRole, recipientIds: m.recipientIds, messages: [] };
    conversationsByKey[key].messages.push(m);
  });
  const allConversations = Object.values(conversationsByKey).sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1]?.createdAt || "";
    const bLast = b.messages[b.messages.length - 1]?.createdAt || "";
    return bLast.localeCompare(aLast);
  });
  const conversations = allConversations.filter((c) => (showArchived ? archivedKeys.has(c.key) : !archivedKeys.has(c.key)));

  const activeConversation = conversations.find((c) => c.key === activeKey);

  useEffect(() => {
    if (activeKey) markAsRead(myUserId, `${markerPrefix}:${activeKey}`);
  }, [activeKey, myUserId, markerPrefix, activeConversation?.messages.length]);

  const [pendingRecipient, setPendingRecipient] = useState(null);

  const handleStartConversation = (recipient) => {
    setPickerOpen(false);
    const key = recipient.role ? `role:${recipient.role}` : `people:${[...recipient.ids, myUserId].sort().join(",")}`;
    setActiveKey(key);
    setPendingRecipient(recipient);
  };

  // Accès direct depuis une vraie fiche (ex. "Chat Team" cliqué depuis Administrateurs) —
  // démarre/ouvre tout de suite la vraie conversation avec cette vraie personne précise, sans
  // passer par le vrai picker manuel. Ne se redéclenche pas si la personne change d'écran et
  // revient (initialPersonId consommé une vraie seule fois par valeur).
  const consumedInitialPersonId = useRef(null);
  useEffect(() => {
    if (initialPersonId && consumedInitialPersonId.current !== initialPersonId) {
      consumedInitialPersonId.current = initialPersonId;
      handleStartConversation({ ids: [initialPersonId] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPersonId]);

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
    await sendAdminChatMessage(myUserId, text, recipient, scope);
    setSending(false);
  };

  const handleArchive = async (e, key) => {
    e.stopPropagation();
    await archiveConversation(myUserId, key);
    refreshArchived();
    if (activeKey === key) setActiveKey(null);
  };

  const handleUnarchive = async (e, key) => {
    e.stopPropagation();
    await unarchiveConversation(myUserId, key);
    refreshArchived();
  };

  const handleDelete = async (e, conversation) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer définitivement cette conversation ? Tous les messages seront effacés pour tout le monde — cette action est irréversible.")) return;
    await deleteConversationMessages(conversation.messages.map((m) => m.id));
    await unarchiveConversation(myUserId, conversation.key);
    if (activeKey === conversation.key) setActiveKey(null);
    refresh();
    refreshArchived();
  };

  return (
    <>
      <div style={{ display: "flex", gap: "0px", height: "calc(100vh - 180px)", marginTop: "16px", border: "2px solid #28405C", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ width: "280px", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "2px solid #28405C", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setShowArchived(false)}
                style={{ fontSize: "11.5px", fontWeight: 700, padding: "5px 10px", borderRadius: "999px", border: "none", cursor: "pointer", background: !showArchived ? "#28405C" : "none", color: !showArchived ? "#39FF66" : "#8792A6" }}
              >
                Actives
              </button>
              <button
                onClick={() => setShowArchived(true)}
                style={{ fontSize: "11.5px", fontWeight: 700, padding: "5px 10px", borderRadius: "999px", border: "none", cursor: "pointer", background: showArchived ? "#28405C" : "none", color: showArchived ? "#39FF66" : "#8792A6" }}
              >
                Archivées
              </button>
            </div>
            <button
              onClick={() => setPickerOpen(true)}
              title="Nouvelle conversation"
              aria-label="Nouvelle conversation"
              style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#39FF66", border: "none", color: "#0D1B2A", fontWeight: 800, fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}
            >
              +
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
            {conversations.map((c) => {
              const info = resolveInfo(c);
              return (
                <div
                  key={c.key}
                  onClick={() => {
                    setActiveKey(c.key);
                    setPendingRecipient(null);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 10px",
                    borderRadius: "8px",
                    background: activeKey === c.key ? "#28405C" : "none",
                    cursor: "pointer",
                  }}
                >
                  <ProfileCircle name={info.avatarSeed} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: activeKey === c.key ? 700 : 500, color: "#F2F2E8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{info.name}</div>
                    {info.subtitle && <div style={{ fontSize: "11px", color: "#8792A6", marginTop: "1px" }}>{info.subtitle}</div>}
                  </div>
                  <ConversationMenu
                    showArchived={showArchived}
                    onArchive={(e) => handleArchive(e, c.key)}
                    onUnarchive={(e) => handleUnarchive(e, c.key)}
                    onDelete={(e) => handleDelete(e, c)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, padding: "14px" }}>
          {activeConversation || pendingRecipient ? (
            <>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px", padding: "4px" }}>
                {(activeConversation?.messages || []).map((m) => (
                  <MessageBubble key={m.id} m={m} isMe={m.senderId === myUserId} myUserId={myUserId} reactionsByMessage={reactionsByMessage} onToggleReaction={handleToggleReaction} />
                ))}
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
          ) : null}
        </div>
      </div>

      {pickerOpen && <RecipientPicker people={people} roles={roles} myUserId={myUserId} onConfirm={handleStartConversation} onCancel={() => setPickerOpen(false)} />}
    </>
  );
}

export function ChatTeamScreen({ myUserId, myRole, initialPersonId }) {
  const [collaborators, setCollaborators] = useState([]);

  useEffect(() => {
    loadCollaborators().then(setCollaborators);
  }, []);

  const people = collaborators.filter(isTeamMember).map((c) => ({ id: c.id, label: [c.name, c.last_name].filter(Boolean).join(" "), sublabel: roleLabel(c.role) }));

  const resolveInfo = (c) => {
    if (c.recipientRole) return { name: roleLabel(c.recipientRole), subtitle: null, avatarSeed: c.recipientRole };
    const members = (c.recipientIds || [])
      .filter((id) => id !== myUserId)
      .map((id) => collaborators.find((col) => col.id === id))
      .filter(Boolean);
    const name = members.length > 0 ? members.map((p) => [p.name, p.last_name].filter(Boolean).join(" ")).join(", ") : "Moi-même";
    const subtitle = members.length === 1 ? roleLabel(members[0].role) : members.length > 1 ? `Groupe (${members.length} personnes)` : null;
    return { name, subtitle, avatarSeed: name };
  };

  return (
    <div>
      <PageTitle>Chat Team</PageTitle>
      <ChatConversationsPanel scope="team" myUserId={myUserId} myRole={myRole} people={people} roles={ADMIN_ROLES} resolveInfo={resolveInfo} markerPrefix="chat_team" initialPersonId={initialPersonId} />
    </div>
  );
}

// Chats Users — vrai échange direct avec des utilisateurs précis de l'app, en plus de la vraie
// vue en lecture seule déjà existante sur les messages "Nous écrire" / "Signaler un problème"
// (celle-ci reste utile : elle montre ce qui arrive spontanément côté app, indépendamment de
// toute conversation démarrée depuis ici). Aucun vrai regroupement par rôle n'a de sens pour un
// simple utilisateur — pas de vrai mode "par type" ici, uniquement "par personne".
export function ChatUsersScreen({ myUserId, myRole }) {
  const [tab, setTab] = useState("conversations");
  const [users, setUsers] = useState([]);
  const [supportMessages, setSupportMessages] = useState(null);

  useEffect(() => {
    loadAppUsers().then(setUsers);
    loadSupportMessages().then(setSupportMessages);
    markAsRead(myUserId, "chat_clients");
  }, [myUserId]);

  const people = users.map((u) => ({ id: u.id, label: [u.name, u.last_name].filter(Boolean).join(" "), sublabel: u.bibro_code }));

  const resolveInfo = (c) => {
    const members = (c.recipientIds || [])
      .filter((id) => id !== myUserId)
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean);
    const name = members.length > 0 ? members.map((u) => [u.name, u.last_name].filter(Boolean).join(" ")).join(", ") : "Moi-même";
    const subtitle = members.length === 1 ? members[0].bibro_code : members.length > 1 ? `Groupe (${members.length} personnes)` : null;
    return { name, subtitle, avatarSeed: name };
  };

  return (
    <div>
      <PageTitle>Chats Users</PageTitle>
      <div style={{ display: "flex", gap: "8px", margin: "16px 0 0" }}>
        {[
          { key: "conversations", label: "Conversations" },
          { key: "support", label: "Support" },
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

      {tab === "conversations" ? (
        <ChatConversationsPanel scope="users" myUserId={myUserId} myRole={myRole} people={people} roles={null} resolveInfo={resolveInfo} markerPrefix="chat_users" />
      ) : (
        <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "12.5px", color: "#8792A6", margin: "0 0 16px" }}>
            Vue en lecture seule des messages envoyés spontanément depuis l'app ("Nous écrire" / "Signaler un problème") — indépendante des conversations ci-dessus.
          </p>
          {!supportMessages ? (
            <p style={{ color: "#8792A6" }}>Chargement...</p>
          ) : supportMessages.length === 0 ? (
            <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucun message pour l'instant.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {supportMessages.map((m) => (
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
      )}
    </div>
  );
}

// Chat Business — même vrai principe que Chats Users, mais un vrai mode "par type" a ici du
// sens : diffuser à tous les comptes Business d'un coup (role: "business"), en plus de choisir
// une ou plusieurs vraies entreprises précises.
export function ChatBusinessScreen({ myUserId, myRole }) {
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    loadBusinessAccounts().then(setBusinesses);
  }, []);

  const people = businesses.map((b) => ({ id: b.id, label: b.company_name || [b.name, b.last_name].filter(Boolean).join(" "), sublabel: b.company_name ? [b.name, b.last_name].filter(Boolean).join(" ") : null }));
  const roles = [{ key: "business", label: "Tous les comptes Business" }];

  const resolveInfo = (c) => {
    if (c.recipientRole) return { name: "Tous les comptes Business", subtitle: null, avatarSeed: "business" };
    const members = (c.recipientIds || [])
      .filter((id) => id !== myUserId)
      .map((id) => businesses.find((b) => b.id === id))
      .filter(Boolean);
    const name = members.length > 0 ? members.map((b) => b.company_name || [b.name, b.last_name].filter(Boolean).join(" ")).join(", ") : "Moi-même";
    const subtitle = members.length === 1 && members[0].company_name ? [members[0].name, members[0].last_name].filter(Boolean).join(" ") : members.length > 1 ? `Groupe (${members.length} comptes)` : null;
    return { name, subtitle, avatarSeed: name };
  };

  return (
    <div>
      <PageTitle>Chat Business</PageTitle>
      <ChatConversationsPanel scope="business" myUserId={myUserId} myRole={myRole} people={people} roles={roles} resolveInfo={resolveInfo} markerPrefix="chat_business" />
    </div>
  );
}
