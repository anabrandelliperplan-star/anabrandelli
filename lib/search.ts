import type { Development, SearchItem } from "./types";
import { driveParts, money, resolveMapsLink } from "./format";

export function normalizeSearch(s: string | null | undefined): string {
  return String(s == null ? "" : s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Cada grupo: [forma canonica, [gatilhos que devem virar essa forma]].
// A forma canonica de um grupo nunca deve conter uma palavra que seja,
// ela mesma, gatilho de outro grupo -- expandSearchSynonyms roda todos os
// pares numa unica passagem sobre a string, entao um gatilho poderia
// re-casar dentro do resultado ja expandido de outro grupo (bug real ja
// visto: canonico "memorial vagas" continha "memorial", que era gatilho
// do grupo "material descritivo").
const SEARCH_SYNONYMS: Array<[string, string[]]> = [
  ["previsao entrega", ["data de entrega", "data entrega", "quando entrega", "quando fica pronto", "quando vai ficar pronto", "quando fica pronta", "prazo de entrega", "prazo entrega", "quando e entregue", "data de conclusao", "data de conclusao da obra", "data de finalizacao", "data", "prazo"]],
  ["fluxo pagamento", ["forma de pagamento", "forma pagamento", "condicoes de pagamento", "condicao de pagamento", "como pagar", "parcelamento", "financiamento", "entrada e parcelas", "como funciona o pagamento"]],
  ["valor partir", ["preco", "precos", "quanto custa", "valor do imovel", "valor inicial", "valor minimo", "quanto sai"]],
  ["tipologia", ["metragem", "metragens", "tamanho do apartamento", "tamanho dos apartamentos", "planta", "plantas", "metros quadrados"]],
  ["endereco", ["localizacao", "onde fica", "como chegar", "mapa"]],
  ["book", ["apresentacao", "material de apresentacao", "book do empreendimento"]],
  ["tabela", ["tabela de vendas", "tabela de precos", "planilha de precos", "planilha"]],
  ["materiais", ["todos os arquivos", "pasta do drive", "drive", "materiais de venda", "materiais de vendas"]],
  ["premiacao", ["premio", "premios", "ganhou premio", "premiado"]],
  ["descricao", ["sobre o empreendimento", "resumo do empreendimento", "informacoes gerais"]],
  ["material descritivo", ["memorial descritivo", "descritivo do imovel", "ficha tecnica", "memorial", "especificacoes tecnicas", "especificacoes", "acabamentos", "detalhamento do imovel"]],
  ["vagas", ["vagas de garagem", "vaga de garagem", "garagem", "quantidade de vagas", "quantas vagas", "numero de vagas", "vaga de estacionamento", "vagas de estacionamento", "estacionamento", "discriminacao das vagas", "discriminacao de vagas", "vagas indeterminadas", "indeterminadas"]],
];

const SEARCH_SYNONYM_PAIRS: Array<[string, string]> = (() => {
  const pairs: Array<[string, string]> = [];
  SEARCH_SYNONYMS.forEach(([canonical, triggers]) => {
    triggers.forEach((t) => pairs.push([t, canonical]));
  });
  pairs.sort((a, b) => b[0].length - a[0].length);
  return pairs;
})();

export function expandSearchSynonyms(q: string): string {
  let result = q;
  SEARCH_SYNONYM_PAIRS.forEach(([trigger, canonical]) => {
    if (result.indexOf(trigger) !== -1) result = result.split(trigger).join(canonical);
  });
  return result;
}

const SEARCH_STOPWORDS: Record<string, 1> = { de: 1, da: 1, do: 1, dos: 1, das: 1, e: 1, a: 1, o: 1, em: 1, no: 1, na: 1 };

export function buildSearchIndex(developments: Development[]): SearchItem[] {
  const items: SearchItem[] = [];
  developments.forEach((dev) => {
    if (dev.hidden) return;
    const entrega = dev.statusDetail || (dev.status === "ready" ? "Pronto para morar" : "");
    items.push({ label: "Previsão de entrega", dev: dev.name, kind: "text", value: entrega || "Não informado", anchorId: "delivery-" + dev.id, cardId: "card-" + dev.id });
    items.push({ label: "Fluxo de pagamento", dev: dev.name, kind: "text", value: dev.fluxoPagamento || "Não informado", anchorId: "payment-" + dev.id, cardId: "card-" + dev.id });
    items.push({ label: "Premiação", dev: dev.name, kind: "text", value: dev.premiacao || "Não informado", anchorId: "premio-" + dev.id, cardId: "card-" + dev.id });
    items.push({ label: "Descrição", dev: dev.name, kind: "text", value: dev.descricao || "Não informado", anchorId: "desc-" + dev.id, cardId: "card-" + dev.id });
    items.push({ label: "Tipologia", dev: dev.name, kind: "text", value: dev.typologies?.length ? "Ver tabela de tipologias" : (dev.typology || "Não informado"), anchorId: "typ-" + dev.id, cardId: "card-" + dev.id });
    items.push({ label: "Valor a partir de", dev: dev.name, kind: "text", value: money(dev.priceFrom), anchorId: "price-" + dev.id, cardId: "card-" + dev.id });
    if (dev.unidadesDisponiveis) items.push({ label: "Unidades disponíveis", dev: dev.name, kind: "text", value: dev.unidadesDisponiveis, anchorId: "price-" + dev.id, cardId: "card-" + dev.id });
    if (dev.mapsLink) items.push({ label: "Endereço", dev: dev.name, kind: "link", value: "Abrir no mapa", url: resolveMapsLink(dev.mapsLink), anchorId: "maps-" + dev.id, cardId: "card-" + dev.id });
    if (dev.bookLink) items.push({ label: "Book", dev: dev.name, kind: "link", value: "Abrir book", url: driveParts(dev.bookLink)?.view || dev.bookLink, anchorId: "book-" + dev.id, cardId: "card-" + dev.id });
    if (dev.tabelaLink) items.push({ label: "Tabela", dev: dev.name, kind: "link", value: "Abrir tabela", url: driveParts(dev.tabelaLink)?.view || dev.tabelaLink, anchorId: "tabela-" + dev.id, cardId: "card-" + dev.id });
    if (dev.driveLink) items.push({ label: "Todos os materiais", dev: dev.name, kind: "link", value: "Abrir materiais", url: driveParts(dev.driveLink)?.view || dev.driveLink, anchorId: "materiais-" + dev.id, cardId: "card-" + dev.id });
    if (dev.materialDescritivoLink) items.push({ label: "Material Descritivo", dev: dev.name, kind: "link", value: "Abrir material descritivo", url: driveParts(dev.materialDescritivoLink)?.view || dev.materialDescritivoLink, anchorId: "descritivo-" + dev.id, cardId: "card-" + dev.id });
    if (dev.vagasIndeterminadas) items.push({ label: "Memorial de Vagas", dev: dev.name, kind: "text", value: "Vagas indeterminadas", anchorId: "garagem-" + dev.id, cardId: "card-" + dev.id });
    else if (dev.vagasGaragemLink) items.push({ label: "Memorial de Vagas", dev: dev.name, kind: "link", value: "Abrir memorial de vagas", url: driveParts(dev.vagasGaragemLink)?.view || dev.vagasGaragemLink, anchorId: "garagem-" + dev.id, cardId: "card-" + dev.id });
  });
  return items;
}

export function searchItems(query: string, developments: Development[]): SearchItem[] {
  let q = normalizeSearch(query).trim();
  if (!q) return [];
  q = expandSearchSynonyms(q);
  const rawTokens = q.split(/\s+/).filter(Boolean);
  let tokens = rawTokens.filter((t) => !SEARCH_STOPWORDS[t]);
  if (!tokens.length) {
    if (q.length < 3) return [];
    tokens = rawTokens;
  }
  const scored: Array<{ item: SearchItem; score: number }> = [];
  buildSearchIndex(developments).forEach((item) => {
    const haystack = normalizeSearch(item.label + " " + item.dev);
    const matchesAll = tokens.every((t) => haystack.indexOf(t) !== -1);
    if (!matchesAll) return;
    const labelHay = normalizeSearch(item.label);
    const score = tokens.reduce((acc, t) => acc + (labelHay.indexOf(t) !== -1 ? 2 : 1), 0);
    scored.push({ item, score });
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
}
