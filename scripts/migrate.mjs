// Migração única: lê os dados ao vivo do index-v3.html (Claude Artifact),
// externaliza as fotos em base64 para o Vercel Blob, tira a senha do JSON
// (vira hash bcrypt em variável de ambiente) e grava o resultado no Redis.
// Rodar uma vez, depois que Redis + Blob já estiverem provisionados:
//
//   node --env-file=.env.local scripts/migrate.mjs
//
// Não é idempotente contra um Redis já populado -- não rodar duas vezes
// sem confirmar antes.

import { readFileSync } from "node:fs";
import { put } from "@vercel/blob";
import Redis from "ioredis";
import bcrypt from "bcryptjs";

const SOURCE_HTML_PATH = new URL("../../index-v3.html", import.meta.url);

function extractDataBlob(html) {
  const match = html.match(/<script id="data-blob" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("data-blob não encontrado em index-v3.html");
  return JSON.parse(match[1]);
}

async function uploadIfBase64(value, blobPath) {
  if (!value || !/^data:image\//.test(value)) return value || "";
  const [, mime, base64] = value.match(/^data:([^;]+);base64,(.*)$/s) || [];
  if (!base64) return value;
  const buffer = Buffer.from(base64, "base64");
  // Store é privado -- guarda a URL da rota /api/media (proxy), nao a URL direta do Blob.
  const blob = await put(blobPath, buffer, { access: "private", contentType: mime, addRandomSuffix: true });
  return `/api/media/${blob.pathname}`;
}

async function main() {
  console.log("Lendo dados de", SOURCE_HTML_PATH.pathname);
  const html = readFileSync(SOURCE_HTML_PATH, "utf8");
  const data = extractDataBlob(html);

  console.log("Empreendimentos encontrados:", data.developments.length);

  // Fotos de perfil e logos
  data.settings.profilePhoto = await uploadIfBase64(data.settings.profilePhoto, "settings/profile-photo.jpg");
  data.settings.logoImage = await uploadIfBase64(data.settings.logoImage, "settings/logo-dark.png");
  data.settings.logoImageLight = await uploadIfBase64(data.settings.logoImageLight, "settings/logo-light.png");

  // Senha: sai do JSON, vira hash bcrypt (ela continua usando a mesma senha)
  const plainPassword = data.settings.adminPassword;
  if (!plainPassword) throw new Error("settings.adminPassword ausente -- migração cancelada");
  const passwordHash = await bcrypt.hash(plainPassword, 12);
  delete data.settings.adminPassword;

  // Fotos de cada empreendimento
  for (const dev of data.developments) {
    delete dev.__saved;
    const photos = dev.photos || [];
    const uploaded = [];
    for (let i = 0; i < photos.length; i++) {
      uploaded.push(await uploadIfBase64(photos[i], `developments/${dev.id}/${i}.jpg`));
    }
    dev.photos = uploaded;
    console.log(`  ${dev.id}: ${uploaded.length} foto(s) migrada(s)`);
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) throw new Error("REDIS_URL não configurado -- rode com `vercel env pull .env.local` antes");
  const redis = new Redis(redisUrl);
  const serialized = JSON.stringify(data);
  await redis.set("hub:data", serialized);

  // Confere: lê de volta e compara
  const readBack = await redis.get("hub:data");
  const matches = readBack === serialized;
  console.log("Leitura de volta bate com o gravado:", matches);
  if (!matches) throw new Error("Divergência na verificação pós-gravação -- não prossiga com o deploy");
  redis.disconnect();

  console.log("\nHash da senha (gere a env var com este valor):");
  console.log("ADMIN_PASSWORD_HASH=" + passwordHash);
  console.log("\nMigração concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
