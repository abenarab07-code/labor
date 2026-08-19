import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, User, Inbox, Calendar, ListChecks, Loader2 } from "lucide-react";

type Result = {
  result_type: "patient" | "request" | "appointment" | "followup";
  id: string;
  title: string;
  subtitle: string | null;
  route: string;
  status: string | null;
  occurred_at: string | null;
};

const ICON: Record<Result["result_type"], any> = {
  patient: User,
  request: Inbox,
  appointment: Calendar,
  followup: ListChecks,
};

const TYPE_LABEL: Record<Result["result_type"], string> = {
  patient: "Patient",
  request: "Demande",
  appointment: "Rendez-vous",
  followup: "Suivi",
};

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      setError(null);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) { setResults([]); setLoading(false); setError(null); return; }
    setLoading(true);
    setError(null);
    const myId = ++reqIdRef.current;
    const t = setTimeout(async () => {
      const { data, error } = await (supabase.rpc as any)("admin_global_search", { p_query: term, p_limit: 20 });
      if (myId !== reqIdRef.current) return;
      setLoading(false);
      if (error) {
        setError(/permission/i.test(error.message) ? "Accès refusé." : "Recherche indisponible.");
        setResults([]);
        return;
      }
      setResults((data ?? []) as Result[]);
      setActive(0);
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  if (!open) return null;

  function go(r: Result) {
    onClose();
    navigate({ to: r.route as any });
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active]); }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-black/5">
          <Search className="h-4 w-4 text-ink/50" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Rechercher patients, demandes, rendez-vous, suivis…"
            className="flex-1 bg-transparent outline-none text-sm placeholder-ink/40"
          />
          {loading && <Loader2 className="h-4 w-4 text-ink/40 animate-spin" />}
          <button onClick={onClose} className="text-ink/40 hover:text-petrol"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {error ? (
            <div className="p-6 text-sm text-red-600 text-center">{error}</div>
          ) : q.trim().length < 2 ? (
            <div className="p-6 text-xs text-ink/40 text-center">Tapez au moins 2 caractères. ↑ ↓ naviguer · ↵ ouvrir · Esc fermer.</div>
          ) : results.length === 0 && !loading ? (
            <div className="p-6 text-xs text-ink/40 text-center">Aucun résultat autorisé pour « {q} ».</div>
          ) : (
            <ul className="divide-y divide-black/5">
              {results.map((r, i) => {
                const Icon = ICON[r.result_type] ?? Search;
                return (
                  <li key={`${r.result_type}-${r.id}`}>
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(r)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 ${i === active ? "bg-mint/40" : "hover:bg-mint/20"}`}
                    >
                      <div className="h-8 w-8 rounded-lg bg-mint text-petrol flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-petrol truncate">{r.title}</div>
                        <div className="text-[11px] text-ink/50 truncate">{r.subtitle}</div>
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-ink/40 shrink-0">{TYPE_LABEL[r.result_type]}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Global hook: opens the palette on ⌘K / Ctrl+K. */
export function useGlobalSearchHotkey(open: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);
}
