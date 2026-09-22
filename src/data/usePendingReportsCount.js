import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";

// Compte des signalements encore "pending" (tous types de fiches confondus), mis à jour en
// temps réel via Supabase Realtime — même principe que useUserCount dans TopBar.jsx. Recompte
// tout à chaque changement plutôt que d'incrémenter/décrémenter, pour rester juste même si un
// signalement change de statut ailleurs (traité, ignoré, archivé) pendant que cet écran est ouvert.
export function usePendingReportsCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const refresh = async () => {
      const { count: c, error } = await supabase.from("entity_reports").select("id", { count: "exact", head: true }).eq("status", "pending");
      if (!error) setCount(c || 0);
    };
    refresh();

    const channel = supabase
      .channel("pending-reports-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "entity_reports" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
