"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Development, HubData, Settings } from "@/lib/types";
import { money, statusBadge } from "@/lib/format";
import { DevelopmentEditor } from "./DevelopmentEditor";
import { SettingsForm } from "./SettingsForm";
import { ChangePasswordForm } from "./ChangePasswordForm";

type StatusMsg = { kind: "info" | "ok" | "err"; text: string } | null;

function DevRow({
  dev,
  onEdit,
}: {
  dev: Development;
  onEdit: () => void;
}) {
  return (
    <div className="admin-row p-4 flex items-center justify-between gap-3" style={dev.hidden ? { opacity: 0.55 } : undefined}>
      <div>
        <p className="font-display font-bold text-sm">
          {dev.name}
          {dev.hidden ? (
            <span className="badge badge-progress" style={{ verticalAlign: "middle", marginLeft: "0.5rem" }}>
              Oculto
            </span>
          ) : null}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
          {money(dev.priceFrom)} · {statusBadge(dev).label}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button className="btn btn-ghost btn-sm" onClick={onEdit} type="button">
          Editar
        </button>
      </div>
    </div>
  );
}

export function AdminDashboard({ initialData }: { initialData: HubData }) {
  const router = useRouter();
  const [developments, setDevelopments] = useState<Development[]>(initialData.developments);
  const [settings, setSettings] = useState<Settings>(initialData.settings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMsg>(null);
  const [saving, setSaving] = useState(false);

  async function addDevelopment() {
    const res = await fetch("/api/admin/developments", { method: "POST" });
    if (!res.ok) {
      setStatus({ kind: "err", text: "Não foi possível criar o empreendimento." });
      return;
    }
    const dev: Development = await res.json();
    setDevelopments((list) => [...list, dev]);
    setEditingId(dev.id);
  }

  async function saveDevelopment(dev: Development) {
    setSaving(true);
    setStatus({ kind: "info", text: "Salvando..." });
    try {
      const res = await fetch(`/api/admin/developments/${dev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dev),
      });
      if (!res.ok) throw new Error();
      const saved: Development = await res.json();
      setDevelopments((list) => list.map((d) => (d.id === saved.id ? saved : d)));
      setEditingId(null);
      setStatus({ kind: "ok", text: "Publicado! Todos que acessarem o site já veem a atualização." });
    } catch {
      setStatus({ kind: "err", text: "Não foi possível salvar agora. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  async function removeDevelopment(id: string) {
    if (!window.confirm("Remover este empreendimento da vitrine?")) return;
    const res = await fetch(`/api/admin/developments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setStatus({ kind: "err", text: "Não foi possível remover." });
      return;
    }
    setDevelopments((list) => list.filter((d) => d.id !== id));
    setEditingId(null);
  }

  async function toggleHidden(dev: Development) {
    const res = await fetch(`/api/admin/developments/${dev.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !dev.hidden }),
    });
    if (!res.ok) return;
    const saved: Development = await res.json();
    setDevelopments((list) => list.map((d) => (d.id === saved.id ? saved : d)));
  }

  async function saveSettings(next: Settings) {
    setSaving(true);
    setStatus({ kind: "info", text: "Salvando..." });
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error();
      const saved: Settings = await res.json();
      setSettings(saved);
      setStatus({ kind: "ok", text: "Configurações salvas." });
    } catch {
      setStatus({ kind: "err", text: "Não foi possível salvar agora. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <section className="admin-panel px-6 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="rule-eyebrow eyebrow">Painel administrativo</div>
          <h2 className="font-display font-extrabold text-xl mt-2">Materiais e configurações</h2>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout} type="button">
          Sair
        </button>
      </div>

      {status ? <div className={"status-msg " + status.kind + " mt-4"} style={{ display: "inline-block" }}>{status.text}</div> : null}

      <h3 className="font-display font-bold text-sm mt-8 mb-3">Empreendimentos</h3>
      <div className="flex flex-col gap-3">
        {developments.map((dev) =>
          editingId === dev.id ? (
            <DevelopmentEditor
              key={dev.id}
              dev={dev}
              saving={saving}
              onCancel={() => setEditingId(null)}
              onSave={saveDevelopment}
              onDelete={() => removeDevelopment(dev.id)}
              onToggleHidden={() => toggleHidden(dev)}
            />
          ) : (
            <DevRow key={dev.id} dev={dev} onEdit={() => setEditingId(dev.id)} />
          )
        )}
      </div>
      <button
        className="btn btn-outline btn-sm mt-3"
        style={{ color: "var(--accent)", borderColor: "var(--accent)" }}
        onClick={addDevelopment}
        type="button"
      >
        + Adicionar empreendimento
      </button>

      <SettingsForm settings={settings} onSave={saveSettings} saving={saving} />
      <ChangePasswordForm />
    </section>
  );
}
