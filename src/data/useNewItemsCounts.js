import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient.js";

// Vrais compteurs de nouveaux ajouts "à traiter" pour les 4 types de fiches — même principe que
// usePendingReportsCount/useUnreadChatCounts : un vrai recompte à chaque changement (realtime),
// avec un vrai rafraîchissement de secours toutes les 15 secondes si la réplication temps réel
// n'est pas activée sur ces tables.
//
// "À traiter" (status = "to_process") est le statut que porte toute nouvelle fiche, qu'elle
// vienne de l'app ou de la plateforme de gestion elle-même — created_via = "app" restreint donc
// le compte aux seules fiches venues de l'app, pour ne jamais notifier un ajout fait ici même.
// Distinct des "Nouvelles contributions" (data_contributions), qui concernent les modifications
// suggérées sur une fiche déjà existante, pas les nouveaux ajouts.
const TABLES = {
  drinks: "drinks_directory",
  venues: "public_venues",
  brands: "brands_directory",
  breweries: "breweries_directory",
};

export function useNewItemsCounts() {
  const [counts, setCounts] = useState({ drinks: 0, venues: 0, brands: 0, breweries: 0 });

  const refresh = useCallback(async () => {
    const entries = await Promise.all(
      Object.entries(TABLES).map(async ([key, table]) => {
        const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }).eq("status", "to_process").eq("created_via", "app");
        return [key, error ? 0 : count || 0];
      })
    );
    setCounts(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase.channel("new-items-counts");
    Object.values(TABLES).forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh);
    });
    channel.subscribe();
    const interval = setInterval(refresh, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [refresh]);

  return counts;
}
