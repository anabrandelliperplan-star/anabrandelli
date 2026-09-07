"use client";

import type { TypologyColumn } from "@/lib/types";
import { TYPOLOGY_ROWS } from "@/lib/format";

const EMPTY_COLUMN: TypologyColumn = { label: "", bedrooms: "", kitchen: "", social: "", support: "" };

export function TypologyTableEditor({
  value,
  onChange,
}: {
  value: TypologyColumn[];
  onChange: (cols: TypologyColumn[]) => void;
}) {
  function updateCell(i: number, key: keyof TypologyColumn, val: string) {
    const next = value.slice();
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  }
  function addColumn() {
    onChange([...value, { ...EMPTY_COLUMN }]);
  }
  function removeColumn(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    minWidth: 170,
    fontFamily: "var(--font-space-grotesk), sans-serif",
    fontSize: "0.82rem",
    padding: "0.5rem 0.6rem",
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    background: "var(--surface)",
    color: "var(--text)",
  };

  return (
    <div className="field">
      <label>Tabela de tipologias (opcional — compara metragens lado a lado)</label>
      <p className="text-xs mb-1" style={{ color: "var(--text-2)" }}>
        Preencha uma coluna por metragem. Cada campo é independente — não precisa colar tabela pronta aqui.
      </p>
      {value.length ? (
        <>
          <div className="typ-table-wrap">
            <table className="typ-table">
              <thead>
                <tr>
                  <th></th>
                  {value.map((col, i) => (
                    <th key={i} style={{ minWidth: 180 }}>
                      <div className="flex items-center gap-1.5">
                        <input
                          style={inputStyle}
                          type="text"
                          value={col.label}
                          onChange={(e) => updateCell(i, "label", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeColumn(i)}
                          aria-label="Remover coluna"
                          style={{
                            flexShrink: 0,
                            width: "1.7rem",
                            height: "1.7rem",
                            borderRadius: "999px",
                            border: "1px solid var(--border)",
                            background: "transparent",
                            color: "#8A3A3A",
                            cursor: "pointer",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TYPOLOGY_ROWS.map(([rowLabel, key]) => (
                  <tr key={key}>
                    <th className="typ-row-label">{rowLabel}</th>
                    {value.map((col, i) => (
                      <td key={i}>
                        <input
                          style={inputStyle}
                          type="text"
                          value={col[key]}
                          onChange={(e) => updateCell(i, key, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      <button
        type="button"
        className="btn btn-outline btn-sm mt-2"
        style={{ color: "var(--accent)", borderColor: "var(--accent)" }}
        onClick={addColumn}
      >
        + Adicionar coluna (metragem)
      </button>
    </div>
  );
}
