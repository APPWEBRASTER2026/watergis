import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { usuario, passwordActual, passwordNueva } = await req.json();

    if (!usuario || !passwordActual || !passwordNueva) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos." },
        { status: 400 }
      );
    }
    if (String(passwordNueva).length < 6) {
      return NextResponse.json(
        { ok: false, error: "La nueva contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const usuarioLimpio = String(usuario).trim().toLowerCase();
    const result = await pool.query(
      "SELECT password_hash FROM usuarios WHERE usuario = $1",
      [usuarioLimpio]
    );
    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    const coincide = await bcrypt.compare(String(passwordActual), result.rows[0].password_hash);
    if (!coincide) {
      return NextResponse.json(
        { ok: false, error: "La contraseña actual no es correcta." },
        { status: 401 }
      );
    }

    const nuevoHash = await bcrypt.hash(String(passwordNueva), 10);
    await pool.query(
      "UPDATE usuarios SET password_hash = $1 WHERE usuario = $2",
      [nuevoHash, usuarioLimpio]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en /api/change-password:", err);
    return NextResponse.json(
      { ok: false, error: "Error del servidor al cambiar la contraseña." },
      { status: 500 }
    );
  }
}
