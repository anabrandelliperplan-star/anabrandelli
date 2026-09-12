"use client";

import { useState } from "react";
import type { Development } from "@/lib/types";
import { waLink } from "@/lib/format";
import { buildTabelaWhatsAppMessage } from "@/lib/tabela-import";
import { money } from "@/lib/simulator";
import { Icon, ICON_TABLE } from "@/lib/icons";

export function UnitTableViewer({ dev }: { dev: Development }) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);

  if (!dev.tabelaUnidades || dev.tabelaUnidades.length === 0) return null;

  const q = query.trim().toLowerCase();
  const filtered = dev.tabelaUnidades.filter((u) => !q || u.unitCode.toLowerCase().includes(q));

  function pick(idx: number) {
    setSelectedIdx(idx);
    setMessage(buildTabelaWhatsAppMessage(dev.tabelaUnidades[idx], dev));
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
    <details id={"unidades-" + dev.id} className="typ-details">
      <summary className="btn btn-ghost btn-sm w-full" style={{ justifyContent: "flex-start", textAlign: "left" }}>
        <Icon html={ICON_TABLE} />
        Ver unidades disponíveis
      </summary>
      <div className="mt-2">
        <input
          type="text"
          placeholder="Buscar unidade (ex.: T1-0706)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: "0.5rem" }}
        />
        <div className="typ-table-wrap" style={{ maxHeight: "14rem" }}>
          <table className="typ-table">
            <thead>
              <tr>
                <th>Unidade</th>
                <th>Pavimento</th>
                <th>Área</th>
                <th>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const idx = dev.tabelaUnidades.indexOf(u);
                return (
                  <tr key={idx} style={idx === selectedIdx ? { background: "var(--surface-2)" } : undefined}>
                    <td className="typ-row-label">{u.unitCode}</td>
                    <td>{u.pavimento}</td>
                    <td>{u.areaM2.toLocaleString("pt-BR")} m²</td>
                    <td>{money(u.valorUnidade)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => pick(idx)} type="button">
                        Gerar mensagem
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-sm" style={{ color: "var(--text-2)" }}>
                    Nenhuma unidade encontrada para &quot;{query}&quot;.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {message ? (
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
                {copied ? "Copiado!" : "Copiar texto"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </details>
  );
}
