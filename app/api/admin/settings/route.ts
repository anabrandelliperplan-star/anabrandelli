import { NextRequest, NextResponse } from "next/server";
import { getData, saveData } from "@/lib/db";
import type { Settings } from "@/lib/types";

export async function GET() {
  const data = await getData();
  return NextResponse.json(data.settings);
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Partial<Settings> | null;
  if (!body) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const data = await getData();
  data.settings = { ...data.settings, ...body };
  await saveData(data);
  return NextResponse.json(data.settings);
}
