import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// Campos que puede mandar el formulario, en el mismo orden que la tabla
const CAMPOS = [
  "localidad","departamento","fuente","tipo_punto","punto_de_muestreo",
  "fecha_de_monitoreo","ph","t_c","tds_mg_l","turb_ntu","salinidad_mg_l",
  "as_mg_l","fluor_mg_l","no3_mg_l","od_mg_l","sat_o2_pct","clorofila_ug_l",
  "algas_bga","cloro_libre_mg_l","dbo_mg_l","dqo_mg_l","detergentes_mg_l",
  "grasas_aceites_mg_l","latitud","longitud",
];

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT * FROM puntos_monitoreo ORDER BY cargado_en DESC`
    );
    return NextResponse.json({ ok: true, puntos: result.rows });
  } catch (err) {
    console.error("Error en GET /api/puntos:", err);
    return NextResponse.json({ ok: false, error: "Error al leer los puntos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { usuario } = body;

    // ── Verificación de autorización ──
    // Solo un usuario que exista en la base de datos puede cargar datos.
    // (Los 3 usuarios históricos hardcodeados deben registrarse una vez
    // con el formulario de "Registrar nuevo usuario" para poder cargar datos).
    if (!usuario) {
      return NextResponse.json({ ok: false, error: "Debés iniciar sesión para cargar datos." }, { status: 401 });
    }
    const userCheck = await pool.query("SELECT usuario FROM usuarios WHERE usuario = $1", [
      String(usuario).trim().toLowerCase(),
    ]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Tu usuario no está registrado en la base de datos. Registrate una vez desde la pantalla de inicio de sesión." },
        { status: 403 }
      );
    }

    // ── Validaciones mínimas ──
    if (!body.localidad || !body.departamento || !body.fuente || !body.tipo_punto ||
        !body.punto_de_muestreo || !body.latitud || !body.longitud) {
      return NextResponse.json(
        { ok: false, error: "Localidad, Departamento, Fuente, Tipo de punto, Punto de muestreo, Latitud y Longitud son obligatorios." },
        { status: 400 }
      );
    }
    const lat = parseFloat(String(body.latitud).replace(",", "."));
    const lng = parseFloat(String(body.longitud).replace(",", "."));
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ ok: false, error: "Latitud y Longitud deben ser números válidos." }, { status: 400 });
    }

    const valores = CAMPOS.map((c) => (body[c] !== undefined && body[c] !== null ? String(body[c]) : null));
    const placeholders = CAMPOS.map((_, i) => `$${i + 1}`).join(", ");

    await pool.query(
      `INSERT INTO puntos_monitoreo (${CAMPOS.join(", ")}, cargado_por)
       VALUES (${placeholders}, $${CAMPOS.length + 1})`,
      [...valores, String(usuario).trim().toLowerCase()]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en POST /api/puntos:", err);
    return NextResponse.json({ ok: false, error: "Error del servidor al guardar el punto." }, { status: 500 });
  }
}
