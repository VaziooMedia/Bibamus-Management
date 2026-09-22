import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient.js";
import { loadAdminChatMessages, loadSupportMessages, loadReadMarkers } from "./sharedDirectories.js";
import { conversationKey, isVisibleToMe } from "./chatHelpers.js";

// Vrais compteurs de non-lus pour les 3 sections de chat — mis à jour en temps réel (mêmes
// principes que usePendingReportsCount), avec un vrai rafraîchissement de secours toutes les 15
// secondes au cas où la réplication temps réel ne serait pas activée sur ces tables.
//
// Chat Team : un vrai message compte comme non lu s'il n'est pas de moi, et que sa vraie
// conversation n'a jamais été marquée comme lue depuis son propre envoi.
// Chat clients : compte les vrais messages support envoyés après le dernier vrai marquage
// "chat_clients" comme lu.
// Chat Business : toujours 0 pour l'instant — aucune vraie source de données n'existe encore.
export function useUnreadChatCounts(myUserId, myRole) {
  const [counts, setCounts] = useState({ chatTeam: 0, chatClients: 0, chatBusiness: 0 });

  const refresh = useCallback(async () => {
    if (!myUserId) return;
    const [messages, supportMessages, markers] = await Promise.all([loadAdminChatMessages(), loadSupportMessages(), loadReadMarkers(myUserId)]);

    const chatTeam = messages
      .filter((m) => m.senderId !== myUserId && isVisibleToMe(m, myUserId, myRole))
      .filter((m) => {
        const lastRead = markers[`chat_team:${conversationKey(m)}`];
        return !lastRead || new Date(m.createdAt) > new Date(lastRead);
      }).length;

    const clientsLastRead = markers["chat_clients"];
    const chatClients = supportMessages.filter((m) => !clientsLastRead || new Date(m.created_at) > new Date(clientsLastRead)).length;

    setCounts({ chatTeam, chatClients, chatBusiness: 0 });
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
