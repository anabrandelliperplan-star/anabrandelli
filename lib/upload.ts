import { upload } from "@vercel/blob/client";

// O Blob store deste projeto é privado -- guardamos a URL da nossa própria
// rota de proxy (/api/media/<pathname>), não a URL direta do Blob.
export async function uploadImage(file: File, pathPrefix: string): Promise<string> {
  const blob = await upload(`${pathPrefix}/${Date.now()}-${file.name}`, file, {
    access: "private",
    handleUploadUrl: "/api/admin/upload",
  });
  return `/api/media/${blob.pathname}`;
}
