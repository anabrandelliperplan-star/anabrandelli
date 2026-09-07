import { NextRequest, NextResponse } from "next/server";
import { getData, saveData } from "@/lib/db";
import type { SimulatorSettings } from "@/lib/types";

export async function GET() {
  const data = await getData();
  return NextResponse.json(data.simulatorSettings);
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Partial<SimulatorSettings> | null;
  if (!body) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const data = await getData();
  data.simulatorSettings = { ...data.simulatorSettings, ...body };
  await saveData(data);
  return NextResponse.json(data.simulatorSettings);
}
