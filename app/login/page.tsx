"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { n8nFetch } from "@/lib/api/n8nClient";
import { setToken } from "@/lib/auth/token";

type LoginOk = {
  token: string;
  user?: { id: string; email: string; role?: string };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim() && password.trim(), [email, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await n8nFetch<LoginOk>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      const token = res.data?.token;
      if (!res.ok || !token) {
        setError(res.errors?.[0]?.message || "Connexion impossible.");
        return;
      }
      setToken(token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
        <p className="text-sm text-stone-600">
          Auth gérée par n8n (login → JWT). Renseigne un compte seedé dans Postgres une fois les workflows prêts.
        </p>

        <form onSubmit={onSubmit} className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-800" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="ex: admin@cabinet.fr"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-800" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

