import { NextRequest, NextResponse } from "next/server";
import { changePassword } from "@/lib/password";

// Protegida pelo middleware (exige sessão válida) e ainda assim exige a
// senha atual -- assim, roubar só o cookie de sessão não basta pra trocar
// a senha e travar o acesso de verdade.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Preencha a senha atual e a nova senha" }, { status: 400 });
  }

  const result = await changePassword(currentPassword, newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
