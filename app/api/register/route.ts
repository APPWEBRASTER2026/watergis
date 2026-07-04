import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { usuario, password, nombre, email } = await req.json();

    // Validaciones básicas
    if (!usuario || !password || !nombre) {
      return NextResponse.json(
        { ok: false, error: "Usuario, contraseña y nombre son obligatorios." },
        { status: 400 }
      );
    }
    const usuarioLimpio = String(usuario).trim().toLowerCase();
    if (usuarioLimpio.length < 3) {
      return NextResponse.json(
        { ok: false, error: "El usuario debe tener al menos 3 caracteres." },
        { status: 400 }
      );
    }
    if (String(password).length < 6) {
      return NextResponse.json(
        { ok: false, error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    // ¿Ya existe ese usuario?
    const existe = await pool.query("SELECT id FROM usuarios WHERE usuario = $1", [usuarioLimpio]);
    if (existe.rows.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Ese usuario ya existe. Elegí otro." },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(String(password), 10);

    await pool.query(
      "INSERT INTO usuarios (usuario, nombre, email, password_hash) VALUES ($1, $2, $3, $4)",
      [usuarioLimpio, String(nombre).trim(), email ? String(email).trim() : null, hash]
    );

    return NextResponse.json({ ok: true, usuario: usuarioLimpio, nombre: String(nombre).trim() });
  } catch (err) {
    console.error("Error en /api/register:", err);
    return NextResponse.json(
      { ok: false, error: "Error del servidor al registrar el usuario." },
      { status: 500 }
    );
  }
}
