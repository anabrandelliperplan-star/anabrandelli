import Redis from "ioredis";

let _redis: Redis | null = null;
function redis(): Redis {
  if (!_redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL não configurado");
    _redis = new Redis(url);
  }
  return _redis;
}

const WINDOW_SECONDS = 10 * 60; // 10 minutos
const MAX_ATTEMPTS = 5;

// Janela fixa (nao deslizante): simples e suficiente para limitar tentativas
// de senha por IP -- INCR cria a chave em 1 se nao existir, e so definimos o
// TTL na primeira tentativa da janela.
export async function checkLoginRateLimit(ip: string): Promise<{ success: boolean }> {
  const key = "ratelimit:login:" + ip;
  const count = await redis().incr(key);
  if (count === 1) {
    await redis().expire(key, WINDOW_SECONDS);
  }
  return { success: count <= MAX_ATTEMPTS };
}
