"use client";

import { useState } from "react";
import type { Development, TabelaUnidade } from "@/lib/types";
import { waLink } from "@/lib/format";
import { buildTabelaWhatsAppMessage } from "@/lib/tabela-import";
import { money } from "@/lib/simulator";
import { Icon, ICON_SEARCH, ICON_TABLE } from "@/lib/icons";

function UnitResultRow({ unit, onSelect }: { unit: TabelaUnidade; onSelect: () => void }) {
  return (
    <button type="button" className="search-result-row" onMouseDown={(e) => e.preventDefault()} onClick={onSelect}>
      <Icon html={ICON_TABLE} />
      <span className="search-result-text">
        <span className="search-result-label">
          {unit.unitCode} <span className="search-result-dev">· {unit.pavimento}</span>
        </span>
        <span className="search-result-value">
          {unit.areaM2.toLocaleString("pt-BR")} m² · {money(unit.valorUnidade)}
        </span>
      </span>
    </button>
  );
}

export function UnitTableViewer({ dev }: { dev: Development }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);

  const hasUnits = Boolean(dev.tabelaUnidades && dev.tabelaUnidades.length);

  if (!hasUnits) {
    // Reserva a mesma altura da linha "Mandar fluxo para o cliente" mesmo
    // quando o empreendimento ainda não tem unidades salvas -- senão os
    // cards ficam desalinhados entre si (mesmo padrão usado em spec/premio).
    return (
      <div className="typ-details is-empty" aria-hidden="true">
        <div className="btn btn-ghost btn-sm w-full" style={{ justifyContent: "flex-start", textAlign: "left" }}>
          <Icon html={ICON_TABLE} />
          Mandar fluxo para o cliente
        </div>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = dev.tabelaUnidades.filter((u) => !q || u.unitCode.toLowerCase().includes(q)).slice(0, 8);

  function pick(idx: number) {
    setSelectedIdx(idx);
    setMessage(buildTabelaWhatsAppMessage(dev.tabelaUnidades[idx], dev));
    setCopied(false);
    setQuery(dev.tabelaUnidades[idx].unitCode);
    setOpen(false);
  }

  function clear() {
    setQuery("");
    setOpen(false);
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
    <details id={"unidades-" + dev.id} className="typ-details">
      <summary className="btn btn-ghost btn-sm w-full" style={{ justifyContent: "flex-start", textAlign: "left" }}>
        <Icon html={ICON_TABLE} />
        Mandar fluxo para o cliente
      </summary>
      <div className="mt-2">
        <div className="search-wrap" style={{ maxWidth: "none", margin: 0 }}>
          <div className="search-box">
            <button
              type="button"
              className="search-icon-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(true)}
              aria-label="Mostrar todas as unidades"
            >
              <Icon html={ICON_SEARCH} />
            </button>
            <input
              type="text"
              placeholder="Buscar unidade (ex.: T1-0706)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            <button type="button" className="search-clear" onClick={clear} aria-label="Limpar busca">
              ✕
            </button>
          </div>
          <div className="search-results" hidden={!open}>
            {filtered.length ? (
              filtered.map((u) => (
                <UnitResultRow key={u.unitCode + u.pavimento} unit={u} onSelect={() => pick(dev.tabelaUnidades.indexOf(u))} />
              ))
            ) : (
              <div className="search-empty">Nenhuma unidade encontrada para &quot;{query}&quot;.</div>
            )}
          </div>
        </div>

        {message && selectedIdx !== null ? (
          <div className="mt-3">
            <textarea
              rows={14}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: "100%",
                fontFamily: "inherit",
                fontSize: "0.85rem",
                padding: "0.6rem 0.7rem",
                border: "1px solid var(--border)",
                borderRadius: "0.6rem",
                background: "var(--surface)",
                color: "var(--text)",
              }}
            />
            <div className="flex flex-wrap items-end gap-2 mt-2">
              <div className="field" style={{ flex: 1, minWidth: "10rem" }}>
                <label>Número do cliente (WhatsApp)</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ex.: 5516999998888" />
              </div>
              <a
                className="btn btn-brand btn-sm"
                href={phone ? waLink(phone, message) : undefined}
                target="_blank"
                rel="noopener"
                onClick={(e) => {
                  if (!phone) e.preventDefault();
                }}
                style={!phone ? { opacity: 0.5, cursor: "default" } : undefined}
              >
                Enviar pelo WhatsApp
              </a>
              <button
                className="btn btn-outline btn-sm"
                style={{ color: "var(--accent)", borderColor: "var(--accent)" }}
                onClick={copyMessage}
                type="button"
              >
                {copied ? "Copiado!" : "Copiar mensagem"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </details>
  );
}
