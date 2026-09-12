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

// Linha típica: "T1-0706 07º andar 62,69 539.161 43.133 1.498 8.087 21.566 431.329"
// ou "LOJA 1 Térreo 305,07 2.895.204 231.616 8.042 43.428 115.808 2.316.163"
// ou (Riverside, entrada dividida em "Ato" + "3 parcelas"):
// "T1-0001 Térreo 84,09 627.940 12.559 12.559 3.489 18.838 25.118 502.352"
// Cada incorporador organiza a "Entrada" de um jeito -- às vezes é só "Ato",
// às vezes "Ato" + mais parcelas. Em vez de fixar a quantidade de colunas,
// captura todo o resto da linha como números e usa posição a partir das
// pontas: o 1º número sempre é o Valor da unidade, os 4 últimos sempre são
// Mensais/Anuais/Única/Financiamento (nessa ordem) -- e tudo que sobrar no
// meio (1 ou mais colunas) é somado em "ato" (entrada total).
const ROW_RE = /^(.+?)\s+(Térreo|\d+º\s*andar)\s+(\d+,\d+)\s+(.+)$/i;
const MONEY_TOKEN_RE = /^[\d.]+\*?$/;

function parseMoneyCol(s: string): number {
  return Number(s.replace(/\*/g, "").replace(/\./g, "")) || 0;
}
function parseAreaCol(s: string): number {
  return Number(s.replace(",", ".")) || 0;
}

export function parseTabelaRows(rows: string[]): ExtractedUnit[] {
  const units: ExtractedUnit[] = [];
  for (const row of rows) {
    const m = row.match(ROW_RE);
    if (!m) continue;
    const tokens = m[4].trim().split(/\s+/).filter((t) => MONEY_TOKEN_RE.test(t));
    // precisa de ao menos: valor, ato, mensal, anual, unica, financiamento
    if (tokens.length < 6) continue;
    const nums = tokens.map(parseMoneyCol);
    const [mensal, anual, unica, financiamento] = nums.slice(-4);
    const entrada = nums.slice(1, nums.length - 4);
    units.push({
      unitCode: m[1].trim(),
      pavimento: m[2].trim(),
      areaM2: parseAreaCol(m[3]),
      valorUnidade: nums[0],
      ato: entrada.reduce((a, b) => a + b, 0),
      mensal,
      anual,
      unica,
      financiamento,
    });
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
  const lines: Array<string | null> = [
    `🏢 *${dev.name}* — ${formatTorreUnidade(unit.unitCode)}`,
    dev.location ? `📍 ${dev.location}` : null,
    `📐 ${unit.areaM2.toLocaleString("pt-BR")} m² | ${unit.pavimento}`,
    dev.descricao ? `ℹ️ ${dev.descricao}` : null,
    `🏗️ ${statusLine(dev)}${dev.statusDetail ? ` | 📅 Entrega: ${formatDeliveryDate(dev.statusDetail)}` : ""}`,
    "",
    "Confira as condições facilitadas de pagamento:",
    "",
    `🏷️ Valor total: ${money(unit.valorUnidade)}`,
    `🔑 Entrada: ${money(unit.ato)}`,
    `🗓️ Mensais (obras): ${money(unit.mensal)}`,
    `📈 Intermediárias: ${money(unit.anual)}`,
    `🗝️ Chaves: ${money(unit.unica)}`,
    `🏦 Financiamento bancário ou recursos próprios: ${money(unit.financiamento)}`,
    "",
    "Podemos agendar uma visita para você conhecer o decorado?",
  ];
  return lines.filter((l) => l !== null).join("\n");
}
