"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Senha incorreta");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-panel px-6 py-8">
      <div className="rule-eyebrow eyebrow">Área administrativa</div>
      <h2 className="font-display font-extrabold text-xl mt-2">Digite a senha</h2>
      <div className="admin-row p-4 mt-4 max-w-xs flex flex-col gap-3">
        <div className="field">
          <label htmlFor="admin-password-input">Senha</label>
          <input
            id="admin-password-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") login();
            }}
          />
        </div>
        <button className="btn btn-brand btn-sm" onClick={login} disabled={loading} type="button">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
      {error ? (
        <p className="status-msg err mt-3" style={{ display: "inline-block" }}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
