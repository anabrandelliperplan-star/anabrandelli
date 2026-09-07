"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ kind: "err", text: "A confirmação não bate com a nova senha" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "err", text: body.error || "Não foi possível trocar a senha" });
        return;
      }
      setMessage({ kind: "ok", text: "Senha alterada com sucesso." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h3 className="font-display font-bold text-sm mt-8 mb-3">Trocar senha do painel</h3>
      <div className="admin-row p-4 grid gap-3 sm:grid-cols-2 max-w-xl">
        <div className="field">
          <label>Senha atual</label>
          <input type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div />
        <div className="field">
          <label>Nova senha (mínimo 10 caracteres)</label>
          <input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>Confirmar nova senha</label>
          <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
      </div>
      {message ? (
        <div className={"status-msg " + message.kind + " mt-3"} style={{ display: "inline-block" }}>
          {message.text}
        </div>
      ) : null}
      <button className="btn btn-brand btn-sm mt-3" onClick={submit} disabled={saving} type="button">
        {saving ? "Salvando..." : "Trocar senha"}
      </button>
    </>
  );
}
