import Redis from "ioredis";
import type { HubData } from "./types";

// A integração de Storage da Vercel conectada a este projeto é o Redis Cloud
// oficial (conexão redis:// padrão), não a Upstash -- por isso um cliente
// ioredis comum em vez do cliente REST da Upstash.
let _redis: Redis | null = null;
function redis(): Redis {
  if (!_redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL não configurado");
    _redis = new Redis(url);
  }
  return _redis;
}

const HUB_KEY = "hub:data";
// Chave separada de HUB_KEY de propósito: `hub:data` (settings) é devolvido
// inteiro pela rota GET /api/admin/settings para preencher o formulário no
// navegador -- se o hash da senha estivesse ali dentro, vazaria pro cliente.
const ADMIN_PASSWORD_HASH_KEY = "hub:admin_password_hash";

const DEFAULT_SIMULATOR_SETTINGS = {
  allowAnuais: true,
  allowParcelaUnica: true,
};

const DEFAULT_DEV_SIM_DATES = {
  simAtoMes: "",
  simSinal1Mes: "",
  simSinal2Mes: "",
  simSinal3Mes: "",
  simMesesObra: 0,
};

const EMPTY_DATA: HubData = {
  settings: {
    whatsapp: "",
    instagram: "",
    email: "",
    phoneDisplay: "",
    tabelaDriveLink: "",
    profilePhoto: "",
    logoImage: "",
    logoImageLight: "",
  },
  developments: [],
  simulatorSettings: DEFAULT_SIMULATOR_SETTINGS,
};

export async function getData(): Promise<HubData> {
  const raw = await redis().get(HUB_KEY);
  if (!raw) return EMPTY_DATA;
  const data = JSON.parse(raw) as HubData;
  // Dado salvo antes de campos novos existirem não os tem -- completa com o padrão,
  // preservando o que já foi configurado.
  data.simulatorSettings = { ...DEFAULT_SIMULATOR_SETTINGS, ...data.simulatorSettings };
  data.developments = data.developments.map((dev) => ({ ...DEFAULT_DEV_SIM_DATES, ...dev }));
  return data;
}

export async function saveData(data: HubData): Promise<void> {
  await redis().set(HUB_KEY, JSON.stringify(data));
}

export async function getAdminPasswordHash(): Promise<string | null> {
  return redis().get(ADMIN_PASSWORD_HASH_KEY);
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
  await redis().set(ADMIN_PASSWORD_HASH_KEY, hash);
}
