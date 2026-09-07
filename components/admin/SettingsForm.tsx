"use client";

import { useState } from "react";
import type { Settings } from "@/lib/types";
import { SinglePhotoField } from "./PhotoUploader";

export function SettingsForm({
  settings,
  onSave,
  saving,
}: {
  settings: Settings;
  onSave: (settings: Settings) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<Settings>(settings);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setDraft((s) => ({ ...s, [key]: value }));
  }

  return (
    <>
      <h3 className="font-display font-bold text-sm mt-8 mb-3">Configurações gerais</h3>
      <SinglePhotoField
        label="Sua foto de perfil"
        value={draft.profilePhoto}
        onChange={(v) => set("profilePhoto", v)}
        pathPrefix="settings"
        thumbStyle={{ width: 80, height: 80 }}
      />
      <SinglePhotoField
        label="Logo da Perplan — versão tema escuro (imagem, com o texto já incluso)"
        hint="Sem logo enviado, mostramos um ícone genérico no lugar."
        value={draft.logoImage}
        onChange={(v) => set("logoImage", v)}
        pathPrefix="settings"
        thumbStyle={{ width: 80, height: 56, background: "var(--bg)" }}
      />
      <SinglePhotoField
        label="Logo da Perplan — versão tema claro (opcional; sem isso, usamos a mesma logo do tema escuro)"
        value={draft.logoImageLight}
        onChange={(v) => set("logoImageLight", v)}
        pathPrefix="settings"
        thumbStyle={{ width: 80, height: 56, background: "var(--bg)" }}
      />
      <div className="admin-row p-4 grid gap-3 sm:grid-cols-2 mt-3">
        <div className="field">
          <label>WhatsApp (só números, com DDI+DDD)</label>
          <input type="text" value={draft.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
        </div>
        <div className="field">
          <label>Instagram (sem @)</label>
          <input type="text" value={draft.instagram} onChange={(e) => set("instagram", e.target.value)} />
        </div>
        <div className="field">
          <label>E-mail</label>
          <input type="text" value={draft.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="field">
          <label>Telefone para exibição</label>
          <input type="text" value={draft.phoneDisplay} onChange={(e) => set("phoneDisplay", e.target.value)} />
        </div>
        <div className="field">
          <label>Link do Drive — Todas as Tabelas de Vendas do Mês</label>
          <input type="text" value={draft.tabelaDriveLink} onChange={(e) => set("tabelaDriveLink", e.target.value)} />
        </div>
      </div>
      <button className="btn btn-brand btn-sm mt-3" onClick={() => onSave(draft)} disabled={saving} type="button">
        {saving ? "Salvando..." : "Salvar configurações"}
      </button>
    </>
  );
}
