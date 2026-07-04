import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { usuario, password } = await req.json();
    if (!usuario || !password) {
      return NextResponse.json(
        { ok: false, error: "Usuario y contraseña son obligatorios." },
        { status: 400 }
      );
    }
    const usuarioLimpio = String(usuario).trim().toLowerCase();

    const result = await pool.query(
      "SELECT usuario, nombre, password_hash FROM usuarios WHERE usuario = $1",
      [usuarioLimpio]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    const row = result.rows[0];
    const coincide = await bcrypt.compare(String(password), row.password_hash);
    if (!coincide) {
      return NextResponse.json(
        { ok: false, error: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, usuario: row.usuario, nombre: row.nombre });
  } catch (err) {
    console.error("Error en /api/login:", err);
    return NextResponse.json(
      { ok: false, error: "Error del servidor al iniciar sesión." },
      { status: 500 }
    );
  }
}
