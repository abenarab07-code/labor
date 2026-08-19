import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock } from "lucide-react";

export function AdminLogin({
  unauthorized = false,
  onSignedIn,
}: {
  unauthorized?: boolean;
  onSignedIn?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr("Identifiants invalides. Vérifiez votre email et mot de passe.");
      return;
    }
    onSignedIn?.();
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-[#0b1618] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-teal/15 text-teal items-center justify-center mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-3xl text-ivory">Dr Tarfaya Lab OS</h1>
          <p className="text-ivory/50 text-sm mt-2">Accès réservé à l'équipe</p>
        </div>

        {unauthorized ? (
          <div className="rounded-2xl bg-[#122326] border border-white/5 p-8 text-center">
            <h2 className="text-ivory font-medium">Accès non autorisé</h2>
            <p className="text-ivory/60 text-sm mt-2">
              Votre compte n'a pas les permissions requises. Contactez un administrateur.
            </p>
            <button
              onClick={signOut}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 text-ivory px-5 py-2.5 text-sm hover:bg-white/15"
            >
              Se déconnecter
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-2xl bg-[#122326] border border-white/5 p-8 space-y-4"
          >
            <div>
              <label className="block text-xs uppercase tracking-wider text-ivory/50 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-ivory placeholder-ivory/30 focus:border-teal outline-none"
                placeholder="vous@cabinet.tld"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-ivory/50 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-ivory placeholder-ivory/30 focus:border-teal outline-none"
                autoComplete="current-password"
              />
            </div>
            {err && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal text-petrol font-medium py-3 hover:bg-teal/90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Se connecter
            </button>
            <p className="text-center text-xs text-ivory/40">Compte protégé — accès surveillé.</p>
          </form>
        )}
      </div>
    </div>
  );
}
