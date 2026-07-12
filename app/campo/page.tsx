"use client";

import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";

// ======================================================
// TIPOS Y CONSTANTES
// ======================================================
type Categoria = "AGUA" | "DIQUE" | "EFLUENTE";
type FuenteUI = "SUBTERRANEA" | "SUPERFICIAL" | "MEZCLA" | "RED";

type FormCampo = {
  localidad: string; departamento: string; fuente: string; tipo_punto: string;
  punto_de_muestreo: string; fecha_de_monitoreo: string;
  ph: string; t_c: string; tds_mg_l: string; turb_ntu: string; salinidad_mg_l: string;
  as_mg_l: string; fluor_mg_l: string; no3_mg_l: string;
  od_mg_l: string; sat_o2_pct: string; clorofila_ug_l: string; algas_bga: string;
  cloro_libre_mg_l: string; dbo_mg_l: string; dqo_mg_l: string;
  detergentes_mg_l: string; grasas_aceites_mg_l: string;
  latitud: string; longitud: string;
};

const vacio = (): FormCampo => ({
  localidad: "", departamento: "", fuente: "SUBTERRANEA", tipo_punto: "POZO",
  punto_de_muestreo: "", fecha_de_monitoreo: new Date().toISOString().slice(0, 10),
  ph: "", t_c: "", tds_mg_l: "", turb_ntu: "", salinidad_mg_l: "",
  as_mg_l: "", fluor_mg_l: "", no3_mg_l: "",
  od_mg_l: "", sat_o2_pct: "", clorofila_ug_l: "", algas_bga: "",
  cloro_libre_mg_l: "", dbo_mg_l: "", dqo_mg_l: "",
  detergentes_mg_l: "", grasas_aceites_mg_l: "",
  latitud: "", longitud: "",
});

const gruposParametros: Record<Categoria, { key: keyof FormCampo; label: string; unidad?: string }[]> = {
  AGUA: [
    { key: "ph", label: "pH" },
    { key: "t_c", label: "Temperatura", unidad: "°C" },
    { key: "tds_mg_l", label: "TDS", unidad: "mg/L" },
    { key: "turb_ntu", label: "Turbidez", unidad: "NTU" },
    { key: "cloro_libre_mg_l", label: "Cloro libre", unidad: "mg/L" },
  ],
  DIQUE: [
    { key: "ph", label: "pH" },
    { key: "t_c", label: "Temperatura", unidad: "°C" },
    { key: "tds_mg_l", label: "TDS", unidad: "mg/L" },
    { key: "turb_ntu", label: "Turbidez", unidad: "NTU" },
    { key: "od_mg_l", label: "Oxígeno Disuelto", unidad: "mg/L" },
    { key: "sat_o2_pct", label: "Saturación de O₂", unidad: "%" },
    { key: "clorofila_ug_l", label: "Clorofila-a", unidad: "µg/L" },
    { key: "algas_bga", label: "Algas BGA", unidad: "cel/mL" },
  ],
  EFLUENTE: [
    { key: "tds_mg_l", label: "TDS", unidad: "mg/L" },
    { key: "ph", label: "pH" },
    { key: "t_c", label: "Temperatura", unidad: "°C" },
    { key: "od_mg_l", label: "Oxígeno Disuelto", unidad: "mg/L" },
    { key: "sat_o2_pct", label: "Saturación de O₂", unidad: "%" },
  ],
};

const CATEGORIAS: { key: Categoria; label: string; emoji: string; color: string }[] = [
  { key: "DIQUE", label: "Diques", emoji: "🌊", color: "rgba(59,130,246,0.15)" },
  { key: "EFLUENTE", label: "Efluentes", emoji: "🏭", color: "rgba(249,115,22,0.15)" },
  { key: "AGUA", label: "Agua potable / Red", emoji: "💧", color: "rgba(34,211,238,0.15)" },
];

const SESSION_KEY = "watergis_campo_session";
const QUEUE_KEY = "watergis_campo_queue";
const ENVIADOS_KEY = "watergis_campo_enviados";
const PREFS_KEY = "watergis_campo_prefs";

type Sesion = { user: string; nombre: string };
type PuntoSugerido = { punto: string; localidad: string; departamento: string; fuente: string; tipo_punto: string };

type ItemCola = { id: string; form: FormCampo; categoria: Categoria; creadoEn: string; intentos: number };
type ItemEnviado = { id: string; punto: string; categoria: Categoria; hora: string; estado: "enviado" | "pendiente" | "error"; usuario?: string };
type Prefs = { confirmarEnvio: boolean; temaClaro: boolean; tamanoLetra: number; precisionMinima: number };
const PREFS_DEFAULT: Prefs = { confirmarEnvio: true, temaClaro: false, tamanoLetra: 100, precisionMinima: 10 };

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================
export default function CampoPage() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [pantalla, setPantalla] = useState<"menu" | "form" | "enviados" | "usuario" | "config">("menu");
  const [categoria, setCategoria] = useState<Categoria>("AGUA");
  const [online, setOnline] = useState(true);
  const [colaLength, setColaLength] = useState(0);
  const [prefs, setPrefs] = useState<Prefs>(PREFS_DEFAULT);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) setSesion(JSON.parse(saved));
      const savedPrefs = localStorage.getItem(PREFS_KEY);
      if (savedPrefs) setPrefs({ ...PREFS_DEFAULT, ...JSON.parse(savedPrefs) });
    } catch {}
    setCargandoSesion(false);

    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/manifest-campo.json";
    document.head.appendChild(link);
    const themeColor = document.createElement("meta");
    themeColor.name = "theme-color";
    themeColor.content = "#0e4f68";
    document.head.appendChild(themeColor);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw-campo.js").catch(() => {});
    }

    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const leerCola = (): ItemCola[] => {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
  };
  const guardarCola = (items: ItemCola[]) => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
    setColaLength(items.length);
  };
  const leerEnviados = (): ItemEnviado[] => {
    try { return JSON.parse(localStorage.getItem(ENVIADOS_KEY) || "[]"); } catch { return []; }
  };
  const agregarEnviado = (item: ItemEnviado) => {
    const actuales = leerEnviados();
    localStorage.setItem(ENVIADOS_KEY, JSON.stringify([item, ...actuales].slice(0, 50)));
  };
  const marcarEnviadoOk = (id: string) => {
    const actuales = leerEnviados().map((e) => (e.id === id ? { ...e, estado: "enviado" as const } : e));
    localStorage.setItem(ENVIADOS_KEY, JSON.stringify(actuales));
  };

  const sincronizarCola = async () => {
    if (!navigator.onLine || !sesion) return;
    const cola = leerCola();
    if (cola.length === 0) return;
    const restantes: ItemCola[] = [];
    for (const item of cola) {
      try {
        const res = await fetch("/api/puntos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item.form, usuario: sesion.user }),
        });
        const data = await res.json();
        if (data.ok) {
          marcarEnviadoOk(item.id);
        } else {
          restantes.push({ ...item, intentos: item.intentos + 1 });
        }
      } catch {
        restantes.push({ ...item, intentos: item.intentos + 1 });
      }
    }
    guardarCola(restantes);
  };

  useEffect(() => {
    setColaLength(leerCola().length);
    sincronizarCola();
    const onOnline = () => sincronizarCola();
    window.addEventListener("online", onOnline);
    const interval = setInterval(sincronizarCola, 30000);
    return () => {
      window.removeEventListener("online", onOnline);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion]);

  const actualizarPrefs = (nuevas: Partial<Prefs>) => {
    setPrefs(prev => {
      const actualizado = { ...prev, ...nuevas };
      try { localStorage.setItem(PREFS_KEY, JSON.stringify(actualizado)); } catch {}
      return actualizado;
    });
  };

  const handleLogout = () => {
    setSesion(null);
    localStorage.removeItem(SESSION_KEY);
  };

  if (cargandoSesion) return null;

  const colorFondo = prefs.temaClaro ? "#f1f5f9" : "#020a0d";

  return (
    <div style={{ minHeight: "100vh", maxHeight: "100vh", overflowY: "auto", WebkitOverflowScrolling: "touch", background: colorFondo, fontFamily: "sans-serif", zoom: prefs.tamanoLetra / 100 } as React.CSSProperties}>
      {!sesion ? (
        <LoginCampo onLogin={(s) => { setSesion(s); localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }} />
      ) : (
        <>
          <HeaderCampo online={online} colaLength={colaLength} temaClaro={prefs.temaClaro} onUsuario={() => setPantalla("usuario")} onConfig={() => setPantalla("config")} onHome={() => setPantalla("menu")} />
          {pantalla === "menu" && (
            <MenuCampo
              temaClaro={prefs.temaClaro}
              onElegir={(c) => { setCategoria(c); setPantalla("form"); }}
              onVerEnviados={() => setPantalla("enviados")}
              cantidadEnviadosHoy={leerEnviados().filter((e) => e.hora.slice(0, 10) === new Date().toISOString().slice(0, 10)).length}
            />
          )}
          {pantalla === "form" && (
            <FormularioCampo
              categoria={categoria}
              usuario={sesion.user}
              online={online}
              confirmarEnvio={prefs.confirmarEnvio}
              precisionMinima={prefs.precisionMinima}
              temaClaro={prefs.temaClaro}
              onVolver={() => setPantalla("menu")}
              onEnviar={(form, ok, id) => {
                if (ok) {
                  agregarEnviado({ id, punto: form.punto_de_muestreo, categoria, hora: new Date().toISOString(), estado: "enviado", usuario: sesion.nombre });
                } else {
                  const cola = leerCola();
                  guardarCola([...cola, { id, form, categoria, creadoEn: new Date().toISOString(), intentos: 0 }]);
                  agregarEnviado({ id, punto: form.punto_de_muestreo, categoria, hora: new Date().toISOString(), estado: "pendiente", usuario: sesion.nombre });
                }
                setPantalla("menu");
              }}
            />
          )}
          {pantalla === "enviados" && (
            <PantallaEnviados
              enviados={leerEnviados()}
              cola={leerCola()}
              onVolver={() => setPantalla("menu")}
              onReintentar={sincronizarCola}
            />
          )}
          {pantalla === "usuario" && (
            <PantallaUsuario sesion={sesion} onVolver={() => setPantalla("menu")} onLogout={handleLogout} />
          )}
          {pantalla === "config" && (
            <PantallaConfig prefs={prefs} colaLength={colaLength} onCambiar={actualizarPrefs} onVolver={() => setPantalla("menu")} onSincronizarAhora={sincronizarCola} />
          )}
        </>
      )}
    </div>
  );
}

// ======================================================
// HEADER
// ======================================================
function HeaderCampo({ online, colaLength, temaClaro, onUsuario, onConfig, onHome }: { online: boolean; colaLength: number; temaClaro: boolean; onUsuario: () => void; onConfig: () => void; onHome: () => void }) {
  const bg = temaClaro ? "#ffffff" : "#0a1622";
  const border = temaClaro ? "#e2e8f0" : "#1e293b";
  const texto = temaClaro ? "#0f172a" : "#fff";
  return (
    <div style={{ background: bg, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 10 }}>
      <div onClick={onHome} style={{ fontSize: 14, fontWeight: 700, color: texto, cursor: "pointer" }}>💧 WATERGIS</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 10, color: online ? "#4ade80" : "#fdba74" }}>
          {online ? "🟢 Online" : "🔴 Sin señal"}
        </span>
        {colaLength > 0 && (
          <span style={{ fontSize: 9, background: "rgba(251,191,36,0.15)", color: "#fbbf24", padding: "2px 7px", borderRadius: 10 }}>
            {colaLength} pendiente{colaLength > 1 ? "s" : ""}
          </span>
        )}
        <div onClick={onConfig} style={{ width: 30, height: 30, borderRadius: "50%", background: temaClaro ? "#f1f5f9" : "#111c2b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>⚙️</div>
        <div onClick={onUsuario} style={{ width: 30, height: 30, borderRadius: "50%", background: "#0e4f68", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>👤</div>
      </div>
    </div>
  );
}

// ======================================================
// LOGIN
// ======================================================
function LoginCampo({ onLogin }: { onLogin: (s: Sesion) => void }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!usuario.trim() || !password) { setError("Completá usuario y contraseña."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.trim(), password }),
      });
      const data = await res.json();
      if (data.ok) {
        onLogin({ user: data.usuario, nombre: data.nombre });
      } else {
        setError(data.error || "Usuario o contraseña incorrectos.");
      }
    } catch {
      setError("Sin conexión — necesitás señal para iniciar sesión la primera vez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, margin: "0 auto 14px", borderRadius: 16, background: "#0e4f68", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>💧</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>WATERGIS</div>
          <div style={{ fontSize: 10, color: "#67e8f9", marginTop: 2 }}>CARGA DE CAMPO</div>
        </div>
        <div style={{ fontSize: 9, color: "#64748b", marginBottom: 5 }}>USUARIO</div>
        <input
          value={usuario} onChange={(e) => setUsuario(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="Ingresá tu usuario"
          style={{ width: "100%", border: "1px solid #1e293b", background: "#0a1622", borderRadius: 10, padding: 12, color: "#e2e8f0", fontSize: 14, marginBottom: 12, boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 9, color: "#64748b", marginBottom: 5 }}>CONTRASEÑA</div>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="Ingresá tu contraseña"
          style={{ width: "100%", border: "1px solid #1e293b", background: "#0a1622", borderRadius: 10, padding: 12, color: "#e2e8f0", fontSize: 14, marginBottom: 18, boxSizing: "border-box" }}
        />
        {error && <div style={{ marginBottom: 12, fontSize: 12, color: "#fca5a5", textAlign: "center" }}>{error}</div>}
        <div
          onClick={handleLogin}
          style={{ background: loading ? "#0e7490" : "#22d3ee", borderRadius: 10, padding: 13, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#022c33", cursor: "pointer" }}
        >
          {loading ? "Verificando..." : "Ingresar"}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// MENÚ PRINCIPAL
// ======================================================
function MenuCampo({ temaClaro, onElegir, onVerEnviados, cantidadEnviadosHoy }: { temaClaro: boolean; onElegir: (c: Categoria) => void; onVerEnviados: () => void; cantidadEnviadosHoy: number }) {
  const subtitulos: Record<Categoria, string> = {
    DIQUE: "pH, TDS, OD, Clorofila, BGA",
    EFLUENTE: "TDS, pH, OD, Saturación",
    AGUA: "pH, TDS, Turbidez, Cloro libre",
  };
  const cardBg = temaClaro ? "#ffffff" : "#0a1622";
  const cardBorder = temaClaro ? "#e2e8f0" : "#1e293b";
  const texto = temaClaro ? "#0f172a" : "#fff";
  const textoMuted = temaClaro ? "#64748b" : "#94a3b8";
  return (
    <div style={{ padding: "20px 18px" }}>
      <div style={{ fontSize: 13, color: textoMuted, marginBottom: 16 }}>¿Qué datos vas a cargar?</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {CATEGORIAS.map((c) => (
          <div
            key={c.key}
            onClick={() => onElegir(c.key)}
            style={{ border: `1px solid ${cardBorder}`, background: cardBg, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{c.emoji}</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: texto }}>{c.label}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{subtitulos[c.key]}</div>
            </div>
          </div>
        ))}
      </div>
      <div
        onClick={onVerEnviados}
        style={{ marginTop: 20, border: `1px dashed ${cardBorder}`, borderRadius: 12, padding: 12, textAlign: "center", fontSize: 10.5, color: textoMuted, cursor: "pointer" }}
      >
        📋 Ver datos enviados hoy ({cantidadEnviadosHoy})
      </div>
    </div>
  );
}

// ======================================================
// FORMULARIO
// ======================================================
function FormularioCampo({
  categoria, usuario, online, confirmarEnvio, precisionMinima, temaClaro, onVolver, onEnviar,
}: {
  categoria: Categoria; usuario: string; online: boolean; confirmarEnvio: boolean; precisionMinima: number; temaClaro: boolean;
  onVolver: () => void;
  onEnviar: (form: FormCampo, ok: boolean, id: string) => void;
}) {
  const [form, setForm] = useState<FormCampo>(vacio());
  const [fuenteUI, setFuenteUI] = useState<FuenteUI>("SUBTERRANEA");
  const [gpsEstado, setGpsEstado] = useState<"buscando" | "ok" | "error">("buscando");
  const [precision, setPrecision] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // ── Puntos ya existentes, para autocompletar y evitar duplicados por error de tipeo ──
  const [puntosExistentes, setPuntosExistentes] = useState<PuntoSugerido[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [puntoBloqueado, setPuntoBloqueado] = useState(false); // true si se eligió uno existente

  useEffect(() => {
    const puntosCSV: PuntoSugerido[] = [];
    Papa.parse("/pozos.csv", {
      download: true, header: true, skipEmptyLines: true,
      complete: (r) => {
        (r.data as any[]).forEach((row) => {
          if (row.PUNTO_DE_MUESTREO) {
            puntosCSV.push({
              punto: row.PUNTO_DE_MUESTREO, localidad: row.Localidad || "", departamento: row.Departamento || "",
              fuente: row.Fuente || "", tipo_punto: row.Tipo_Punto || "POZO",
            });
          }
        });
        cargarDeDB(puntosCSV);
      },
      error: () => cargarDeDB(puntosCSV),
    });
    const cargarDeDB = async (base: PuntoSugerido[]) => {
      try {
        const res = await fetch("/api/puntos");
        const data = await res.json();
        const puntosDB: PuntoSugerido[] = data.ok
          ? (data.puntos as any[]).map((p) => ({
              punto: p.punto_de_muestreo, localidad: p.localidad, departamento: p.departamento,
              fuente: p.fuente, tipo_punto: p.tipo_punto,
            }))
          : [];
        // Combinamos y sacamos duplicados por nombre de punto, quedándonos con la última versión
        const combinados = [...base, ...puntosDB];
        const unicos = new Map<string, PuntoSugerido>();
        combinados.forEach((p) => unicos.set(p.punto.trim().toLowerCase(), p));
        setPuntosExistentes(Array.from(unicos.values()));
      } catch {
        setPuntosExistentes(base);
      }
    };
  }, []);

  // Qué tipo_punto corresponde a esta categoría, para no sugerir puntos de otro tipo
  const tiposValidos = categoria === "AGUA" ? ["POZO", "RED"] : categoria === "DIQUE" ? ["DIQUE"] : ["EFLUENTE"];
  const sugerenciasFiltradas = form.punto_de_muestreo.trim().length >= 2
    ? puntosExistentes
        .filter((p) => tiposValidos.includes((p.tipo_punto || "").toUpperCase()))
        .filter((p) => p.punto.toLowerCase().includes(form.punto_de_muestreo.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  const elegirPuntoExistente = (p: PuntoSugerido) => {
    setForm((prev) => ({
      ...prev,
      punto_de_muestreo: p.punto,
      localidad: p.localidad,
      departamento: p.departamento,
      fuente: p.fuente || prev.fuente,
      tipo_punto: p.tipo_punto || prev.tipo_punto,
      // Las coordenadas NO se tocan: se mantiene la lectura GPS fresca del lugar donde estás parado ahora.
    }));
    if (p.tipo_punto === "RED" && ["SUBTERRANEA", "SUPERFICIAL", "MEZCLA"].includes((p.fuente || "").toUpperCase())) {
      setFuenteUI("RED");
    }
    setPuntoBloqueado(true);
    setMostrarSugerencias(false);
  };

  useEffect(() => {
    if (!("geolocation" in navigator)) { setGpsEstado("error"); return; }

    let mejorPrecision = Infinity;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const precisionActual = Math.round(pos.coords.accuracy);
        // Solo actualizamos si esta lectura es igual o mejor que la mejor que ya tenemos —
        // el GPS va afinando con el tiempo, así que descartamos lecturas peores que ya superamos.
        if (precisionActual <= mejorPrecision) {
          mejorPrecision = precisionActual;
          setForm((prev) => ({ ...prev, latitud: pos.coords.latitude.toFixed(6), longitud: pos.coords.longitude.toFixed(6) }));
          setPrecision(precisionActual);
        }
        setGpsEstado("ok");
      },
      () => setGpsEstado("error"),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (categoria === "DIQUE") setForm((p) => ({ ...p, tipo_punto: "DIQUE", fuente: "SUPERFICIAL" }));
    else if (categoria === "EFLUENTE") setForm((p) => ({ ...p, tipo_punto: "EFLUENTE" }));
    else setForm((p) => ({ ...p, tipo_punto: fuenteUI === "RED" ? "RED" : "POZO", fuente: fuenteUI === "RED" ? p.fuente || "SUBTERRANEA" : fuenteUI }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  const elegirFuente = (f: FuenteUI) => {
    setFuenteUI(f);
    if (f === "RED") setForm((p) => ({ ...p, tipo_punto: "RED", fuente: "SUBTERRANEA" }));
    else setForm((p) => ({ ...p, tipo_punto: "POZO", fuente: f }));
  };

  const set = (campo: keyof FormCampo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  const parametros = gruposParametros[categoria];
  const titulo = categoria === "DIQUE" ? "🌊 Dique" : categoria === "EFLUENTE" ? "🏭 Efluente" : "💧 Agua potable";

  const enviarAhora = async () => {
    setEnviando(true);
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!online) {
      setEnviando(false);
      onEnviar(form, false, id);
      return;
    }
    try {
      const res = await fetch("/api/puntos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, usuario }),
      });
      const data = await res.json();
      setEnviando(false);
      onEnviar(form, !!data.ok, id);
    } catch {
      setEnviando(false);
      onEnviar(form, false, id);
    }
  };

  const handleEnviar = () => {
    setError("");
    if (!form.localidad.trim() || !form.departamento.trim() || !form.punto_de_muestreo.trim()) {
      setError("Completá Localidad, Departamento y Sitio de extracción."); return;
    }
    if (!form.latitud || !form.longitud) {
      setError("Todavía no se detectó la ubicación GPS. Esperá unos segundos o reintentá."); return;
    }
    if (precisionMinima > 0 && precision !== null && precision > precisionMinima) {
      setError(`La precisión del GPS es de ${precision}m — necesitás ${precisionMinima}m o mejor. Esperá unos segundos y volvé a intentar.`);
      return;
    }
    if (confirmarEnvio) { setMostrarConfirmacion(true); return; }
    enviarAhora();
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ background: "#0a1622", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1e293b" }}>
        <div onClick={onVolver} style={{ fontSize: 16, color: "#67e8f9", cursor: "pointer" }}>←</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{titulo} — Cargar dato</div>
      </div>

      <div style={{ padding: "16px 18px" }}>
        {categoria === "AGUA" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Fuente *</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
              {(["SUBTERRANEA", "SUPERFICIAL", "MEZCLA", "RED"] as FuenteUI[]).map((f) => (
                <div
                  key={f}
                  onClick={() => elegirFuente(f)}
                  style={{
                    border: `1px solid ${fuenteUI === f ? "#22d3ee" : "#1e293b"}`,
                    background: fuenteUI === f ? "rgba(34,211,238,0.15)" : "transparent",
                    borderRadius: 8, padding: "8px 2px", textAlign: "center", fontSize: 9,
                    color: fuenteUI === f ? "#67e8f9" : "#64748b", cursor: "pointer",
                  }}
                >
                  {f === "SUBTERRANEA" ? "Subterránea" : f === "SUPERFICIAL" ? "Superficial" : f === "MEZCLA" ? "Mezcla" : "🚿 Red"}
                </div>
              ))}
            </div>
            {fuenteUI === "RED" && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>¿De qué origen viene el agua de esta red? *</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {["SUBTERRANEA", "SUPERFICIAL", "MEZCLA"].map((o) => (
                    <div
                      key={o}
                      onClick={() => setForm((p) => ({ ...p, fuente: o }))}
                      style={{
                        border: `1px solid ${form.fuente === o ? "#a855f7" : "#1e293b"}`,
                        background: form.fuente === o ? "rgba(168,85,247,0.15)" : "transparent",
                        borderRadius: 8, padding: "8px 2px", textAlign: "center", fontSize: 9,
                        color: form.fuente === o ? "#d8b4fe" : "#64748b", cursor: "pointer",
                      }}
                    >
                      {o === "SUBTERRANEA" ? "Subterránea" : o === "SUPERFICIAL" ? "Superficial" : "Mezcla"}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "#67e8f9", marginBottom: 3 }}>📍 UBICACIÓN GPS</div>
          {gpsEstado === "buscando" && <div style={{ fontSize: 11, color: "#94a3b8" }}>Buscando señal GPS...</div>}
          {gpsEstado === "ok" && (
            <>
              <div style={{ fontSize: 11.5, color: "#e2e8f0" }}>{form.latitud}, {form.longitud}</div>
              <div style={{ fontSize: 9, color: (precisionMinima > 0 && precision !== null && precision > precisionMinima) ? "#fca5a5" : "#4ade80", marginTop: 2 }}>
                {(precisionMinima > 0 && precision !== null && precision > precisionMinima) ? "⚠️" : "✓"} Precisión: {precision}m{precisionMinima > 0 ? ` (mín. requerido: ${precisionMinima}m)` : ""}
              </div>
              {precisionMinima > 0 && precision !== null && precision > precisionMinima && (
                <div style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 2 }}>Afinando señal, esperá unos segundos...</div>
              )}
            </>
          )}
          {gpsEstado === "error" && <div style={{ fontSize: 11, color: "#fca5a5" }}>No se pudo obtener el GPS. Revisá los permisos de ubicación.</div>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: "#64748b", marginBottom: 3 }}>Departamento *</div>
            <input value={form.departamento} onChange={set("departamento")} placeholder="Capital"
              style={{ width: "100%", border: "1px solid #1e293b", background: "#0a1622", borderRadius: 8, padding: 8, color: "#e2e8f0", fontSize: 11, boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: "#64748b", marginBottom: 3 }}>Localidad *</div>
            <input value={form.localidad} onChange={set("localidad")} placeholder="San Fernando"
              style={{ width: "100%", border: "1px solid #1e293b", background: "#0a1622", borderRadius: 8, padding: 8, color: "#e2e8f0", fontSize: 11, boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ marginBottom: 10, position: "relative" }}>
          <div style={{ fontSize: 9, color: "#64748b", marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
            <span>Sitio de extracción *</span>
            {puntoBloqueado && (
              <span onClick={() => setPuntoBloqueado(false)} style={{ color: "#67e8f9", cursor: "pointer" }}>✓ punto existente · cambiar</span>
            )}
          </div>
          <input
            value={form.punto_de_muestreo}
            disabled={puntoBloqueado}
            onChange={(e) => { set("punto_de_muestreo")(e); setMostrarSugerencias(true); }}
            onFocus={() => setMostrarSugerencias(true)}
            placeholder="Ej: Pozo N°3, Dique Ipizca..."
            style={{ width: "100%", border: "1px solid #22d3ee", background: puntoBloqueado ? "#0d1b28" : "#0a1622", borderRadius: 8, padding: 8, color: puntoBloqueado ? "#67e8f9" : "#e2e8f0", fontSize: 11, boxSizing: "border-box" }}
          />
          {mostrarSugerencias && !puntoBloqueado && sugerenciasFiltradas.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#0a1622", border: "1px solid #1e293b", borderRadius: 8, overflow: "hidden", zIndex: 20 }}>
              {sugerenciasFiltradas.map((p) => (
                <div
                  key={p.punto}
                  onClick={() => elegirPuntoExistente(p)}
                  style={{ padding: "8px 10px", borderBottom: "1px solid #1e293b", cursor: "pointer" }}
                >
                  <div style={{ fontSize: 10.5, color: "#e2e8f0" }}>{p.punto}</div>
                  <div style={{ fontSize: 8.5, color: "#64748b", marginTop: 1 }}>{p.localidad} · {p.departamento}</div>
                </div>
              ))}
            </div>
          )}
          {!puntoBloqueado && form.punto_de_muestreo.trim().length >= 2 && sugerenciasFiltradas.length === 0 && (
            <div style={{ fontSize: 8.5, color: "#64748b", marginTop: 3 }}>No hay puntos existentes con ese nombre — se va a cargar como punto nuevo.</div>
          )}
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "#64748b", marginBottom: 3 }}>Fecha</div>
          <input type="date" value={form.fecha_de_monitoreo} onChange={set("fecha_de_monitoreo")}
            style={{ width: "100%", border: "1px solid #1e293b", background: "#0a1622", borderRadius: 8, padding: 8, color: "#e2e8f0", fontSize: 11, boxSizing: "border-box" }} />
        </div>

        <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Parámetros in situ</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {parametros.map((p) => (
            <div key={p.key}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 3 }}>{p.label}{p.unidad ? ` (${p.unidad})` : ""}</div>
              <input
                value={form[p.key]} onChange={set(p.key)} placeholder="0.00" inputMode="decimal"
                style={{ width: "100%", border: "1px solid #334155", background: "#0a1622", borderRadius: 6, padding: 8, color: "#e2e8f0", fontSize: 11, boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>

        {error && <div style={{ marginTop: 12, fontSize: 11, color: "#fca5a5", textAlign: "center" }}>{error}</div>}

        <div
          onClick={enviando ? undefined : handleEnviar}
          style={{ marginTop: 16, background: enviando ? "#0e7490" : "#22d3ee", borderRadius: 12, padding: 13, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#022c33", cursor: enviando ? "default" : "pointer" }}
        >
          {enviando ? "Enviando..." : online ? "Enviar al mapa" : "Guardar (sin señal)"}
        </div>
        <div style={{ marginTop: 8, textAlign: "center", fontSize: 9.5, color: "#64748b" }}>
          Si te falta un análisis, dejalo vacío y cargalo después desde la web.
        </div>
      </div>

      {mostrarConfirmacion && (
        <div style={{ minHeight: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", inset: 0, zIndex: 200 }}>
          <div style={{ width: "85%", maxWidth: 300, background: "#0a1622", border: "1px solid #1e293b", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6 }}>¿Confirmás el envío?</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>
              {form.punto_de_muestreo || "Punto sin nombre"} — {form.localidad}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div onClick={() => setMostrarConfirmacion(false)} style={{ flex: 1, border: "1px solid #334155", borderRadius: 10, padding: 10, textAlign: "center", fontSize: 11.5, color: "#94a3b8", cursor: "pointer" }}>Revisar</div>
              <div onClick={() => { setMostrarConfirmacion(false); enviarAhora(); }} style={{ flex: 1, background: "#22d3ee", borderRadius: 10, padding: 10, textAlign: "center", fontSize: 11.5, fontWeight: 700, color: "#022c33", cursor: "pointer" }}>Confirmar</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================================
// PANTALLA — DATOS ENVIADOS
// ======================================================
function PantallaEnviados({ enviados, cola, onVolver, onReintentar }: { enviados: ItemEnviado[]; cola: ItemCola[]; onVolver: () => void; onReintentar: () => void }) {
  const labelCat: Record<Categoria, string> = { DIQUE: "🌊 Dique", EFLUENTE: "🏭 Efluente", AGUA: "💧 Agua/Red" };
  return (
    <div>
      <div style={{ background: "#0a1622", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1e293b" }}>
        <div onClick={onVolver} style={{ fontSize: 16, color: "#67e8f9", cursor: "pointer" }}>←</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", flex: 1 }}>Datos enviados</div>
        {cola.length > 0 && (
          <div onClick={onReintentar} style={{ fontSize: 10, color: "#67e8f9", cursor: "pointer" }}>↻ Reintentar</div>
        )}
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {enviados.length === 0 && (
          <div style={{ textAlign: "center", color: "#64748b", fontSize: 12, marginTop: 30 }}>Todavía no cargaste ningún dato.</div>
        )}
        {enviados.map((e) => (
          <div key={e.id} style={{ border: "1px solid #1e293b", background: "#0a1622", borderRadius: 10, padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#e2e8f0" }}>{e.punto || "(sin nombre)"}</div>
              <div style={{ fontSize: 9, color: "#64748b" }}>
                {new Date(e.hora).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} · {labelCat[e.categoria]}{e.usuario ? ` · 👤 ${e.usuario}` : ""}
              </div>
            </div>
            <div style={{ fontSize: 9, color: e.estado === "enviado" ? "#4ade80" : e.estado === "pendiente" ? "#fdba74" : "#fca5a5" }}>
              {e.estado === "enviado" ? "✓ En el mapa" : e.estado === "pendiente" ? "⏳ Pendiente" : "⚠ Error"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================================================
// PANTALLA — USUARIO
// ======================================================
function PantallaUsuario({ sesion, onVolver, onLogout }: { sesion: Sesion; onVolver: () => void; onLogout: () => void }) {
  const [mostrarPass, setMostrarPass] = useState(false);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [nueva2, setNueva2] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const cambiarPassword = async () => {
    setMsg("");
    if (!actual || !nueva) { setMsg("Completá los dos campos."); return; }
    if (nueva !== nueva2) { setMsg("Las contraseñas nuevas no coinciden."); return; }
    if (nueva.length < 6) { setMsg("Mínimo 6 caracteres."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: sesion.user, passwordActual: actual, passwordNueva: nueva }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg("✅ Contraseña actualizada.");
        setActual(""); setNueva(""); setNueva2("");
      } else {
        setMsg(data.error || "No se pudo cambiar la contraseña.");
      }
    } catch {
      setMsg("Sin conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ background: "#0a1622", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1e293b" }}>
        <div onClick={onVolver} style={{ fontSize: 16, color: "#67e8f9", cursor: "pointer" }}>←</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Mi usuario</div>
      </div>
      <div style={{ padding: "18px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0e4f68", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>
          <div>
            <div style={{ fontSize: 12.5, color: "#fff", fontWeight: 600 }}>{sesion.nombre}</div>
            <div style={{ fontSize: 9.5, color: "#67e8f9" }}>@{sesion.user}</div>
          </div>
        </div>

        <div onClick={() => setMostrarPass((v) => !v)} style={{ border: "1px solid #1e293b", borderRadius: 10, padding: 11, marginBottom: 8, fontSize: 11, color: "#e2e8f0", cursor: "pointer" }}>
          🔑 Cambiar contraseña
        </div>

        {mostrarPass && (
          <div style={{ background: "#0a1622", border: "1px solid #1e293b", borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <input type="password" value={actual} onChange={(e) => setActual(e.target.value)} placeholder="Contraseña actual"
              style={{ width: "100%", border: "1px solid #1e293b", background: "#020a0d", borderRadius: 8, padding: 9, color: "#e2e8f0", fontSize: 11, marginBottom: 8, boxSizing: "border-box" }} />
            <input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Nueva contraseña"
              style={{ width: "100%", border: "1px solid #1e293b", background: "#020a0d", borderRadius: 8, padding: 9, color: "#e2e8f0", fontSize: 11, marginBottom: 8, boxSizing: "border-box" }} />
            <input type="password" value={nueva2} onChange={(e) => setNueva2(e.target.value)} placeholder="Repetir nueva contraseña"
              style={{ width: "100%", border: "1px solid #1e293b", background: "#020a0d", borderRadius: 8, padding: 9, color: "#e2e8f0", fontSize: 11, marginBottom: 10, boxSizing: "border-box" }} />
            {msg && <div style={{ fontSize: 10.5, color: msg.startsWith("✅") ? "#4ade80" : "#fca5a5", marginBottom: 8, textAlign: "center" }}>{msg}</div>}
            <div onClick={loading ? undefined : cambiarPassword} style={{ background: "#22d3ee", borderRadius: 8, padding: 10, textAlign: "center", fontSize: 11, fontWeight: 700, color: "#022c33", cursor: "pointer" }}>
              {loading ? "Guardando..." : "Confirmar cambio"}
            </div>
          </div>
        )}

        <div onClick={onLogout} style={{ border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: 11, fontSize: 11, color: "#fca5a5", cursor: "pointer" }}>
          ↪ Cerrar sesión
        </div>
      </div>
    </div>
  );
}

// ======================================================
// PANTALLA — CONFIGURACIÓN
// ======================================================
function Toggle({ activo, onChange }: { activo: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!activo)}
      style={{ width: 42, height: 24, borderRadius: 12, background: activo ? "#22d3ee" : "#334155", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}
    >
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: activo ? 21 : 3, transition: "left 0.15s" }} />
    </div>
  );
}

function PantallaConfig({
  prefs, colaLength, onCambiar, onVolver, onSincronizarAhora,
}: {
  prefs: Prefs; colaLength: number;
  onCambiar: (nuevas: Partial<Prefs>) => void;
  onVolver: () => void;
  onSincronizarAhora: () => void;
}) {
  const [sincronizando, setSincronizando] = useState(false);
  const filaStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #1e293b" };

  return (
    <div>
      <div style={{ background: "#0a1622", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1e293b" }}>
        <div onClick={onVolver} style={{ fontSize: 16, color: "#67e8f9", cursor: "pointer" }}>←</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>⚙️ Configuración</div>
      </div>

      <div style={{ padding: "16px 18px" }}>

        <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Carga de datos</div>
        <div style={filaStyle}>
          <div>
            <div style={{ fontSize: 12, color: "#e2e8f0" }}>Confirmar antes de enviar</div>
            <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 1 }}>Evita toques accidentales</div>
          </div>
          <Toggle activo={prefs.confirmarEnvio} onChange={(v) => onCambiar({ confirmarEnvio: v })} />
        </div>

        <div style={{ padding: "13px 0", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 12, color: "#e2e8f0", marginBottom: 8 }}>Precisión mínima del GPS</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 10, 20, 50].map((v) => (
              <div
                key={v}
                onClick={() => onCambiar({ precisionMinima: v })}
                style={{
                  flex: 1, textAlign: "center", padding: "7px 4px", borderRadius: 8, fontSize: 10.5, cursor: "pointer",
                  border: `1px solid ${prefs.precisionMinima === v ? "#22d3ee" : "#334155"}`,
                  background: prefs.precisionMinima === v ? "rgba(34,211,238,0.15)" : "transparent",
                  color: prefs.precisionMinima === v ? "#67e8f9" : "#64748b",
                }}
              >
                {v === 0 ? "Sin límite" : `${v}m`}
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, margin: "18px 0 4px" }}>Apariencia</div>
        <div style={filaStyle}>
          <div style={{ fontSize: 12, color: "#e2e8f0" }}>Tema claro</div>
          <Toggle activo={prefs.temaClaro} onChange={(v) => onCambiar({ temaClaro: v })} />
        </div>
        <div style={{ padding: "13px 0", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 12, color: "#e2e8f0", marginBottom: 2 }}>Tamaño de letra</div>
          <div style={{ fontSize: 9.5, color: "#64748b", marginBottom: 8 }}>Para sol fuerte o guantes de trabajo</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[100, 115, 130, 150].map((v) => (
              <div
                key={v}
                onClick={() => onCambiar({ tamanoLetra: v })}
                style={{
                  flex: 1, textAlign: "center", padding: "7px 4px", borderRadius: 8, cursor: "pointer",
                  fontSize: 10.5 + (v - 100) / 25,
                  border: `1px solid ${prefs.tamanoLetra === v ? "#22d3ee" : "#334155"}`,
                  background: prefs.tamanoLetra === v ? "rgba(34,211,238,0.15)" : "transparent",
                  color: prefs.tamanoLetra === v ? "#67e8f9" : "#64748b",
                }}
              >
                {v === 100 ? "Normal" : v === 115 ? "Grande" : v === 130 ? "Muy grande" : "Máxima"}
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, margin: "18px 0 4px" }}>Sincronización</div>
        <div style={{ padding: "13px 0", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 12, color: "#e2e8f0" }}>
            {colaLength === 0 ? "Todo sincronizado ✓" : `${colaLength} dato${colaLength > 1 ? "s" : ""} pendiente${colaLength > 1 ? "s" : ""} de subir`}
          </div>
          {colaLength > 0 && (
            <div
              onClick={async () => { setSincronizando(true); await onSincronizarAhora(); setSincronizando(false); }}
              style={{ marginTop: 8, border: "1px solid #22d3ee", borderRadius: 8, padding: 8, textAlign: "center", fontSize: 11, color: "#67e8f9", cursor: "pointer" }}
            >
              {sincronizando ? "Sincronizando..." : "↻ Sincronizar ahora"}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
