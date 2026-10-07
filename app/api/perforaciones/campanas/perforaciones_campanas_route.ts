import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ADMIN_HARDCODEADOS = ["nicolas.doria", "admin", "inspector1"];

const CAMPOS = [
  "perforacion_id","fecha","hora","responsable","nivel_estatico_m","nivel_dinamico_m",
  "abatimiento_m","tiempo_bombeo_h","caudal_actual_m3h","presion_boca_psi","consumo_motor_a",
  "lectura_medidor_m3","temp_agua_c","ph","conductividad_us_cm","tds_mg_l",
  "presencia_arena","nitratos_mg_l","ras","bacterias","notas",
];

async function tieneAcceso(usuario: string): Promise<boolean> {
  const u = String(usuario).trim().toLowerCase();
  if (ADMIN_HARDCODEADOS.includes(u)) return true;
  const r = await pool.query("SELECT acceso_perforaciones FROM usuarios WHERE usuario = $1", [u]);
  return r.rows.length > 0 && r.rows[0].acceso_perforaciones === "admin";
}

export async function GET(req: NextRequest) {
  try {
    const perforacionId = req.nextUrl.searchParams.get("perforacion_id");
    if (!perforacionId) {
      return NextResponse.json({ ok: false, error: "Falta perforacion_id." }, { status: 400 });
    }
    const result = await pool.query(
      "SELECT * FROM campanas_perforacion WHERE perforacion_id = $1 ORDER BY creado_en ASC",
      [perforacionId]
    );
    return NextResponse.json({ ok: true, campanas: result.rows });
  } catch (err) {
    console.error("Error en GET /api/perforaciones/campanas:", err);
    return NextResponse.json({ ok: false, error: "Error al leer las campañas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { usuario } = body;
    if (!usuario) return NextResponse.json({ ok: false, error: "Debés iniciar sesión." }, { status: 401 });
    if (!(await tieneAcceso(usuario))) {
      return NextResponse.json({ ok: false, error: "Tu cuenta no tiene permiso para cargar en Perforaciones." }, { status: 403 });
    }
    if (!body.perforacion_id || !body.fecha) {
      return NextResponse.json({ ok: false, error: "Faltan campos obligatorios (perforación, fecha)." }, { status: 400 });
    }

    const valores = CAMPOS.map((c) => (body[c] !== undefined && body[c] !== null ? String(body[c]) : null));
    const placeholders = CAMPOS.map((_, i) => `$${i + 1}`).join(", ");

    await pool.query(
      `INSERT INTO campanas_perforacion (${CAMPOS.join(", ")}, cargado_por)
       VALUES (${placeholders}, $${CAMPOS.length + 1})`,
      [...valores, String(usuario).trim().toLowerCase()]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en POST /api/perforaciones/campanas:", err);
    return NextResponse.json({ ok: false, error: "Error del servidor al guardar la campaña." }, { status: 500 });
  }
}
