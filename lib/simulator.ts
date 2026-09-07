import type { SimulatorSettings } from "./types";

export const SPLIT_OPTIONS = ["20/80", "30/70", "40/60", "50/50", "60/40", "70/30", "80/20", "90/10", "100/0"] as const;
export type SplitOption = (typeof SPLIT_OPTIONS)[number];

export function splitObraPercent(split: SplitOption): number {
  return Number(split.split("/")[0]);
}

export interface SimulatorInput {
  valorImovel: number;
  split: SplitOption;
  ato: number;
  sinal: number; // valor de cada um dos 3 sinais (30/60/90 dias)
  anuaisAtivo: boolean;
  anuaisQuantidade: number;
  anuaisValor: number; // valor de cada parcela anual
  unicaAtivo: boolean;
  unicaValor: number;
  unidadeLabel: string; // ex.: "Unidade 142 - Torre Cerejeira | 84,50 m²" (preenchido manualmente por enquanto)
}

export interface SimulatorResult {
  valorImovel: number;
  valorObra: number;
  valorFinanciamento: number;
  ato: number;
  sinalUnitario: number;
  sinalTotal: number;
  anuaisTotal: number;
  unicaTotal: number;
  intermediariasTotal: number; // ato + sinais + anuais + unica
  saldoParaMensais: number; // valorObra - intermediariasTotal (pode ser negativo -> erro)
  mesesObra: number;
  mensalValor: number; // 0 se saldoParaMensais <= 0
  excedeuSaldoObra: boolean;
  atoAbaixoDoMinimo: boolean;
  percMinAtoAplicado: number;
}

export function simulate(input: SimulatorInput, settings: SimulatorSettings): SimulatorResult {
  const percObra = splitObraPercent(input.split);
  const valorObra = round2((input.valorImovel * percObra) / 100);
  const valorFinanciamento = round2(input.valorImovel - valorObra);

  const sinalTotal = round2(input.sinal * 3);
  const anuaisTotal = input.anuaisAtivo ? round2(input.anuaisQuantidade * input.anuaisValor) : 0;
  const unicaTotal = input.unicaAtivo ? round2(input.unicaValor) : 0;

  const intermediariasTotal = round2(input.ato + sinalTotal + anuaisTotal + unicaTotal);
  const saldoParaMensais = round2(valorObra - intermediariasTotal);
  const excedeuSaldoObra = saldoParaMensais < 0;
  const mensalValor = excedeuSaldoObra || settings.mesesObra <= 0 ? 0 : round2(saldoParaMensais / settings.mesesObra);

  const minAtoValor = round2((valorObra * settings.percMinAto) / 100);
  const atoAbaixoDoMinimo = input.ato < minAtoValor;

  return {
    valorImovel: input.valorImovel,
    valorObra,
    valorFinanciamento,
    ato: input.ato,
    sinalUnitario: input.sinal,
    sinalTotal,
    anuaisTotal,
    unicaTotal,
    intermediariasTotal,
    saldoParaMensais,
    mesesObra: settings.mesesObra,
    mensalValor,
    excedeuSaldoObra,
    atoAbaixoDoMinimo,
    percMinAtoAplicado: settings.percMinAto,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function money(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function buildWhatsAppText(input: SimulatorInput, result: SimulatorResult): string {
  const lines: string[] = [];
  if (input.unidadeLabel.trim()) lines.push(input.unidadeLabel.trim());
  lines.push(`Valor do imóvel: ${money(result.valorImovel)}`);
  lines.push(`Split: ${input.split.replace("/", "% obra / ")}% financiamento`);
  lines.push("");
  lines.push(`Período de obra (${money(result.valorObra)}):`);
  lines.push(`- Ato: ${money(result.ato)}`);
  lines.push(`- 3x Sinal (30/60/90 dias): ${money(result.sinalUnitario)} cada (total ${money(result.sinalTotal)})`);
  if (input.anuaisAtivo) lines.push(`- Anuais (${input.anuaisQuantidade}x): ${money(input.anuaisValor)} cada (total ${money(result.anuaisTotal)})`);
  if (input.unicaAtivo) lines.push(`- Parcela única: ${money(result.unicaTotal)}`);
  lines.push(`- Mensais (${result.mesesObra}x): ${money(result.mensalValor)} cada`);
  if (result.valorFinanciamento > 0) {
    lines.push("");
    lines.push(`Na entrega (financiamento bancário): ${money(result.valorFinanciamento)}`);
  }
  return lines.join("\n");
}
