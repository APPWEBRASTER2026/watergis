import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { usuario, avatar } = await req.json();
    if (!usuario || !avatar) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos." },
        { status: 400 }
      );
    }
    const usuarioLimpio = String(usuario).trim().toLowerCase();

    const result = await pool.query("SELECT id FROM usuarios WHERE usuario = $1", [usuarioLimpio]);
    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado. Este cambio requiere una cuenta registrada." },
        { status: 404 }
      );
    }

    await pool.query("UPDATE usuarios SET avatar = $1 WHERE usuario = $2", [String(avatar), usuarioLimpio]);

    return NextResponse.json({ ok: true, avatar: String(avatar) });
  } catch (err) {
    console.error("Error en /api/change-avatar:", err);
    return NextResponse.json(
      { ok: false, error: "Error del servidor al cambiar el avatar." },
      { status: 500 }
    );
  }
}
