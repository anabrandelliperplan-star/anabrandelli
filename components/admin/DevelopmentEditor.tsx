"use client";

import { useState } from "react";
import type { Development, DevelopmentStatus } from "@/lib/types";
import { Icon, ICON_MINIMIZE } from "@/lib/icons";
import { TypologyTableEditor } from "./TypologyTableEditor";
import { MultiPhotoField } from "./PhotoUploader";

const STATUS_OPTIONS: Array<[DevelopmentStatus, string]> = [
  ["progress", "Em obras"],
  ["ready", "Pronto para morar"],
  ["launch", "Lançamento"],
];

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="field sm:col-span-2">
      <label>{label}</label>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function DevelopmentEditor({
  dev,
  onCancel,
  onSave,
  onDelete,
  onToggleHidden,
  saving,
}: {
  dev: Development;
  onCancel: () => void;
  onSave: (dev: Development) => void;
  onDelete: () => void;
  onToggleHidden: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<Development>(dev);

  function set<K extends keyof Development>(key: K, value: Development[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="admin-row p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display font-bold text-sm">{draft.name}</p>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} type="button">
          <Icon html={ICON_MINIMIZE} />
          Minimizar
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome do empreendimento" value={draft.name} onChange={(v) => set("name", v)} />
        <Field label="Localização" value={draft.location} onChange={(v) => set("location", v)} />
        <Field label="Tipologia" value={draft.typology} onChange={(v) => set("typology", v)} />
        <div className="field">
          <label>Status</label>
          <select value={draft.status} onChange={(e) => set("status", e.target.value as DevelopmentStatus)}>
            {STATUS_OPTIONS.map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Field
          label='Previsão de entrega (ex.: Agosto/2028) — se o status for "Pronto para morar", coloque aqui a data que foi entregue (ex.: Agosto de 2023)'
          value={draft.statusDetail}
          onChange={(v) => set("statusDetail", v)}
        />
        <Field
          label="Valor a partir de (R$) — só números, sem ponto nem vírgula (ex.: 548717)"
          value={draft.priceFrom}
          type="number"
          onChange={(v) => set("priceFrom", Number(v) || 0)}
        />
        <Field
          label="Unidades disponíveis (ex.: 8 disponíveis)"
          value={draft.unidadesDisponiveis}
          onChange={(v) => set("unidadesDisponiveis", v)}
        />
        <Field
          label='Endereço — link do Google Maps/Waze (use "Enviar por link", não "Incorporar mapa")'
          value={draft.mapsLink}
          onChange={(v) => set("mapsLink", v)}
        />
        <Field
          label="Premiação (opcional — ex.: 2º lugar Prêmio Master Imobiliário)"
          value={draft.premiacao}
          onChange={(v) => set("premiacao", v)}
        />
        <Field label="Link da Tabela deste empreendimento" value={draft.tabelaLink} onChange={(v) => set("tabelaLink", v)} />
        <Field label="Link do Book" value={draft.bookLink} onChange={(v) => set("bookLink", v)} />
        <Field
          label="Link de todos os materiais (pasta geral do Drive)"
          value={draft.driveLink}
          onChange={(v) => set("driveLink", v)}
        />
        <Field
          label="Link do Material Descritivo"
          value={draft.materialDescritivoLink}
          onChange={(v) => set("materialDescritivoLink", v)}
        />
        <Field label="Link do Memorial de Vagas" value={draft.vagasGaragemLink} onChange={(v) => set("vagasGaragemLink", v)} />
        <div className="field sm:col-span-2">
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 400 }}>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={draft.vagasIndeterminadas}
              onChange={(e) => set("vagasIndeterminadas", e.target.checked)}
            />
            Vagas indeterminadas (sem memorial de vagas fixo — mostra esse aviso direto no card)
          </label>
        </div>
        <TextareaField label="Descrição (resumo do empreendimento)" value={draft.descricao} onChange={(v) => set("descricao", v)} />
        <TextareaField
          label="Fluxo de pagamento (ex.: 20% período obra (direto com a construtora) / 80% após a entrega (recursos próprios/financiamento))"
          value={draft.fluxoPagamento}
          onChange={(v) => set("fluxoPagamento", v)}
        />
      </div>
      <TypologyTableEditor value={draft.typologies} onChange={(cols) => set("typologies", cols)} />
      <MultiPhotoField
        value={draft.photos}
        onChange={(photos) => set("photos", photos)}
        pathPrefix={`developments/${draft.id}`}
      />
      <div className="flex gap-2">
        <button className="btn btn-brand btn-sm" onClick={() => onSave(draft)} disabled={saving} type="button">
          {saving ? "Salvando..." : "Salvar e publicar"}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button
          className="btn btn-outline btn-sm ml-auto"
          style={{ color: "var(--accent)", borderColor: "var(--accent)" }}
          onClick={onToggleHidden}
          type="button"
        >
          {draft.hidden ? "Mostrar na vitrine" : "Ocultar da vitrine"}
        </button>
        <button className="btn btn-danger btn-sm" onClick={onDelete} type="button">
          Remover
        </button>
      </div>
    </div>
  );
}
