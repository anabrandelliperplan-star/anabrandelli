"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SimulatorSettings } from "@/lib/types";
import { SPLIT_OPTIONS, buildWhatsAppText, money, simulate, type SimulatorInput, type SplitOption } from "@/lib/simulator";

function SettingsSection({
  settings,
  onSave,
}: {
  settings: SimulatorSettings;
  onSave: (s: SimulatorSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/simulator-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        onSave(await res.json());
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-row p-4 grid gap-3 sm:grid-cols-2 mb-6">
      <div className="field">
        <label>Meses de obra (trava a quantidade de mensais)</label>
        <input
          type="number"
          value={draft.mesesObra}
          onChange={(e) => setDraft((d) => ({ ...d, mesesObra: Number(e.target.value) || 0 }))}
        />
      </div>
      <div className="field">
        <label>% mínimo de ato</label>
        <input
          type="number"
          value={draft.percMinAto}
          onChange={(e) => setDraft((d) => ({ ...d, percMinAto: Number(e.target.value) || 0 }))}
        />
      </div>
      <div className="field sm:col-span-2" style={{ flexDirection: "row", alignItems: "center", gap: "1.5rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 400 }}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={draft.allowAnuais}
            onChange={(e) => setDraft((d) => ({ ...d, allowAnuais: e.target.checked }))}
          />
          Permitir parcelas anuais
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 400 }}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={draft.allowParcelaUnica}
            onChange={(e) => setDraft((d) => ({ ...d, allowParcelaUnica: e.target.checked }))}
          />
          Permitir parcela única
        </label>
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button className="btn btn-outline btn-sm" style={{ color: "var(--accent)", borderColor: "var(--accent)" }} onClick={save} disabled={saving} type="button">
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
        {saved ? <span className="status-msg ok">Salvo</span> : null}
      </div>
    </div>
  );
}

const EMPTY_INPUT: SimulatorInput = {
  valorImovel: 0,
  split: "20/80",
  ato: 0,
  sinal: 0,
  anuaisAtivo: false,
  anuaisQuantidade: 1,
  anuaisValor: 0,
  unicaAtivo: false,
  unicaValor: 0,
  unidadeLabel: "",
};

export function SimulatorPage({ initialSettings }: { initialSettings: SimulatorSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [input, setInput] = useState<SimulatorInput>(EMPTY_INPUT);
  const [copied, setCopied] = useState(false);

  function set<K extends keyof SimulatorInput>(key: K, value: SimulatorInput[K]) {
    setInput((i) => ({ ...i, [key]: value }));
    setCopied(false);
  }

  const result = useMemo(() => simulate(input, settings), [input, settings]);

  async function copyToWhatsApp() {
    const text = buildWhatsAppText(input, result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="admin-panel px-6 py-8">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <div className="rule-eyebrow eyebrow">Painel administrativo</div>
          <h2 className="font-display font-extrabold text-xl mt-2">Simulador de fluxo de pagamento</h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Visível só aqui por enquanto -- ainda não aparece na página pública.
          </p>
        </div>
        <Link href="/admin" className="btn btn-ghost btn-sm">
          Voltar ao painel
        </Link>
      </div>

      <h3 className="font-display font-bold text-sm mb-3">Configurações</h3>
      <SettingsSection settings={settings} onSave={setSettings} />

      <h3 className="font-display font-bold text-sm mb-3">Simular</h3>
      <div className="admin-row p-4 grid gap-3 sm:grid-cols-2 mb-6">
        <div className="field sm:col-span-2">
          <label>Unidade (opcional -- ex.: &quot;Unidade 142 - Torre Cerejeira | 84,50 m²&quot;)</label>
          <input type="text" value={input.unidadeLabel} onChange={(e) => set("unidadeLabel", e.target.value)} />
        </div>
        <div className="field">
          <label>Valor do imóvel (R$)</label>
          <input type="number" value={input.valorImovel || ""} onChange={(e) => set("valorImovel", Number(e.target.value) || 0)} />
        </div>
        <div className="field">
          <label>Split (obra / financiamento)</label>
          <select value={input.split} onChange={(e) => set("split", e.target.value as SplitOption)}>
            {SPLIT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "100/0" ? "100% no período de obra" : opt.replace("/", "% obra / ") + "% financiamento"}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Ato (R$)</label>
          <input type="number" value={input.ato || ""} onChange={(e) => set("ato", Number(e.target.value) || 0)} />
        </div>
        <div className="field">
          <label>Sinal (R$ cada, 3x -- 30/60/90 dias)</label>
          <input type="number" value={input.sinal || ""} onChange={(e) => set("sinal", Number(e.target.value) || 0)} />
        </div>
        {settings.allowAnuais ? (
          <>
            <div className="field">
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 400 }}>
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={input.anuaisAtivo}
                  onChange={(e) => set("anuaisAtivo", e.target.checked)}
                />
                Anuais
              </label>
            </div>
            <div className="field flex-row gap-2" style={{ flexDirection: "row" }}>
              <div style={{ flex: 1 }}>
                <label>Quantidade</label>
                <input
                  type="number"
                  disabled={!input.anuaisAtivo}
                  value={input.anuaisQuantidade}
                  onChange={(e) => set("anuaisQuantidade", Number(e.target.value) || 0)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Valor cada (R$)</label>
                <input
                  type="number"
                  disabled={!input.anuaisAtivo}
                  value={input.anuaisValor || ""}
                  onChange={(e) => set("anuaisValor", Number(e.target.value) || 0)}
                />
              </div>
            </div>
          </>
        ) : null}
        {settings.allowParcelaUnica ? (
          <>
            <div className="field">
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 400 }}>
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={input.unicaAtivo}
                  onChange={(e) => set("unicaAtivo", e.target.checked)}
                />
                Parcela única
              </label>
            </div>
            <div className="field">
              <label>Valor (R$)</label>
              <input
                type="number"
                disabled={!input.unicaAtivo}
                value={input.unicaValor || ""}
                onChange={(e) => set("unicaValor", Number(e.target.value) || 0)}
              />
            </div>
          </>
        ) : null}
      </div>

      <h3 className="font-display font-bold text-sm mb-3">Resultado</h3>
      <div className="admin-row p-4 mb-3">
        {result.atoAbaixoDoMinimo ? (
          <p className="status-msg err mb-3" style={{ display: "inline-block" }}>
            O ato está abaixo do mínimo de {result.percMinAtoAplicado}% do valor de obra ({money((result.valorObra * result.percMinAtoAplicado) / 100)}).
          </p>
        ) : null}
        {result.excedeuSaldoObra ? (
          <p className="status-msg err mb-3" style={{ display: "inline-block" }}>
            Ato + sinais + anuais + parcela única ultrapassam o valor do período de obra em {money(-result.saldoParaMensais)}.
          </p>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          <p>
            Valor do imóvel: <strong>{money(result.valorImovel)}</strong>
          </p>
          <p>
            Split: <strong>{input.split.replace("/", "% obra / ")}% financiamento</strong>
          </p>
          <p>
            Valor período de obra: <strong>{money(result.valorObra)}</strong>
          </p>
          <p>
            Valor financiamento (na entrega): <strong>{money(result.valorFinanciamento)}</strong>
          </p>
          <p>
            Ato: <strong>{money(result.ato)}</strong>
          </p>
          <p>
            3x Sinal (30/60/90 dias): <strong>{money(result.sinalUnitario)}</strong> cada (total {money(result.sinalTotal)})
          </p>
          {input.anuaisAtivo ? (
            <p>
              Anuais ({input.anuaisQuantidade}x): <strong>{money(input.anuaisValor)}</strong> cada (total {money(result.anuaisTotal)})
            </p>
          ) : null}
          {input.unicaAtivo ? (
            <p>
              Parcela única: <strong>{money(result.unicaTotal)}</strong>
            </p>
          ) : null}
          <p>
            Mensais ({result.mesesObra}x): <strong>{money(result.mensalValor)}</strong> cada
          </p>
        </div>
      </div>

      <button className="btn btn-brand btn-sm" onClick={copyToWhatsApp} type="button">
        {copied ? "Copiado!" : "Copiar para WhatsApp"}
      </button>
    </section>
  );
}
