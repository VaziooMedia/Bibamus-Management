import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient.js";
import { loadAdminChatMessages, loadSupportMessages, loadReadMarkers } from "./sharedDirectories.js";
import { conversationKey, isVisibleToMe } from "./chatHelpers.js";

// Vrais compteurs de non-lus pour les 3 sections de chat — mis à jour en temps réel (mêmes
// principes que usePendingReportsCount), avec un vrai rafraîchissement de secours toutes les 15
// secondes au cas où la réplication temps réel ne serait pas activée sur ces tables.
//
// Chaque canal (team/users/business) compte les vrais messages qui ne sont pas de moi, dont la
// vraie conversation n'a jamais été marquée comme lue depuis son propre envoi. Chats Users
// ajoute en plus les vrais messages support ("Nous écrire" / "Signaler un problème") non lus.
function countUnreadForScope(messages, markerPrefix, myUserId, myRole, markers) {
  return messages
    .filter((m) => m.senderId !== myUserId && isVisibleToMe(m, myUserId, myRole))
    .filter((m) => {
      const lastRead = markers[`${markerPrefix}:${conversationKey(m)}`];
      return !lastRead || new Date(m.createdAt) > new Date(lastRead);
    }).length;
}

export function useUnreadChatCounts(myUserId, myRole) {
  const [counts, setCounts] = useState({ chatTeam: 0, chatUsers: 0, chatBusiness: 0 });

  const refresh = useCallback(async () => {
    if (!myUserId) return;
    const [teamMessages, usersMessages, businessMessages, supportMessages, markers] = await Promise.all([
      loadAdminChatMessages("team"),
      loadAdminChatMessages("users"),
      loadAdminChatMessages("business"),
      loadSupportMessages(),
      loadReadMarkers(myUserId),
    ]);

    const chatTeam = countUnreadForScope(teamMessages, "chat_team", myUserId, myRole, markers);
    const chatBusiness = countUnreadForScope(businessMessages, "chat_business", myUserId, myRole, markers);

    const usersConversationsUnread = countUnreadForScope(usersMessages, "chat_users", myUserId, myRole, markers);
    const clientsLastRead = markers["chat_clients"];
    const supportUnread = supportMessages.filter((m) => !clientsLastRead || new Date(m.created_at) > new Date(clientsLastRead)).length;

    setCounts({ chatTeam, chatUsers: usersConversationsUnread + supportUnread, chatBusiness });
  }, [myUserId, myRole]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("chat-unread-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_chat_messages" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_read_markers" }, refresh)
      .subscribe();
    const interval = setInterval(refresh, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [refresh]);

  return counts;
}
