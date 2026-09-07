import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _loginRatelimit: Ratelimit | null = null;

// 5 tentativas de login a cada 10 minutos, por IP.
export function getLoginRatelimit(): Ratelimit {
  if (!_loginRatelimit) {
    _loginRatelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "ratelimit:login",
    });
  }
  return _loginRatelimit;
}
