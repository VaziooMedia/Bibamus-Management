import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";

// Compte des signalements encore "pending" (tous types de fiches confondus), mis à jour en
// temps réel via Supabase Realtime — même principe que useUserCount dans TopBar.jsx. Recompte
// tout à chaque changement plutôt que d'incrémenter/décrémenter, pour rester juste même si un
// signalement change de statut ailleurs (traité, ignoré, archivé) pendant que cet écran est ouvert.
// Compte des signalements encore "pending" (tous types de fiches confondus). Mis à jour en
// temps réel via Supabase Realtime quand c'est possible (même principe que useUserCount dans
// TopBar.jsx) — MAIS cela suppose que la table entity_reports a été explicitement activée pour
// la réplication temps réel côté Supabase (Database → Replication), un vrai réglage distinct du
// code qui n'est pas automatique. En complément, un vrai rafraîchissement de secours toutes les
// 15 secondes garantit que le badge reste juste même si ce réglage n'a jamais été fait.
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

    const interval = setInterval(refresh, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return count;
}
