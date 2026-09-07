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
};

export async function getData(): Promise<HubData> {
  const raw = await redis().get(HUB_KEY);
  return raw ? (JSON.parse(raw) as HubData) : EMPTY_DATA;
}

export async function saveData(data: HubData): Promise<void> {
  await redis().set(HUB_KEY, JSON.stringify(data));
}
