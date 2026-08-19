import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminShell";
import { formatRelative } from "@/lib/admin/utils";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { runMutation } from "@/lib/admin/mutation-utils";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  component: NotifPage,
});

type NotifRow = {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  body: string | null;
  priority: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
  read_for_me: boolean;
};

function NotifPage() {
  const [items, setItems] = useState<NotifRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    setUserId(uid);
    if (!uid) { setLoading(false); return; }
    // Server-side redacted view: hides titles/bodies/links for records the
    // recipient cannot access; marketing never sees clinical identities.
    const { data, error } = await (supabase.rpc as any)("list_my_notifications", { p_limit: 100 });
    if (error) toast.error(error.message);
    setItems((data ?? []) as NotifRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`notif-page-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  async function markOneRead(n: NotifRow) {
    if (!userId || n.read_for_me) return;
    await runMutation(async () => {
      if (n.user_id === userId) {
        const { error } = await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", n.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_reads")
          .upsert({ user_id: userId, notification_id: n.id }, { onConflict: "user_id,notification_id" });
        if (error) throw error;
      }
    }, { silent: true });
    load();
  }

  async function markAllRead() {
    if (!userId) return;
    const personalUnread = items.filter((n) => n.user_id === userId && !n.read_at).map((n) => n.id);
    const globalUnread = items.filter((n) => n.user_id === null && !n.read_for_me).map((n) => n.id);
    const res = await runMutation(async () => {
      if (personalUnread.length) {
        const { error } = await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .in("id", personalUnread)
          .eq("user_id", userId);
        if (error) throw error;
      }
      if (globalUnread.length) {
        const rows = globalUnread.map((id) => ({ user_id: userId, notification_id: id }));
        const { error } = await supabase
          .from("notification_reads")
          .upsert(rows, { onConflict: "user_id,notification_id" });
        if (error) throw error;
      }
    }, { successMessage: "Notifications marquées comme lues" });
    if (res.ok) load();
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Événements et alertes de la clinique"
        actions={
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-full bg-white border border-black/10 px-4 py-2 text-sm text-petrol hover:bg-mint"
          >
            <CheckCheck className="h-4 w-4" /> Tout marquer lu
          </button>
        }
      />
      {loading ? (
        <div className="text-sm text-ink/50">Chargement…</div>
      ) : items.length === 0 ? (
        <EmptyState title="Aucune notification" icon={Bell} />
      ) : (
        <div className="rounded-2xl bg-white border border-black/5 divide-y divide-black/5">
          {items.map((n) => {
            const linkable = !!n.link;
            return (
              <button
                key={n.id}
                onClick={() => markOneRead(n)}
                className={`w-full text-left p-4 flex items-start gap-3 hover:bg-mint/10 transition-colors ${
                  n.read_for_me ? "" : "bg-mint/20"
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full mt-2 shrink-0 ${n.read_for_me ? "bg-ink/20" : "bg-teal"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-petrol font-medium">{n.title}</div>
                  {n.body && <div className="text-xs text-ink/60">{n.body}</div>}
                  <div className="text-[10px] text-ink/40 mt-1 flex items-center gap-2">
                    <span>{formatRelative(n.created_at)}</span>
                    {!linkable && (n.type || "").length > 0 && (
                      <span className="italic text-ink/30">· lien indisponible</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
