import bcrypt from "bcryptjs";

// Só é importado pela rota de login (runtime Node.js) -- nunca pelo
// middleware (Edge runtime), que usa apenas lib/session.ts.
export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) throw new Error("ADMIN_PASSWORD_HASH não configurado");
  return bcrypt.compare(password, hash);
}
