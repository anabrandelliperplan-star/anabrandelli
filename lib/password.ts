import bcrypt from "bcryptjs";
import { getAdminPasswordHash, setAdminPasswordHash } from "./db";

// Só é importado por rotas admin (runtime Node.js) -- nunca pelo middleware
// (Edge runtime), que usa apenas lib/session.ts.
//
// O hash mora no Redis (não só na env var ADMIN_PASSWORD_HASH) para permitir
// trocar a senha pelo próprio painel, sem precisar de um novo deploy. A env
// var continua existindo como valor inicial/fallback da primeira migração.
export async function verifyPassword(password: string): Promise<boolean> {
  const hash = (await getAdminPasswordHash()) || process.env.ADMIN_PASSWORD_HASH;
  if (!hash) throw new Error("Nenhum hash de senha configurado (nem no Redis, nem em ADMIN_PASSWORD_HASH)");
  return bcrypt.compare(password, hash);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const valid = await verifyPassword(currentPassword);
  if (!valid) return { ok: false, error: "Senha atual incorreta" };
  if (newPassword.length < 10) return { ok: false, error: "A nova senha precisa ter pelo menos 10 caracteres" };
  const newHash = await bcrypt.hash(newPassword, 12);
  await setAdminPasswordHash(newHash);
  return { ok: true };
}
