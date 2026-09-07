import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

// O Blob store deste projeto foi criado como privado (sem opção pública),
// então servimos as fotos através desta rota -- pública, sem exigir sessão
// de admin -- que busca o conteúdo no Blob usando o token do servidor.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathname = path.join("/");

  const result = await get(pathname, { access: "private" }).catch(() => null);
  if (!result || !result.stream) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return new NextResponse(result.stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
