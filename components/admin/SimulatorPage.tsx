"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Development, SimulatorSettings } from "@/lib/types";
import { formatDeliveryDate, parseDeliveryToYearMonth } from "@/lib/format";
import {
  SPLIT_OPTIONS,
  addMonths,
  buildWhatsAppText,
  formatMoneyInputValue,
  formatMonthYear,
  money,
  parseAreaInput,
  parseMoneyInput,
  simulate,
  type DevSimDates,
  type SimulatorInput,
  type SplitOption,
} from "@/lib/simulator";

// Campos de dinheiro usam type="text" + parseMoneyInput (aceita centavos com
// vírgula, ex. "587.354,80") -- um <input type="number"> interpreta
// "587.354" como 587,354 (ponto = decimal do navegador), não como milhar
// brasileiro.
function MoneyField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={formatMoneyInputValue(value)}
        onChange={(e) => onChange(parseMoneyInput(e.target.value))}
      />
    </div>
  );
}

function MonthField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="month" disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

interface DevDatesDraft {
  simAtoMes: string;
  simSinal1Mes: string;
  simSinal2Mes: string;
  simSinal3Mes: string;
}

function DevDatesSection({
  dev,
  onSaved,
}: {
  dev: Development;
  onSaved: (dev: Development) => void;
}) {
  const [draft, setDraft] = useState<DevDatesDraft>({
    simAtoMes: dev.simAtoMes,
    simSinal1Mes: dev.simSinal1Mes,
    simSinal2Mes: dev.simSinal2Mes,
    simSinal3Mes: dev.simSinal3Mes,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setField<K extends keyof DevDatesDraft>(key: K, value: DevDatesDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/developments/${dev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        onSaved(await res.json());
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  const entregaMes = parseDeliveryToYearMonth(dev.statusDetail);

  return (
    <div className="admin-row p-4 grid gap-3 sm:grid-cols-2 mb-6">
      <p className="sm:col-span-2 text-sm" style={{ color: "var(--text-2)" }}>
        Data de entrega cadastrada: <strong>{formatDeliveryDate(dev.statusDetail) || "não informada"}</strong>
        {entregaMes ? "" : " -- preencha uma data de entrega reconhecível (ex.: \"Agosto/2028\") na edição do empreendimento para o simulador calcular os meses restantes."}
      </p>
      <MonthField label="Data do Ato (mês/ano)" value={draft.simAtoMes} onChange={(v) => setField("simAtoMes", v)} />
      <div />
      <MonthField label="Data do Sinal 1 (mês/ano)" value={draft.simSinal1Mes} onChange={(v) => setField("simSinal1Mes", v)} />
      <MonthField label="Data do Sinal 2 (mês/ano)" value={draft.simSinal2Mes} onChange={(v) => setField("simSinal2Mes", v)} />
      <MonthField label="Data do Sinal 3 (mês/ano)" value={draft.simSinal3Mes} onChange={(v) => setField("simSinal3Mes", v)} />
      <p className="sm:col-span-2 text-xs" style={{ color: "var(--text-2)" }}>
        Mensais começam automaticamente no mês seguinte ao Sinal 3. Anuais e parcela única não podem cair depois da
        data de entrega. Nenhum dos dois precisa ser configurado à parte.
      </p>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button className="btn btn-outline btn-sm" style={{ color: "var(--accent)", borderColor: "var(--accent)" }} onClick={save} disabled={saving} type="button">
          {saving ? "Salvando..." : "Salvar datas deste empreendimento"}
        </button>
        {saved ? <span className="status-msg ok">Salvo</span> : null}
      </div>
    </div>
  );
}

function GlobalSettingsSection({
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
    <div className="admin-row p-4 mb-6">
      <div className="flex items-center gap-6 mb-3">
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 400 }}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={draft.allowAnuais}
            onChange={(e) => {
              setDraft((d) => ({ ...d, allowAnuais: e.target.checked }));
              setSaved(false);
            }}
          />
          Permitir parcelas anuais
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 400 }}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={draft.allowParcelaUnica}
            onChange={(e) => {
              setDraft((d) => ({ ...d, allowParcelaUnica: e.target.checked }));
              setSaved(false);
            }}
          />
          Permitir parcela única
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn btn-outline btn-sm" style={{ color: "var(--accent)", borderColor: "var(--accent)" }} onClick={save} disabled={saving} type="button">
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {saved ? <span className="status-msg ok">Salvo</span> : null}
      </div>
    </div>
  );
}

const EMPTY_INPUT: SimulatorInput = {
  developmentName: "",
  valorImovel: 0,
  areaM2: 0,
  split: "20/80",
  ato: 0,
  sinal: 0,
  mensalValor: 0,
  anuaisAtivo: false,
  anuaisQuantidade: 1,
  anuaisValor: 0,
  anuaisInicioMes: "",
  unicaAtivo: false,
  unicaValor: 0,
  unicaMes: "",
  unidadeLabel: "",
};

export function SimulatorPage({
  initialSettings,
  developments,
}: {
  initialSettings: SimulatorSettings;
  developments: Development[];
}) {
  const [devList, setDevList] = useState(developments);
  const [settings, setSettings] = useState(initialSettings);
  const [input, setInput] = useState<SimulatorInput>(EMPTY_INPUT);
  const [selectedDevId, setSelectedDevId] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedDev = devList.find((d) => d.id === selectedDevId) || null;

  function set<K extends keyof SimulatorInput>(key: K, value: SimulatorInput[K]) {
    setInput((i) => ({ ...i, [key]: value }));
    setCopied(false);
  }

  function selectDevelopment(id: string) {
    setSelectedDevId(id);
    const dev = devList.find((d) => d.id === id);
    setInput((i) => ({
      ...i,
      developmentName: dev ? dev.name : "",
      valorImovel: dev ? dev.priceFrom : i.valorImovel,
    }));
    setCopied(false);
  }

  const dates: DevSimDates = useMemo(() => {
    const sinal3Mes = selectedDev?.simSinal3Mes || "";
    return {
      atoMes: selectedDev?.simAtoMes || "",
      sinal1Mes: selectedDev?.simSinal1Mes || "",
      sinal2Mes: selectedDev?.simSinal2Mes || "",
      sinal3Mes,
      // Mensais começam automaticamente no mês seguinte ao Sinal 3.
      mensalInicioMes: sinal3Mes ? addMonths(sinal3Mes, 1) : "",
      entregaMes: (selectedDev && parseDeliveryToYearMonth(selectedDev.statusDetail)) || "",
    };
  }, [selectedDev]);

  const result = useMemo(() => simulate(input, dates), [input, dates]);

  async function copyToWhatsApp() {
    const text = buildWhatsAppText(input, result, dates);
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

      <div className="field mb-6" style={{ maxWidth: 28 + "rem" }}>
        <label>Empreendimento</label>
        <select value={selectedDevId} onChange={(e) => selectDevelopment(e.target.value)}>
          <option value="">Selecione um empreendimento</option>
          {devList.map((dev) => (
            <option key={dev.id} value={dev.id}>
              {dev.name}
            </option>
          ))}
        </select>
      </div>

      {selectedDev ? (
        <>
          <h3 className="font-display font-bold text-sm mb-3">Datas deste empreendimento</h3>
          <DevDatesSection
            dev={selectedDev}
            onSaved={(updated) => setDevList((list) => list.map((d) => (d.id === updated.id ? updated : d)))}
          />

          <h3 className="font-display font-bold text-sm mb-3">Configurações gerais</h3>
          <GlobalSettingsSection settings={settings} onSave={setSettings} />

          <h3 className="font-display font-bold text-sm mb-3">Simular</h3>
          <div className="admin-row p-4 grid gap-3 sm:grid-cols-2 mb-6">
            <div className="field sm:col-span-2">
              <label>Unidade (opcional -- ex.: &quot;Unidade 142 - Torre Cerejeira | 84,50 m²&quot;)</label>
              <input type="text" value={input.unidadeLabel} onChange={(e) => set("unidadeLabel", e.target.value)} />
            </div>
            <MoneyField label="Valor do imóvel (R$)" value={input.valorImovel} onChange={(v) => set("valorImovel", v)} />
            <div className="field">
              <label>Área (m²) -- opcional, ex.: 84,50</label>
              <input
                type="text"
                inputMode="decimal"
                value={input.areaM2 ? input.areaM2.toLocaleString("pt-BR") : ""}
                onChange={(e) => set("areaM2", parseAreaInput(e.target.value))}
              />
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
            <div />
            <MoneyField label={`Ato (R$) -- ${dates.atoMes ? formatMonthYear(dates.atoMes) : "data não configurada"}`} value={input.ato} onChange={(v) => set("ato", v)} />
            <MoneyField
              label={`Sinal (R$ cada, 3x) -- ${[dates.sinal1Mes, dates.sinal2Mes, dates.sinal3Mes].filter(Boolean).map(formatMonthYear).join(", ") || "datas não configuradas"}`}
              value={input.sinal}
              onChange={(v) => set("sinal", v)}
            />

            <MoneyField
              label={`Mensal (R$ cada, ${result.mesesObra}x -- a partir de ${dates.mensalInicioMes ? formatMonthYear(dates.mensalInicioMes) : "configure o Sinal 3 acima"})`}
              value={input.mensalValor}
              onChange={(v) => set("mensalValor", v)}
            />
            <p className="text-xs self-end pb-2" style={{ color: "var(--text-2)" }}>
              Quantidade calculada automaticamente: meses entre hoje e a entrega ({formatMonthYear(dates.entregaMes) || "sem data de entrega"}). Diminui sozinha a cada mês que passa.
            </p>

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
                <div />
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
                    <MoneyField label="Valor cada (R$)" value={input.anuaisValor} onChange={(v) => set("anuaisValor", v)} disabled={!input.anuaisAtivo} />
                  </div>
                </div>
                <MonthField
                  label="1ª anual em (mês/ano)"
                  value={input.anuaisInicioMes}
                  onChange={(v) => set("anuaisInicioMes", v)}
                  disabled={!input.anuaisAtivo}
                />
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
                <div />
                <MoneyField label="Valor (R$)" value={input.unicaValor} onChange={(v) => set("unicaValor", v)} disabled={!input.unicaAtivo} />
                <MonthField label="Cai em (mês/ano)" value={input.unicaMes} onChange={(v) => set("unicaMes", v)} disabled={!input.unicaAtivo} />
              </>
            ) : null}
          </div>

          <h3 className="font-display font-bold text-sm mb-3">Resultado</h3>
          <div className="admin-row p-4 mb-3">
            {result.saldoFaltante > 0 ? (
              <p className="status-msg err mb-3" style={{ display: "inline-block" }}>
                Falta {money(result.saldoFaltante)} para fechar o valor do período de obra com o fluxo desejado -- ato +
                sinais + anuais + parcela única + mensais ainda não cobrem {money(result.valorObra)}.
              </p>
            ) : result.saldoFaltante < 0 ? (
              <p className="status-msg info mb-3" style={{ display: "inline-block" }}>
                Esse fluxo coleta {money(-result.saldoFaltante)} a mais do que o valor do período de obra.
              </p>
            ) : null}
            {result.mensalExcedeuLimite ? (
              <p className="status-msg err mb-3" style={{ display: "inline-block" }}>
                As mensais terminam em {formatMonthYear(result.mensalFimMes)}, depois da entrega ({formatMonthYear(dates.entregaMes)}).
              </p>
            ) : null}
            {result.anuaisExcedeuLimite ? (
              <p className="status-msg err mb-3" style={{ display: "inline-block" }}>
                As anuais terminam em {formatMonthYear(result.anuaisFimMes)}, depois da entrega ({formatMonthYear(dates.entregaMes)}).
              </p>
            ) : null}
            {result.unicaExcedeuLimite ? (
              <p className="status-msg err mb-3" style={{ display: "inline-block" }}>
                A parcela única está em {formatMonthYear(input.unicaMes)}, depois da entrega ({formatMonthYear(dates.entregaMes)}).
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 mb-4">
              <div className="admin-row p-3">
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
                  A pagar no período de obra
                </p>
                <p className="font-display font-extrabold text-2xl mt-1">{money(result.valorObra)}</p>
              </div>
              <div className="admin-row p-3">
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
                  A pagar pós-obra (financiamento)
                </p>
                <p className="font-display font-extrabold text-2xl mt-1">{money(result.valorFinanciamento)}</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <p>
                Valor do imóvel: <strong>{money(result.valorImovel)}</strong>
              </p>
              {result.areaM2 > 0 ? (
                <p>
                  Área: <strong>{result.areaM2.toLocaleString("pt-BR")} m²</strong> ({money(result.valorPorM2)}/m²)
                </p>
              ) : null}
              <p>
                Split: <strong>{input.split.replace("/", "% obra / ")}% financiamento</strong>
              </p>
              <p>
                Ato ({formatMonthYear(dates.atoMes)}): <strong>{money(result.ato)}</strong>
              </p>
              <p>
                Sinais ({[dates.sinal1Mes, dates.sinal2Mes, dates.sinal3Mes].filter(Boolean).map(formatMonthYear).join(", ")}): <strong>{money(result.sinalUnitario)}</strong> cada (total {money(result.sinalTotal)})
              </p>
              {input.anuaisAtivo ? (
                <p>
                  Anuais ({input.anuaisQuantidade}x a partir de {formatMonthYear(input.anuaisInicioMes)}): <strong>{money(input.anuaisValor)}</strong> cada (total {money(result.anuaisTotal)})
                </p>
              ) : null}
              {input.unicaAtivo ? (
                <p>
                  Parcela única ({formatMonthYear(input.unicaMes)}): <strong>{money(result.unicaTotal)}</strong>
                </p>
              ) : null}
              <p>
                Mensais ({result.mesesObra}x a partir de {formatMonthYear(dates.mensalInicioMes)}): <strong>{money(result.mensalValor)}</strong> cada (total {money(result.mensalTotal)})
              </p>
              <p>
                Total coletado no período de obra: <strong>{money(result.totalColetadoObra)}</strong>
              </p>
            </div>
          </div>

          <button className="btn btn-brand btn-sm" onClick={copyToWhatsApp} type="button">
            {copied ? "Copiado!" : "Copiar para WhatsApp"}
          </button>
        </>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Selecione um empreendimento acima para configurar as datas e simular.
        </p>
      )}
    </section>
  );
}
