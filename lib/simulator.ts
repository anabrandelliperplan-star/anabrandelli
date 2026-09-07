export const SPLIT_OPTIONS = ["20/80", "30/70", "40/60", "50/50", "60/40", "70/30", "80/20", "90/10", "100/0"] as const;
export type SplitOption = (typeof SPLIT_OPTIONS)[number];

export function splitObraPercent(split: SplitOption): number {
  return Number(split.split("/")[0]);
}

// Datas fixas do empreendimento (Ato, Sinais, início das mensais) --
// configuradas uma vez no painel, não mudam por simulação.
export interface DevSimDates {
  atoMes: string; // "YYYY-MM"
  sinal1Mes: string;
  sinal2Mes: string;
  sinal3Mes: string;
  mensalInicioMes: string;
  mesesObra: number; // quantidade de mensais -- configurada por empreendimento, varia de um pro outro
  entregaMes: string; // "YYYY-MM" -- extraída da data de entrega do empreendimento, só para o aviso de limite
}

export interface SimulatorInput {
  developmentName: string;
  valorImovel: number;
  areaM2: number;
  split: SplitOption;
  ato: number;
  sinal: number; // valor de cada um dos 3 sinais -- as datas vêm de DevSimDates
  mensalValor: number; // as mensais começam em DevSimDates.mensalInicioMes
  anuaisAtivo: boolean;
  anuaisQuantidade: number;
  anuaisValor: number;
  anuaisInicioMes: string; // "YYYY-MM" -- quando a 1ª anual cai
  unicaAtivo: boolean;
  unicaValor: number;
  unicaMes: string; // "YYYY-MM" -- quando a parcela única cai
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
  mesesObra: number; // configurado por empreendimento -- varia de um pro outro
  mensalValor: number;
  mensalTotal: number; // mensalValor * mesesObra
  totalColetadoObra: number; // ato + sinais + anuais + unica + mensais
  saldoFaltante: number; // valorObra - totalColetadoObra; positivo = falta dinheiro, negativo = sobrou
  mensalFimMes: string;
  mensalExcedeuLimite: boolean; // mensais terminando depois da entrega
  anuaisFimMes: string;
  anuaisExcedeuLimite: boolean; // anuais terminando depois da entrega
  unicaExcedeuLimite: boolean; // parcela única depois da entrega
}

export function simulate(input: SimulatorInput, dates: DevSimDates): SimulatorResult {
  const percObra = splitObraPercent(input.split);
  const valorObra = round2((input.valorImovel * percObra) / 100);
  const valorFinanciamento = round2(input.valorImovel - valorObra);

  const sinalTotal = round2(input.sinal * 3);
  const anuaisTotal = input.anuaisAtivo ? round2(input.anuaisQuantidade * input.anuaisValor) : 0;
  const unicaTotal = input.unicaAtivo ? round2(input.unicaValor) : 0;

  const mesesObra = dates.mesesObra;
  const mensalTotal = round2(input.mensalValor * mesesObra);

  const totalColetadoObra = round2(input.ato + sinalTotal + anuaisTotal + unicaTotal + mensalTotal);
  const saldoFaltante = round2(valorObra - totalColetadoObra);

  const valorPorM2 = input.areaM2 > 0 ? round2(input.valorImovel / input.areaM2) : 0;

  const mensalFimMes = dates.mensalInicioMes && mesesObra > 0 ? addMonths(dates.mensalInicioMes, mesesObra - 1) : "";
  const mensalExcedeuLimite = Boolean(dates.entregaMes && mensalFimMes && compareMonth(mensalFimMes, dates.entregaMes) > 0);

  const anuaisFimMes =
    input.anuaisAtivo && input.anuaisInicioMes ? addMonths(input.anuaisInicioMes, (input.anuaisQuantidade - 1) * 12) : "";
  const anuaisExcedeuLimite = Boolean(
    input.anuaisAtivo && dates.entregaMes && anuaisFimMes && compareMonth(anuaisFimMes, dates.entregaMes) > 0
  );

  const unicaExcedeuLimite = Boolean(
    input.unicaAtivo && dates.entregaMes && input.unicaMes && compareMonth(input.unicaMes, dates.entregaMes) > 0
  );

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
    mesesObra,
    mensalValor: input.mensalValor,
    mensalTotal,
    totalColetadoObra,
    saldoFaltante,
    mensalFimMes,
    mensalExcedeuLimite,
    anuaisFimMes,
    anuaisExcedeuLimite,
    unicaExcedeuLimite,
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

// Valores em R$ com centavos opcionais: "587.354,80" -- ponto é separador de
// milhar, vírgula é decimal (padrão brasileiro). "587.354" (sem vírgula)
// continua funcionando como valor inteiro, sem centavos.
export function parseMoneyInput(raw: string): number {
  const cleaned = String(raw || "").replace(/[^\d,]/g, "");
  if (!cleaned) return 0;
  const [intPart, centsPart] = cleaned.split(",");
  const n = Number(intPart + (centsPart !== undefined ? "." + centsPart.slice(0, 2) : ""));
  return Number.isFinite(n) ? n : 0;
}

export function formatMoneyInputValue(n: number): string {
  if (!n) return "";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MONTH_FULL = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// "YYYY-MM" -> "Março/2026" (mesmo formato do <input type="month">)
export function formatMonthYear(yyyyMm: string): string {
  if (!yyyyMm) return "";
  const [y, m] = yyyyMm.split("-").map(Number);
  if (!y || !m) return yyyyMm;
  const name = MONTH_FULL[m - 1] || "";
  return name.charAt(0).toUpperCase() + name.slice(1) + "/" + y;
}

export function addMonths(yyyyMm: string, months: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const newY = Math.floor(total / 12);
  const newM = (total % 12) + 1;
  return `${newY}-${String(newM).padStart(2, "0")}`;
}

// >0 se a > b, <0 se a < b, 0 se iguais (comparação lexicográfica funciona
// direto no formato "YYYY-MM").
export function compareMonth(a: string, b: string): number {
  return a === b ? 0 : a > b ? 1 : -1;
}

// Quantos meses de "a" até "b" (b - a). Ex.: 2026-01 -> 2026-04 = 3.
export function monthDiff(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return by * 12 + (bm - 1) - (ay * 12 + (am - 1));
}

export function buildWhatsAppText(input: SimulatorInput, result: SimulatorResult, dates: DevSimDates): string {
  const lines: string[] = [];
  if (input.developmentName.trim()) lines.push(input.developmentName.trim());
  if (input.unidadeLabel.trim()) lines.push(input.unidadeLabel.trim());
  lines.push(`Valor do imóvel: ${money(result.valorImovel)}`);
  if (result.areaM2 > 0) lines.push(`Área: ${result.areaM2.toLocaleString("pt-BR")} m² (${money(result.valorPorM2)}/m²)`);
  lines.push(`Split: ${input.split.replace("/", "% obra / ")}% financiamento`);
  lines.push("");
  lines.push(`Período de obra (${money(result.valorObra)}):`);
  lines.push(`- Ato (${formatMonthYear(dates.atoMes)}): ${money(result.ato)}`);
  lines.push(
    `- Sinais (${formatMonthYear(dates.sinal1Mes)}, ${formatMonthYear(dates.sinal2Mes)}, ${formatMonthYear(dates.sinal3Mes)}): ${money(result.sinalUnitario)} cada (total ${money(result.sinalTotal)})`
  );
  if (input.anuaisAtivo)
    lines.push(`- Anuais (${input.anuaisQuantidade}x a partir de ${formatMonthYear(input.anuaisInicioMes)}): ${money(input.anuaisValor)} cada (total ${money(result.anuaisTotal)})`);
  if (input.unicaAtivo) lines.push(`- Parcela única (${formatMonthYear(input.unicaMes)}): ${money(result.unicaTotal)}`);
  lines.push(`- Mensais (${result.mesesObra}x a partir de ${formatMonthYear(dates.mensalInicioMes)}): ${money(result.mensalValor)} cada (total ${money(result.mensalTotal)})`);
  if (result.valorFinanciamento > 0) {
    lines.push("");
    lines.push(`Na entrega (financiamento bancário): ${money(result.valorFinanciamento)}`);
  }
  return lines.join("\n");
}
