import { upload } from "@vercel/blob/client";

export async function uploadImage(file: File, pathPrefix: string): Promise<string> {
  const blob = await upload(`${pathPrefix}/${Date.now()}-${file.name}`, file, {
    access: "public",
    handleUploadUrl: "/api/admin/upload",
  });
  return blob.url;
}
