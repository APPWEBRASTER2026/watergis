import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ADMIN_HARDCODEADOS = ["nicolas.doria", "admin", "inspector1"];

const CAMPOS = [
  "nombre","establecimiento","provincia","departamento","localidad","uso_previsto",
  "profundidad_total_m","diametro_perforacion_pulg","diametro_entubado_pulg",
  "engravillado","potencia_bomba_hp","latitud","longitud",
];

async function tieneAcceso(usuario: string): Promise<boolean> {
  const u = String(usuario).trim().toLowerCase();
  if (ADMIN_HARDCODEADOS.includes(u)) return true;
  const r = await pool.query("SELECT acceso_perforaciones FROM usuarios WHERE usuario = $1", [u]);
  return r.rows.length > 0 && r.rows[0].acceso_perforaciones === "admin";
}

export async function GET() {
  try {
    // Trae cada pozo junto con el resumen de su última campaña, para el mapa y el dashboard
    const result = await pool.query(`
      SELECT p.*,
        c.fecha AS ultima_fecha, c.nivel_estatico_m, c.nivel_dinamico_m, c.abatimiento_m,
        c.caudal_actual_m3h, c.conductividad_us_cm, c.tds_mg_l, c.presencia_arena
      FROM perforaciones p
      LEFT JOIN LATERAL (
        SELECT * FROM campanas_perforacion cp
        WHERE cp.perforacion_id = p.id
        ORDER BY cp.creado_en DESC LIMIT 1
      ) c ON true
      ORDER BY p.creado_en DESC
    `);
    return NextResponse.json({ ok: true, perforaciones: result.rows });
  } catch (err) {
    console.error("Error en GET /api/perforaciones:", err);
    return NextResponse.json({ ok: false, error: "Error al leer las perforaciones." }, { status: 500 });
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
    if (!body.nombre || !body.departamento || !body.localidad || !body.uso_previsto || !body.latitud || !body.longitud) {
      return NextResponse.json({ ok: false, error: "Faltan campos obligatorios (nombre, ubicación, uso previsto, coordenadas)." }, { status: 400 });
    }

    const valores = CAMPOS.map((c) => (body[c] !== undefined && body[c] !== null ? String(body[c]) : null));
    const placeholders = CAMPOS.map((_, i) => `$${i + 1}`).join(", ");

    const result = await pool.query(
      `INSERT INTO perforaciones (${CAMPOS.join(", ")}, cargado_por)
       VALUES (${placeholders}, $${CAMPOS.length + 1}) RETURNING id`,
      [...valores, String(usuario).trim().toLowerCase()]
    );

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error("Error en POST /api/perforaciones:", err);
    return NextResponse.json({ ok: false, error: "Error del servidor al guardar la perforación." }, { status: 500 });
  }
}
