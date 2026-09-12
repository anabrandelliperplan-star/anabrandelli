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
const ROW_RE =
  /^(.+?)\s+(Térreo|\d+º\s*andar)\s+(\d+,\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\*?$/i;

function parseMoneyCol(s: string): number {
  return Number(s.replace(/\./g, "")) || 0;
}
function parseAreaCol(s: string): number {
  return Number(s.replace(",", ".")) || 0;
}

export function parseTabelaRows(rows: string[]): ExtractedUnit[] {
  const units: ExtractedUnit[] = [];
  for (const row of rows) {
    const m = row.match(ROW_RE);
    if (!m) continue;
    units.push({
      unitCode: m[1].trim(),
      pavimento: m[2].trim(),
      areaM2: parseAreaCol(m[3]),
      valorUnidade: parseMoneyCol(m[4]),
      ato: parseMoneyCol(m[5]),
      mensal: parseMoneyCol(m[6]),
      anual: parseMoneyCol(m[7]),
      unica: parseMoneyCol(m[8]),
      financiamento: parseMoneyCol(m[9]),
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
