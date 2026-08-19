import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminShell";
import { formatDateTime } from "@/lib/admin/utils";
import { ScrollText } from "lucide-react";

import { RequireAdmin } from "@/components/admin/RequireRole";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAdmin>
      <AuditPage />
    </RequireAdmin>
  ),
});

function AuditPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => setItems(data ?? []));
  }, []);
  return (
    <div>
      <PageHeader title="Journal d'audit" subtitle="Traçabilité de toutes les actions sensibles" />
      {items.length === 0 ? <EmptyState title="Aucun événement" icon={ScrollText} /> : (
        <div className="rounded-2xl bg-white border border-black/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-ink/50 border-b border-black/5"><tr><th className="text-left px-4 py-3">Date</th><th className="text-left">Action</th><th className="text-left">Entité</th><th className="text-left">Résumé</th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-black/5"><td className="px-4 py-3 whitespace-nowrap text-ink/60">{formatDateTime(a.created_at)}</td><td className="text-petrol">{a.action}</td><td className="text-ink/60">{a.entity_type}</td><td className="text-ink">{a.summary ?? "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
