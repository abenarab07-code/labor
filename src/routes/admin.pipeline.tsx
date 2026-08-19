import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/AdminShell";
import { PIPELINE_STAGES, formatRelative } from "@/lib/admin/utils";
import { runMutation } from "@/lib/admin/mutation-utils";
import { updateRequestStatus } from "@/lib/admin/requests";

export const Route = createFileRoute("/admin/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  component: PipelinePage,
});

function PipelinePage() {
  const [items, setItems] = useState<any[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase.from("appointment_requests")
        .select("id, name, phone_e164, treatment, status, created_at, updated_at, temperature")
        .order("created_at", { ascending: false }).limit(500);
      if (!cancelled) setItems(data ?? []);
    }
    load();
    const ch = supabase.channel(`pipeline-live-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointment_requests" }, load).subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    PIPELINE_STAGES.forEach((s) => (g[s.key] = []));
    items.forEach((r) => { if (g[r.status]) g[r.status].push(r); });
    return g;
  }, [items]);

  async function moveTo(row: any, newStatus: string) {
    if (row.status === newStatus) return;
    await runMutation(
      () => updateRequestStatus(row.id, newStatus, row.updated_at ?? null),
      { busyRef, successMessage: "Déplacé" },
    );
  }

  return (
    <div>
      <PageHeader title="Pipeline" subtitle="Vue Kanban des demandes — glissez-déposez pour changer d'étape" />
      <div className="grid grid-flow-col auto-cols-[280px] gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((s) => (
          <div
            key={s.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const row = items.find((it) => it.id === dragging); if (row) moveTo(row, s.key); setDragging(null); }}
            className="bg-black/[0.02] rounded-2xl p-3 min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-xs font-medium text-petrol">{s.label}</div>
              <div className="text-xs text-ink/40">{grouped[s.key]?.length ?? 0}</div>
            </div>
            <div className="space-y-2">
              {grouped[s.key]?.map((r) => (
                <div
                  key={r.id}
                  draggable
                  onDragStart={() => setDragging(r.id)}
                  onDragEnd={() => setDragging(null)}
                  className="bg-white rounded-xl p-3 border border-black/5 hover:border-teal/40 cursor-grab active:cursor-grabbing"
                >
                  <Link to="/admin/demandes/$id" params={{ id: r.id }} className="block">
                    <div className="text-sm text-petrol truncate">{r.name}</div>
                    <div className="text-xs text-ink/50 truncate">{r.treatment ?? "—"}</div>
                    <div className="text-[10px] text-ink/40 mt-1 flex items-center justify-between">
                      <span>{formatRelative(r.created_at)}</span>
                      {r.temperature && <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${r.temperature === "chaud" ? "bg-red-100 text-red-600" : r.temperature === "tiede" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-600"}`}>{r.temperature}</span>}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
