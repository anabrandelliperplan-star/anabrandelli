export type DevelopmentStatus = "progress" | "ready" | "launch";

export interface TypologyColumn {
  label: string;
  bedrooms: string;
  kitchen: string;
  social: string;
  support: string;
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
  premiacao: string;
  descricao: string;
  fluxoPagamento: string;
  photos: string[];
  typologies: TypologyColumn[];
  hidden: boolean;
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
  mesesObra: number;
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
