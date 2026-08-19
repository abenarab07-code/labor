import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminShell";
import { formatRelative } from "@/lib/admin/utils";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/admin/activite")({
  head: () => ({ meta: [{ title: "Activité — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  component: ActivityPage,
});

function ActivityPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase.from("patient_activities")
        .select("id, type, summary, created_at, patient_id, request_id").order("created_at", { ascending: false }).limit(200);
      if (!cancelled) setItems(data ?? []);
    }
    load();
    const ch = supabase.channel(`activity-live-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_activities" }, load).subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  return (
    <div>
      <PageHeader title="Centre d'activité" subtitle="Tous les événements du CRM en direct" />
      {items.length === 0 ? <EmptyState title="Aucune activité" icon={Activity} /> : (
        <div className="rounded-2xl bg-white border border-black/5 divide-y divide-black/5">
          {items.map((a) => (
            <div key={a.id} className="p-4 flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-teal mt-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-petrol">{a.summary}</div>
                <div className="text-[10px] text-ink/40 uppercase tracking-wide">{a.type} · {formatRelative(a.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
