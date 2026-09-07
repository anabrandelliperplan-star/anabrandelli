import { Redis } from "@upstash/redis";
import type { HubData } from "./types";

let _redis: Redis | null = null;
function redis(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
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
  const data = await redis().get<HubData>(HUB_KEY);
  return data ?? EMPTY_DATA;
}

export async function saveData(data: HubData): Promise<void> {
  await redis().set(HUB_KEY, data);
}
