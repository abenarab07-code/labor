import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminShell";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/admin/marketing")({
  head: () => ({ meta: [{ title: "Marketing — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  component: MarketingPage,
});

function MarketingPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [byPage, setByPage] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const from = new Date(); from.setDate(from.getDate() - 30);
      const { data } = await supabase.from("website_events").select("event_type, path, created_at").gte("created_at", from.toISOString()).order("created_at", { ascending: false }).limit(500);
      setEvents(data ?? []);
      const p: Record<string, number> = {};
      (data ?? []).forEach((e: any) => { const k = e.path ?? "?"; p[k] = (p[k] ?? 0) + 1; });
      setByPage(p);
    }
    load();
  }, []);

  const entries = Object.entries(byPage).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div>
      <PageHeader title="Marketing" subtitle="Sources d'acquisition et performance du site" />
      {events.length === 0 ? <EmptyState title="Aucun événement" description="Le tracking apparaîtra ici dès que le site enregistre du trafic." icon={Megaphone} /> : (
        <div className="rounded-2xl bg-white border border-black/5 p-5">
          <h3 className="font-serif text-lg text-petrol mb-4">Pages les plus vues (30j)</h3>
          <ul className="space-y-2">
            {entries.map(([k, v]) => (
              <li key={k}>
                <div className="flex justify-between text-xs mb-1"><span className="text-ink/70 truncate">{k}</span><span className="text-petrol tabular-nums">{v}</span></div>
                <div className="h-1.5 bg-black/5 rounded-full overflow-hidden"><div className="h-full bg-teal" style={{ width: `${(v / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
