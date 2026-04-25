import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { applySeo } from "@/lib/seo";
import { Sparkles, Mail, CheckCircle } from "lucide-react";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [email, setEmail]       = useState("");
  const [sent, setSent]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    applySeo({ title: "Sign in — Worthly AI", noindex: true });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/app", { replace: true });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        const params = new URLSearchParams(window.location.search);
        navigate(params.get("return_to") || "/app", { replace: true });
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });

    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(38_25%_97%)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "hsl(32 95% 54%)" }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Worthly AI</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 space-y-6">
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
              <div>
                <p className="font-semibold text-stone-800">Check your email</p>
                <p className="text-sm text-stone-500 mt-1">
                  We sent a magic link to <span className="font-medium text-stone-700">{email}</span>. Click it to sign in.
                </p>
              </div>
              <button
                onClick={() => setSent(false)}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="font-bold text-xl text-stone-900">Sign in</h1>
                <p className="text-sm text-stone-400 mt-1">
                  Get unlimited verdicts, price watches, and purchase history.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: "hsl(32 95% 54%)" }}
                >
                  {loading ? "Sending…" : "Send magic link"}
                </button>
              </form>

              <p className="text-[11px] text-center text-stone-400">
                No password needed. No spam. Just a sign-in link.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
