export type DevelopmentStatus = "progress" | "ready" | "launch";

export interface TypologyColumn {
  label: string;
  bedrooms: string;
  kitchen: string;
  social: string;
  support: string;
}

export interface TabelaUnidade {
  unitCode: string;
  pavimento: string;
  areaM2: number;
  valorUnidade: number;
  ato: number;
  mensal: number;
  anual: number;
  unica: number;
  financiamento: number;
}

export interface Development {
  id: string;
  name: string;
  location: string;
  typology: string;
  status: DevelopmentStatus;
  statusDetail: string;
  priceFrom: number;
  unidadesDisponiveis: string;
  driveLink: string;
  tabelaLink: string;
  bookLink: string;
  mapsLink: string;
  materialDescritivoLink: string;
  vagasGaragemLink: string;
  vagasIndeterminadas: boolean;
  // Se tem unidade decorada pra visitar -- muda a frase final da mensagem de
  // WhatsApp gerada a partir da tabela (convite pra ver o decorado ou, sem
  // decorado, pra marcar um atendimento).
  temDecorado: boolean;
  premiacao: string;
  descricao: string;
  fluxoPagamento: string;
  photos: string[];
  typologies: TypologyColumn[];
  hidden: boolean;
  // Datas do simulador de fluxo -- fixas por empreendimento, "YYYY-MM".
  // Mensais começam automaticamente no mês seguinte ao Sinal 3, não é um
  // campo salvo à parte.
  simAtoMes: string;
  simSinal1Mes: string;
  simSinal2Mes: string;
  simSinal3Mes: string;
  simMesesObra: number; // quantidade de mensais -- varia de empreendimento pra empreendimento
  // Unidades extraídas da tabela de vendas em PDF (painel admin) -- exibidas
  // e usadas para gerar a mensagem de WhatsApp direto na página pública.
  tabelaUnidades: TabelaUnidade[];
}

export interface Settings {
  whatsapp: string;
  instagram: string;
  email: string;
  phoneDisplay: string;
  tabelaDriveLink: string;
  profilePhoto: string;
  logoImage: string;
  logoImageLight: string;
}

export interface SimulatorSettings {
  allowAnuais: boolean;
  allowParcelaUnica: boolean;
}

export interface HubData {
  settings: Settings;
  developments: Development[];
  simulatorSettings: SimulatorSettings;
}

export interface SearchItem {
  label: string;
  dev: string;
  kind: "text" | "link";
  value: string;
  url?: string;
  anchorId: string;
  cardId: string;
}
