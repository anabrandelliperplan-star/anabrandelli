import { NextRequest, NextResponse } from "next/server";
import { getData, saveData } from "@/lib/db";
import type { Development } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Partial<Development> | null;
  if (!body) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const data = await getData();
  const dev = data.developments.find((d) => d.id === id);
  if (!dev) {
    return NextResponse.json({ error: "Empreendimento não encontrado" }, { status: 404 });
  }
  Object.assign(dev, body);
  await saveData(data);
  return NextResponse.json(dev);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData();
  const before = data.developments.length;
  data.developments = data.developments.filter((d) => d.id !== id);
  if (data.developments.length === before) {
    return NextResponse.json({ error: "Empreendimento não encontrado" }, { status: 404 });
  }
  await saveData(data);
  return NextResponse.json({ ok: true });
}
