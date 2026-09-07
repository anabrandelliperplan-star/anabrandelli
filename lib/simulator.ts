import type { SimulatorSettings } from "./types";

export const SPLIT_OPTIONS = ["20/80", "30/70", "40/60", "50/50", "60/40", "70/30", "80/20", "90/10", "100/0"] as const;
export type SplitOption = (typeof SPLIT_OPTIONS)[number];

export function splitObraPercent(split: SplitOption): number {
  return Number(split.split("/")[0]);
}

export interface SimulatorInput {
  valorImovel: number;
  areaM2: number;
  split: SplitOption;
  ato: number;
  sinal: number; // valor de cada um dos 3 sinais (30/60/90 dias)
  anuaisAtivo: boolean;
  anuaisQuantidade: number;
  anuaisValor: number; // valor de cada parcela anual
  unicaAtivo: boolean;
  unicaValor: number;
  mensalValor: number; // valor de cada mensal -- digitado livremente, não é mais calculado
  unidadeLabel: string; // ex.: "Unidade 142 - Torre Cerejeira | 84,50 m²" (preenchido manualmente por enquanto)
}

export interface SimulatorResult {
  valorImovel: number;
  areaM2: number;
  valorPorM2: number; // 0 se areaM2 <= 0
  valorObra: number;
  valorFinanciamento: number;
  ato: number;
  sinalUnitario: number;
  sinalTotal: number;
  anuaisTotal: number;
  unicaTotal: number;
  mesesObra: number;
  mensalValor: number;
  mensalTotal: number; // mensalValor * mesesObra
  totalColetadoObra: number; // ato + sinais + anuais + unica + mensais
  saldoFaltante: number; // valorObra - totalColetadoObra; positivo = falta dinheiro, negativo = sobrou
}

export function simulate(input: SimulatorInput, settings: SimulatorSettings): SimulatorResult {
  const percObra = splitObraPercent(input.split);
  const valorObra = round2((input.valorImovel * percObra) / 100);
  const valorFinanciamento = round2(input.valorImovel - valorObra);

  const sinalTotal = round2(input.sinal * 3);
  const anuaisTotal = input.anuaisAtivo ? round2(input.anuaisQuantidade * input.anuaisValor) : 0;
  const unicaTotal = input.unicaAtivo ? round2(input.unicaValor) : 0;
  const mensalTotal = round2(input.mensalValor * settings.mesesObra);

  const totalColetadoObra = round2(input.ato + sinalTotal + anuaisTotal + unicaTotal + mensalTotal);
  const saldoFaltante = round2(valorObra - totalColetadoObra);

  const valorPorM2 = input.areaM2 > 0 ? round2(input.valorImovel / input.areaM2) : 0;

  return {
    valorImovel: input.valorImovel,
    areaM2: input.areaM2,
    valorPorM2,
    valorObra,
    valorFinanciamento,
    ato: input.ato,
    sinalUnitario: input.sinal,
    sinalTotal,
    anuaisTotal,
    unicaTotal,
    mesesObra: settings.mesesObra,
    mensalValor: input.mensalValor,
    mensalTotal,
    totalColetadoObra,
    saldoFaltante,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function money(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Área usa vírgula como separador decimal ("84,50"), diferente dos campos de
// dinheiro (que usam ponto como separador de milhar, sem decimais).
export function parseAreaInput(raw: string): number {
  const cleaned = String(raw || "").replace(/[^\d,]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function buildWhatsAppText(input: SimulatorInput, result: SimulatorResult): string {
  const lines: string[] = [];
  if (input.unidadeLabel.trim()) lines.push(input.unidadeLabel.trim());
  lines.push(`Valor do imóvel: ${money(result.valorImovel)}`);
  if (result.areaM2 > 0) lines.push(`Área: ${result.areaM2.toLocaleString("pt-BR")} m² (${money(result.valorPorM2)}/m²)`);
  lines.push(`Split: ${input.split.replace("/", "% obra / ")}% financiamento`);
  lines.push("");
  lines.push(`Período de obra (${money(result.valorObra)}):`);
  lines.push(`- Ato: ${money(result.ato)}`);
  lines.push(`- 3x Sinal (30/60/90 dias): ${money(result.sinalUnitario)} cada (total ${money(result.sinalTotal)})`);
  if (input.anuaisAtivo) lines.push(`- Anuais (${input.anuaisQuantidade}x): ${money(input.anuaisValor)} cada (total ${money(result.anuaisTotal)})`);
  if (input.unicaAtivo) lines.push(`- Parcela única: ${money(result.unicaTotal)}`);
  lines.push(`- Mensais (${result.mesesObra}x): ${money(result.mensalValor)} cada (total ${money(result.mensalTotal)})`);
  if (result.valorFinanciamento > 0) {
    lines.push("");
    lines.push(`Na entrega (financiamento bancário): ${money(result.valorFinanciamento)}`);
  }
  return lines.join("\n");
}
