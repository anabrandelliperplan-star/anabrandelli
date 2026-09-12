"use client";

import { useState } from "react";
import Link from "next/link";
import type { Development } from "@/lib/types";
import { waLink } from "@/lib/format";
import { extractPdfRows, parseTabelaRows, buildTabelaWhatsAppMessage, type ExtractedUnit } from "@/lib/tabela-import";

function EditableCell({ value, onChange, width }: { value: string | number; onChange: (v: string) => void; width?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: width || "5.5rem",
        fontSize: "0.78rem",
        padding: "0.3rem 0.4rem",
        border: "1px solid var(--border)",
        borderRadius: "0.4rem",
        background: "var(--surface)",
        color: "var(--text)",
      }}
    />
  );
}

export function TabelaImportPage({ developments }: { developments: Development[] }) {
  const [devList, setDevList] = useState(developments);
  const [selectedDevId, setSelectedDevId] = useState("");
  const [units, setUnits] = useState<ExtractedUnit[]>([]);
  const [rawRows, setRawRows] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedUnitIdx, setSelectedUnitIdx] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedDev = devList.find((d) => d.id === selectedDevId) || null;

  function selectDevelopment(id: string) {
    setSelectedDevId(id);
    const dev = devList.find((d) => d.id === id);
    setUnits(dev?.tabelaUnidades || []);
    setRawRows([]);
    setSelectedUnitIdx(null);
    setMessage("");
    setSaved(false);
  }

  async function saveUnits() {
    if (!selectedDev) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/developments/${selectedDev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabelaUnidades: units }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDevList((list) => list.map((d) => (d.id === updated.id ? updated : d)));
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  async function onPickPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    setUnits([]);
    setRawRows([]);
    setSelectedUnitIdx(null);
    setMessage("");
    setSaved(false);
    try {
      const rows = await extractPdfRows(file);
      setRawRows(rows);
      setUnits(parseTabelaRows(rows));
    } catch {
      setRawRows(["Não consegui ler esse PDF -- tenta outro arquivo."]);
    } finally {
      setProcessing(false);
      e.target.value = "";
    }
  }

  function updateUnit<K extends keyof ExtractedUnit>(idx: number, key: K, raw: string) {
    setUnits((list) =>
      list.map((u, i) => {
        if (i !== idx) return u;
        const value = key === "unitCode" || key === "pavimento" ? raw : Number(raw.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        return { ...u, [key]: value };
      })
    );
    setSaved(false);
  }

  function addUnit() {
    setUnits((list) => [
      ...list,
      { unitCode: "", pavimento: "", areaM2: 0, valorUnidade: 0, ato: 0, mensal: 0, anual: 0, unica: 0, financiamento: 0 },
    ]);
    setSaved(false);
  }

  function removeUnit(idx: number) {
    setUnits((list) => list.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function selectUnit(idx: number) {
    if (!selectedDev) return;
    setSelectedUnitIdx(idx);
    setMessage(buildTabelaWhatsAppMessage(units[idx], selectedDev));
    setCopied(false);
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
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
          <h2 className="font-display font-extrabold text-xl mt-2">Importar tabela de vendas (PDF)</h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Depois de salvar, as unidades ficam visíveis para qualquer corretor na página pública desse empreendimento.
          </p>
        </div>
        <Link href="/admin" className="btn btn-ghost btn-sm">
          Voltar ao painel
        </Link>
      </div>

      <div className="admin-row p-4 grid gap-3 sm:grid-cols-2 mb-6">
        <div className="field">
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
        <div className="field">
          <label>PDF da tabela de vendas / espelho</label>
          <input type="file" accept="application/pdf" onChange={onPickPdf} disabled={processing || !selectedDev} />
          {!selectedDev ? (
            <p className="text-xs mt-1" style={{ color: "var(--text-2)" }}>
              Selecione o empreendimento antes de enviar o PDF.
            </p>
          ) : processing ? (
            <p className="text-xs mt-1" style={{ color: "var(--text-2)" }}>
              Lendo o PDF...
            </p>
          ) : null}
        </div>
      </div>

      {units.length > 0 ? (
        <>
          <h3 className="font-display font-bold text-sm mb-3">
            Unidades encontradas ({units.length}) -- confira e corrija se algo saiu errado
          </h3>
          <div className="admin-row p-2 mb-6" style={{ overflowX: "auto" }}>
            <table className="typ-table" style={{ minWidth: "60rem" }}>
              <thead>
                <tr>
                  <th>Unidade</th>
                  <th>Pavimento</th>
                  <th>Área (m²)</th>
                  <th>Valor</th>
                  <th>Ato</th>
                  <th>Mensal</th>
                  <th>Anual</th>
                  <th>Única</th>
                  <th>Financiamento</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {units.map((u, idx) => (
                  <tr key={idx} style={idx === selectedUnitIdx ? { background: "var(--surface-2)" } : undefined}>
                    <td>
                      <EditableCell value={u.unitCode} onChange={(v) => updateUnit(idx, "unitCode", v)} width="6rem" />
                    </td>
                    <td>
                      <EditableCell value={u.pavimento} onChange={(v) => updateUnit(idx, "pavimento", v)} width="6.5rem" />
                    </td>
                    <td>
                      <EditableCell value={u.areaM2} onChange={(v) => updateUnit(idx, "areaM2", v)} />
                    </td>
                    <td>
                      <EditableCell value={u.valorUnidade} onChange={(v) => updateUnit(idx, "valorUnidade", v)} width="6.5rem" />
                    </td>
                    <td>
                      <EditableCell value={u.ato} onChange={(v) => updateUnit(idx, "ato", v)} />
                    </td>
                    <td>
                      <EditableCell value={u.mensal} onChange={(v) => updateUnit(idx, "mensal", v)} />
                    </td>
                    <td>
                      <EditableCell value={u.anual} onChange={(v) => updateUnit(idx, "anual", v)} />
                    </td>
                    <td>
                      <EditableCell value={u.unica} onChange={(v) => updateUnit(idx, "unica", v)} />
                    </td>
                    <td>
                      <EditableCell value={u.financiamento} onChange={(v) => updateUnit(idx, "financiamento", v)} width="6.5rem" />
                    </td>
                    <td className="flex gap-1">
                      <button className="btn btn-brand btn-sm" onClick={() => selectUnit(idx)} type="button">
                        Gerar mensagem
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => removeUnit(idx)} type="button" aria-label="Remover unidade">
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <button className="btn btn-outline btn-sm" style={{ color: "var(--accent)", borderColor: "var(--accent)" }} onClick={addUnit} type="button">
              + Adicionar unidade manualmente
            </button>
            <button className="btn btn-brand btn-sm" onClick={saveUnits} disabled={saving || !selectedDev} type="button">
              {saving ? "Salvando..." : "Salvar unidades no empreendimento"}
            </button>
            {saved ? <span className="status-msg ok">Salvo -- já aparece na página pública para esse empreendimento</span> : null}
          </div>
        </>
      ) : selectedDev ? (
        <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
          Nenhuma unidade salva ainda para {selectedDev.name}. Envie um PDF acima para começar.
        </p>
      ) : null}

      {rawRows.length > 0 ? (
        <details className="mb-6">
          <summary className="btn btn-ghost btn-sm" style={{ display: "inline-flex", cursor: "pointer" }}>
            {units.length > 0 ? "Ver texto bruto extraído do PDF" : "Nenhuma unidade reconhecida -- ver texto bruto extraído"}
          </summary>
          <div className="admin-row p-3 mt-2 text-xs" style={{ maxHeight: "16rem", overflowY: "auto", whiteSpace: "pre-wrap", color: "var(--text-2)" }}>
            {rawRows.join("\n")}
          </div>
        </details>
      ) : null}

      {message ? (
        <>
          <h3 className="font-display font-bold text-sm mb-3">Mensagem</h3>
          <div className="admin-row p-4 mb-3">
            <textarea
              rows={16}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: "100%", fontFamily: "inherit", fontSize: "0.85rem", background: "transparent", border: "none", color: "var(--text)" }}
            />
          </div>
          <div className="admin-row p-4 flex flex-wrap items-end gap-3">
            <div className="field" style={{ flex: 1, minWidth: "12rem" }}>
              <label>Número do cliente (WhatsApp, com DDI+DDD)</label>
              <input type="text" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="ex.: 5516999998888" />
            </div>
            <a
              className="btn btn-brand btn-sm"
              href={clientPhone ? waLink(clientPhone, message) : undefined}
              target="_blank"
              rel="noopener"
              onClick={(e) => {
                if (!clientPhone) e.preventDefault();
              }}
              style={!clientPhone ? { opacity: 0.5, cursor: "default" } : undefined}
            >
              Enviar pelo WhatsApp
            </a>
            <button className="btn btn-outline btn-sm" style={{ color: "var(--accent)", borderColor: "var(--accent)" }} onClick={copyMessage} type="button">
              {copied ? "Copiado!" : "Copiar texto"}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
