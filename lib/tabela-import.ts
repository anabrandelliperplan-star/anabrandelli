import type { Development, TabelaUnidade } from "./types";
import { formatDeliveryDate } from "./format";
import { money } from "./simulator";

export type ExtractedUnit = TabelaUnidade;

// Lê o PDF inteiramente no navegador (pdfjs-dist) -- nada é enviado pro
// servidor. Agrupa os itens de texto por posição (mesma altura = mesma
// linha da tabela, ordenados da esquerda pra direita) em vez de usar o
// texto "corrido" que o pdfjs devolve por padrão, que embaralha a ordem
// das colunas em tabelas.
export async function extractPdfRows(file: File): Promise<string[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const rows: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str: string; transform: number[] }>;

    const groups: Array<{ y: number; cells: Array<{ x: number; str: string }> }> = [];
    for (const item of items) {
      if (!item.str.trim()) continue;
      const y = item.transform[5];
      const x = item.transform[4];
      let group = groups.find((g) => Math.abs(g.y - y) <= 2);
      if (!group) {
        group = { y, cells: [] };
        groups.push(group);
      }
      group.cells.push({ x, str: item.str });
    }

    groups.sort((a, b) => b.y - a.y); // topo pra baixo (y decresce pra baixo no PDF)
    for (const group of groups) {
      group.cells.sort((a, b) => a.x - b.x);
      rows.push(
        group.cells
          .map((c) => c.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      );
    }
  }
  return rows;
}

// Formatos já vistos (cada incorporador organiza a tabela de um jeito):
// MB Park:    "T1-0706 07º andar 62,69 539.161 43.133 1.498 8.087 21.566 431.329"
//             "LOJA 1 Térreo 305,07 2.895.204 231.616 8.042 43.428 115.808 2.316.163"
// Riverside:  "T1-0001 Térreo 84,09 627.940 12.559 12.559 3.489 18.838 25.118 502.352"
//             (entrada dividida em "Ato" + "3 parcelas" -- 2 colunas em vez de 1)
// HYPE:       "U1801 18º andar TIPO PADRÃO (4 SUÍTES) 179,11 1.845.777 369.155 1.476.622"
//             (tem uma coluna de texto livre "Planta" entre pavimento e área;
//             só tem Valor + Entrada + Única, sem Mensal/Anual/Financiamento)
// Marquises:  "Millenium ** 9º 274,81 R$ 2.254.000,00 4 Fechada 263-264|265-266"
//             (pavimento sem "andar"; valor com R$ e centavos; sem fluxo de
//             pagamento nenhum, só specs da unidade)
const ROW_RE = /^(.+?)\s+(Térreo|\d+[º°](?:\s*andar)?)\s+(?:.+?\s+)?(\d+,\d+)\s+(.+)$/i;
const MONEY_TOKEN_RE = /^[\d.]+(?:,\d{1,2})?\*?$/;

function parseMoneyCol(s: string): number {
  const cleaned = s.replace(/\*/g, "");
  const [intPart, cents] = cleaned.split(",");
  const value = Number(intPart.replace(/\./g, "")) || 0;
  return cents ? Number(`${value}.${cents.padEnd(2, "0").slice(0, 2)}`) : value;
}
function parseAreaCol(s: string): number {
  return Number(s.replace(",", ".")) || 0;
}

// Nem toda tabela tem o mesmo conjunto de colunas de pagamento -- em vez de
// tentar mapear cabeçalho por cabeçalho (o layout varia demais entre PDFs),
// olha o texto inteiro extraído pra decidir qual "molde" de colunas usar,
// e aplica esse molde em todas as linhas de dados.
type TabelaVariant = "full" | "entrada_unica" | "specs_only";

function detectVariant(rows: string[]): TabelaVariant {
  const text = rows.join(" ").toLowerCase();
  const hasMensal = /mensa/.test(text);
  const hasFinanciamento = /financiamento/.test(text);
  const hasUnica = /única|unica/.test(text);
  if (hasMensal && hasFinanciamento) return "full";
  if (hasUnica) return "entrada_unica";
  return "specs_only";
}

export function parseTabelaRows(rows: string[]): ExtractedUnit[] {
  const variant = detectVariant(rows);
  const units: ExtractedUnit[] = [];
  for (const row of rows) {
    const m = row.match(ROW_RE);
    if (!m) continue;
    const tokens = m[4].trim().split(/\s+/).filter((t) => MONEY_TOKEN_RE.test(t));
    const base = { unitCode: m[1].trim(), pavimento: m[2].trim(), areaM2: parseAreaCol(m[3]) };

    if (variant === "full") {
      // valor, [1+ colunas de entrada], mensal, anual, unica, financiamento
      if (tokens.length < 6) continue;
      const nums = tokens.map(parseMoneyCol);
      const [mensal, anual, unica, financiamento] = nums.slice(-4);
      const entrada = nums.slice(1, nums.length - 4);
      units.push({ ...base, valorUnidade: nums[0], ato: entrada.reduce((a, b) => a + b, 0), mensal, anual, unica, financiamento });
    } else if (variant === "entrada_unica") {
      // valor, [1+ colunas de entrada], unica -- sem mensal/anual/financiamento
      if (tokens.length < 2) continue;
      const nums = tokens.map(parseMoneyCol);
      const unica = nums[nums.length - 1];
      const entrada = nums.slice(1, nums.length - 1);
      units.push({ ...base, valorUnidade: nums[0], ato: entrada.reduce((a, b) => a + b, 0), mensal: 0, anual: 0, unica, financiamento: 0 });
    } else {
      // só specs da unidade -- pega o valor e ignora o resto (suítes, vagas etc.)
      if (tokens.length < 1) continue;
      units.push({ ...base, valorUnidade: parseMoneyCol(tokens[0]), ato: 0, mensal: 0, anual: 0, unica: 0, financiamento: 0 });
    }
  }
  return units;
}

// "T1-0706" -> "Torre 1 | Unidade 0706". Unidades sem esse padrão (ex.: "LOJA 1")
// aparecem como estão.
function formatTorreUnidade(unitCode: string): string {
  const m = unitCode.match(/^T(\d+)-(\d+)\*?$/i);
  return m ? `Torre ${m[1]} | Unidade ${m[2]}` : unitCode;
}

function statusLine(dev: Development): string {
  if (dev.status === "ready") return "Pronto para morar";
  if (dev.status === "launch") return "Lançamento";
  return "Obras em andamento";
}

export function buildTabelaWhatsAppMessage(unit: ExtractedUnit, dev: Development): string {
  // Nem toda tabela tem todas as colunas de pagamento (ex.: algumas só têm
  // Entrada + Única, outras não têm fluxo de pagamento nenhum) -- omite as
  // linhas cujo valor não veio preenchido em vez de mostrar "R$ 0,00".
  const paymentLines = [
    unit.ato ? `🔑 Entrada: ${money(unit.ato)}` : null,
    unit.mensal ? `🗓️ Mensais (obras): ${money(unit.mensal)}` : null,
    unit.anual ? `📈 Intermediárias: ${money(unit.anual)}` : null,
    unit.unica ? `🗝️ Chaves: ${money(unit.unica)}` : null,
    unit.financiamento ? `🏦 Financiamento bancário ou recursos próprios: ${money(unit.financiamento)}` : null,
  ].filter((l): l is string => l !== null);

  const lines: Array<string | null> = [
    `🏢 *${dev.name}* — ${formatTorreUnidade(unit.unitCode)}`,
    dev.location ? `📍 ${dev.location}` : null,
    `📐 ${unit.areaM2.toLocaleString("pt-BR")} m² | ${unit.pavimento}`,
    dev.descricao ? `ℹ️ ${dev.descricao}` : null,
    `🏗️ ${statusLine(dev)}${dev.statusDetail ? ` | 📅 Entrega: ${formatDeliveryDate(dev.statusDetail)}` : ""}`,
    "",
    `🏷️ Valor total: ${money(unit.valorUnidade)}`,
    ...(paymentLines.length ? ["", "Confira as condições facilitadas de pagamento:", "", ...paymentLines] : []),
    "",
    dev.temDecorado ? "Podemos agendar uma visita para você conhecer o decorado?" : "Podemos agendar um atendimento?",
  ];
  return lines.filter((l) => l !== null).join("\n");
}
