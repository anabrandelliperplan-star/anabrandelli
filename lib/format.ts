import type { Development } from "./types";

export function money(n: number | string | null | undefined): string {
  const num = Number(n) || 0;
  return "R$ " + num.toLocaleString("pt-BR");
}

export function waLink(whatsapp: string, msg: string): string {
  return "https://wa.me/" + (whatsapp || "") + "?text=" + encodeURIComponent(msg);
}

export interface DriveParts {
  view: string;
  download: string;
  imgSrc: string;
}

export function driveParts(url: string | null | undefined): DriveParts | null {
  if (!url) return null;
  const s = String(url);
  const m = s.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m) {
    const id = m[1];
    return {
      view: "https://drive.google.com/file/d/" + id + "/view",
      download: "https://drive.google.com/uc?export=download&id=" + id,
      imgSrc: "https://drive.google.com/uc?export=view&id=" + id,
    };
  }
  return { view: s, download: s, imgSrc: s };
}

// Se colarem o código de "Incorporar mapa" (um <iframe ...>) em vez do link
// simples, extrai a URL de dentro do atributo src para o botão continuar funcionando.
export function resolveMapsLink(raw: string | null | undefined): string {
  if (!raw) return "";
  const m = String(raw).match(/src\s*=\s*["']([^"']+)["']/i);
  return m ? m[1] : String(raw).trim();
}

export function statusBadge(dev: Pick<Development, "status">): { cls: string; label: string } {
  if (dev.status === "ready") return { cls: "badge-ready", label: "Pronto para morar" };
  if (dev.status === "launch") return { cls: "badge-launch", label: "Lançamento" };
  return { cls: "badge-progress", label: "Em obras" };
}

const MONTH_ABBR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTH_FULL = [
  "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function stripAccents(s: string): string {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function formatDeliveryDate(raw: string | null | undefined): string {
  if (!raw) return "";
  const s = stripAccents(String(raw)).toLowerCase().replace(/\\/g, "/").trim();
  const m = s.match(/([a-z]{3,9})\s*(?:de)?\s*[\/\-]?\s*(\d{2,4})/);
  if (!m) return raw;
  const monthToken = m[1];
  let year = m[2];
  let monthIdx = MONTH_ABBR.indexOf(monthToken.slice(0, 3));
  if (monthIdx === -1) monthIdx = MONTH_FULL.indexOf(monthToken);
  if (monthIdx === -1) return raw;
  if (year.length === 2) year = "20" + year;
  return MONTH_ABBR[monthIdx] + "/" + year;
}

// Remove separador de milhar brasileiro ("548.717") antes de converter para
// numero -- Number() direto interpretaria o ponto como decimal.
export function parsePriceInput(raw: string): number {
  const digitsOnly = String(raw || "").replace(/\./g, "").replace(/[^\d]/g, "");
  return digitsOnly ? Number(digitsOnly) : 0;
}

export const TYPOLOGY_ROWS: Array<[string, keyof Development["typologies"][number]]> = [
  ["Configuração de Quartos", "bedrooms"],
  ["Opções de Cozinha", "kitchen"],
  ["Área Social", "social"],
  ["Apoio e Serviços", "support"],
];
