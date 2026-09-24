import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";

// Compte des revendications encore "pending" — même vrai principe que
// usePendingReportsCount (temps réel via Supabase Realtime + rafraîchissement de secours
// toutes les 15 secondes, vu que la réplication temps réel suppose un vrai réglage explicite
// côté Supabase — Database → Replication — qui n'est pas automatique).
export function useOpenClaimsCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const refresh = async () => {
      const { count: c, error } = await supabase.from("entity_claims").select("id", { count: "exact", head: true }).eq("status", "pending");
      if (!error) setCount(c || 0);
    };
    refresh();

    const channel = supabase
      .channel("open-claims-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "entity_claims" }, refresh)
      .subscribe();

    const interval = setInterval(refresh, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return count;
}
