"use client";

import "leaflet/dist/leaflet.css";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Papa from "papaparse";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  GeoJSON,
  useMap,
} from "react-leaflet";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import L from "leaflet";
import { MapPin, AlertTriangle, Droplets, Waves, Plus } from "lucide-react";

// ======================================================
// FIX LEAFLET
// ======================================================

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ======================================================
// ICONOS MAPA
// ======================================================

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const orangeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const violetIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const greyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});

// ======================================================
// TYPES
// ======================================================

type Punto = {
  Localidad: string; Departamento: string; Fuente: string;
  Tipo_Punto: string;
  PUNTO_DE_MUESTREO: string; Fecha_de_monitoreo: string;
  Ph: string; T_ºC: string; TDS_mg_l: string; Turb_NTU: string;
  Salinidad_mg_l: string; As_mg_l: string; Fluor_mg_l: string;
  NO3_mg_l: string;
  OD_mg_l: string; Sat_O2_pct: string; Clorofila_ug_l: string;
  Algas_BGA: string; Cloro_libre_mg_l: string;
  DBO_mg_l: string; DQO_mg_l: string; Detergentes_mg_l: string; Grasas_Aceites_mg_l: string;
  Latitud: string; Longitud: string;
};

type Idioma    = "es" | "en" | "de" | "pt";
type Tipografia = "inter" | "mono" | "serif";

// tipo de panel del menú hamburguesa
type PanelMenu = "informes" | "capas" | "acerca" | "temperaturas" | null;

// ======================================================
// TRADUCCIONES
// ======================================================

const T: Record<Idioma, Record<string, string>> = {
  es: {
    plataforma:"Plataforma Hidroquímica", provincia:"Provincia de Catamarca",
    puntos:"Puntos", riesgo:"Riesgo",
    distribucionRiesgo:"Distribución de Riesgo de Arsénico (mg/L)",
    bajo:"Bajo", medio:"Medio", alto:"Alto",
    distribucionFuentes:"Distribución de Fuentes",
    subterranea:"Subterránea", superficial:"Superficial", mezcla:"Mezcla",
    capasGis:"Capas GIS", departamentos:"Departamentos", cuencas:"Cuencas", rios:"Ríos",
    informacion:"Información", autor:"Autor / Creador",
    fecha:"Fecha de elaboración / edición", proyeccion:"Sistema de Proyección",
    referencia:"Referencia", refTexto:"Base hidroquímica provincial y capas GIS oficiales",
    miPerfil:"Mi Perfil", ajustes:"Ajustes", cerrarSesion:"Cerrar sesión",
    nombre:"Nombre", ultimoAcceso:"Último acceso",
    cambiarContrasena:"Cambiar contraseña", cambiarFoto:"Cambiar foto",
    idioma:"Idioma", tipografia:"Tipografía",
    lectorPantalla:"Lector de Pantalla / Audio",
    lectorDesc:"Activar narración por voz de los datos del mapa",
    lectorBtn:"Activar narración", lectorBtnOff:"Desactivar narración",
    lectorReading:"Leyendo datos...",
    fontInter:"Inter — Sans-serif moderna", fontMono:"Monospace — Técnica legible", fontSerif:"Georgia — Clásica y formal",
    punto:"Punto", campanas:"Campañas", fuente:"Fuente",
    oscuro:"Oscuro", satelite:"Satélite",
    menuPrincipal:"Menú principal",
    generarInformes:"Generar Informes",
    acercaSistema:"Acerca del Sistema",
    // Informes
    filtroDept:"Departamento", filtroLoc:"Localidad", filtroFuente:"Fuente", filtroRiesgo:"Riesgo",
    todosLosDept:"Todos los Departamentos", todasLasLoc:"Todas las Localidades",
    todasLasFuentes:"Todas las Fuentes", todosLosRiesgos:"Todos los Riesgos",
    generarPDF:"📄 Generar PDF", exportarExcel:"📊 Exportar Excel",
    previsualizacion:"Vista previa del informe",
    // Capas
    agregarCapa:"Agregar capa personalizada", urlCapa:"URL del GeoJSON", nombreCapa:"Nombre de la capa",
    colorCapa:"Color", agregar:"Agregar", capasActivas:"Capas activas",
    sinCapas:"Sin capas adicionales", eliminar:"Eliminar",
    // Acerca
    acercaTitulo:"Sistema WATERGIS", acercaVersion:"Versión 2.0 — Junio 2026",
    acercaDesc:"Plataforma de monitoreo hidroquímico para la Provincia de Catamarca. Visualización y análisis de calidad de agua subterránea y superficial.",
    acercaAutor:"Desarrollado por Nicolás Doria",
    acercaProyeccion:"Sistema de Proyección: WGS 84 / EPSG:4326",
    acercaFuentes:"Fuentes de datos: Base hidroquímica provincial, IGN, DGA Catamarca",
    acercaContacto:"Contacto: watergis@catamarca.gob.ar",
  },
  en: {
    plataforma:"Hydrochemical Platform", provincia:"Catamarca Province",
    puntos:"Points", riesgo:"Risk",
    distribucionRiesgo:"Arsenic Risk Distribution (mg/L)",
    bajo:"Low", medio:"Medium", alto:"High",
    distribucionFuentes:"Source Distribution",
    subterranea:"Groundwater", superficial:"Surface water", mezcla:"Mixed",
    capasGis:"GIS Layers", departamentos:"Departments", cuencas:"Watersheds", rios:"Rivers",
    informacion:"Information", autor:"Author / Creator",
    fecha:"Creation / Edit Date", proyeccion:"Projection System",
    referencia:"Reference", refTexto:"Provincial hydrochemical database and official GIS layers",
    miPerfil:"My Profile", ajustes:"Settings", cerrarSesion:"Sign out",
    nombre:"Name", ultimoAcceso:"Last access",
    cambiarContrasena:"Change password", cambiarFoto:"Change photo",
    idioma:"Language", tipografia:"Typography",
    lectorPantalla:"Screen Reader / Audio",
    lectorDesc:"Enable voice narration of map data",
    lectorBtn:"Enable narration", lectorBtnOff:"Disable narration",
    lectorReading:"Reading data...",
    fontInter:"Inter — Modern sans-serif", fontMono:"Monospace — Technical & readable", fontSerif:"Georgia — Classic & formal",
    punto:"Point", campanas:"Campaigns", fuente:"Source",
    oscuro:"Dark", satelite:"Satellite",
    menuPrincipal:"Main menu",
    generarInformes:"Generate Reports",
    acercaSistema:"About the System",
    filtroDept:"Department", filtroLoc:"Locality", filtroFuente:"Source", filtroRiesgo:"Risk",
    todosLosDept:"All Departments", todasLasLoc:"All Localities",
    todasLasFuentes:"All Sources", todosLosRiesgos:"All Risk Levels",
    generarPDF:"📄 Generate PDF", exportarExcel:"📊 Export Excel",
    previsualizacion:"Report preview",
    agregarCapa:"Add custom layer", urlCapa:"GeoJSON URL", nombreCapa:"Layer name",
    colorCapa:"Color", agregar:"Add", capasActivas:"Active layers",
    sinCapas:"No additional layers", eliminar:"Remove",
    acercaTitulo:"WATERGIS System", acercaVersion:"Version 2.0 — June 2026",
    acercaDesc:"Hydrochemical monitoring platform for Catamarca Province. Visualization and analysis of groundwater and surface water quality.",
    acercaAutor:"Developed by Nicolás Doria",
    acercaProyeccion:"Projection System: WGS 84 / EPSG:4326",
    acercaFuentes:"Data sources: Provincial hydrochemical database, IGN, DGA Catamarca",
    acercaContacto:"Contact: watergis@catamarca.gob.ar",
  },
  de: {
    plataforma:"Hydrochemische Plattform", provincia:"Provinz Catamarca",
    puntos:"Punkte", riesgo:"Risiko",
    distribucionRiesgo:"Arsenrisikoverteilung (mg/L)",
    bajo:"Niedrig", medio:"Mittel", alto:"Hoch",
    distribucionFuentes:"Quellenverteilung",
    subterranea:"Grundwasser", superficial:"Oberflächenwasser", mezcla:"Gemischt",
    capasGis:"GIS-Ebenen", departamentos:"Departements", cuencas:"Einzugsgebiete", rios:"Flüsse",
    informacion:"Information", autor:"Autor / Ersteller",
    fecha:"Erstellungs- / Bearbeitungsdatum", proyeccion:"Projektionssystem",
    referencia:"Referenz", refTexto:"Provinzielle hydrochemische Datenbank und offizielle GIS-Ebenen",
    miPerfil:"Mein Profil", ajustes:"Einstellungen", cerrarSesion:"Abmelden",
    nombre:"Name", ultimoAcceso:"Letzter Zugriff",
    cambiarContrasena:"Passwort ändern", cambiarFoto:"Foto ändern",
    idioma:"Sprache", tipografia:"Typografie",
    lectorPantalla:"Bildschirmleser / Audio",
    lectorDesc:"Sprachausgabe der Kartendaten aktivieren",
    lectorBtn:"Sprachausgabe aktivieren", lectorBtnOff:"Sprachausgabe deaktivieren",
    lectorReading:"Daten werden gelesen...",
    fontInter:"Inter — Modernes Sans-serif", fontMono:"Monospace — Technisch & lesbar", fontSerif:"Georgia — Klassisch & formal",
    punto:"Punkt", campanas:"Kampagnen", fuente:"Quelle",
    oscuro:"Dunkel", satelite:"Satellit",
    menuPrincipal:"Hauptmenü",
    generarInformes:"Berichte erstellen",
    acercaSistema:"Über das System",
    filtroDept:"Departement", filtroLoc:"Ortschaft", filtroFuente:"Quelle", filtroRiesgo:"Risiko",
    todosLosDept:"Alle Departements", todasLasLoc:"Alle Ortschaften",
    todasLasFuentes:"Alle Quellen", todosLosRiesgos:"Alle Risikoklassen",
    generarPDF:"📄 PDF erstellen", exportarExcel:"📊 Excel exportieren",
    previsualizacion:"Berichtsvorschau",
    agregarCapa:"Benutzerdefinierte Ebene hinzufügen", urlCapa:"GeoJSON-URL", nombreCapa:"Ebenenname",
    colorCapa:"Farbe", agregar:"Hinzufügen", capasActivas:"Aktive Ebenen",
    sinCapas:"Keine zusätzlichen Ebenen", eliminar:"Entfernen",
    acercaTitulo:"WATERGIS System", acercaVersion:"Version 2.0 — Juni 2026",
    acercaDesc:"Hydrochemische Überwachungsplattform für die Provinz Catamarca.",
    acercaAutor:"Entwickelt von Nicolás Doria",
    acercaProyeccion:"Projektionssystem: WGS 84 / EPSG:4326",
    acercaFuentes:"Datenquellen: Provinzielle hydrochemische Datenbank, IGN, DGA Catamarca",
    acercaContacto:"Kontakt: watergis@catamarca.gob.ar",
  },
  pt: {
    plataforma:"Plataforma Hidroquímica", provincia:"Província de Catamarca",
    puntos:"Pontos", riesgo:"Risco",
    distribucionRiesgo:"Distribuição de Risco de Arsênio (mg/L)",
    bajo:"Baixo", medio:"Médio", alto:"Alto",
    distribucionFuentes:"Distribuição de Fontes",
    subterranea:"Subterrânea", superficial:"Superficial", mezcla:"Mista",
    capasGis:"Camadas GIS", departamentos:"Departamentos", cuencas:"Bacias", rios:"Rios",
    informacion:"Informação", autor:"Autor / Criador",
    fecha:"Data de elaboração / edição", proyeccion:"Sistema de Projeção",
    referencia:"Referência", refTexto:"Base hidroquímica provincial e camadas GIS oficiais",
    miPerfil:"Meu Perfil", ajustes:"Configurações", cerrarSesion:"Sair",
    nombre:"Nome", ultimoAcceso:"Último acesso",
    cambiarContrasena:"Alterar senha", cambiarFoto:"Alterar foto",
    idioma:"Idioma", tipografia:"Tipografia",
    lectorPantalla:"Leitor de Tela / Áudio",
    lectorDesc:"Ativar narração por voz dos dados do mapa",
    lectorBtn:"Ativar narração", lectorBtnOff:"Desativar narração",
    lectorReading:"Lendo dados...",
    fontInter:"Inter — Sans-serif moderna", fontMono:"Monospace — Técnica e legível", fontSerif:"Georgia — Clássica e formal",
    punto:"Ponto", campanas:"Campanhas", fuente:"Fonte",
    oscuro:"Escuro", satelite:"Satélite",
    menuPrincipal:"Menu principal",
    generarInformes:"Gerar Relatórios",
    acercaSistema:"Sobre o Sistema",
    filtroDept:"Departamento", filtroLoc:"Localidade", filtroFuente:"Fonte", filtroRiesgo:"Risco",
    todosLosDept:"Todos os Departamentos", todasLasLoc:"Todas as Localidades",
    todasLasFuentes:"Todas as Fontes", todosLosRiesgos:"Todos os Riscos",
    generarPDF:"📄 Gerar PDF", exportarExcel:"📊 Exportar Excel",
    previsualizacion:"Pré-visualização do relatório",
    agregarCapa:"Adicionar camada personalizada", urlCapa:"URL do GeoJSON", nombreCapa:"Nome da camada",
    colorCapa:"Cor", agregar:"Adicionar", capasActivas:"Camadas ativas",
    sinCapas:"Sem camadas adicionais", eliminar:"Remover",
    acercaTitulo:"Sistema WATERGIS", acercaVersion:"Versão 2.0 — Junho 2026",
    acercaDesc:"Plataforma de monitoramento hidroquímico para a Província de Catamarca.",
    acercaAutor:"Desenvolvido por Nicolás Doria",
    acercaProyeccion:"Sistema de Projeção: WGS 84 / EPSG:4326",
    acercaFuentes:"Fontes de dados: Base hidroquímica provincial, IGN, DGA Catamarca",
    acercaContacto:"Contato: watergis@catamarca.gob.ar",
  },
};

// ======================================================
// COLORS
// ======================================================

const cuencaColors = [
  "#ff006e","#3a86ff","#8338ec","#fb5607","#ffbe0b",
  "#06d6a0","#118ab2","#ef476f","#8ac926","#1982c4","#6a4c93","#f72585",
];

// ======================================================
// TEMPERATURA MEDIA ANUAL POR DEPARTAMENTO — CAA Art. 982
// ======================================================

const TEMP_DPTO: Record<string, number> = {
  "CAPITAL":                    22,
  "VALLE VIEJO":                22,
  "FRAY MAMERTO ESQUIU":        20,
  "FRAY MAMERTO ESQUIÚ":        20,
  "CAPAYON":                    20,
  "CAPAYÁN":                    20,
  "LA PAZ":                     21,
  "EL ALTO":                    18,
  "ANCASTI":                    19,
  "AMBATO":                     17,
  "POMAN":                      20,
  "POMÁN":                      20,
  "TINOGASTA":                  17,
  "SANTA MARIA":                16,
  "SANTA MARÍA":                16,
  "BELEN":                      17,
  "BELÉN":                      17,
  "ANDALGALA":                  18,
  "ANDALGALÁ":                  18,
  "SANTA ROSA":                 20,
  "ANTOFAGASTA DE LA SIERRA":   10,
  "PACLIN":                     19,
  "PACLÍN":                     19,
};

const parseAs = (val: string | undefined) =>
  parseFloat(String(val || "0").replace(",", "."));

// Límite CAA de Flúor según temperatura media anual (Art. 982) — compartido entre
// el informe general y el mapa de calor, para no tener la tabla duplicada en dos lugares.
const limiteFluorPorTemp = (temp: number): {limInf: number; limSup: number; rango: string} => {
  if (temp <= 12.0)  return { limInf: 0.9, limSup: 1.7, rango: "10.0–12.0°C" };
  if (temp <= 14.6)  return { limInf: 0.8, limSup: 1.5, rango: "12.1–14.6°C" };
  if (temp <= 17.6)  return { limInf: 0.8, limSup: 1.3, rango: "14.7–17.6°C" };
  if (temp <= 21.4)  return { limInf: 0.7, limSup: 1.2, rango: "17.7–21.4°C" };
  if (temp <= 26.2)  return { limInf: 0.7, limSup: 1.0, rango: "21.5–26.2°C" };
  return               { limInf: 0.6, limSup: 0.8, rango: "26.3–32.6°C" };
};

// Límites legales de referencia (CAA) usados para el mapa de calor absoluto
const LIM_HEAT_AS  = 0.01;   // mg/L
const LIM_HEAT_TDS = 1500;   // mg/L

const fontFamilies: Record<Tipografia, string> = {
  inter: "'Inter','Segoe UI',sans-serif",
  mono:  "'Courier New','Roboto Mono',monospace",
  serif: "'Georgia','Times New Roman',serif",
};

// ======================================================
// MINI KPI
// ======================================================

// ======================================================
// HEAT LAYER COMPONENT
// ======================================================

function HeatLayer({ points, param }: { points: Punto[]; param: string }) {
  const map = useMap();

  useEffect(() => {
    const L = (window as any).L;
    if (!L?.heatLayer || !map) return;

    // Temperatura promedio del CSV, usada como respaldo si un departamento no está en la tabla
    const temps = points.map(p=>parseFloat(String(p.T_ºC||"0").replace(",","."))).filter(v=>!isNaN(v)&&v>0);
    const avgTempGlobal = temps.length>0 ? temps.reduce((a,b)=>a+b,0)/temps.length : 20;

    // Límite legal (CAA) de cada punto — para Flúor depende del departamento de ESE punto
    const limitePara = (p: Punto): number => {
      if (param==="As")  return LIM_HEAT_AS;
      if (param==="TDS") return LIM_HEAT_TDS;
      if (param==="Fluor") {
        const dpto = (p.Departamento||"").toUpperCase();
        const temp = TEMP_DPTO[dpto] ?? avgTempGlobal;
        return limiteFluorPorTemp(temp).limSup;
      }
      return 1;
    };

    const heatData = points
      .map(p => {
        const lat = parseFloat(p.Latitud?.toString().replace(",","."));
        const lng = parseFloat(p.Longitud?.toString().replace(",","."));
        if(isNaN(lat)||isNaN(lng)) return null;
        let val = 0;
        if(param==="As")    val = parseFloat(String(p.As_mg_l||"0").replace(",","."));
        if(param==="TDS")   val = parseFloat(String(p.TDS_mg_l||"0").replace(",","."));
        if(param==="Fluor") val = parseFloat(String(p.Fluor_mg_l||"0").replace(",","."));
        // Normalizar contra el límite LEGAL (no contra el percentil de la muestra):
        // 0 = sin rastro, 1.0 = justo en el límite CAA, 2.0 = el doble del límite (rojo intenso)
        const limite = limitePara(p);
        const intensity = Math.min(val / limite, 2.0) / 2.0;
        return [lat, lng, intensity] as [number,number,number];
      })
      .filter((x): x is [number,number,number] => x !== null);

    const heat = L.heatLayer(heatData, {
      radius:45,
      blur:35,
      maxZoom:18,
      max:1.0,
      minOpacity:0.25,
      gradient:{ 0.0:"#22c55e", 0.25:"#86efac", 0.5:"#f59e0b", 0.75:"#ef4444", 1.0:"#7f1d1d" }
    }).addTo(map);

    return () => { try{ map.removeLayer(heat); }catch{} };
  }, [points, param, map]);

  return null;
}

function MiniKPI({ title, subtitle, value, icon }: {
  title: string; subtitle?: string; value: any; icon?: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          {subtitle && <p className="mt-1 text-[10px] text-slate-500">{subtitle}</p>}
        </div>
        {icon && <div className="rounded-xl bg-slate-800 p-2">{icon}</div>}
      </div>
      <h2 className="mt-3 text-3xl font-black text-cyan-300">{value}</h2>
    </div>
  );
}

function PopupCard({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ background:"#0f172a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"12px", padding:"10px" }}>
      <div style={{ fontSize:"11px", opacity:0.7 }}>{label}</div>
      <div style={{ fontSize:"18px", fontWeight:700 }}>{value}</div>
    </div>
  );
}


// ======================================================
// USUARIOS PERMITIDOS
// ======================================================

const USUARIOS: Record<string, { password: string; nombre: string }> = {
  "nicolas.doria": { password: "watergis2026",  nombre: "Nicolás Doria"  },
  "admin":         { password: "catamarca2026", nombre: "Administrador"  },
  "inspector1":    { password: "inspector123",  nombre: "Inspector GIS"  },
};
const STORAGE_KEY = "watergis_session";

// Íconos de avatar disponibles — temática de agua/monitoreo ambiental
const AVATARES = ["💧","🌊","🏞️","💦","🚰","🏔️","🐟","🌿","⚗️","🧪","🔬","📡"];

function LoginScreen({ onLogin }: { onLogin: (user: string, nombre: string, avatar?: string, rol?: string) => void }) {
  const [modo, setModo] = useState<"login"|"registro">("login");

  // ── Campos de login ──
  const [usuario, setUsuario]   = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // ── Campos de registro ──
  const [regNombre, setRegNombre]     = useState("");
  const [regUsuario, setRegUsuario]   = useState("");
  const [regEmail, setRegEmail]       = useState("");
  const [regDni, setRegDni]           = useState("");
  const [regProfesion, setRegProfesion] = useState("");
  const [regLugarTrabajo, setRegLugarTrabajo] = useState("");
  const [regProvincia, setRegProvincia] = useState("Catamarca");
  const [regLocalidad, setRegLocalidad] = useState("");
  const [regAvatar, setRegAvatar] = useState(AVATARES[0]);
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [regError, setRegError]       = useState("");
  const [regOk, setRegOk]             = useState("");
  const [regLoading, setRegLoading]   = useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);

    // 1) Usuarios históricos hardcodeados — se mantienen funcionando sin tocar nada
    const u = USUARIOS[usuario.trim().toLowerCase()];
    if (u && u.password === password) {
      onLogin(usuario.trim().toLowerCase(), u.nombre);
      setLoading(false);
      return;
    }

    // 2) Usuarios registrados en la base de datos
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.trim(), password }),
      });
      const data = await res.json();
      if (data.ok) {
        onLogin(data.usuario, data.nombre, data.avatar, data.rol);
      } else {
        setError(data.error || "Usuario o contraseña incorrectos.");
      }
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegError(""); setRegOk("");
    if (!regNombre.trim() || !regUsuario.trim() || !regPassword) {
      setRegError("Completá nombre, usuario y contraseña."); return;
    }
    if (regPassword !== regPassword2) {
      setRegError("Las contraseñas no coinciden."); return;
    }
    if (regPassword.length < 6) {
      setRegError("La contraseña debe tener al menos 6 caracteres."); return;
    }
    setRegLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: regUsuario.trim(),
          password: regPassword,
          nombre: regNombre.trim(),
          email: regEmail.trim(),
          dni: regDni.trim(),
          profesion: regProfesion.trim(),
          lugar_trabajo: regLugarTrabajo.trim(),
          provincia: regProvincia.trim(),
          localidad: regLocalidad.trim(),
          avatar: regAvatar,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setRegOk("¡Cuenta creada! Iniciando sesión...");
        setTimeout(()=>onLogin(data.usuario, data.nombre, regAvatar, "usuario"), 800);
      } else {
        setRegError(data.error || "No se pudo crear la cuenta.");
      }
    } catch {
      setRegError("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[99999] overflow-y-auto py-8" style={{background:"radial-gradient(ellipse at top left, #0c2d3d 0%, #041318 60%, #020a0d 100%)"}}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{opacity:0.55}}>
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <g stroke="#2dd4bf" strokeWidth="1.2">
            <line x1="80" y1="100" x2="200" y2="170"/><line x1="200" y1="170" x2="170" y2="280"/>
            <line x1="200" y1="170" x2="320" y2="130"/><line x1="320" y1="130" x2="430" y2="190"/>
            <line x1="430" y1="190" x2="560" y2="140"/><line x1="430" y1="190" x2="470" y2="300"/>
            <line x1="170" y1="280" x2="260" y2="350"/><line x1="470" y1="300" x2="380" y2="370"/>
            <line x1="260" y1="350" x2="380" y2="370"/>
          </g>
          <g stroke="#22d3ee" strokeWidth="1.2">
            <line x1="700" y1="90" x2="800" y2="150"/><line x1="800" y1="150" x2="920" y2="110"/>
            <line x1="800" y1="150" x2="840" y2="260"/><line x1="920" y1="110" x2="1030" y2="160"/>
            <line x1="840" y1="260" x2="960" y2="300"/><line x1="960" y1="300" x2="1080" y2="250"/>
          </g>
          <g stroke="#2dd4bf" strokeWidth="1.2">
            <line x1="60" y1="560" x2="160" y2="620"/><line x1="160" y1="620" x2="120" y2="720"/>
            <line x1="160" y1="620" x2="280" y2="660"/><line x1="280" y1="660" x2="240" y2="750"/>
          </g>
          <g stroke="#22d3ee" strokeWidth="1.2">
            <line x1="580" y1="520" x2="680" y2="580"/><line x1="680" y1="580" x2="650" y2="690"/>
            <line x1="680" y1="580" x2="800" y2="540"/><line x1="800" y1="540" x2="900" y2="600"/>
            <line x1="900" y1="600" x2="1000" y2="560"/><line x1="900" y1="600" x2="940" y2="710"/>
          </g>
          <g fill="#5eead4">
            <circle cx="80" cy="100" r="4"/><circle cx="170" cy="280" r="4"/><circle cx="320" cy="130" r="4"/>
            <circle cx="560" cy="140" r="4"/><circle cx="260" cy="350" r="4"/><circle cx="60" cy="560" r="4"/>
            <circle cx="120" cy="720" r="4"/><circle cx="280" cy="660" r="4"/><circle cx="240" cy="750" r="4"/>
          </g>
          <g fill="#67e8f9">
            <circle cx="920" cy="110" r="4"/><circle cx="1030" cy="160" r="4"/><circle cx="1080" cy="250" r="4"/>
            <circle cx="650" cy="690" r="4"/><circle cx="1000" cy="560" r="4"/><circle cx="940" cy="710" r="4"/>
          </g>
          <g fill="#2dd4bf">
            <circle cx="200" cy="170" r="6"/><circle cx="430" cy="190" r="6"/><circle cx="470" cy="300" r="6"/>
            <circle cx="380" cy="370" r="6"/><circle cx="160" cy="620" r="6"/>
          </g>
          <g fill="#22d3ee">
            <circle cx="800" cy="150" r="6"/><circle cx="840" cy="260" r="6"/><circle cx="960" cy="300" r="6"/>
            <circle cx="680" cy="580" r="6"/><circle cx="800" cy="540" r="6"/><circle cx="900" cy="600" r="6"/>
          </g>
        </svg>
      </div>
      <div className="relative w-full max-w-md mx-4 my-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 mb-4">
            <span className="text-3xl">💧</span>
          </div>
          <h1 className="text-3xl font-black text-cyan-400 tracking-tight">WATERGIS</h1>
          <p className="text-slate-400 text-sm mt-1">Plataforma Hidroquímica — Provincia de Catamarca</p>
        </div>

        {modo==="login" ? (
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 backdrop-blur-md p-8 shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-6 text-center">Iniciar sesión</h2>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Usuario</label>
              <input type="text" value={usuario} onChange={e=>setUsuario(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Ingresá tu usuario" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"/>
            </div>
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Contraseña</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Ingresá tu contraseña" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"/>
            </div>
            {error && <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400 text-center">{error}</div>}
            <button onClick={handleLogin} disabled={loading} className="w-full rounded-xl bg-cyan-500 py-3 font-bold text-black hover:bg-cyan-400 transition-colors disabled:opacity-50">
              {loading?"Verificando...":"Ingresar"}
            </button>
            <div className="mt-6 pt-5 border-t border-slate-800">
              <button onClick={()=>{setModo("registro");setError("");}} className="w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-2.5 font-bold text-cyan-400 hover:bg-cyan-500/20 transition-colors text-sm">
                ✨ Registrar nuevo usuario
              </button>
              <p className="text-xs text-slate-500 text-center mt-3">¿Problemas para acceder? Contactá al administrador.</p>
              <p className="text-xs text-slate-600 text-center mt-1">watergis@catamarca.gob.ar</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 backdrop-blur-md p-8 shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-6 text-center">Crear cuenta nueva</h2>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Nombre completo</label>
              <input type="text" value={regNombre} onChange={e=>setRegNombre(e.target.value)} placeholder="Ej: Juan Pérez" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"/>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Usuario</label>
              <input type="text" value={regUsuario} onChange={e=>setRegUsuario(e.target.value)} placeholder="Ej: juan.perez" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"/>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Email (opcional)</label>
              <input type="email" value={regEmail} onChange={e=>setRegEmail(e.target.value)} placeholder="juan@ejemplo.com" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"/>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">DNI</label>
                <input type="text" value={regDni} onChange={e=>setRegDni(e.target.value)} placeholder="30123456" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Profesión</label>
                <input type="text" value={regProfesion} onChange={e=>setRegProfesion(e.target.value)} placeholder="Ing. Ambiental" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"/>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Lugar de trabajo</label>
              <input type="text" value={regLugarTrabajo} onChange={e=>setRegLugarTrabajo(e.target.value)} placeholder="Ej: Secretaría del Agua y Ambiente" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"/>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Provincia</label>
                <input type="text" value={regProvincia} onChange={e=>setRegProvincia(e.target.value)} placeholder="Catamarca" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Localidad</label>
                <input type="text" value={regLocalidad} onChange={e=>setRegLocalidad(e.target.value)} placeholder="San Fernando" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"/>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Elegí un ícono para tu perfil</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARES.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={()=>setRegAvatar(av)}
                    className={`aspect-square rounded-xl border text-xl flex items-center justify-center transition-all ${
                      regAvatar===av ? "border-cyan-500 bg-cyan-500/20 scale-105" : "border-slate-700 bg-slate-900 hover:border-slate-500"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Contraseña</label>
              <input type="password" value={regPassword} onChange={e=>setRegPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"/>
            </div>
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Repetir contraseña</label>
              <input type="password" value={regPassword2} onChange={e=>setRegPassword2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleRegister()} placeholder="Repetí la contraseña" className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"/>
            </div>
            {regError && <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400 text-center">{regError}</div>}
            {regOk && <div className="mb-4 rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-400 text-center">{regOk}</div>}
            <button onClick={handleRegister} disabled={regLoading} className="w-full rounded-xl bg-cyan-500 py-3 font-bold text-black hover:bg-cyan-400 transition-colors disabled:opacity-50">
              {regLoading?"Creando cuenta...":"Crear cuenta"}
            </button>
            <div className="mt-6 pt-5 border-t border-slate-800">
              <button onClick={()=>{setModo("login");setRegError("");setRegOk("");}} className="w-full text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                ← Volver a iniciar sesión
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center">
          <p className="text-xs text-slate-400">🌐 Podés explorar el mapa sin iniciar sesión —
            <button onClick={()=>onLogin("publico","Visitante")} className="text-cyan-500 hover:text-cyan-400 ml-1 underline underline-offset-2">continuar sin cuenta</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// FORMULARIO DE CARGA DE DATOS
// ======================================================
function CargaDatosForm({
  usuario, onClose, onGuardado, puntos, prefill,
}: {
  usuario: string;
  onClose: () => void;
  onGuardado: () => void;
  puntos: Punto[];
  prefill?: { punto_de_muestreo: string; localidad: string; departamento: string; fuente: string; tipo_punto: string; latitud: string; longitud: string } | null;
}) {
  const esNuevaCampana = !!prefill;

  const categoriaInicial = (): "AGUA"|"DIQUE"|"EFLUENTE" => {
    if (!prefill) return "AGUA";
    if (prefill.tipo_punto === "DIQUE") return "DIQUE";
    if (prefill.tipo_punto === "EFLUENTE") return "EFLUENTE";
    return "AGUA";
  };
  const fuenteUIInicial = (): "SUBTERRANEA"|"SUPERFICIAL"|"MEZCLA"|"RED" => {
    if (!prefill) return "SUBTERRANEA";
    if (prefill.tipo_punto === "RED") return "RED";
    return (prefill.fuente as any) || "SUBTERRANEA";
  };

  const vacio = {
    localidad: prefill?.localidad || "", departamento: prefill?.departamento || "",
    fuente: prefill?.fuente || "SUBTERRANEA", tipo_punto: prefill?.tipo_punto || "POZO",
    punto_de_muestreo: prefill?.punto_de_muestreo || "", fecha_de_monitoreo: "", ph: "", t_c: "", tds_mg_l: "",
    turb_ntu: "", salinidad_mg_l: "", as_mg_l: "", fluor_mg_l: "", no3_mg_l: "",
    od_mg_l: "", sat_o2_pct: "", clorofila_ug_l: "", algas_bga: "", cloro_libre_mg_l: "",
    dbo_mg_l: "", dqo_mg_l: "", detergentes_mg_l: "", grasas_aceites_mg_l: "",
    latitud: prefill?.latitud || "", longitud: prefill?.longitud || "",
  };
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (campo: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [campo]: e.target.value }));

  // Categoría visible al usuario (agrupa Pozo+Red+Fuente bajo "Agua potable")
  const [categoria, setCategoria] = useState<"AGUA"|"DIQUE"|"EFLUENTE">(categoriaInicial());

  // Qué botón de Fuente está resaltado en la UI (distinto del valor real que se guarda,
  // porque un punto de Red guarda como "fuente" su origen real: Subterránea/Superficial/Mezcla)
  const [fuenteUI, setFuenteUI] = useState<"SUBTERRANEA"|"SUPERFICIAL"|"MEZCLA"|"RED">(fuenteUIInicial());

  // ── Autocompletar por nombre de punto (solo para puntos nuevos, sin prefill) ──
  const [buscando, setBuscando] = useState(false);
  const puntosUnicos = useMemo(() => {
    const vistos = new Set<string>();
    const lista: { nombre: string; localidad: string; departamento: string; fuente: string; tipo_punto: string; latitud: string; longitud: string; campanas: number }[] = [];
    puntos.forEach(p => {
      const clave = `${p.PUNTO_DE_MUESTREO}__${p.Localidad}`;
      const existente = lista.find(x => x.nombre === p.PUNTO_DE_MUESTREO && x.localidad === p.Localidad);
      if (existente) { existente.campanas++; return; }
      if (!p.PUNTO_DE_MUESTREO) return;
      lista.push({
        nombre: p.PUNTO_DE_MUESTREO, localidad: p.Localidad, departamento: p.Departamento,
        fuente: p.Fuente, tipo_punto: p.Tipo_Punto || "POZO",
        latitud: p.Latitud, longitud: p.Longitud, campanas: 1,
      });
    });
    return lista;
  }, [puntos]);

  const sugerencias = useMemo(() => {
    const texto = form.punto_de_muestreo.trim().toLowerCase();
    if (esNuevaCampana || texto.length < 2) return [];
    return puntosUnicos.filter(p => p.nombre.toLowerCase().includes(texto)).slice(0, 6);
  }, [form.punto_de_muestreo, puntosUnicos, esNuevaCampana]);

  const elegirSugerencia = (s: typeof puntosUnicos[number]) => {
    setForm(prev => ({
      ...prev, punto_de_muestreo: s.nombre, localidad: s.localidad, departamento: s.departamento,
      fuente: s.tipo_punto === "RED" ? (s.fuente || "SUBTERRANEA") : s.fuente,
      tipo_punto: s.tipo_punto, latitud: s.latitud, longitud: s.longitud,
    }));
    if (s.tipo_punto === "DIQUE") setCategoria("DIQUE");
    else if (s.tipo_punto === "EFLUENTE") setCategoria("EFLUENTE");
    else setCategoria("AGUA");
    setFuenteUI(s.tipo_punto === "RED" ? "RED" : (s.fuente as any) || "SUBTERRANEA");
    setBuscando(false);
  };

  // Al elegir categoría, derivamos el tipo_punto real que se guarda en la base
  const elegirCategoria = (cat: "AGUA"|"DIQUE"|"EFLUENTE") => {
    setCategoria(cat);
    if (cat === "DIQUE") setForm(prev => ({ ...prev, tipo_punto: "DIQUE" }));
    else if (cat === "EFLUENTE") setForm(prev => ({ ...prev, tipo_punto: "EFLUENTE" }));
    else setForm(prev => ({ ...prev, tipo_punto: fuenteUI === "RED" ? "RED" : "POZO" }));
  };

  // Botón de Fuente (Subterránea/Superficial/Mezcla/Red). Si es Red, el origen real
  // (para el campo "fuente" que se guarda) se completa con el sub-selector de abajo.
  const elegirFuente = (f: "SUBTERRANEA"|"SUPERFICIAL"|"MEZCLA"|"RED") => {
    setFuenteUI(f);
    if (f === "RED") {
      setForm(prev => ({ ...prev, tipo_punto: "RED", fuente: "SUBTERRANEA" })); // origen por defecto
    } else {
      setForm(prev => ({ ...prev, tipo_punto: "POZO", fuente: f }));
    }
  };

  // Origen real del agua de Red — solo se pregunta cuando fuenteUI es "RED"
  const elegirOrigenRed = (origen: string) => {
    setForm(prev => ({ ...prev, fuente: origen }));
  };

  // Qué parámetros mostrar según la categoría elegida — evita llenar campos que no aplican
  const gruposParametros: Record<string, {key:string; label:string; unidad?:string}[]> = {
    AGUA: [
      {key:"tds_mg_l", label:"TDS", unidad:"mg/L"}, {key:"turb_ntu", label:"Turbidez", unidad:"NTU"},
      {key:"cloro_libre_mg_l", label:"Cloro libre", unidad:"mg/L"}, {key:"as_mg_l", label:"Arsénico (As)", unidad:"mg/L"},
      {key:"no3_mg_l", label:"Nitratos (NO3)", unidad:"mg/L"}, {key:"fluor_mg_l", label:"Flúor", unidad:"mg/L"},
      {key:"ph", label:"pH"}, {key:"t_c", label:"Temperatura", unidad:"°C"},
    ],
    DIQUE: [
      {key:"tds_mg_l", label:"TDS", unidad:"mg/L"}, {key:"turb_ntu", label:"Turbidez", unidad:"NTU"},
      {key:"od_mg_l", label:"Oxígeno Disuelto (OD)", unidad:"mg/L"}, {key:"sat_o2_pct", label:"Saturación de O₂", unidad:"%"},
      {key:"clorofila_ug_l", label:"Clorofila-a", unidad:"µg/L"}, {key:"algas_bga", label:"Algas BGA", unidad:"cel/mL"},
      {key:"ph", label:"pH"}, {key:"t_c", label:"Temperatura", unidad:"°C"},
    ],
    EFLUENTE: [
      {key:"od_mg_l", label:"Oxígeno Disuelto (OD)", unidad:"mg/L"}, {key:"sat_o2_pct", label:"Saturación de O₂", unidad:"%"},
      {key:"tds_mg_l", label:"TDS", unidad:"mg/L"}, {key:"dbo_mg_l", label:"DBO5", unidad:"mg/L"},
      {key:"dqo_mg_l", label:"DQO", unidad:"mg/L"}, {key:"detergentes_mg_l", label:"Detergentes", unidad:"mg/L"},
      {key:"ph", label:"pH"}, {key:"t_c", label:"Temperatura", unidad:"°C"},
      {key:"grasas_aceites_mg_l", label:"Grasas y Aceites", unidad:"mg/L"},
    ],
  };
  const parametrosActivos = (gruposParametros[categoria] || gruposParametros.AGUA)
    .filter(p => !(categoria === "AGUA" && p.key === "cloro_libre_mg_l" && fuenteUI !== "RED" && fuenteUI !== "MEZCLA"));

  const handleGuardar = async () => {
    setError(""); setOk(false);
    if (!form.localidad.trim() || !form.departamento.trim() || !form.punto_de_muestreo.trim() || !form.latitud.trim() || !form.longitud.trim()) {
      setError("Localidad, Departamento, Punto de muestreo, Latitud y Longitud son obligatorios.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/puntos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, usuario }),
      });
      const data = await res.json();
      if (data.ok) {
        setOk(true);
        onGuardado();
        setTimeout(() => setForm(vacio), 100);
      } else {
        setError(data.error || "No se pudo guardar el punto.");
      }
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors";
  const labelClass = "text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[99999] p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="sticky top-0 bg-slate-950 border-b border-slate-800 p-5 flex justify-between items-center z-10">
          <div>
            <h2 className="text-white font-bold text-lg">{esNuevaCampana ? "➕ Nueva campaña" : "➕ Cargar dato de monitoreo"}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {esNuevaCampana ? `${prefill!.punto_de_muestreo} — los datos del punto ya están cargados` : "Se guarda directo en la base de datos — aparece en el mapa al instante."}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-5">
          {/* Categoría — define qué parámetros se piden más abajo (fija si es una nueva campaña) */}
          {!esNuevaCampana && (
          <div className="mb-4">
            <label className={labelClass}>¿Qué datos querés cargar? *</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                {key:"AGUA",     label:"Agua Potable", emoji:"💧"},
                {key:"DIQUE",    label:"Diques",       emoji:"🌊"},
                {key:"EFLUENTE", label:"Efluentes",    emoji:"🏭"},
              ] as const).map(cat => (
                <button
                  key={cat.key}
                  onClick={()=>elegirCategoria(cat.key)}
                  className={`rounded-xl border py-3 text-xs font-bold transition-colors flex flex-col items-center gap-1 ${
                    categoria===cat.key ? "border-cyan-500 bg-cyan-500/20 text-cyan-300" : "border-slate-700 text-slate-500 hover:border-slate-500"
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
            {categoria==="AGUA" && (
              <p className="text-[10px] text-slate-500 mt-2">
                Incluye pozos, red de distribución y agua superficial o subterránea de consumo.
              </p>
            )}
          </div>
          )}

          {/* Fuente — solo aplica a Agua Potable; acá también se elige si es un punto de Red */}
          {!esNuevaCampana && categoria === "AGUA" && (
            <div className="mb-4">
              <label className={labelClass}>Fuente *</label>
              <div className="grid grid-cols-4 gap-2">
                {(["SUBTERRANEA","SUPERFICIAL","MEZCLA","RED"] as const).map(f => (
                  <button
                    key={f}
                    onClick={()=>elegirFuente(f)}
                    className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
                      fuenteUI===f ? "border-cyan-500 bg-cyan-500/20 text-cyan-300" : "border-slate-700 text-slate-500 hover:border-slate-500"
                    }`}
                  >
                    {f==="SUBTERRANEA"?"Subterránea":f==="SUPERFICIAL"?"Superficial":f==="MEZCLA"?"Mezcla":"🚿 Red"}
                  </button>
                ))}
              </div>

              {/* Sub-selector — solo aparece si se eligió Red: de qué origen viene esa agua */}
              {fuenteUI === "RED" && (
                <div className="mt-3">
                  <label className={labelClass}>¿De qué origen viene el agua de esta red? *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["SUBTERRANEA","SUPERFICIAL","MEZCLA"].map(o => (
                      <button
                        key={o}
                        onClick={()=>elegirOrigenRed(o)}
                        className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
                          form.fuente===o ? "border-purple-500 bg-purple-500/20 text-purple-300" : "border-slate-700 text-slate-500 hover:border-slate-500"
                        }`}
                      >
                        {o==="SUBTERRANEA"?"Subterránea":o==="SUPERFICIAL"?"Superficial":"Mezcla"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {esNuevaCampana ? (
            <>
              <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-wider mt-5 mb-2">Punto (bloqueado)</h3>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 mb-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Localidad:</span> <span className="text-slate-300">{form.localidad}</span></div>
                  <div><span className="text-slate-500">Depto:</span> <span className="text-slate-300">{form.departamento}</span></div>
                  <div><span className="text-slate-500">Fuente:</span> <span className="text-slate-300">{form.fuente}</span></div>
                  <div><span className="text-slate-500">Tipo:</span> <span className="text-slate-300">{form.tipo_punto}</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                  📍 {form.latitud}, {form.longitud} · 🔒 no se puede editar desde acá
                </div>
              </div>
              <div className="mb-3">
                <label className={labelClass}>Fecha de esta campaña *</label>
                <input type="date" className={inputClass} value={form.fecha_de_monitoreo} onChange={set("fecha_de_monitoreo")}/>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-wider mt-5 mb-2">Ubicación</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className={labelClass}>Localidad *</label><input className={inputClass} value={form.localidad} onChange={set("localidad")} placeholder="Ej: San Fernando"/></div>
                <div><label className={labelClass}>Departamento *</label><input className={inputClass} value={form.departamento} onChange={set("departamento")} placeholder="Ej: Capital"/></div>
              </div>
              <div className="mb-3 relative">
                <label className={labelClass}>Punto de muestreo *</label>
                <input
                  className={inputClass}
                  value={form.punto_de_muestreo}
                  onChange={e=>{ set("punto_de_muestreo")(e); setBuscando(true); }}
                  onFocus={()=>setBuscando(true)}
                  onBlur={()=>setTimeout(()=>setBuscando(false), 150)}
                  placeholder="Ej: Pozo N°3, Dique Ipizca, Red Escuela N°317..."
                />
                {buscando && sugerencias.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 shadow-xl overflow-hidden">
                    {sugerencias.map(s => (
                      <button
                        key={`${s.nombre}_${s.localidad}`}
                        onClick={()=>elegirSugerencia(s)}
                        className="w-full text-left px-3 py-2 hover:bg-cyan-500/10 border-b border-slate-800 last:border-0"
                      >
                        <div className="text-xs text-slate-200">{s.nombre} <span className="text-cyan-400">— {s.localidad}</span></div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{s.campanas} campaña{s.campanas!==1?"s":""} cargada{s.campanas!==1?"s":""}</div>
                      </button>
                    ))}
                  </div>
                )}
                {!esNuevaCampana && form.punto_de_muestreo.trim().length >= 2 && (
                  <p className="text-[10px] text-slate-500 mt-1">💡 Si ya cargaste este punto antes, elegilo de la lista para completar ubicación y fuente solas.</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div><label className={labelClass}>Latitud *</label><input className={inputClass} value={form.latitud} onChange={set("latitud")} placeholder="-28.4696"/></div>
                <div><label className={labelClass}>Longitud *</label><input className={inputClass} value={form.longitud} onChange={set("longitud")} placeholder="-65.7852"/></div>
                <div><label className={labelClass}>Fecha de monitoreo</label><input type="date" className={inputClass} value={form.fecha_de_monitoreo} onChange={set("fecha_de_monitoreo")}/></div>
              </div>
            </>
          )}

          <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-wider mt-5 mb-2">
            Parámetros — {categoria==="AGUA"?"Agua Potable":categoria==="DIQUE"?"Diques":"Efluentes"}
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {parametrosActivos.map(p => (
              <div key={p.key}>
                <label className={labelClass}>{p.label}{p.unidad?` (${p.unidad})`:""}</label>
                <input className={inputClass} value={(form as any)[p.key]} onChange={set(p.key)} placeholder="0.00" inputMode="decimal"/>
              </div>
            ))}
          </div>

          {error && <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400 text-center">{error}</div>}
          {ok && <div className="mt-3 rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-400 text-center">✅ Punto guardado — ya está visible en el mapa.</div>}

          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800">Cerrar</button>
            <button onClick={handleGuardar} disabled={loading} className="flex-1 rounded-xl bg-cyan-500 py-3 text-sm font-bold text-black hover:bg-cyan-400 disabled:opacity-50">
              {loading?"Guardando...":"Guardar y agregar al mapa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// ASISTENTE DE AYUDA — información fija sobre química, efluentes,
// napas y normativa. No usa ninguna IA ni API externa: cero costo.
// ======================================================
const TEMAS_AYUDA = [
  {
    emoji: "💧",
    titulo: "Química del agua",
    texto: `Los parámetros que monitorea el sistema tienen estos significados prácticos:
    • Arsénico (As): de origen natural en muchos acuíferos del centro-norte argentino; la exposición prolongada por encima del límite se asocia a riesgos de salud a largo plazo (HACRE).
    • Flúor: en dosis correctas previene caries, pero en exceso causa fluorosis dental y ósea — por eso el límite varía según la temperatura media del lugar (a mayor temperatura, se toma más agua, así que el límite permitido es menor).
    • Nitratos (NO3): indican contaminación por materia orgánica (pozos ciegos, agroquímicos, ganadería cercana). En bebés pueden causar metahemoglobinemia.
    • TDS (Sólidos Disueltos Totales): mide la mineralización general del agua; valores muy altos afectan el sabor y pueden indicar salinización.
    • pH: fuera del rango normal puede corroer cañerías o indicar contaminación.`,
  },
  {
    emoji: "🏭",
    titulo: "Efluentes cloacales",
    texto: `Antes de que un efluente (cloacal o industrial) se vuelque a un río o colectora, tiene que cumplir ciertos límites:
    • DBO5 (Demanda Bioquímica de Oxígeno): mide cuánto oxígeno consumen los microorganismos al degradar la materia orgánica del agua. Si es muy alta, le saca el oxígeno disuelto al río y puede matar peces.
    • DQO (Demanda Química de Oxígeno): similar a la DBO5, pero mide también compuestos que no se degradan biológicamente. Siempre es igual o mayor que la DBO5.
    • Grasas y aceites: forman una película en la superficie del agua que impide el intercambio de oxígeno con el aire.
    • Detergentes: en exceso generan espuma y afectan la fauna acuática.
    Un tratamiento cloacal típico (planta depuradora) reduce estos valores antes de descargar el agua tratada.`,
  },
  {
    emoji: "🕳️",
    titulo: "Napas y acuíferos",
    texto: `Un acuífero es una capa de roca o sedimento subterráneo que almacena y permite el paso del agua — es de donde se abastecen la mayoría de los pozos.
    • Agua subterránea: viene de estos acuíferos, filtrada naturalmente por el suelo, pero puede arrastrar minerales de la roca (como arsénico o flúor de origen geológico).
    • Agua superficial: ríos, diques y arroyos, más expuesta a contaminación directa pero generalmente con menos minerales disueltos.
    • Contaminación de napas: ocurre por infiltración de pozos ciegos, agroquímicos, efluentes mal tratados, o sobreexplotación que permite el ingreso de agua salada o contaminada desde capas vecinas.
    Por eso monitorear pozos de forma periódica es clave: una napa contaminada no se "limpia" rápido, el proceso de recuperación natural puede tardar años.`,
  },
  {
    emoji: "📋",
    titulo: "Normativa CAA y Res. 65/05",
    texto: `Dos marcos normativos rigen lo que este sistema evalúa:
    • Código Alimentario Argentino (CAA), Arts. 982-983: fija los límites de calidad de agua potable en todo el país — Arsénico 0.01 mg/L, Nitratos 45 mg/L, TDS 1500 mg/L, y Flúor variable según la temperatura media anual de la zona.
    • Resolución 65/05 (Catamarca): regula el vertido de efluentes, con límites distintos según el destino (colectora cloacal, pozo absorbente, o curso de agua superficial).
    Estas normas son la referencia que usa cada informe del sistema para marcar si un valor "supera" o está "normal".`,
  },
];

function AsistenteAyuda() {
  const [abierto, setAbierto] = useState(false);
  const [temaAbierto, setTemaAbierto] = useState<number | null>(null);

  return (
    <>
      {/* Botón flotante — tubo de ensayo */}
      <button
        onClick={()=>setAbierto(v=>!v)}
        className="fixed bottom-6 right-6 z-[99998] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 shadow-2xl hover:scale-105 transition-transform"
        aria-label="Abrir ayuda"
      >
        <span className="text-2xl">🧪</span>
      </button>

      {abierto && (
        <div className="fixed bottom-24 right-6 z-[99998] w-[340px] max-h-[70vh] flex flex-col rounded-2xl border border-cyan-500/30 bg-slate-950 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-cyan-700 to-teal-800 flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg">🧪</div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Guía WATERGIS</div>
              <div className="text-[10.5px] text-cyan-100">Química, efluentes y napas</div>
            </div>
            <button onClick={()=>setAbierto(false)} className="text-white/80 hover:text-white text-lg leading-none">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <p className="text-[11px] text-slate-400 mb-3">Elegí un tema para ver la explicación:</p>
            <div className="flex flex-col gap-2">
              {TEMAS_AYUDA.map((tema, i) => (
                <div key={tema.titulo} className="rounded-lg border border-slate-700 overflow-hidden">
                  <button
                    onClick={()=>setTemaAbierto(temaAbierto===i ? null : i)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-cyan-500/5 transition-colors"
                  >
                    <span className="text-base">{tema.emoji}</span>
                    <span className="text-[11.5px] text-slate-200 flex-1">{tema.titulo}</span>
                    <span className="text-slate-500 text-xs">{temaAbierto===i ? "▲" : "▼"}</span>
                  </button>
                  {temaAbierto===i && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-800">
                      <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">{tema.texto}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Map() {
  // ── AUTH ──
  const [sesion, setSesion] = useState<{user:string;nombre:string;avatar?:string;rol?:string}|null>(null);
  const [loginVisible, setLoginVisible] = useState(true);
  const esAutenticado = sesion !== null && sesion.user !== "publico";
  // Los 3 usuarios históricos (hardcodeados) son admin por compatibilidad; el resto depende de la base de datos
  const esAdmin = esAutenticado && (sesion?.rol === "admin" || !!USUARIOS[sesion?.user || ""]);

  useEffect(()=>{
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if(saved){ const p=JSON.parse(saved); if(p.user&&p.nombre){ setSesion(p); setLoginVisible(false); } }
    } catch {}
  },[]);

  const [mostrarBienvenida, setMostrarBienvenida] = useState(false);

  const handleLogin=(user:string,nombre:string,avatar?:string,rol?:string)=>{
    const s={user,nombre,avatar,rol}; setSesion(s); setLoginVisible(false);
    if(user!=="publico"){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(s)); }catch{} }
    if(user!=="publico"){
      setMostrarBienvenida(true);
      setTimeout(()=>setMostrarBienvenida(false), 4000);
    }
  };

  const handleLogout=()=>{
    setSesion(null); setLoginVisible(true);
    try{ localStorage.removeItem(STORAGE_KEY); }catch{}
    setUserMenuOpen(false);
  };

  const [points, setPoints]             = useState<Punto[]>([]);
  const [search, setSearch]             = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showPerfil, setShowPerfil]     = useState(false);
  const [showCambiarPass, setShowCambiarPass] = useState(false);
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passNueva2, setPassNueva2] = useState("");
  const [passError, setPassError] = useState("");
  const [passOk, setPassOk] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const [showCambiarFoto, setShowCambiarFoto] = useState(false);
  const [fotoError, setFotoError] = useState("");
  const [fotoLoading, setFotoLoading] = useState(false);

  const handleCambiarPassword = async () => {
    setPassError(""); setPassOk(false);
    if (!passActual || !passNueva) { setPassError("Completá los dos campos."); return; }
    if (passNueva !== passNueva2) { setPassError("Las contraseñas nuevas no coinciden."); return; }
    if (passNueva.length < 6) { setPassError("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    setPassLoading(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: sesion?.user, passwordActual: passActual, passwordNueva: passNueva }),
      });
      const data = await res.json();
      if (data.ok) {
        setPassOk(true);
        setPassActual(""); setPassNueva(""); setPassNueva2("");
        setTimeout(()=>{ setShowCambiarPass(false); setPassOk(false); }, 1500);
      } else {
        setPassError(data.error || "No se pudo cambiar la contraseña.");
      }
    } catch {
      setPassError("No se pudo conectar con el servidor.");
    } finally {
      setPassLoading(false);
    }
  };

  const handleCambiarAvatar = async (nuevoAvatar: string) => {
    setFotoError(""); setFotoLoading(true);
    try {
      const res = await fetch("/api/change-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: sesion?.user, avatar: nuevoAvatar }),
      });
      const data = await res.json();
      if (data.ok) {
        setSesion(prev => {
          const nuevo = prev ? { ...prev, avatar: nuevoAvatar } : prev;
          if (nuevo) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevo)); } catch {} }
          return nuevo;
        });
        setShowCambiarFoto(false);
      } else {
        setFotoError(data.error || "No se pudo cambiar el ícono.");
      }
    } catch {
      setFotoError("No se pudo conectar con el servidor.");
    } finally {
      setFotoLoading(false);
    }
  };
  const [showAjustes, setShowAjustes]   = useState(false);
  const [showCargaForm, setShowCargaForm] = useState(false);
  const [puntoParaNuevaCampana, setPuntoParaNuevaCampana] = useState<{ punto_de_muestreo: string; localidad: string; departamento: string; fuente: string; tipo_punto: string; latitud: string; longitud: string } | null>(null);

  const abrirNuevaCampana = (p: Punto) => {
    setPuntoParaNuevaCampana({
      punto_de_muestreo: p.PUNTO_DE_MUESTREO,
      localidad: p.Localidad,
      departamento: p.Departamento,
      fuente: p.Fuente,
      tipo_punto: p.Tipo_Punto || "POZO",
      latitud: p.Latitud,
      longitud: p.Longitud,
    });
    setShowCargaForm(true);
  };
  const [selectedVariable, setSelectedVariable] = useState("As");
  const [selectedFuente, setSelectedFuente]     = useState("TODAS");

  // Estado para el parámetro seleccionado en cada popup (clave: punto_localidad)
  const [popupVar, setPopupVar] = useState<Record<string,string>>({});

  // Filtro tipo de punto
  const [tipoPunto, setTipoPunto] = useState<"TODOS"|"POZO"|"DIQUE"|"RED"|"EFLUENTE">("TODOS");
  const [infTipoPunto, setInfTipoPunto] = useState<"DIQUE"|"RED"|"EFLUENTE"|null>(null);
  const [diqueSeleccionado, setDiqueSeleccionado] = useState("TODOS");

  const diquesUnicosLista = useMemo(()=>
    [...new Set(points.filter(p=>(p.Tipo_Punto||"").toUpperCase()==="DIQUE").map(p=>p.PUNTO_DE_MUESTREO))].filter(Boolean).sort()
  ,[points]);

  // Punto de efluente específico (mismo patrón que diqueSeleccionado)
  const [efluenteSeleccionado, setEfluenteSeleccionado] = useState("TODOS");

  const efluentesUnicosLista = useMemo(()=>
    [...new Set(points.filter(p=>(p.Tipo_Punto||"").toUpperCase()==="EFLUENTE").map(p=>p.PUNTO_DE_MUESTREO))].filter(Boolean).sort()
  ,[points]);

  // Filtro sidebar
  const [selectedFiltDept, setSelectedFiltDept] = useState("TODOS");

  // Punto de muestreo específico de RED (análogo a diqueSeleccionado)
  const [redPuntoSeleccionado, setRedPuntoSeleccionado] = useState("TODOS");

  // Puntos de muestreo de RED — si hay una Localidad elegida en el filtro (search),
  // se listan solo los puntos de esa localidad; si hay Departamento, los de ese departamento
  const redPuntosUnicosLista = useMemo(()=>{
    let base = points.filter(p=>(p.Tipo_Punto||"").toUpperCase()==="RED");
    if(search) base = base.filter(p=>p.Localidad===search);
    else if(selectedFiltDept!=="TODOS") base = base.filter(p=>p.Departamento===selectedFiltDept);
    return [...new Set(base.map(p=>p.PUNTO_DE_MUESTREO))].filter(Boolean).sort();
  },[points, search, selectedFiltDept]);

  // Si cambia la Localidad o el Departamento, reseteo el punto de red elegido
  useEffect(()=>{ setRedPuntoSeleccionado("TODOS"); },[search, selectedFiltDept]);

  // Menú hamburguesa
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [panelMenu, setPanelMenu]         = useState<PanelMenu>(null);

  // Localidades filtradas por departamento seleccionado en sidebar
  const localidadesFiltradas = useMemo(()=>{
    const base = selectedFiltDept==="TODOS" ? points : points.filter(p=>p.Departamento===selectedFiltDept);
    return [...new Set(base.map(p=>p.Localidad).filter(Boolean))].sort();
  },[points, selectedFiltDept]);

  // Reset localidad cuando cambia el departamento del sidebar
  useEffect(()=>{ setSearch(""); },[selectedFiltDept]);

  // Filtros del informe
  const [infDept, setInfDept]     = useState("TODOS");
  const [infLoc, setInfLoc]       = useState("TODAS");
  const [infFuente, setInfFuente] = useState("TODAS");
  const [infRiesgo, setInfRiesgo] = useState("TODOS");

  // Capas personalizadas
  const [customLayers, setCustomLayers] = useState<{ url: string; name: string; color: string; data: any }[]>([]);
  const [newLayerUrl, setNewLayerUrl]   = useState("");
  const [newLayerName, setNewLayerName] = useState("");
  const [newLayerColor, setNewLayerColor] = useState("#ff0066");
  const [layerError, setLayerError]     = useState("");

  // Ajustes
  const [idioma, setIdioma]         = useState<Idioma>("es");
  const [tipografia, setTipografia] = useState<Tipografia>("inter");
  const [lectorLeyendo, setLectorLeyendo] = useState(false);

  const t = T[idioma];

  useEffect(() => { document.body.style.fontFamily = fontFamilies[tipografia]; }, [tipografia]);


  // Resetear localidad cuando cambia el departamento
  useEffect(() => { setInfLoc("TODAS"); }, [infDept]);

  // ======================================================
  // LECTOR
  // ======================================================

  const leerDatos = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (lectorLeyendo) { setLectorLeyendo(false); return; }
    const resumen = {
      es: `Plataforma Water GIS. ${visiblePoints.length} puntos. Arsénico elevado: ${puntosAltos}. Promedio As: ${promedioAs.toFixed(3)} mg/L. TDS: ${promedioTds.toFixed(0)} mg/L.`,
      en: `Water GIS. ${visiblePoints.length} points. High arsenic: ${puntosAltos}. Avg As: ${promedioAs.toFixed(3)} mg/L. TDS: ${promedioTds.toFixed(0)} mg/L.`,
      de: `Water GIS. ${visiblePoints.length} Punkte. Hochrisiko-Arsen: ${puntosAltos}. Arsen-Ø: ${promedioAs.toFixed(3)} mg/L. TDS: ${promedioTds.toFixed(0)} mg/L.`,
      pt: `Water GIS. ${visiblePoints.length} pontos. Arsênio elevado: ${puntosAltos}. Média As: ${promedioAs.toFixed(3)} mg/L. TDS: ${promedioTds.toFixed(0)} mg/L.`,
    }[idioma];
    const utt = new SpeechSynthesisUtterance(resumen);
    utt.lang = { es:"es-AR", en:"en-US", de:"de-DE", pt:"pt-BR" }[idioma];
    utt.rate = 0.95;
    utt.onend = () => setLectorLeyendo(false);
    setLectorLeyendo(true);
    window.speechSynthesis.speak(utt);
  };

  useEffect(() => {
    if (!showAjustes && lectorLeyendo) { window.speechSynthesis?.cancel(); setLectorLeyendo(false); }
  }, [showAjustes]);

  // ======================================================
  // CAPAS GIS
  // ======================================================

  const [departamentos, setDepartamentos] = useState<any>(null);
  const [showDepartamentos, setShowDepartamentos] = useState(true);
  const [cuencas, setCuencas]             = useState<any>(null);
  const [showCuencas, setShowCuencas]     = useState(true);
  const [rios, setRios]                   = useState<any>(null);
  const [showRios, setShowRios]           = useState(true);

  // Mapa de calor
  const [heatParam, setHeatParam] = useState<"ninguno"|"As"|"TDS"|"Fluor">("ninguno");
  const [heatReady, setHeatReady] = useState(false);

  useEffect(()=>{
    if(typeof window==="undefined") return;
    if((window as any).L?.HeatLayer){ setHeatReady(true); return; }
    const s=document.createElement("script");
    s.src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js";
    s.async=true; s.onload=()=>setHeatReady(true);
    document.head.appendChild(s);
  },[]);

  // ======================================================
  // LOAD DATA
  // ======================================================

  // ── Pop-up nuevos puntos ──
  const [popupNuevos, setPopupNuevos] = useState<{
    visible: boolean;
    total: number;
    porDpto: {dpto: string; cantidad: number}[];
    fecha: string;
  }>({ visible: false, total: 0, porDpto: [], fecha: "" });

  // Convierte una fila de la tabla puntos_monitoreo (snake_case) al formato Punto usado en toda la app
  const dbRowToPunto = (row: any): Punto => ({
    Localidad: row.localidad || "",
    Departamento: row.departamento || "",
    Fuente: row.fuente || "",
    Tipo_Punto: row.tipo_punto || "",
    PUNTO_DE_MUESTREO: row.punto_de_muestreo || "",
    Fecha_de_monitoreo: row.fecha_de_monitoreo || "",
    Ph: row.ph || "",
    "T_ºC": row.t_c || "",
    TDS_mg_l: row.tds_mg_l || "",
    Turb_NTU: row.turb_ntu || "",
    Salinidad_mg_l: row.salinidad_mg_l || "",
    As_mg_l: row.as_mg_l || "",
    Fluor_mg_l: row.fluor_mg_l || "",
    NO3_mg_l: row.no3_mg_l || "",
    OD_mg_l: row.od_mg_l || "",
    Sat_O2_pct: row.sat_o2_pct || "",
    Clorofila_ug_l: row.clorofila_ug_l || "",
    Algas_BGA: row.algas_bga || "",
    Cloro_libre_mg_l: row.cloro_libre_mg_l || "",
    DBO_mg_l: row.dbo_mg_l || "",
    DQO_mg_l: row.dqo_mg_l || "",
    Detergentes_mg_l: row.detergentes_mg_l || "",
    Grasas_Aceites_mg_l: row.grasas_aceites_mg_l || "",
    Latitud: row.latitud || "",
    Longitud: row.longitud || "",
  });

  // Trae los puntos cargados por el formulario desde la base de datos y los suma a los del CSV
  const cargarPuntosDB = async (baseCSV: Punto[]) => {
    try {
      const res = await fetch("/api/puntos");
      const data = await res.json();
      if (data.ok) {
        const puntosDB = (data.puntos as any[]).map(dbRowToPunto);
        setPoints([...baseCSV, ...puntosDB]);
      }
    } catch {
      // Si falla la base de datos, seguimos mostrando al menos los datos del CSV
    }
  };

  // Recarga completa (CSV + base de datos) — se reutiliza después de cargar un dato nuevo desde el formulario
  const recargarTodosLosPuntos = () => {
    Papa.parse("/pozos.csv", {
      download: true, header: true, skipEmptyLines: true,
      complete: (r) => cargarPuntosDB(r.data as Punto[]),
    });
  };

  useEffect(() => {
    Papa.parse("/pozos.csv", {
      download: true, header: true, skipEmptyLines: true,
      complete: (r) => {
        const data = r.data as Punto[];
        setPoints(data);
        cargarPuntosDB(data);

        // ── Detectar puntos nuevos ──
        const STORAGE_KEY_PUNTOS = "watergis_puntos_vistos";
        const hoy = new Date().toISOString().split("T")[0]; // "2026-06-25"

        try {
          const saved = localStorage.getItem(STORAGE_KEY_PUNTOS);
          const visto = saved ? JSON.parse(saved) : {};

          // Contar puntos actuales por departamento
          const actualPorDpto: Record<string, number> = {};
          data.forEach(p => {
            if (!p.Departamento) return;
            actualPorDpto[p.Departamento] = (actualPorDpto[p.Departamento]||0) + 1;
          });

          // Comparar con lo que el usuario ya vio
          const nuevosPorDpto: {dpto: string; cantidad: number}[] = [];
          let totalNuevos = 0;

          Object.entries(actualPorDpto).forEach(([dpto, count]) => {
            const vistoCount = visto[dpto] || 0;
            if (count > vistoCount) {
              const diff = count - vistoCount;
              nuevosPorDpto.push({ dpto, cantidad: diff });
              totalNuevos += diff;
            }
          });

          // Mostrar pop-up solo si hay puntos nuevos Y no lo vio hoy
          const ultimaVez = visto["__ultima_vez"] || "";
          if (totalNuevos > 0 && ultimaVez !== hoy) {
            setPopupNuevos({
              visible: true,
              total: totalNuevos,
              porDpto: nuevosPorDpto,
              fecha: hoy,
            });
          }

          // Guardar el estado actual para la próxima visita
          const nuevoVisto = { ...actualPorDpto, "__ultima_vez": hoy };
          localStorage.setItem(STORAGE_KEY_PUNTOS, JSON.stringify(nuevoVisto));

        } catch(e) {
          // Si falla localStorage simplemente no mostramos el pop-up
        }
      },
    });
  }, []);

  useEffect(() => { fetch("/departamentos.geojson").then(r=>r.json()).then(setDepartamentos); }, []);
  useEffect(() => { fetch("/cuencas.geojson").then(r=>r.json()).then(setCuencas); }, []);
  useEffect(() => { fetch("/rios.geojson").then(r=>r.json()).then(setRios); }, []);

  // ======================================================
  // FILTRO
  // ======================================================

  const visiblePoints = useMemo(() => {
    return points.filter((p) => {
      const lat = parseFloat(p.Latitud?.toString().replace(",","."));
      const lng = parseFloat(p.Longitud?.toString().replace(",","."));
      if (isNaN(lat)||isNaN(lng)) return false;
      const tipoOk = tipoPunto==="TODOS" || (p.Tipo_Punto||"POZO").toUpperCase()===tipoPunto;
      const deptOk = selectedFiltDept==="TODOS" || p.Departamento===selectedFiltDept;
      const locOk  = search.trim()==="" ? true : p.Localidad===search;
      const fOk    = selectedFuente==="TODAS" || p.Fuente===selectedFuente;
      return tipoOk && deptOk && locOk && fOk;
    });
  }, [points, search, selectedFuente, selectedFiltDept, tipoPunto]);

  // ======================================================
  // KPI
  // ======================================================

  const promedioAs  = visiblePoints.length>0 ? visiblePoints.reduce((a,p)=>a+parseAs(p.As_mg_l),0)/visiblePoints.length : 0;
  const promedioTds = visiblePoints.length>0 ? visiblePoints.reduce((a,p)=>a+parseFloat(String(p.TDS_mg_l||"0").replace(",",".")),0)/visiblePoints.length : 0;
  const promedioFluor = visiblePoints.length>0 ? visiblePoints.reduce((a,p)=>a+parseAs(p.Fluor_mg_l),0)/visiblePoints.length : 0;
  const promedioNO3   = visiblePoints.length>0 ? visiblePoints.reduce((a,p)=>a+parseAs(p.NO3_mg_l),0)/visiblePoints.length : 0;
  const promedioPh    = visiblePoints.length>0 ? visiblePoints.reduce((a,p)=>a+parseAs(p.Ph),0)/visiblePoints.length : 0;

  const puntosAltos = visiblePoints.filter(p=>parseAs(p.As_mg_l)>0.01).length;
  const totalF      = visiblePoints.length;
  const subterranea = visiblePoints.filter(p=>p.Fuente==="SUBTERRANEA").length;
  const superficial = visiblePoints.filter(p=>p.Fuente==="SUPERFICIAL").length;
  const mezcla      = visiblePoints.filter(p=>p.Fuente==="MEZCLA").length;
  const pctSub = totalF>0 ? ((subterranea/totalF)*100).toFixed(1) : "0";
  const pctSup = totalF>0 ? ((superficial/totalF)*100).toFixed(1) : "0";
  const pctMez = totalF>0 ? ((mezcla/totalF)*100).toFixed(1) : "0";

  const estadoGeneral = promedioAs > 0.05 ? "⛔ ALERTA" : promedioAs > 0.01 ? "⚠️ PRECAUCIÓN" : "✅ NORMAL";
  const fuentePred    = subterranea>=superficial && subterranea>=mezcla ? t.subterranea : superficial>=mezcla ? t.superficial : t.mezcla;

  // campañas históricas de As por año (para el informe)
  const historicAs = useMemo(() => {
    const byYear: Record<string, number[]> = {};
    visiblePoints.forEach(p => {
      const yr = p.Fecha_de_monitoreo?.split(/[-/]/)[0];
      if (!yr || yr.length!==4) return;
      if (!byYear[yr]) byYear[yr]=[];
      byYear[yr].push(parseAs(p.As_mg_l));
    });
    return Object.keys(byYear).sort().map(yr => ({
      year: yr,
      avg: (byYear[yr].reduce((a,v)=>a+v,0)/byYear[yr].length).toFixed(3),
    }));
  }, [visiblePoints]);

  // Porcentajes de riesgo
  const bajoCnt  = visiblePoints.filter(p=>parseAs(p.As_mg_l)<0.01).length;
  const medioCnt = visiblePoints.filter(p=>{const a=parseAs(p.As_mg_l);return a>=0.01&&a<=0.05;}).length;
  const altoCnt  = visiblePoints.filter(p=>parseAs(p.As_mg_l)>0.05).length;
  const safePct  = (n:number) => totalF>0?((n/totalF)*100).toFixed(0):"0";

  // Departamentos únicos
  const departamentosUniq = useMemo(()=>[...new Set(points.map(p=>p.Departamento).filter(Boolean))].sort(),[points]);
  // Localidades únicas — se filtran según el departamento seleccionado en el informe
  const localidades = useMemo(()=>{
    const base = infDept==="TODOS" ? points : points.filter(p=>p.Departamento===infDept);
    return [...new Set(base.map(p=>p.Localidad).filter(Boolean))].sort();
  },[points, infDept]);

  // ======================================================
  // ICONOS
  // ======================================================

  const getMarkerIcon = (point: Punto) => {
    if(point.Tipo_Punto==="DIQUE") return blueIcon;
    if(point.Tipo_Punto==="RED") return violetIcon;
    if(point.Tipo_Punto==="EFLUENTE") return greyIcon;
    if (selectedVariable==="As") {
      const as=parseAs(point.As_mg_l);
      if(as>0.05) return redIcon;
      if(as>0.01) return orangeIcon;
      return greenIcon;
    }
    const tds=parseFloat(String(point.TDS_mg_l||"0").replace(",","."));
    if(tds>2000) return redIcon;
    if(tds>1000) return orangeIcon;
    return greenIcon;
  };

  const cuencaStyle = (feature: any) => {
    const id=feature?.properties?.id||feature?.properties?.ID||feature?.properties?.OBJECTID||feature?.properties?.NOMBRE||1;
    const color=cuencaColors[Math.abs(String(id).split("").reduce((a,c)=>a+c.charCodeAt(0),0))%cuencaColors.length];
    return { color, fillColor:color, fillOpacity:0.28, weight:2 };
  };

  // ======================================================
  // AGREGAR CAPA PERSONALIZADA
  // ======================================================

  const agregarCapa = async () => {
    setLayerError("");
    if (!newLayerUrl.trim()) { setLayerError("Ingresá una URL válida."); return; }
    try {
      const res  = await fetch(newLayerUrl);
      const data = await res.json();
      setCustomLayers(prev=>[...prev,{ url:newLayerUrl, name:newLayerName||"Capa "+Date.now(), color:newLayerColor, data }]);
      setNewLayerUrl(""); setNewLayerName(""); setNewLayerColor("#ff0066");
    } catch {
      setLayerError("No se pudo cargar el GeoJSON. Verificá la URL y que tenga CORS habilitado.");
    }
  };

  // ======================================================
  // GENERAR PDF — usando HTML + window.print() sin dependencias
  // ======================================================

  const [pdfLoading, setPdfLoading] = useState(false);

  const generarPDF = () => {
    setPdfLoading(true);

    const filtrado = points.filter(p => {
      const dOk  = infDept==="TODOS"   || p.Departamento===infDept;
      const lOk  = infLoc==="TODAS"    || p.Localidad===infLoc;
      const fOk  = infFuente==="TODAS" || p.Fuente===infFuente;
      const asV  = parseAs(p.As_mg_l);
      const rOk  = infRiesgo==="TODOS" ||
        (infRiesgo==="BAJO"  && asV<0.01) ||
        (infRiesgo==="MEDIO" && asV>=0.01 && asV<=0.05) ||
        (infRiesgo==="ALTO"  && asV>0.05);
      const lat = parseFloat(p.Latitud?.toString().replace(",","."));
      const lng = parseFloat(p.Longitud?.toString().replace(",","."));
      return dOk&&lOk&&fOk&&rOk&&!isNaN(lat)&&!isNaN(lng);
    });

    const base: Punto[] = filtrado.length > 0 ? filtrado : points.filter(p=>{
      const lat=parseFloat(p.Latitud?.toString().replace(",","."));
      const lng=parseFloat(p.Longitud?.toString().replace(",","."));
      return !isNaN(lat)&&!isNaN(lng);
    });

    const avgAs    = base.length>0?base.reduce((a,p)=>a+parseAs(p.As_mg_l),0)/base.length:0;
    const avgFluor = base.length>0?base.reduce((a,p)=>a+parseAs(p.Fluor_mg_l),0)/base.length:0;
    const avgNO3   = base.length>0?base.reduce((a,p)=>a+parseAs(p.NO3_mg_l),0)/base.length:0;
    const avgTDS   = base.length>0?base.reduce((a,p)=>a+parseFloat(String(p.TDS_mg_l||"0").replace(",",".")),0)/base.length:0;
    const avgPh    = base.length>0?base.reduce((a,p)=>a+parseAs(p.Ph),0)/base.length:0;
    const avgTemp  = base.length>0?base.reduce((a,p)=>a+parseAs(p.T_ºC),0)/base.length:0;

    // ── Temperatura media anual según departamento seleccionado (CAA Art. 982) ──
    const dptoKey = (infDept!=="TODOS" ? infDept : base[0]?.Departamento || "").toUpperCase();
    const tempAnual = TEMP_DPTO[dptoKey] ?? avgTemp; // fallback a promedio del CSV si no está en tabla

    // ── Límite CAA de Flúor según temperatura promedio (Art. 982) ──
    const fluorInfo = limiteFluorPorTemp(tempAnual);

    const estG  = avgAs>0.05?"⛔ ALERTA":avgAs>0.01?"⚠️ PRECAUCIÓN":"✅ NORMAL";
    const estColor = avgAs>0.05?"#ef4444":avgAs>0.01?"#f59e0b":"#22c55e";
    const fPred = (() => {
      const sub=base.filter(p=>p.Fuente==="SUBTERRANEA").length;
      const sup=base.filter(p=>p.Fuente==="SUPERFICIAL").length;
      const mez=base.filter(p=>p.Fuente==="MEZCLA").length;
      return sub>=sup&&sub>=mez?"Subterránea":sup>=mez?"Superficial":"Mezcla";
    })();
    const bCnt=base.filter(p=>parseAs(p.As_mg_l)<0.01).length;
    const mCnt=base.filter(p=>{const a=parseAs(p.As_mg_l);return a>=0.01&&a<=0.05;}).length;
    const aCnt=base.filter(p=>parseAs(p.As_mg_l)>0.05).length;
    const pct=(n:number)=>base.length>0?((n/base.length)*100).toFixed(1):"0";

    const no3Bajo  = base.filter(p=>parseAs(p.NO3_mg_l)<5).length;
    const no3Medio = base.filter(p=>{const v=parseAs(p.NO3_mg_l);return v>=5&&v<=10;}).length;
    const no3Alto  = base.filter(p=>parseAs(p.NO3_mg_l)>10).length;
    const pctNo3   = (n:number)=>base.length>0?((n/base.length)*100).toFixed(1):"0";

    const byYear: Record<string,number[]>={};
    base.forEach(p=>{
      const yr=p.Fecha_de_monitoreo?.split(/[-/]/)[0];
      if(!yr||yr.length!==4) return;
      if(!byYear[yr]) byYear[yr]=[];
      byYear[yr].push(parseAs(p.As_mg_l));
    });
    const histData=Object.keys(byYear).sort().map(yr=>({
      yr, avg:(byYear[yr].reduce((a,v)=>a+v,0)/byYear[yr].length).toFixed(3)
    }));

    const soloDepto = infDept!=="TODOS" && infLoc==="TODAS";
    const soloLoc   = infLoc!=="TODAS";
    const titulo2   = soloLoc
      ? `${infLoc.toUpperCase()} · ${(infDept!=="TODOS"?infDept:base[0]?.Departamento||"").toUpperCase()}`
      : soloDepto ? `DEPARTAMENTO ${infDept.toUpperCase()}`
      : `PROVINCIA DE CATAMARCA — TODOS LOS DEPARTAMENTOS`;
    const fecha = new Date().toLocaleDateString("es-AR");
    const nombreBase2 = soloLoc ? infLoc : soloDepto ? `Departamento_${infDept}` : "General";

    // Límites CAA para puntos críticos
    const LIM_AS  = 0.01;   // CAA Art. 982 — Arsénico
    const LIM_NO3 = 45.0;   // CAA Art. 983 — Nitratos
    const LIM_TDS = 1500;   // CAA — Sólidos disueltos totales

    const puntosAltosAs  = base.filter(p=>parseAs(p.As_mg_l)>LIM_AS)
      .sort((a,b)=>parseAs(b.As_mg_l)-parseAs(a.As_mg_l)).slice(0,15);
    const puntosAltosNo3 = base.filter(p=>parseAs(p.NO3_mg_l)>LIM_NO3)
      .sort((a,b)=>parseAs(b.NO3_mg_l)-parseAs(a.NO3_mg_l)).slice(0,15);
    const puntosAltosTDS = base.filter(p=>parseFloat(String(p.TDS_mg_l||"0").replace(",","."))>LIM_TDS)
      .sort((a,b)=>parseFloat(String(b.TDS_mg_l||"0").replace(",","."))-parseFloat(String(a.TDS_mg_l||"0").replace(",","."))).slice(0,15);

    // Flúor — el límite depende de la temperatura media anual del departamento (fluorInfo ya calculado arriba)
    const fluorBajoCnt   = base.filter(p=>parseAs(p.Fluor_mg_l)<fluorInfo.limInf).length;
    const fluorNormalCnt = base.filter(p=>{const v=parseAs(p.Fluor_mg_l);return v>=fluorInfo.limInf&&v<=fluorInfo.limSup;}).length;
    const fluorAltoCnt   = base.filter(p=>parseAs(p.Fluor_mg_l)>fluorInfo.limSup).length;
    const pctFluor = (n:number)=>base.length>0?((n/base.length)*100).toFixed(1):"0";
    const puntosAltosFluor = base.filter(p=>parseAs(p.Fluor_mg_l)>fluorInfo.limSup)
      .sort((a,b)=>parseAs(b.Fluor_mg_l)-parseAs(a.Fluor_mg_l)).slice(0,15);

    const conclusion = soloLoc
      ? `La localidad de ${infLoc} presenta una calidad de agua generalmente estable. Se identifican concentraciones elevadas de arsénico en determinados sectores, por lo que se recomienda continuar con el monitoreo periódico y mantener controles preventivos sobre las fuentes de abastecimiento.`
      : soloDepto
      ? `El departamento de ${infDept} presenta en general una calidad de agua estable. Se identifican variaciones entre localidades en cuanto a concentraciones de arsénico, por lo que se recomienda el monitoreo periódico y controles preventivos diferenciados por localidad.`
      : `La Provincia de Catamarca presenta en general una calidad de agua variable según zona. Se recomienda el monitoreo continuo, especialmente en zonas con arsénico elevado, y mantener los controles establecidos por los organismos competentes.`;

    const tr = (cells: string[], header=false) =>
      `<tr>${cells.map(c=>`<${header?"th":"td"}>${c}</${header?"th":"td"}>`).join("")}</tr>`;

    const barraHTML = (pctStr:string, color:string) =>
      `<div style="background:#1e293b;border-radius:4px;height:10px;width:100%">
        <div style="background:${color};border-radius:4px;height:10px;width:${pctStr}%"></div>
      </div>`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe WATERGIS — ${nombreBase2}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; background: white; }
  .page { padding: 18mm 16mm; }
  h1 { font-size: 22px; color: #0e7490; margin-bottom: 2px; }
  h2 { font-size: 13px; color: #0e7490; border-left: 4px solid #06b6d4; padding-left: 8px; margin: 16px 0 8px; }
  h3 { font-size: 11px; color: #475569; margin: 12px 0 6px; }
  .subtitle { font-size: 12px; color: #334155; margin-bottom: 2px; }
  .meta { font-size: 10px; color: #64748b; margin-bottom: 14px; }
  .header-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10.5px; }
  th { background: #0e7490; color: white; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .estado-alerta { color: #dc2626; font-weight: bold; }
  .estado-precaucion { color: #d97706; font-weight: bold; }
  .estado-normal { color: #16a34a; font-weight: bold; }
  .bar-row { display: flex; align-items: center; gap: 10px; margin: 4px 0; }
  .bar-label { width: 160px; flex-shrink: 0; font-size: 10px; }
  .bar-wrap { flex: 1; background: #e2e8f0; border-radius: 4px; height: 12px; }
  .bar-fill { height: 12px; border-radius: 4px; }
  .bar-val { width: 80px; text-align: right; font-size: 10px; font-weight: bold; }
  .caa-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-top: 16px; }
  .caa-box h2 { color: #15803d; border-left-color: #22c55e; }
  .nota { font-size: 9px; color: #64748b; font-style: italic; margin-top: 8px; line-height: 1.5; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
  .supera { color: #dc2626; font-weight: bold; }
  .limite { color: #d97706; font-weight: bold; }
  .ok { color: #16a34a; font-weight: bold; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 15mm; size: A4; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- ENCABEZADO -->
  <div class="header-box">
    <div class="header-top">
      <div>
        <h1>💧 WATERGIS</h1>
        <div class="subtitle">INFORME HIDROQUÍMICO LOCAL</div>
        <div class="subtitle"><strong>${titulo2}</strong></div>
      </div>
      <div style="text-align:right;font-size:10px;color:#64748b">
        <div>Usuario: Nicolás Doria</div>
        <div>Fecha: ${fecha}</div>
        <div>Puntos analizados: ${base.length}</div>
      </div>
    </div>
  </div>

  <!-- RESUMEN -->
  <table>
    <tbody>
      ${tr(["Campañas realizadas", String(base.length)])}
      ${tr(["Fuente predominante", fPred])}
      ${tr(["Estado general", `<span class="estado-${avgAs>0.05?"alerta":avgAs>0.01?"precaucion":"normal"}">${estG}</span>`])}
    </tbody>
  </table>

  <!-- INDICADORES -->
  <h2>INDICADORES PRINCIPALES</h2>
  <table>
    <thead>${tr(["Parámetro","Promedio","Límite CAA","Estado"],true)}</thead>
    <tbody>
      ${tr(["Arsénico (As)", avgAs.toFixed(3)+" mg/L", "0.010 mg/L", `<span class="${avgAs>0.01?"supera":avgAs>0.008?"limite":"ok"}">${avgAs>0.01?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["Flúor", avgFluor.toFixed(2)+" mg/L", `${fluorInfo.limInf}–${fluorInfo.limSup} mg/L`, `<span class="${avgFluor>fluorInfo.limSup?"supera":avgFluor<fluorInfo.limInf?"limite":"ok"}">${avgFluor>fluorInfo.limSup?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["Nitratos (NO3)", avgNO3.toFixed(1)+" mg/L", "45 mg/L (CAA)", `<span class="${avgNO3>45?"supera":avgNO3>36?"limite":"ok"}">${avgNO3>45?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["TDS", avgTDS.toFixed(0)+" mg/L", "1500 mg/L (CAA)", `<span class="${avgTDS>1500?"supera":avgTDS>1200?"limite":"ok"}">${avgTDS>1500?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["pH", avgPh.toFixed(1), "6.5 – 8.5", `<span class="${avgPh<6.5||avgPh>8.5?"supera":"ok"}">${avgPh<6.5||avgPh>8.5?"⚠️ Fuera de rango":"✅ Normal"}</span>`])}
    </tbody>
  </table>
  <p class="nota">Referencia: Código Alimentario Argentino, Arts. 982-983 (Res. Conjunta 33/2023). Nitratos: máx. 45 mg/L como ion nitrato. TDS: máx. 1500 mg/L.</p>

  <!-- RIESGO AS -->
  <h2>DISTRIBUCIÓN DE RIESGO — ARSÉNICO (As)</h2>
  <div class="bar-row">
    <div class="bar-label">Bajo (&lt; 0.01 mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#22c55e;width:${pct(bCnt)}%"></div></div>
    <div class="bar-val" style="color:#22c55e">${bCnt} (${pct(bCnt)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Medio (0.01–0.05 mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#f59e0b;width:${pct(mCnt)}%"></div></div>
    <div class="bar-val" style="color:#f59e0b">${mCnt} (${pct(mCnt)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Alto (&gt; 0.05 mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#ef4444;width:${pct(aCnt)}%"></div></div>
    <div class="bar-val" style="color:#ef4444">${aCnt} (${pct(aCnt)}%)</div>
  </div>

  ${puntosAltosAs.length>0?`
  <h3>Puntos críticos — Arsénico (As) superior al límite CAA (&gt; 0.01 mg/L)</h3>
  <table>
    <thead>${tr(["Localidad","Departamento","Punto de muestreo","Fuente","As (mg/L)","Estado"],true)}</thead>
    <tbody>
      ${puntosAltosAs.map(p=>tr([
        p.Localidad||"-", p.Departamento||"-", p.PUNTO_DE_MUESTREO||"-", p.Fuente||"-",
        parseAs(p.As_mg_l).toFixed(3),
        '<span class="supera">⛔ Supera CAA</span>'
      ])).join("")}
    </tbody>
  </table>
  <h3>Riesgo alto de As por tipo de fuente</h3>
  <table>
    <thead>${tr(["Tipo de fuente","Puntos en riesgo alto","% del total en riesgo"],true)}</thead>
    <tbody>
      ${[["Subterránea","SUBTERRANEA"],["Superficial","SUPERFICIAL"],["Mezcla","MEZCLA"]].map(([label,key])=>{
        const n=base.filter(p=>parseAs(p.As_mg_l)>0.05&&p.Fuente===key).length;
        return tr([label, `${n} puntos`, aCnt>0?((n/aCnt)*100).toFixed(1)+"%":"0%"]);
      }).join("")}
    </tbody>
  </table>`:""}

  <!-- RIESGO NO3 -->
  <h2>DISTRIBUCIÓN DE RIESGO — NITRATOS (NO3⁻)</h2>
  <div class="bar-row">
    <div class="bar-label">Bajo (&lt; 5 mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#22c55e;width:${pctNo3(no3Bajo)}%"></div></div>
    <div class="bar-val" style="color:#22c55e">${no3Bajo} (${pctNo3(no3Bajo)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Medio (5–10 mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#f59e0b;width:${pctNo3(no3Medio)}%"></div></div>
    <div class="bar-val" style="color:#f59e0b">${no3Medio} (${pctNo3(no3Medio)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Alto (&gt; 10 mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#ef4444;width:${pctNo3(no3Alto)}%"></div></div>
    <div class="bar-val" style="color:#ef4444">${no3Alto} (${pctNo3(no3Alto)}%)</div>
  </div>

  ${puntosAltosNo3.length>0?`
  <h3>Puntos críticos — Nitratos (NO3⁻) superior al límite CAA (&gt; 45 mg/L)</h3>
  <table>
    <thead>${tr(["Localidad","Departamento","Punto de muestreo","Fuente","NO3 (mg/L)","Estado"],true)}</thead>
    <tbody>
      ${puntosAltosNo3.map(p=>tr([
        p.Localidad||"-", p.Departamento||"-", p.PUNTO_DE_MUESTREO||"-", p.Fuente||"-",
        parseAs(p.NO3_mg_l).toFixed(1),
        '<span class="supera">⛔ Supera CAA</span>'
      ])).join("")}
    </tbody>
  </table>
  <h3>Riesgo alto de NO3 por tipo de fuente</h3>
  <table>
    <thead>${tr(["Tipo de fuente","Puntos que superan CAA","% del total que supera"],true)}</thead>
    <tbody>
      ${[["Subterránea","SUBTERRANEA"],["Superficial","SUPERFICIAL"],["Mezcla","MEZCLA"]].map(([label,key])=>{
        const n=base.filter(p=>parseAs(p.NO3_mg_l)>45&&p.Fuente===key).length;
        return tr([label, `${n} puntos`, puntosAltosNo3.length>0?((n/puntosAltosNo3.length)*100).toFixed(1)+"%":"0%"]);
      }).join("")}
    </tbody>
  </table>`:""}

  ${puntosAltosTDS.length>0?`
  <h2>PUNTOS CRÍTICOS — SÓLIDOS DISUELTOS TOTALES (TDS)</h2>
  <h3>Puntos que superan el límite CAA (&gt; 1500 mg/L)</h3>
  <table>
    <thead>${tr(["Localidad","Departamento","Punto de muestreo","Fuente","TDS (mg/L)","Estado"],true)}</thead>
    <tbody>
      ${puntosAltosTDS.map(p=>tr([
        p.Localidad||"-", p.Departamento||"-", p.PUNTO_DE_MUESTREO||"-", p.Fuente||"-",
        parseFloat(String(p.TDS_mg_l||"0").replace(",",".")).toFixed(0),
        '<span class="supera">⛔ Supera CAA</span>'
      ])).join("")}
    </tbody>
  </table>
  <h3>TDS sobre límite CAA por tipo de fuente</h3>
  <table>
    <thead>${tr(["Tipo de fuente","Puntos que superan CAA","% del total que supera"],true)}</thead>
    <tbody>
      ${[["Subterránea","SUBTERRANEA"],["Superficial","SUPERFICIAL"],["Mezcla","MEZCLA"]].map(([label,key])=>{
        const n=base.filter(p=>parseFloat(String(p.TDS_mg_l||"0").replace(",","."))>1500&&p.Fuente===key).length;
        return tr([label, `${n} puntos`, puntosAltosTDS.length>0?((n/puntosAltosTDS.length)*100).toFixed(1)+"%":"0%"]);
      }).join("")}
    </tbody>
  </table>`:""}

  <!-- RIESGO FLÚOR — límite según temperatura media anual del departamento (CAA Art. 982) -->
  <h2>DISTRIBUCIÓN DE RIESGO — FLÚOR (límite ${fluorInfo.limInf}–${fluorInfo.limSup} mg/L según T° media: ${tempAnual}°C)</h2>
  <div class="bar-row">
    <div class="bar-label">Bajo (&lt; ${fluorInfo.limInf} mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#38bdf8;width:${pctFluor(fluorBajoCnt)}%"></div></div>
    <div class="bar-val" style="color:#38bdf8">${fluorBajoCnt} (${pctFluor(fluorBajoCnt)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Normal (${fluorInfo.limInf}–${fluorInfo.limSup} mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#22c55e;width:${pctFluor(fluorNormalCnt)}%"></div></div>
    <div class="bar-val" style="color:#22c55e">${fluorNormalCnt} (${pctFluor(fluorNormalCnt)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Alto (&gt; ${fluorInfo.limSup} mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#ef4444;width:${pctFluor(fluorAltoCnt)}%"></div></div>
    <div class="bar-val" style="color:#ef4444">${fluorAltoCnt} (${pctFluor(fluorAltoCnt)}%)</div>
  </div>

  ${puntosAltosFluor.length>0?`
  <h3>Puntos críticos — Flúor superior al límite CAA (&gt; ${fluorInfo.limSup} mg/L)</h3>
  <table>
    <thead>${tr(["Localidad","Departamento","Punto de muestreo","Fuente","Flúor (mg/L)","Estado"],true)}</thead>
    <tbody>
      ${puntosAltosFluor.map(p=>tr([
        p.Localidad||"-", p.Departamento||"-", p.PUNTO_DE_MUESTREO||"-", p.Fuente||"-",
        parseAs(p.Fluor_mg_l).toFixed(2),
        '<span class="supera">⛔ Supera CAA</span>'
      ])).join("")}
    </tbody>
  </table>
  <h3>Riesgo alto de Flúor por tipo de fuente</h3>
  <table>
    <thead>${tr(["Tipo de fuente","Puntos que superan CAA","% del total que supera"],true)}</thead>
    <tbody>
      ${[["Subterránea","SUBTERRANEA"],["Superficial","SUPERFICIAL"],["Mezcla","MEZCLA"]].map(([label,key])=>{
        const n=base.filter(p=>parseAs(p.Fluor_mg_l)>fluorInfo.limSup&&p.Fuente===key).length;
        return tr([label, `${n} puntos`, fluorAltoCnt>0?((n/fluorAltoCnt)*100).toFixed(1)+"%":"0%"]);
      }).join("")}
    </tbody>
  </table>`:""}

  ${histData.length>0?`
  <h2>EVOLUCIÓN HISTÓRICA DEL ARSÉNICO</h2>
  <table>
    <thead>${tr(["Año","As promedio (mg/L)"],true)}</thead>
    <tbody>${histData.map(h=>tr([h.yr, h.avg+" mg/L"])).join("")}</tbody>
  </table>`:""}

  <!-- OBSERVACIONES -->
  <h2>OBSERVACIONES AUTOMÁTICAS</h2>
  <ul style="padding-left:16px;line-height:1.8">
    <li>Se observan valores de arsénico superiores al valor guía en algunos sectores.</li>
    <li>Los nitratos permanecen dentro de rangos aceptables.</li>
    <li>La calidad fisicoquímica presenta estabilidad respecto de campañas anteriores.</li>
    <li>No se detectan cambios bruscos en los parámetros monitoreados.</li>
  </ul>

  <!-- CONCLUSIÓN -->
  <h2>CONCLUSIÓN TÉCNICA</h2>
  <p style="line-height:1.7;color:#334155">${conclusion}</p>

  <!-- CAA -->
  <div class="caa-box">
    <h2>LÍMITES DE REFERENCIA — CÓDIGO ALIMENTARIO ARGENTINO (CAA)</h2>
    <table>
      <thead>${tr(["Parámetro","Límite CAA","Unidad","Promedio medido","Estado"],true)}</thead>
      <tbody>
        ${tr(["Arsénico (As)", "0.010", "mg/L", avgAs.toFixed(3), `<span class="${avgAs>0.01?"supera":"ok"}">${avgAs>0.01?"⛔ Supera":"✅ Normal"}</span>`])}
        ${tr([`Flúor (${fluorInfo.rango})`, `${fluorInfo.limInf}–${fluorInfo.limSup}`, "mg/L", avgFluor.toFixed(2), `<span class="${avgFluor>fluorInfo.limSup?"supera":avgFluor<fluorInfo.limInf?"limite":"ok"}">${avgFluor>fluorInfo.limSup?"⛔ Supera límite sup.":avgFluor<fluorInfo.limInf?"⚠️ Bajo límite inf.":"✅ Normal"}</span>`])}
        ${tr(["Nitratos (NO3⁻)", "45.0", "mg/L", avgNO3.toFixed(1), `<span class="${avgNO3>45?"supera":"ok"}">${avgNO3>45?"⛔ Supera":"✅ Normal"}</span>`])}
        ${tr(["TDS", "1500", "mg/L", avgTDS.toFixed(0), `<span class="${avgTDS>1500?"supera":"ok"}">${avgTDS>1500?"⛔ Supera":"✅ Normal"}</span>`])}
      </tbody>
    </table>
    <p class="nota">
      Nota: El límite de Flúor del CAA (Art. 982) varía según la temperatura media anual del agua.
      Temperatura media anual de referencia (${dptoKey||"Catamarca"}): ${tempAnual}°C — Rango CAA: ${fluorInfo.rango} → Límite inferior: ${fluorInfo.limInf} mg/L · Límite superior: ${fluorInfo.limSup} mg/L.<br>
      Fuente: Código Alimentario Argentino — Arts. 982 y 983. OMS: Guías para la calidad del agua potable, 4ª ed.
    </p>
  </div>

  <div class="footer">
    Sistema WATERGIS — Plataforma Hidroquímica · Provincia de Catamarca · WGS 84 / EPSG:4326<br>
    Generado: ${fecha} · Usuario: Nicolás Doria · watergis-production.up.railway.app
  </div>
</div>
<script>window.onload=()=>{ window.print(); }</script>
</body></html>`;

    const ventana = window.open("","_blank","width=900,height=700");
    if(ventana){
      ventana.document.write(html);
      ventana.document.close();
    }
    setPdfLoading(false);
  };

  // ======================================================
  // GENERAR PDF — DIQUES Y RED (mismo formato visual)
  // ======================================================

  const generarPDFEspecial = (tipo: "DIQUE"|"RED"|"EFLUENTE") => {
    setPdfLoading(true);

    // Diques, Red y Efluentes usan los filtros de Departamento / Localidad ya elegidos en el panel lateral
    const fDept = selectedFiltDept;
    const fLoc  = search || "TODAS";

    const base: Punto[] = points.filter(p => {
      const lat = parseFloat(p.Latitud?.toString().replace(",","."));
      const lng = parseFloat(p.Longitud?.toString().replace(",","."));
      if(isNaN(lat)||isNaN(lng)) return false;
      if((p.Tipo_Punto||"").toUpperCase()!==tipo) return false;
      const dOk = fDept==="TODOS" || p.Departamento===fDept;
      const lOk = fLoc==="TODAS"  || p.Localidad===fLoc;
      const diqueOk = tipo!=="DIQUE" || diqueSeleccionado==="TODOS" || p.PUNTO_DE_MUESTREO===diqueSeleccionado;
      const redOk   = tipo!=="RED"   || redPuntoSeleccionado==="TODOS" || p.PUNTO_DE_MUESTREO===redPuntoSeleccionado;
      const efluOk  = tipo!=="EFLUENTE" || efluenteSeleccionado==="TODOS" || p.PUNTO_DE_MUESTREO===efluenteSeleccionado;
      return dOk && lOk && diqueOk && redOk && efluOk;
    });

    const fecha = new Date().toLocaleDateString("es-AR");
    const soloDeptoR     = fDept!=="TODOS" && fLoc==="TODAS";
    const soloLocR       = fLoc!=="TODAS";
    const soloUnDique    = tipo==="DIQUE" && diqueSeleccionado!=="TODOS";
    const soloUnPuntoRed = tipo==="RED"   && redPuntoSeleccionado!=="TODOS";
    const soloUnEfluente = tipo==="EFLUENTE" && efluenteSeleccionado!=="TODOS";

    const titulo2 = tipo==="DIQUE"
      ? (soloUnDique ? `${diqueSeleccionado.toUpperCase()} · ${base[0]?.Departamento?.toUpperCase()||""}` : `PROVINCIA DE CATAMARCA — TODOS LOS DIQUES`)
      : tipo==="RED"
      ? (soloUnPuntoRed
        ? `${redPuntoSeleccionado.toUpperCase()} · ${base[0]?.Localidad?.toUpperCase()||""}`
        : soloLocR
        ? `${fLoc.toUpperCase()} · ${(fDept!=="TODOS"?fDept:base[0]?.Departamento||"").toUpperCase()}`
        : soloDeptoR ? `DEPARTAMENTO ${fDept.toUpperCase()}`
        : `PROVINCIA DE CATAMARCA — TODOS LOS PUNTOS DE RED`)
      : (soloUnEfluente ? `${efluenteSeleccionado.toUpperCase()} · ${base[0]?.Departamento?.toUpperCase()||""}` : `PROVINCIA DE CATAMARCA — TODOS LOS EFLUENTES`);

    const nombreBase2 = tipo==="DIQUE"
      ? (soloUnDique ? diqueSeleccionado : "Todos_los_diques")
      : tipo==="RED"
      ? (soloUnPuntoRed ? redPuntoSeleccionado : soloLocR ? fLoc : soloDeptoR ? `Departamento_${fDept}` : "General")
      : (soloUnEfluente ? efluenteSeleccionado : "Todos_los_efluentes");

    const num = (v:string|undefined) => parseFloat(String(v||"0").replace(",","."));
    const avg = (arr:Punto[], f:(p:Punto)=>number) => arr.length>0 ? arr.reduce((a,p)=>a+f(p),0)/arr.length : 0;

    const tr = (cells: string[], header=false) =>
      `<tr>${cells.map(c=>`<${header?"th":"td"}>${c}</${header?"th":"td"}>`).join("")}</tr>`;

    // ── CSS compartido — idéntico al informe de pozos ──
    const sharedStyle = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; background: white; }
  .page { padding: 18mm 16mm; }
  h1 { font-size: 22px; color: #0e7490; margin-bottom: 2px; }
  h2 { font-size: 13px; color: #0e7490; border-left: 4px solid #06b6d4; padding-left: 8px; margin: 16px 0 8px; }
  h3 { font-size: 11px; color: #475569; margin: 12px 0 6px; }
  .subtitle { font-size: 12px; color: #334155; margin-bottom: 2px; }
  .meta { font-size: 10px; color: #64748b; margin-bottom: 14px; }
  .header-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10.5px; }
  th { background: #0e7490; color: white; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .estado-alerta { color: #dc2626; font-weight: bold; }
  .estado-precaucion { color: #d97706; font-weight: bold; }
  .estado-normal { color: #16a34a; font-weight: bold; }
  .bar-row { display: flex; align-items: center; gap: 10px; margin: 4px 0; }
  .bar-label { width: 180px; flex-shrink: 0; font-size: 10px; }
  .bar-wrap { flex: 1; background: #e2e8f0; border-radius: 4px; height: 12px; }
  .bar-fill { height: 12px; border-radius: 4px; }
  .bar-val { width: 90px; text-align: right; font-size: 10px; font-weight: bold; }
  .caa-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-top: 16px; }
  .caa-box h2 { color: #15803d; border-left-color: #22c55e; }
  .nota { font-size: 9px; color: #64748b; font-style: italic; margin-top: 8px; line-height: 1.5; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
  .supera { color: #dc2626; font-weight: bold; }
  .limite { color: #d97706; font-weight: bold; }
  .ok { color: #16a34a; font-weight: bold; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 15mm; size: A4; } }`;

    let html = "";

    if(tipo==="DIQUE"){
      const avgOD    = avg(base, p=>num(p.OD_mg_l));
      const avgSat   = avg(base, p=>num(p.Sat_O2_pct));
      const avgCloro = avg(base, p=>num(p.Clorofila_ug_l));
      const avgBGA   = avg(base, p=>num(p.Algas_BGA));
      const avgAs    = avg(base, p=>num(p.As_mg_l));
      const avgFluor = avg(base, p=>num(p.Fluor_mg_l));
      const avgTDS   = avg(base, p=>num(p.TDS_mg_l));
      const avgPh    = avg(base, p=>num(p.Ph));

      const odCritico = base.filter(p=>num(p.OD_mg_l)<2).length;
      const odBajo    = base.filter(p=>{const v=num(p.OD_mg_l);return v>=2&&v<5;}).length;
      const odNormal  = base.filter(p=>num(p.OD_mg_l)>=5).length;

      const satBajo   = base.filter(p=>num(p.Sat_O2_pct)<80).length;
      const satNormal = base.filter(p=>{const v=num(p.Sat_O2_pct);return v>=80&&v<=120;}).length;
      const satAlto   = base.filter(p=>num(p.Sat_O2_pct)>120).length;

      const cloroOligo  = base.filter(p=>num(p.Clorofila_ug_l)<3).length;
      const cloroMeso   = base.filter(p=>{const v=num(p.Clorofila_ug_l);return v>=3&&v<10;}).length;
      const cloroEutro  = base.filter(p=>{const v=num(p.Clorofila_ug_l);return v>=10&&v<50;}).length;
      const cloroAlerta = base.filter(p=>num(p.Clorofila_ug_l)>=50).length;

      const bgaBajo      = base.filter(p=>num(p.Algas_BGA)<5000).length;
      const bgaModerado  = base.filter(p=>{const v=num(p.Algas_BGA);return v>=5000&&v<10000;}).length;
      const bgaAlto      = base.filter(p=>num(p.Algas_BGA)>=10000).length;

      const pct = (n:number) => base.length>0?((n/base.length)*100).toFixed(1):"0";

      const estG     = avgOD<2?"ALERTA":avgOD<5||avgCloro>=10?"PRECAUCIÓN":"NORMAL";
      const estClase = avgOD<2?"alerta":avgOD<5||avgCloro>=10?"precaucion":"normal";

      const puntosCriticos = base.filter(p=>
          num(p.OD_mg_l)<2 ||
          num(p.Sat_O2_pct)<80 || num(p.Sat_O2_pct)>120 ||
          num(p.Clorofila_ug_l)>=50 ||
          num(p.Algas_BGA)>=10000)
        .sort((a,b)=>num(a.OD_mg_l)-num(b.OD_mg_l));

      const diquesUnicos = [...new Set(base.map(p=>p.PUNTO_DE_MUESTREO))];

      html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe Diques — ${nombreBase2}</title>
<style>${sharedStyle}</style></head>
<body>
<div class="page">

  <div class="header-box">
    <div class="header-top">
      <div>
        <h1>💧 WATERGIS</h1>
        <div class="subtitle">INFORME DE DIQUES — MONITOREO DE CALIDAD DE AGUA</div>
        <div class="subtitle"><strong>${titulo2}</strong></div>
      </div>
      <div style="text-align:right;font-size:10px;color:#64748b">
        <div>Usuario: Nicolás Doria</div>
        <div>Fecha: ${fecha}</div>
        <div>Diques analizados: ${diquesUnicos.length} (${base.length} campañas)</div>
      </div>
    </div>
  </div>

  <table>
    <tbody>
      ${tr(["Campañas realizadas", String(base.length)])}
      ${tr(["Diques monitoreados", diquesUnicos.join(", ")||"-"])}
      ${tr(["Estado general", `<span class="estado-${estClase}">${estG==="ALERTA"?"⛔ "+estG:estG==="PRECAUCIÓN"?"⚠️ "+estG:"✅ "+estG}</span>`])}
    </tbody>
  </table>

  <h2>INDICADORES PRINCIPALES</h2>
  <table>
    <thead>${tr(["Parámetro","Promedio","Rango óptimo","Estado"],true)}</thead>
    <tbody>
      ${tr(["Oxígeno Disuelto (OD)", avgOD.toFixed(1)+" mg/L", "≥ 5–6 mg/L", `<span class="${avgOD<2?"supera":avgOD<5?"limite":"ok"}">${avgOD<2?"⛔ Hipoxia":avgOD<5?"⚠️ Bajo":"✅ Saludable"}</span>`])}
      ${tr(["Saturación de O₂", avgSat.toFixed(0)+"%", "80% – 120%", `<span class="${avgSat<80||avgSat>120?"limite":"ok"}">${avgSat<80?"⚠️ Bajo":avgSat>120?"⚠️ Sobresaturado":"✅ Excelente"}</span>`])}
      ${tr(["Clorofila-a", avgCloro.toFixed(1)+" µg/L", "&lt; 10 µg/L", `<span class="${avgCloro>=50?"supera":avgCloro>=10?"limite":"ok"}">${avgCloro>=50?"⛔ Floración":avgCloro>=10?"⚠️ Eutrófico":"✅ Normal"}</span>`])}
      ${tr(["Algas BGA", avgBGA.toFixed(0)+" cel/mL", "&lt; 10.000 cel/mL", `<span class="${avgBGA>=10000?"supera":"ok"}">${avgBGA>=10000?"⛔ Riesgo":"✅ Bajo riesgo"}</span>`])}
      ${tr(["Arsénico (As)", avgAs.toFixed(3)+" mg/L", "0.010 mg/L (CAA)", `<span class="${avgAs>0.01?"supera":avgAs>0.008?"limite":"ok"}">${avgAs>0.01?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["Flúor", avgFluor.toFixed(2)+" mg/L", "0.7 – 1.2 mg/L*", `<span class="${avgFluor>1.2?"supera":avgFluor<0.7?"limite":"ok"}">${avgFluor>1.2?"⛔ Supera":avgFluor<0.7?"⚠️ Bajo límite":"✅ Normal"}</span>`])}
      ${tr(["TDS", avgTDS.toFixed(0)+" mg/L", "1500 mg/L (CAA)", `<span class="${avgTDS>1500?"supera":avgTDS>1200?"limite":"ok"}">${avgTDS>1500?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["pH", avgPh.toFixed(1), "6.5 – 8.5", `<span class="${avgPh<6.5||avgPh>8.5?"supera":"ok"}">${avgPh<6.5||avgPh>8.5?"⚠️ Fuera de rango":"✅ Normal"}</span>`])}
    </tbody>
  </table>

  <h2>DISTRIBUCIÓN — OXÍGENO DISUELTO (OD)</h2>
  <div class="bar-row">
    <div class="bar-label">Hipóxico (&lt; 2 mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#ef4444;width:${pct(odCritico)}%"></div></div>
    <div class="bar-val" style="color:#ef4444">${odCritico} (${pct(odCritico)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Bajo (2–5 mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#f59e0b;width:${pct(odBajo)}%"></div></div>
    <div class="bar-val" style="color:#f59e0b">${odBajo} (${pct(odBajo)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Saludable (≥ 5 mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#22c55e;width:${pct(odNormal)}%"></div></div>
    <div class="bar-val" style="color:#22c55e">${odNormal} (${pct(odNormal)}%)</div>
  </div>

  <h2>DISTRIBUCIÓN — SATURACIÓN DE OXÍGENO (O₂)</h2>
  <div class="bar-row">
    <div class="bar-label">Bajo (&lt; 80%)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#ef4444;width:${pct(satBajo)}%"></div></div>
    <div class="bar-val" style="color:#ef4444">${satBajo} (${pct(satBajo)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Normal (80–120%)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#22c55e;width:${pct(satNormal)}%"></div></div>
    <div class="bar-val" style="color:#22c55e">${satNormal} (${pct(satNormal)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Sobresaturado (&gt; 120%)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#f59e0b;width:${pct(satAlto)}%"></div></div>
    <div class="bar-val" style="color:#f59e0b">${satAlto} (${pct(satAlto)}%)</div>
  </div>

  <h2>ESTADO TRÓFICO — CLOROFILA-A</h2>
  <div class="bar-row">
    <div class="bar-label">Oligotrófico (&lt; 3 µg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#22c55e;width:${pct(cloroOligo)}%"></div></div>
    <div class="bar-val" style="color:#22c55e">${cloroOligo} (${pct(cloroOligo)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Mesotrófico (3–10 µg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#84cc16;width:${pct(cloroMeso)}%"></div></div>
    <div class="bar-val" style="color:#84cc16">${cloroMeso} (${pct(cloroMeso)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Eutrófico (10–50 µg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#f59e0b;width:${pct(cloroEutro)}%"></div></div>
    <div class="bar-val" style="color:#f59e0b">${cloroEutro} (${pct(cloroEutro)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Floración (&gt; 50 µg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#ef4444;width:${pct(cloroAlerta)}%"></div></div>
    <div class="bar-val" style="color:#ef4444">${cloroAlerta} (${pct(cloroAlerta)}%)</div>
  </div>

  <h2>DISTRIBUCIÓN DE RIESGO — ALGAS BGA (Cianobacterias)</h2>
  <div class="bar-row">
    <div class="bar-label">Bajo (&lt; 5.000 cel/mL)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#22c55e;width:${pct(bgaBajo)}%"></div></div>
    <div class="bar-val" style="color:#22c55e">${bgaBajo} (${pct(bgaBajo)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Moderado (5.000–10.000 cel/mL)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#f59e0b;width:${pct(bgaModerado)}%"></div></div>
    <div class="bar-val" style="color:#f59e0b">${bgaModerado} (${pct(bgaModerado)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Alto — riesgo de toxinas (&gt; 10.000 cel/mL)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#ef4444;width:${pct(bgaAlto)}%"></div></div>
    <div class="bar-val" style="color:#ef4444">${bgaAlto} (${pct(bgaAlto)}%)</div>
  </div>

  ${puntosCriticos.length>0?`
  <h3>Puntos críticos — Diques en alerta sanitaria</h3>
  <table>
    <thead>${tr(["Dique","Departamento","OD (mg/L)","Sat. O₂ (%)","Clorofila (µg/L)","Algas BGA (cel/mL)","Estado"],true)}</thead>
    <tbody>
      ${puntosCriticos.map(p=>tr([
        p.PUNTO_DE_MUESTREO||"-", p.Departamento||"-",
        num(p.OD_mg_l).toFixed(1), num(p.Sat_O2_pct).toFixed(0), num(p.Clorofila_ug_l).toFixed(1), num(p.Algas_BGA).toFixed(0),
        '<span class="supera">⛔ ALERTA</span>'
      ])).join("")}
    </tbody>
  </table>`:""}

  <h2>OBSERVACIONES AUTOMÁTICAS</h2>
  <ul style="padding-left:16px;line-height:1.8">
    <li>El Oxígeno Disuelto es fundamental para la respiración de los organismos acuáticos; valores menores a 2 mg/L generan hipoxia y mortalidad de peces.</li>
    <li>La Clorofila-a indica el estado trófico del cuerpo de agua; valores superiores a 50 µg/L sugieren floración algal activa.</li>
    <li>Las cianobacterias (BGA) en niveles altos (&gt; 10.000 cel/mL) pueden generar toxinas y fluctuaciones extremas de oxígeno disuelto.</li>
    <li>Se recomienda monitoreo continuo en los diques que presenten alertas, especialmente en época estival.</li>
  </ul>

  <div class="caa-box">
    <h2>LÍMITES DE REFERENCIA — CALIDAD DE AGUA EN RESERVAS</h2>
    <table>
      <thead>${tr(["Parámetro","Límite / Rango","Significado"],true)}</thead>
      <tbody>
        ${tr(["OD mínimo saludable", "≥ 5–6 mg/L", "Por debajo genera estrés y mortalidad en especies sensibles"])}
        ${tr(["OD crítico (Hipoxia)", "&lt; 2 mg/L", "Provoca muerte de peces y libera nutrientes tóxicos del sedimento"])}
        ${tr(["Saturación O₂ excelente", "80% – 120%", "Rango óptimo para vida acuática"])}
        ${tr(["Clorofila-a Oligotrófico", "&lt; 2–3 µg/L", "Agua clara y sana"])}
        ${tr(["Clorofila-a Eutrófico", "10 – 50 µg/L", "Exceso de nutrientes"])}
        ${tr(["Clorofila-a Alerta/Floración", "&gt; 50 µg/L", "Floración algal activa"])}
        ${tr(["BGA niveles bajos", "&lt; 10.000 cel/mL", "Baja probabilidad de toxicidad"])}
        ${tr(["Arsénico (As) — CAA", "0.010 mg/L", "Límite máximo Código Alimentario Argentino"])}
        ${tr(["TDS — CAA", "1500 mg/L", "Límite máximo Código Alimentario Argentino"])}
      </tbody>
    </table>
    <p class="nota">Fuentes: LG Sonic — Calidad del agua en lagos. AquaBook — Subsecretaría de Recursos Hídricos. DataStream — Dissolved Oxygen Guidebook. Código Alimentario Argentino, Arts. 982–983.</p>
  </div>

  <div class="footer">
    Sistema WATERGIS — Provincia de Catamarca · WGS 84 / EPSG:4326<br>
    Generado: ${fecha} · Usuario: Nicolás Doria · watergis-production.up.railway.app
  </div>
</div>
<script>window.onload=()=>{ window.print(); }</script>
</body></html>`;

    } else if(tipo==="RED") {
      const avgCloro = avg(base, p=>num(p.Cloro_libre_mg_l));
      const avgTurb  = avg(base, p=>num(p.Turb_NTU));
      const avgTDS   = avg(base, p=>num(p.TDS_mg_l));
      const avgAs    = avg(base, p=>num(p.As_mg_l));
      const avgFluor = avg(base, p=>num(p.Fluor_mg_l));
      const avgNO3   = avg(base, p=>num(p.NO3_mg_l));
      const avgPh    = avg(base, p=>num(p.Ph));

      const turbOk   = base.filter(p=>num(p.Turb_NTU)<=3).length;
      const turbAlta = base.filter(p=>num(p.Turb_NTU)>3).length;

      const cloroBajo = base.filter(p=>num(p.Cloro_libre_mg_l)<0.20).length;
      const cloroOk   = base.filter(p=>{const v=num(p.Cloro_libre_mg_l);return v>=0.20&&v<=2.00;}).length;
      const cloroAlto = base.filter(p=>num(p.Cloro_libre_mg_l)>2.00).length;

      const pct = (n:number) => base.length>0?((n/base.length)*100).toFixed(1):"0";

      const estG     = avgTurb>3||avgAs>0.01||avgTDS>1500?"PRECAUCIÓN":"NORMAL";
      const estClase = estG==="PRECAUCIÓN"?"precaucion":"normal";

      const puntosCriticos = base.filter(p=>num(p.Turb_NTU)>3||num(p.Cloro_libre_mg_l)<0.20||num(p.Cloro_libre_mg_l)>2.00)
        .sort((a,b)=>num(b.Turb_NTU)-num(a.Turb_NTU));

      const localidadesUnicas = [...new Set(base.map(p=>p.Localidad))];

      html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe Red — ${nombreBase2}</title>
<style>${sharedStyle}</style></head>
<body>
<div class="page">

  <div class="header-box">
    <div class="header-top">
      <div>
        <h1>💧 WATERGIS</h1>
        <div class="subtitle">INFORME DE RED DE DISTRIBUCIÓN</div>
        <div class="subtitle"><strong>${titulo2}</strong></div>
      </div>
      <div style="text-align:right;font-size:10px;color:#64748b">
        <div>Usuario: Nicolás Doria</div>
        <div>Fecha: ${fecha}</div>
        <div>Localidades: ${localidadesUnicas.length} (${base.length} campañas)</div>
      </div>
    </div>
  </div>

  <table>
    <tbody>
      ${tr(["Campañas realizadas", String(base.length)])}
      ${tr(["Localidades monitoreadas", localidadesUnicas.join(", ")||"-"])}
      ${tr(["Estado general", `<span class="estado-${estClase}">${estG==="PRECAUCIÓN"?"⚠️ "+estG:"✅ "+estG}</span>`])}
    </tbody>
  </table>

  <h2>INDICADORES PRINCIPALES</h2>
  <table>
    <thead>${tr(["Parámetro","Promedio","Límite inferior","Límite superior","Estado"],true)}</thead>
    <tbody>
      ${tr(["Turbidez", avgTurb.toFixed(1)+" NTU", "—", "3.0 NTU", `<span class="${avgTurb>3?"supera":"ok"}">${avgTurb>3?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["Cloro libre residual", avgCloro.toFixed(2)+" mg/L", "0.20 mg/L", "2.00 mg/L", `<span class="${avgCloro<0.2?"limite":avgCloro>2?"supera":"ok"}">${avgCloro<0.2?"⚠️ Bajo":avgCloro>2?"⛔ Alto":"✅ Normal"}</span>`])}
      ${tr(["TDS", avgTDS.toFixed(0)+" mg/L", "—", "1500 mg/L", `<span class="${avgTDS>1500?"supera":avgTDS>1200?"limite":"ok"}">${avgTDS>1500?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["Arsénico (As)", avgAs.toFixed(3)+" mg/L", "—", "0.010 mg/L", `<span class="${avgAs>0.01?"supera":avgAs>0.008?"limite":"ok"}">${avgAs>0.01?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["Flúor", avgFluor.toFixed(2)+" mg/L", "0.7 mg/L", "1.2 mg/L*", `<span class="${avgFluor>1.2?"supera":avgFluor<0.7?"limite":"ok"}">${avgFluor>1.2?"⛔ Supera":avgFluor<0.7?"⚠️ Bajo":"✅ Normal"}</span>`])}
      ${tr(["Nitratos (NO3)", avgNO3.toFixed(1)+" mg/L", "—", "45.0 mg/L", `<span class="${avgNO3>45?"supera":avgNO3>35?"limite":"ok"}">${avgNO3>45?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["pH", avgPh.toFixed(1), "6.5", "8.5", `<span class="${avgPh<6.5||avgPh>8.5?"supera":"ok"}">${avgPh<6.5||avgPh>8.5?"⚠️ Fuera de rango":"✅ Normal"}</span>`])}
    </tbody>
  </table>

  <h2>DISTRIBUCIÓN — TURBIDEZ</h2>
  <div class="bar-row">
    <div class="bar-label">Dentro de norma (≤ 3 NTU)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#22c55e;width:${pct(turbOk)}%"></div></div>
    <div class="bar-val" style="color:#22c55e">${turbOk} (${pct(turbOk)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Fuera de norma (&gt; 3 NTU)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#ef4444;width:${pct(turbAlta)}%"></div></div>
    <div class="bar-val" style="color:#ef4444">${turbAlta} (${pct(turbAlta)}%)</div>
  </div>

  <h2>DISTRIBUCIÓN — CLORO LIBRE RESIDUAL</h2>
  <div class="bar-row">
    <div class="bar-label">Bajo (&lt; 0.20 mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#f59e0b;width:${pct(cloroBajo)}%"></div></div>
    <div class="bar-val" style="color:#f59e0b">${cloroBajo} (${pct(cloroBajo)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Normal (0.20–2.00 mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#22c55e;width:${pct(cloroOk)}%"></div></div>
    <div class="bar-val" style="color:#22c55e">${cloroOk} (${pct(cloroOk)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Alto (&gt; 2.00 mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#ef4444;width:${pct(cloroAlto)}%"></div></div>
    <div class="bar-val" style="color:#ef4444">${cloroAlto} (${pct(cloroAlto)}%)</div>
  </div>

  ${puntosCriticos.length>0?`
  <h3>Puntos críticos — Red fuera de norma</h3>
  <table>
    <thead>${tr(["Localidad","Departamento","Punto de muestreo","Turbidez (NTU)","Cloro libre (mg/L)","Estado"],true)}</thead>
    <tbody>
      ${puntosCriticos.map(p=>tr([
        p.Localidad||"-", p.Departamento||"-", p.PUNTO_DE_MUESTREO||"-",
        num(p.Turb_NTU).toFixed(1), num(p.Cloro_libre_mg_l).toFixed(2),
        '<span class="supera">⛔ Fuera de norma</span>'
      ])).join("")}
    </tbody>
  </table>`:""}

  <h2>OBSERVACIONES AUTOMÁTICAS</h2>
  <ul style="padding-left:16px;line-height:1.8">
    <li>La turbidez elevada puede indicar presencia de sedimentos, materia orgánica o falla en el proceso de filtración.</li>
    <li>El cloro libre residual es indicador de desinfección efectiva; valores bajos implican riesgo de recontaminación bacteriológica.</li>
    <li>Niveles de cloro superiores a 2.00 mg/L pueden generar sabor y olor desagradables sin riesgo sanitario directo.</li>
    <li>Se recomienda monitoreo diario en los puntos de red que presenten desvíos respecto a los valores normativos.</li>
  </ul>

  <div class="caa-box">
    <h2>LÍMITES DE REFERENCIA — RED DE DISTRIBUCIÓN</h2>
    <table>
      <thead>${tr(["Parámetro","Límite / Rango","Norma de referencia"],true)}</thead>
      <tbody>
        ${tr(["Turbidez", "&lt; 3 NTU", "Norma de potabilidad"])}
        ${tr(["Cloro libre residual", "0.20 – 2.00 mg/L", "Norma de desinfección"])}
        ${tr(["Arsénico (As) — CAA", "0.010 mg/L", "Código Alimentario Argentino Art. 982"])}
        ${tr(["Flúor — CAA", "0.7 – 1.2 mg/L (según T° media)", "Código Alimentario Argentino Art. 982"])}
        ${tr(["TDS — CAA", "1500 mg/L", "Código Alimentario Argentino"])}
        ${tr(["Nitratos (NO3) — CAA", "45.0 mg/L", "Código Alimentario Argentino Art. 983"])}
      </tbody>
    </table>
    <p class="nota">Fuentes: Código Alimentario Argentino, Arts. 982–983. Normas de potabilidad y desinfección de agua de red.</p>
  </div>

  <div class="footer">
    Sistema WATERGIS — Provincia de Catamarca · WGS 84 / EPSG:4326<br>
    Generado: ${fecha} · Usuario: Nicolás Doria · watergis-production.up.railway.app
  </div>
</div>
<script>window.onload=()=>{ window.print(); }</script>
</body></html>`;
    } else {
      // EFLUENTES CLOACALES — límites según Tabla Consolidada de Límites Admisibles para
      // vuelco de efluentes cloacales tratados a cuerpo receptor o colectora.
      const LIM_DBO  = 50;    // mg/L
      const LIM_DQO  = 250;   // mg/L
      const LIM_GYA  = 50;    // Aceites y grasas (sust. solubles en éter etílico), mg/L
      const LIM_DET  = 2;     // Detergentes sintéticos, mg/L (Res. 65/05, Título A — colectora cloacal)
      const LIM_TEMP = 45;    // °C
      const PH_MIN   = 5.5;
      const PH_MAX   = 10.0;
      const LIM_TDS_EFL = 1500; // mg/L — referencia general (no está en la tabla cloacal específica)

      const avgDBO = avg(base, p=>num(p.DBO_mg_l));
      const avgDQO = avg(base, p=>num(p.DQO_mg_l));
      const avgGyA = avg(base, p=>num(p.Grasas_Aceites_mg_l));
      const avgDet = avg(base, p=>num(p.Detergentes_mg_l));
      const avgTDS = avg(base, p=>num(p.TDS_mg_l));
      const avgPh  = avg(base, p=>num(p.Ph));
      const avgTemp = avg(base, p=>num(p.T_ºC));

      const pct = (n:number) => base.length>0?((n/base.length)*100).toFixed(1):"0";

      const dboOk    = base.filter(p=>num(p.DBO_mg_l)<=LIM_DBO).length;
      const dboAlto  = base.filter(p=>num(p.DBO_mg_l)>LIM_DBO).length;

      const dqoOk    = base.filter(p=>num(p.DQO_mg_l)<=LIM_DQO).length;
      const dqoAlto  = base.filter(p=>num(p.DQO_mg_l)>LIM_DQO).length;

      const gyaOk    = base.filter(p=>num(p.Grasas_Aceites_mg_l)<=LIM_GYA).length;
      const gyaAlto  = base.filter(p=>num(p.Grasas_Aceites_mg_l)>LIM_GYA).length;

      const estG     = (avgDBO>LIM_DBO||avgDQO>LIM_DQO||avgGyA>LIM_GYA||avgDet>LIM_DET||avgPh<PH_MIN||avgPh>PH_MAX||avgTemp>LIM_TEMP) ? "FUERA DE NORMA" : "NORMAL";
      const estClase = estG==="FUERA DE NORMA" ? "alerta" : "normal";

      const puntosCriticos = base.filter(p=>
          num(p.DBO_mg_l)>LIM_DBO ||
          num(p.DQO_mg_l)>LIM_DQO ||
          num(p.Grasas_Aceites_mg_l)>LIM_GYA ||
          num(p.Detergentes_mg_l)>LIM_DET ||
          num(p.Ph)<PH_MIN || num(p.Ph)>PH_MAX ||
          num(p.T_ºC)>LIM_TEMP)
        .sort((a,b)=>num(b.DBO_mg_l)-num(a.DBO_mg_l));

      const efluentesUnicos = [...new Set(base.map(p=>p.PUNTO_DE_MUESTREO))];

      html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe Efluentes Cloacales — ${nombreBase2}</title>
<style>${sharedStyle}</style></head>
<body>
<div class="page">

  <div class="header-box">
    <div class="header-top">
      <div>
        <h1>🏭 WATERGIS</h1>
        <div class="subtitle">INFORME DE EFLUENTES CLOACALES — CONTROL DE VUELCOS</div>
        <div class="subtitle"><strong>${titulo2}</strong></div>
      </div>
      <div style="text-align:right;font-size:10px;color:#64748b">
        <div>Usuario: Nicolás Doria</div>
        <div>Fecha: ${fecha}</div>
        <div>Puntos de vuelco analizados: ${efluentesUnicos.length} (${base.length} campañas)</div>
      </div>
    </div>
  </div>

  <table>
    <tbody>
      ${tr(["Campañas realizadas", String(base.length)])}
      ${tr(["Puntos de vuelco monitoreados", efluentesUnicos.join(", ")||"-"])}
      ${tr(["Estado general", `<span class="estado-${estClase}">${estG==="FUERA DE NORMA"?"⛔ "+estG:"✅ "+estG}</span>`])}
    </tbody>
  </table>

  <h2>INDICADORES PRINCIPALES</h2>
  <table>
    <thead>${tr(["Parámetro","Promedio","Límite de vuelco (efluente cloacal)","Estado"],true)}</thead>
    <tbody>
      ${tr(["DBO5 (Demanda Bioquímica de Oxígeno)", avgDBO.toFixed(1)+" mg/L", `${LIM_DBO} mg/L`, `<span class="${avgDBO>LIM_DBO?"supera":"ok"}">${avgDBO>LIM_DBO?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["DQO (Demanda Química de Oxígeno)", avgDQO.toFixed(1)+" mg/L", `${LIM_DQO} mg/L`, `<span class="${avgDQO>LIM_DQO?"supera":"ok"}">${avgDQO>LIM_DQO?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["Aceites y Grasas", avgGyA.toFixed(2)+" mg/L", `${LIM_GYA} mg/L`, `<span class="${avgGyA>LIM_GYA?"supera":"ok"}">${avgGyA>LIM_GYA?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["Detergentes sintéticos", avgDet.toFixed(2)+" mg/L", `${LIM_DET} mg/L`, `<span class="${avgDet>LIM_DET?"supera":"ok"}">${avgDet>LIM_DET?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["TDS", avgTDS.toFixed(0)+" mg/L", `${LIM_TDS_EFL} mg/L*`, `<span class="${avgTDS>LIM_TDS_EFL?"supera":"ok"}">${avgTDS>LIM_TDS_EFL?"⛔ Supera":"✅ Normal"}</span>`])}
      ${tr(["pH", avgPh.toFixed(1), `${PH_MIN} – ${PH_MAX}`, `<span class="${avgPh<PH_MIN||avgPh>PH_MAX?"supera":"ok"}">${avgPh<PH_MIN||avgPh>PH_MAX?"⚠️ Fuera de rango":"✅ Normal"}</span>`])}
      ${tr(["Temperatura", avgTemp.toFixed(1)+" °C", `≤ ${LIM_TEMP} °C`, `<span class="${avgTemp>LIM_TEMP?"supera":"ok"}">${avgTemp>LIM_TEMP?"⛔ Supera":"✅ Normal"}</span>`])}
    </tbody>
  </table>

  <h2>DISTRIBUCIÓN — DBO5</h2>
  <div class="bar-row">
    <div class="bar-label">Dentro de norma (≤ ${LIM_DBO} mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#22c55e;width:${pct(dboOk)}%"></div></div>
    <div class="bar-val" style="color:#22c55e">${dboOk} (${pct(dboOk)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Fuera de norma (&gt; ${LIM_DBO} mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#ef4444;width:${pct(dboAlto)}%"></div></div>
    <div class="bar-val" style="color:#ef4444">${dboAlto} (${pct(dboAlto)}%)</div>
  </div>

  <h2>DISTRIBUCIÓN — DQO</h2>
  <div class="bar-row">
    <div class="bar-label">Dentro de norma (≤ ${LIM_DQO} mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#22c55e;width:${pct(dqoOk)}%"></div></div>
    <div class="bar-val" style="color:#22c55e">${dqoOk} (${pct(dqoOk)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Fuera de norma (&gt; ${LIM_DQO} mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#ef4444;width:${pct(dqoAlto)}%"></div></div>
    <div class="bar-val" style="color:#ef4444">${dqoAlto} (${pct(dqoAlto)}%)</div>
  </div>

  <h2>DISTRIBUCIÓN — ACEITES Y GRASAS</h2>
  <div class="bar-row">
    <div class="bar-label">Dentro de norma (≤ ${LIM_GYA} mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#22c55e;width:${pct(gyaOk)}%"></div></div>
    <div class="bar-val" style="color:#22c55e">${gyaOk} (${pct(gyaOk)}%)</div>
  </div>
  <div class="bar-row">
    <div class="bar-label">Fuera de norma (&gt; ${LIM_GYA} mg/L)</div>
    <div class="bar-wrap"><div class="bar-fill" style="background:#ef4444;width:${pct(gyaAlto)}%"></div></div>
    <div class="bar-val" style="color:#ef4444">${gyaAlto} (${pct(gyaAlto)}%)</div>
  </div>

  ${puntosCriticos.length>0?`
  <h3>Puntos críticos — Efluentes fuera de norma</h3>
  <table>
    <thead>${tr(["Punto de vuelco","Departamento","DBO5 (mg/L)","DQO (mg/L)","Grasas y Aceites (mg/L)","Detergentes (mg/L)","Estado"],true)}</thead>
    <tbody>
      ${puntosCriticos.map(p=>tr([
        p.PUNTO_DE_MUESTREO||"-", p.Departamento||"-",
        num(p.DBO_mg_l).toFixed(1), num(p.DQO_mg_l).toFixed(1), num(p.Grasas_Aceites_mg_l).toFixed(2), num(p.Detergentes_mg_l).toFixed(2),
        '<span class="supera">⛔ Fuera de norma</span>'
      ])).join("")}
    </tbody>
  </table>`:""}

  <h2>OBSERVACIONES AUTOMÁTICAS</h2>
  <ul style="padding-left:16px;line-height:1.8">
    <li>La DBO5 y la DQO indican la carga de materia orgánica del efluente; valores elevados consumen el oxígeno disuelto del cuerpo receptor y afectan la vida acuática.</li>
    <li>Los aceites y grasas forman películas superficiales que dificultan la transferencia de oxígeno al agua.</li>
    <li>Los detergentes sintéticos por encima del límite pueden generar espumas y afectar la biodegradación natural del cuerpo receptor.</li>
    <li>Se recomienda verificar el sistema de tratamiento previo al vuelco en los puntos que superen los límites establecidos.</li>
  </ul>

  <div class="caa-box">
    <h2>LÍMITES DE VUELCO — EFLUENTES CLOACALES</h2>
    <table>
      <thead>${tr(["Parámetro","Límite de vuelco","Norma de referencia"],true)}</thead>
      <tbody>
        ${tr(["DBO5 (Demanda Bioquímica de Oxígeno)", "&lt; 50 mg/L", "Tabla Consolidada de Límites Admisibles — vertido tratado"])}
        ${tr(["DQO (Demanda Química de Oxígeno)", "&lt; 250 mg/L", "Tabla Consolidada de Límites Admisibles"])}
        ${tr(["Aceites y Grasas (sust. solubles en éter etílico)", "&lt; 50 mg/L", "Tabla Consolidada de Límites Admisibles"])}
        ${tr(["Detergentes sintéticos", "&lt; 2 mg/L", "Res. 65/05 — Título A (vuelco a colectora cloacal)"])}
        ${tr(["pH", "5.5 – 10.0", "Tabla Consolidada de Límites Admisibles"])}
        ${tr(["Temperatura", "≤ 45 °C", "Tabla Consolidada de Límites Admisibles"])}
        ${tr(["TDS", "1500 mg/L*", "Referencia general (no incluido en la tabla cloacal específica)"])}
      </tbody>
    </table>
    <p class="nota">
      Valores de referencia habituales para vuelco de efluentes cloacales tratados a cuerpo receptor o colectora
      (Tabla Consolidada de Límites Admisibles). El límite de Detergentes se toma de la Resolución 65/05 de Catamarca,
      Título A (vuelco a colectora cloacal), por ser el valor más específico disponible para ese parámetro.
      * El límite de TDS no está regulado en esta tabla; se incluye como referencia general de calidad de agua.
      Nota técnica: esta tabla no reemplaza indicadores microbiológicos (ej. Coliformes fecales) ni de sólidos
      sedimentables/suspendidos, que hoy no forman parte de los parámetros cargados en el sistema.
    </p>
  </div>

  <div class="footer">
    Sistema WATERGIS — Provincia de Catamarca · WGS 84 / EPSG:4326<br>
    Generado: ${fecha} · Usuario: Nicolás Doria · watergis-production.up.railway.app
  </div>
</div>
<script>window.onload=()=>{ window.print(); }</script>
</body></html>`;
    }

    const ventana = window.open("","_blank","width=900,height=700");
    if(ventana){
      ventana.document.write(html);
      ventana.document.close();
    }
    setPdfLoading(false);
  };



  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#020617]">

      {/* ===== ASISTENTE DE AYUDA (tubo de ensayo, sin costo) ===== */}
      {!loginVisible && <AsistenteAyuda />}

      {/* ===== PANTALLA DE LOGIN ===== */}
      {loginVisible && <LoginScreen onLogin={handleLogin} />}

      {/* ===== BIENVENIDA AL INGRESAR ===== */}
      {mostrarBienvenida && sesion && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100000]">
          <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/40 bg-slate-950/90 backdrop-blur-md px-5 py-3.5 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-500/40 text-xl flex-shrink-0">
              {sesion.avatar || "💧"}
            </div>
            <div>
              <div className="text-sm font-bold text-white">Bienvenido, {sesion.nombre}</div>
              <div className="text-[11px] text-cyan-300">Sesión iniciada correctamente</div>
            </div>
          </div>
        </div>
      )}

      {showCargaForm && esAutenticado && (
        <CargaDatosForm
          usuario={sesion!.user}
          onClose={()=>{ setShowCargaForm(false); setPuntoParaNuevaCampana(null); }}
          onGuardado={recargarTodosLosPuntos}
          puntos={points}
          prefill={puntoParaNuevaCampana}
        />
      )}

      {/* ===== POP-UP NUEVOS PUNTOS ===== */}
      {popupNuevos.visible && !loginVisible && (
        <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-cyan-500/40 bg-slate-950 p-6 shadow-2xl text-white">

            {/* Cabecera */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xl">
                💧
              </div>
              <div>
                <p className="font-bold text-cyan-400 text-sm">Nuevos puntos de monitoreo</p>
                <p className="text-xs text-slate-500">{new Date().toLocaleDateString("es-AR", {day:"numeric",month:"long",year:"numeric"})}</p>
              </div>
              <button
                onClick={()=>setPopupNuevos(p=>({...p,visible:false}))}
                className="ml-auto text-slate-500 hover:text-white text-lg leading-none"
              >✕</button>
            </div>

            {/* Cuerpo */}
            <p className="text-sm text-slate-300 mb-4">
              Se agregaron <span className="font-bold text-white">{popupNuevos.total} nuevos puntos</span> de monitoreo desde tu última visita:
            </p>

            {/* Tags por departamento */}
            <div className="flex flex-wrap gap-2 mb-5">
              {popupNuevos.porDpto.map(({dpto, cantidad})=>(
                <span key={dpto}
                  className="rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 text-xs px-3 py-1.5 font-medium">
                  {dpto} <span className="font-bold">+{cantidad}</span>
                </span>
              ))}
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={()=>setPopupNuevos(p=>({...p,visible:false}))}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm text-slate-400 hover:bg-slate-800 transition-colors">
                Cerrar
              </button>
              <button
                onClick={()=>{
                  setPopupNuevos(p=>({...p,visible:false}));
                  // Si hay un solo dpto, filtrar por él
                  if(popupNuevos.porDpto.length===1){
                    setSelectedFiltDept(popupNuevos.porDpto[0].dpto);
                  }
                }}
                className="flex-1 rounded-xl bg-cyan-500 py-2.5 text-sm font-bold text-black hover:bg-cyan-400 transition-colors">
                Ver en el mapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BANNER VISITANTE ===== */}
      {!loginVisible && !esAutenticado && (
        <div className="absolute top-14 left-0 right-0 z-[9998] bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <span>🔒 Modo visitante — información limitada. Iniciá sesión para acceder a todos los datos.</span>
          <button onClick={()=>setLoginVisible(true)} className="ml-4 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1 font-bold hover:bg-amber-500/30 whitespace-nowrap">
            Iniciar sesión
          </button>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="absolute top-0 left-0 right-0 z-[10000] h-14 border-b border-slate-800 bg-slate-950/95 backdrop-blur flex items-center justify-between px-5 text-white">

        {/* ── HAMBURGUESA ── */}
        <div className="relative">
          <button
            onClick={() => { setHamburgerOpen(v=>!v); setPanelMenu(null); }}
            className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800 font-semibold"
          >
            ☰ <span className="text-cyan-400">WATERGIS</span>
          </button>

          {/* Dropdown hamburguesa */}
          {hamburgerOpen && (
            <div className="absolute left-0 top-12 w-60 rounded-xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden z-[11000]">
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {t.menuPrincipal}
              </p>
              {([
                { key:"informes",     icon:"📄", label:t.generarInformes },
                { key:"capas",        icon:"🗺️", label:t.capasGis },
                { key:"temperaturas", icon:"🌡️", label:"Temperaturas / Flúor CAA" },
                { key:"acerca",       icon:"ℹ️", label:t.acercaSistema },
              ] as { key: PanelMenu & string; icon: string; label: string }[]).map(item=>(
                <button
                  key={item.key}
                  onClick={() => {
                    if(item.key==="informes" && !esAutenticado){
                      setHamburgerOpen(false);
                      setLoginVisible(true);
                      return;
                    }
                    setPanelMenu(p=>p===item.key?null:item.key as PanelMenu);
                    setHamburgerOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-800 text-sm ${panelMenu===item.key?"text-cyan-400 bg-slate-800/60":""} ${item.key==="informes"&&!esAutenticado?"opacity-50":""}`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                  {item.key==="informes"&&!esAutenticado && <span className="ml-auto text-xs text-amber-400">🔒</span>}
                </button>
              ))}
            </div>
          )}

          {/* ── PANEL INFORMES ── */}
          {panelMenu==="informes" && (
            <div className="absolute left-0 top-12 w-[360px] rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-2xl text-white z-[11000] max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-cyan-400">📄 {t.generarInformes}</h3>
                <button onClick={()=>setPanelMenu(null)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">{t.filtroDept}</p>
                  <select value={infDept} onChange={e=>setInfDept(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm text-white">
                    <option value="TODOS">{t.todosLosDept}</option>
                    {departamentosUniq.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">{t.filtroLoc}</p>
                  <select value={infLoc} onChange={e=>setInfLoc(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm text-white">
                    <option value="TODAS">{t.todasLasLoc}</option>
                    {localidades.map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">{t.filtroFuente}</p>
                  <select value={infFuente} onChange={e=>setInfFuente(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm text-white">
                    <option value="TODAS">{t.todasLasFuentes}</option>
                    <option value="SUBTERRANEA">{t.subterranea}</option>
                    <option value="SUPERFICIAL">{t.superficial}</option>
                    <option value="MEZCLA">{t.mezcla}</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">{t.filtroRiesgo}</p>
                  <select value={infRiesgo} onChange={e=>setInfRiesgo(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm text-white">
                    <option value="TODOS">{t.todosLosRiesgos}</option>
                    <option value="BAJO">{t.bajo}</option>
                    <option value="MEDIO">{t.medio}</option>
                    <option value="ALTO">{t.alto}</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-300 mb-4 font-mono leading-relaxed">
                <p className="text-cyan-400 font-bold mb-1">▸ {t.previsualizacion}</p>
                <p>Estado general: <span className={promedioAs>0.05?"text-red-400":promedioAs>0.01?"text-amber-400":"text-green-400"}>{estadoGeneral}</span></p>
                <p>As promedio: {promedioAs.toFixed(3)} mg/L</p>
                <p>TDS promedio: {promedioTds.toFixed(0)} mg/L</p>
                <p>Bajo {safePct(bajoCnt)}% · Medio {safePct(medioCnt)}% · Alto {safePct(altoCnt)}%</p>
                <p>Puntos: {visiblePoints.length}</p>
              </div>

              <button
                onClick={generarPDF}
                disabled={pdfLoading}
                className="w-full rounded-xl bg-cyan-500 py-3 font-bold text-black hover:bg-cyan-400 mb-2 text-sm disabled:opacity-50 disabled:cursor-wait">
                {pdfLoading ? "⏳ Generando..." : t.generarPDF}
              </button>
              <button
                className="w-full rounded-xl border border-cyan-500 py-3 font-bold text-cyan-300 hover:bg-cyan-500/10 text-sm">
                {t.exportarExcel}
              </button>
            </div>
          )}

          {/* ── PANEL CAPAS GIS ── */}
          {panelMenu==="capas" && (
            <div className="absolute left-0 top-12 w-[360px] rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-2xl text-white z-[11000] max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-cyan-400">🗺️ {t.capasGis}</h3>
                <button onClick={()=>setPanelMenu(null)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
              </div>

              {/* Capas base */}
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Capas base</p>
              {[
                { label:t.departamentos, checked:showDepartamentos, onChange:setShowDepartamentos, color:"#39ff14" },
                { label:t.cuencas,       checked:showCuencas,       onChange:setShowCuencas,       color:"#22d3ee" },
                { label:t.rios,          checked:showRios,           onChange:setShowRios,           color:"#38bdf8" },
              ].map(({ label, checked, onChange, color })=>(
                <label key={label} className="mb-2 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ background:color }} />
                    <span>{label}</span>
                  </div>
                  <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} />
                </label>
              ))}

              <div className="h-px bg-slate-800 my-4" />

              {/* Agregar capa */}
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                {t.agregarCapa}
              </p>
              <div className="space-y-2 mb-3">
                <input type="text" value={newLayerName} onChange={e=>setNewLayerName(e.target.value)}
                  placeholder={t.nombreCapa}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm text-white placeholder:text-slate-500" />
                <input type="text" value={newLayerUrl} onChange={e=>setNewLayerUrl(e.target.value)}
                  placeholder={t.urlCapa}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm text-white placeholder:text-slate-500" />
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-400">{t.colorCapa}:</p>
                  <input type="color" value={newLayerColor} onChange={e=>setNewLayerColor(e.target.value)}
                    className="h-8 w-12 rounded-lg border border-slate-700 bg-slate-900 cursor-pointer" />
                  <span className="text-xs text-slate-400">{newLayerColor}</span>
                </div>
                {layerError && <p className="text-xs text-red-400">{layerError}</p>}
                <button onClick={agregarCapa}
                  className="w-full rounded-xl bg-cyan-500/20 border border-cyan-500 py-2 text-sm font-bold text-cyan-300 hover:bg-cyan-500/30">
                  + {t.agregar}
                </button>
              </div>

              {/* Capas activas */}
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t.capasActivas}</p>
              {customLayers.length===0
                ? <p className="text-xs text-slate-500 italic">{t.sinCapas}</p>
                : customLayers.map((cl,i)=>(
                  <div key={i} className="mb-2 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ background:cl.color }} />
                      <span className="text-slate-300 truncate max-w-[200px]">{cl.name}</span>
                    </div>
                    <button onClick={()=>setCustomLayers(prev=>prev.filter((_,j)=>j!==i))}
                      className="text-red-400 hover:text-red-300 text-xs">
                      {t.eliminar}
                    </button>
                  </div>
                ))
              }
            </div>
          )}


          {/* ── PANEL TEMPERATURAS / FLÚOR CAA ── */}
          {panelMenu==="temperaturas" && (
            <div className="absolute left-0 top-12 w-[420px] rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-2xl text-white z-[11000] max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-cyan-400">🌡️ Temperaturas Medias Anuales — Flúor CAA</h3>
                <button onClick={()=>setPanelMenu(null)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Límites de Flúor según <strong className="text-cyan-300">Código Alimentario Argentino Art. 982</strong> en función de la temperatura media anual de cada departamento.
              </p>

              {/* Tabla */}
              <div className="rounded-xl overflow-hidden border border-slate-700 mb-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-cyan-900/60 text-cyan-300">
                      <th className="text-left px-3 py-2">Departamento</th>
                      <th className="text-center px-3 py-2">T° media anual</th>
                      <th className="text-center px-3 py-2">Rango CAA</th>
                      <th className="text-center px-3 py-2">F⁻ (mg/L)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { dpto:"Antofagasta de la Sierra", temp:10 },
                      { dpto:"Belén",                    temp:17 },
                      { dpto:"Tinogasta",                temp:17 },
                      { dpto:"Ambato",                   temp:17 },
                      { dpto:"Santa María",              temp:16 },
                      { dpto:"El Alto",                  temp:18 },
                      { dpto:"Andalgalá",                temp:18 },
                      { dpto:"Ancasti",                  temp:19 },
                      { dpto:"Paclín",                   temp:19 },
                      { dpto:"Fray M. Esquiú",           temp:20 },
                      { dpto:"Capayán",                  temp:20 },
                      { dpto:"Pomán",                    temp:20 },
                      { dpto:"Santa Rosa",               temp:20 },
                      { dpto:"La Paz",                   temp:21 },
                      { dpto:"Capital",                  temp:22 },
                      { dpto:"Valle Viejo",              temp:22 },
                    ].map((row, i) => {
                      const fl = row.temp<=12?{inf:0.9,sup:1.7,rango:"10.0–12.0°C"}
                               : row.temp<=14.6?{inf:0.8,sup:1.5,rango:"12.1–14.6°C"}
                               : row.temp<=17.6?{inf:0.8,sup:1.3,rango:"14.7–17.6°C"}
                               : row.temp<=21.4?{inf:0.7,sup:1.2,rango:"17.7–21.4°C"}
                               : row.temp<=26.2?{inf:0.7,sup:1.0,rango:"21.5–26.2°C"}
                               : {inf:0.6,sup:0.8,rango:"26.3–32.6°C"};
                      return (
                        <tr key={row.dpto} className={i%2===0?"bg-slate-900":"bg-slate-800/50"}>
                          <td className="px-3 py-2 text-slate-200 font-medium">{row.dpto}</td>
                          <td className="px-3 py-2 text-center text-amber-300 font-bold">{row.temp}°C</td>
                          <td className="px-3 py-2 text-center text-slate-400">{fl.rango}</td>
                          <td className="px-3 py-2 text-center">
                            <span className="text-cyan-300 font-bold">{fl.inf}–{fl.sup}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Leyenda rangos CAA */}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rangos CAA — Art. 982</p>
              <div className="space-y-1.5">
                {[
                  { rango:"10.0–12.0°C", inf:0.9, sup:1.7 },
                  { rango:"12.1–14.6°C", inf:0.8, sup:1.5 },
                  { rango:"14.7–17.6°C", inf:0.8, sup:1.3 },
                  { rango:"17.7–21.4°C", inf:0.7, sup:1.2 },
                  { rango:"21.5–26.2°C", inf:0.7, sup:1.0 },
                  { rango:"26.3–32.6°C", inf:0.6, sup:0.8 },
                ].map(r=>(
                  <div key={r.rango} className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-1.5 text-xs">
                    <span className="text-slate-400">T° {r.rango}</span>
                    <span className="text-cyan-300 font-bold">{r.inf}–{r.sup} mg/L</span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[10px] text-slate-500 leading-relaxed">
                Fuente: Código Alimentario Argentino, Art. 982. Temperaturas medias anuales basadas en datos del SMN e INTA Catamarca. Valores referenciales — para uso oficial validar con fuentes primarias.
              </p>
            </div>
          )}

          {/* ── PANEL ACERCA ── */}
          {panelMenu==="acerca" && (
            <div className="absolute left-0 top-12 w-[340px] rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-2xl text-white z-[11000]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-cyan-400">ℹ️ {t.acercaSistema}</h3>
                <button onClick={()=>setPanelMenu(null)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-2xl">💧</div>
                <div>
                  <p className="font-bold text-white">{t.acercaTitulo}</p>
                  <p className="text-xs text-cyan-400">{t.acercaVersion}</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">{t.acercaDesc}</p>

              <div className="space-y-2 text-xs">
                {[t.acercaAutor, t.acercaProyeccion, t.acercaFuentes, t.acercaContacto].map((line,i)=>(
                  <div key={i} className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-slate-300">{line}</div>
                ))}
              </div>

              <div className="mt-4 h-px bg-slate-800" />
              <p className="mt-3 text-[10px] text-slate-600 text-center">
                © 2026 WATERGIS · Provincia de Catamarca · WGS 84 / EPSG:4326
              </p>
            </div>
          )}
        </div>

        {/* ── MENÚ USUARIO ── */}
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800"
          >
            {esAutenticado ? (sesion?.avatar || "👤") : "🌐"} <span>{sesion?.nombre ?? "Visitante"}</span> ▼
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden z-[11000]">
              {esAutenticado ? (
                <>
                  <button onClick={()=>{setShowPerfil(v=>!v);setShowAjustes(false);setUserMenuOpen(false);}}
                    className="w-full px-4 py-3 text-left hover:bg-slate-800">👤 {t.miPerfil}</button>
                  <button onClick={()=>{setShowAjustes(v=>!v);setShowPerfil(false);setUserMenuOpen(false);}}
                    className="w-full px-4 py-3 text-left hover:bg-slate-800">⚙️ {t.ajustes}</button>
                  <button onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-slate-800">🚪 {t.cerrarSesion}</button>
                </>
              ) : (
                <>
                  <button onClick={()=>{setLoginVisible(true);setUserMenuOpen(false);}}
                    className="w-full px-4 py-3 text-left text-cyan-400 hover:bg-slate-800 font-semibold">🔑 Iniciar sesión</button>
                  <button onClick={()=>{setShowAjustes(v=>!v);setUserMenuOpen(false);}}
                    className="w-full px-4 py-3 text-left hover:bg-slate-800">⚙️ {t.ajustes}</button>
                </>
              )}
            </div>
          )}

          {/* PANEL MI PERFIL */}
          {showPerfil && (
            <div className="absolute right-0 top-12 w-[300px] rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-2xl text-white z-[11000]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-cyan-400">{t.miPerfil}</h3>
                <button onClick={()=>setShowPerfil(false)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-2xl">
                  {sesion?.avatar || "👤"}
                </div>
                <div>
                  <p className="text-xs text-slate-400">{t.nombre}</p>
                  <p className="font-semibold">{sesion?.nombre ?? "Visitante"}</p>
                </div>
              </div>
              <button onClick={()=>{setShowCambiarPass(v=>!v);setShowCambiarFoto(false);}} className="w-full rounded-xl border border-cyan-500 p-3 mb-2 text-sm font-bold text-cyan-300 hover:bg-cyan-500/10">{t.cambiarContrasena}</button>
              <button onClick={()=>{setShowCambiarFoto(v=>!v);setShowCambiarPass(false);}} className="w-full rounded-xl border border-cyan-500 p-3 text-sm font-bold text-cyan-300 hover:bg-cyan-500/10">{t.cambiarFoto}</button>

              {/* SUB-PANEL: Cambiar contraseña */}
              {showCambiarPass && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <input type="password" value={passActual} onChange={e=>setPassActual(e.target.value)} placeholder="Contraseña actual"
                    className="w-full mb-2 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"/>
                  <input type="password" value={passNueva} onChange={e=>setPassNueva(e.target.value)} placeholder="Nueva contraseña"
                    className="w-full mb-2 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"/>
                  <input type="password" value={passNueva2} onChange={e=>setPassNueva2(e.target.value)} placeholder="Repetir nueva contraseña"
                    className="w-full mb-3 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"/>
                  {passError && <p className="text-xs text-red-400 mb-2 text-center">{passError}</p>}
                  {passOk && <p className="text-xs text-green-400 mb-2 text-center">✅ Contraseña actualizada</p>}
                  <button onClick={handleCambiarPassword} disabled={passLoading}
                    className="w-full rounded-xl bg-cyan-500 p-2.5 text-sm font-bold text-black hover:bg-cyan-400 disabled:opacity-50">
                    {passLoading?"Guardando...":"Confirmar cambio"}
                  </button>
                  <p className="text-[10px] text-slate-500 mt-2 text-center">
                    Si tu cuenta es una de las 3 originales del sistema (no registrada por vos), primero registrate como usuario nuevo para poder cambiar la contraseña.
                  </p>
                </div>
              )}

              {/* SUB-PANEL: Cambiar foto/ícono */}
              {showCambiarFoto && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-400 mb-2">Elegí tu nuevo ícono</p>
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {AVATARES.map(av => (
                      <button
                        key={av}
                        onClick={()=>handleCambiarAvatar(av)}
                        disabled={fotoLoading}
                        className={`aspect-square rounded-lg border text-lg flex items-center justify-center transition-all disabled:opacity-50 ${
                          sesion?.avatar===av ? "border-cyan-500 bg-cyan-500/20" : "border-slate-700 bg-slate-900 hover:border-slate-500"
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                  {fotoError && <p className="text-xs text-red-400 text-center">{fotoError}</p>}
                </div>
              )}
            </div>
          )}

          {/* PANEL AJUSTES */}
          {showAjustes && (
            <div className="absolute right-0 top-12 w-[340px] rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-2xl text-white z-[11000] overflow-y-auto max-h-[80vh]">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-cyan-400">{t.ajustes}</h3>
                <button onClick={()=>setShowAjustes(false)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
              </div>

              {/* Idioma */}
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">🌐 {t.idioma}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["es","en","de","pt"] as Idioma[]).map(lang=>{
                    const labels:Record<Idioma,string>={es:"🇦🇷 Español",en:"🇺🇸 English",de:"🇩🇪 Deutsch",pt:"🇧🇷 Português"};
                    return (
                      <button key={lang} onClick={()=>setIdioma(lang)}
                        className={`rounded-xl border p-2 text-sm font-semibold transition-all ${idioma===lang?"border-cyan-500 bg-cyan-500/20 text-cyan-300":"border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"}`}>
                        {labels[lang]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="h-px bg-slate-800 mb-5" />

              {/* Tipografía */}
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">🔤 {t.tipografia}</p>
                <div className="flex flex-col gap-2">
                  {(["inter","mono","serif"] as Tipografia[]).map(font=>{
                    const previews:Record<Tipografia,string>={inter:"'Inter',sans-serif",mono:"'Courier New',monospace",serif:"'Georgia',serif"};
                    const labels:Record<Tipografia,string>={inter:t.fontInter,mono:t.fontMono,serif:t.fontSerif};
                    return (
                      <button key={font} onClick={()=>setTipografia(font)}
                        className={`rounded-xl border p-3 text-left transition-all ${tipografia===font?"border-cyan-500 bg-cyan-500/20":"border-slate-700 bg-slate-900 hover:border-slate-500"}`}>
                        <p className="text-sm font-semibold text-white mb-0.5" style={{fontFamily:previews[font]}}>
                          Aa — {labels[font].split("—")[0].trim()}
                        </p>
                        <p className="text-xs text-slate-400">{labels[font].split("—")[1]?.trim()}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="h-px bg-slate-800 mb-5" />

              {/* Lector */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">🔊 {t.lectorPantalla}</p>
                <p className="text-xs text-slate-500 mb-3">{t.lectorDesc}</p>
                <button onClick={leerDatos}
                  className={`w-full rounded-xl p-3 text-sm font-bold transition-all ${lectorLeyendo?"bg-amber-500/20 border border-amber-500 text-amber-300":"bg-cyan-500/10 border border-cyan-500 text-cyan-300 hover:bg-cyan-500/20"}`}>
                  {lectorLeyendo?`⏹ ${t.lectorBtnOff}`:`▶ ${t.lectorBtn}`}
                </button>
                {lectorLeyendo && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
                    <span className="animate-pulse">●</span> {t.lectorReading}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== SIDEBAR ===== */}
      <div className="absolute left-0 top-14 z-[9999] h-[calc(100vh-56px)] w-[360px] overflow-y-auto border-r border-cyan-900/40 bg-slate-950/95 p-6 text-white backdrop-blur-xl">

        <div className="mb-8">
          <p className="text-sm font-semibold text-cyan-400">{t.plataforma}</p>
          <p className="mt-2 text-xs text-slate-400">{t.provincia}</p>
        </div>

        {/* ── CARGAR DATOS — solo administradores autorizados ── */}
        {esAdmin && (
          <button
            onClick={()=>setShowCargaForm(true)}
            className="group mb-6 flex w-full items-center gap-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 p-4 text-left transition-all hover:border-cyan-400/60 hover:from-cyan-500/20 hover:to-cyan-500/10"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-black transition-transform group-hover:scale-105">
              <Plus size={20} strokeWidth={2.5}/>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Cargar datos</div>
              <div className="text-[11px] text-slate-400">Nuevo punto de monitoreo</div>
            </div>
            <span className="text-cyan-400 opacity-0 transition-opacity group-hover:opacity-100">→</span>
          </button>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3">
          <MiniKPI title={t.puntos}  value={visiblePoints.length} icon={<MapPin size={20} className="text-cyan-400"/>}/>
          <MiniKPI title={t.riesgo}  value={puntosAltos}          icon={<AlertTriangle size={20} className="text-red-400"/>}/>
          <MiniKPI title="As"        value={isNaN(promedioAs)?"ERROR":promedioAs.toFixed(3)} icon={<Droplets size={20} className="text-emerald-400"/>}/>
          <MiniKPI title="TDS"       value={promedioTds.toFixed(0)} icon={<Waves size={20} className="text-amber-400"/>}/>
        </div>

        {/* DISTRIBUCIÓN DE RIESGO Y FUENTES — solo usuarios autenticados */}
        {esAutenticado ? (
          <>
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 text-sm font-semibold text-cyan-300">{t.distribucionRiesgo}</div>
          {(()=>{
            const riskData=[
              {name:t.bajo, value:bajoCnt,  color:"#22c55e"},
              {name:t.medio,value:medioCnt, color:"#f59e0b"},
              {name:t.alto, value:altoCnt,  color:"#ef4444"},
            ];
            return (
              <div className="h-[260px]">
                <div className="flex items-center gap-4 h-full">
                  <div style={{width:120,flexShrink:0}}>
                    <ResponsiveContainer width={120} height={120}>
                      <PieChart>
                        <Pie data={riskData} dataKey="value" cx="50%" cy="50%" outerRadius={52} innerRadius={34} paddingAngle={2}>
                          {riskData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                        </Pie>
                        <Tooltip/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-[150px] w-px bg-slate-700/60"/>
                  <div className="flex flex-col gap-6 text-sm">
                    {riskData.map((r,i)=>(
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-md" style={{background:r.color}}/>
                        <div>
                          <p className="font-semibold text-white">{r.name}</p>
                          <p className="text-slate-400">{r.value} ({safePct(r.value)}%)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* DISTRIBUCIÓN DE FUENTES */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-4 text-sm font-semibold text-cyan-300">{t.distribucionFuentes}</div>
          <div className="flex flex-col gap-3 text-sm">
            {[
              {label:t.subterranea,count:subterranea,pct:pctSub,color:"bg-cyan-500"},
              {label:t.superficial,count:superficial,pct:pctSup,color:"bg-blue-500"},
              {label:t.mezcla,     count:mezcla,     pct:pctMez,color:"bg-purple-500"},
            ].map(({label,count,pct,color})=>(
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300">{label}</span>
                  <span className="font-semibold text-cyan-300">{count} ({pct}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div className={`h-2 rounded-full ${color}`} style={{width:`${pct}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
          </>
        ) : (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-center">
            <p className="text-2xl mb-2">🔒</p>
            <p className="text-sm font-semibold text-amber-300 mb-1">Datos restringidos</p>
            <p className="text-xs text-slate-400 mb-3">Iniciá sesión para ver indicadores de riesgo, arsénico, distribución de fuentes y generar informes.</p>
            <button onClick={()=>setLoginVisible(true)}
              className="rounded-xl bg-cyan-500/20 border border-cyan-500 px-4 py-2 text-sm font-bold text-cyan-300 hover:bg-cyan-500/30">
              🔑 Iniciar sesión
            </button>
          </div>
        )}

        {/* ===== FILTROS ===== */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-cyan-400 text-sm">🔍</span>
            <h3 className="text-sm font-bold text-cyan-400">Filtrar puntos</h3>
            {(search||selectedFuente!=="TODAS"||selectedFuente!=="TODAS") && (
              <button
                onClick={()=>{setSearch("");setSelectedFuente("TODAS");}}
                className="ml-auto text-[10px] text-slate-500 hover:text-red-400 transition-colors"
              >
                ✕ Limpiar
              </button>
            )}
          </div>

          {/* Tipo de punto — filtro aparte, independiente del filtro de Fuente (Subterránea/Superficial/Mezcla) */}
          <div className="mb-3">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
              Tipo de punto
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                {key:"DIQUE",    label:"Diques",    color:"border-blue-500 text-blue-300"},
                {key:"RED",      label:"Red",       color:"border-purple-500 text-purple-300"},
                {key:"EFLUENTE", label:"Efluentes", color:"border-slate-400 text-slate-300"},
              ] as {key:string;label:string;color:string}[]).map(opt=>(
                <button
                  key={opt.key}
                  onClick={()=>setTipoPunto(tipoPunto===opt.key ? "TODOS" : opt.key as any)}
                  className={`rounded-lg border p-1.5 text-[10px] font-semibold transition-all ${
                    tipoPunto===opt.key ? opt.color+" bg-slate-800" : "border-slate-800 bg-slate-950 text-slate-600 hover:border-slate-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Selector de dique específico — solo si tipoPunto es DIQUE */}
            {tipoPunto==="DIQUE" && (
              <div className="mt-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                  Unidad
                </label>
                <select
                  value={diqueSeleccionado}
                  onChange={e=>setDiqueSeleccionado(e.target.value)}
                  className="w-full rounded-xl border border-blue-700/50 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="TODOS">Todos los diques</option>
                  {diquesUnicosLista.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            {/* Selector de punto de muestreo específico — solo si tipoPunto es RED.
                Si ya elegiste una Localidad más abajo, acá solo aparecen los puntos de esa localidad. */}
            {tipoPunto==="RED" && (
              <div className="mt-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                  Punto de muestreo
                </label>
                <select
                  value={redPuntoSeleccionado}
                  onChange={e=>setRedPuntoSeleccionado(e.target.value)}
                  className="w-full rounded-xl border border-purple-700/50 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="TODOS">
                    {search ? `Todos los puntos de ${search}` : "Todos los puntos de Red"}
                  </option>
                  {redPuntosUnicosLista.map(pt=><option key={pt} value={pt}>{pt}</option>)}
                </select>
                {!search && (
                  <p className="text-[9px] text-slate-500 mt-1">
                    Tip: elegí una Localidad abajo para ver solo sus puntos de muestreo.
                  </p>
                )}
              </div>
            )}

            {/* Selector de efluente específico — solo si tipoPunto es EFLUENTE */}
            {tipoPunto==="EFLUENTE" && (
              <div className="mt-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                  Punto de vuelco
                </label>
                <select
                  value={efluenteSeleccionado}
                  onChange={e=>setEfluenteSeleccionado(e.target.value)}
                  className="w-full rounded-xl border border-slate-500/50 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-slate-400"
                >
                  <option value="TODOS">Todos los efluentes</option>
                  {efluentesUnicosLista.map(e=><option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            )}

            {/* Botón generar informe específico de Diques, Red o Efluentes */}
            {(tipoPunto==="DIQUE"||tipoPunto==="RED"||tipoPunto==="EFLUENTE") && esAutenticado && (
              <button
                onClick={()=>{ setInfTipoPunto(tipoPunto); generarPDFEspecial(tipoPunto as "DIQUE"|"RED"|"EFLUENTE"); }}
                className={`mt-2 w-full rounded-lg border py-2 text-xs font-bold transition-all ${
                  tipoPunto==="DIQUE"
                    ? "border-blue-500 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                    : tipoPunto==="RED"
                    ? "border-purple-500 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                    : "border-slate-400 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20"
                }`}
              >
                📄 Generar informe de {tipoPunto==="DIQUE"
                  ? (diqueSeleccionado==="TODOS" ? "Todos los Diques" : diqueSeleccionado)
                  : tipoPunto==="RED"
                  ? (redPuntoSeleccionado==="TODOS" ? (search ? `Red — ${search}` : "Red") : redPuntoSeleccionado)
                  : (efluenteSeleccionado==="TODOS" ? "Todos los Efluentes" : efluenteSeleccionado)}
              </button>
            )}
          </div>
          <div className="mb-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
              {t.departamentos}
            </label>
            <select
              value={selectedFiltDept}
              onChange={e=>{ setSelectedFiltDept(e.target.value); setSearch(""); }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="TODOS">Todos los departamentos</option>
              {departamentosUniq.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Localidad — filtrada por departamento */}
          <div className="mb-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
              Localidad
            </label>
            <select
              value={search}
              onChange={e=>setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">Todas las localidades</option>
              {localidadesFiltradas.map(l=><option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Fuente */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
              {t.fuente}
            </label>
            <select
              value={selectedFuente}
              onChange={e=>setSelectedFuente(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="TODAS">Todas las fuentes</option>
              <option value="SUBTERRANEA">{t.subterranea}</option>
              <option value="SUPERFICIAL">{t.superficial}</option>
              <option value="MEZCLA">{t.mezcla}</option>
            </select>
          </div>

          {/* Contador resultados */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Puntos visibles</span>
            <span className="text-sm font-bold text-cyan-400">{visiblePoints.length}</span>
          </div>
        </div>

        {/* ===== MAPA DE CALOR ===== */}
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔥</span>
            <h3 className="text-sm font-bold text-cyan-400">Mapa de Calor</h3>
          </div>
          <p className="text-[10px] text-slate-500 mb-3">Visualizá la intensidad de un parámetro sobre el mapa.</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key:"ninguno", label:"Desactivar", color:"border-slate-700 text-slate-500" },
              { key:"As",      label:"Arsénico",   color:"border-cyan-500 text-cyan-300"   },
              { key:"TDS",     label:"TDS",         color:"border-amber-500 text-amber-300" },
              { key:"Fluor",   label:"Flúor",       color:"border-purple-500 text-purple-300" },
            ] as {key:string;label:string;color:string}[]).map(opt=>(
              <button
                key={opt.key}
                onClick={()=>setHeatParam(opt.key as any)}
                className={`rounded-xl border p-2 text-xs font-semibold transition-all ${
                  heatParam===opt.key
                    ? opt.color+" bg-slate-800"
                    : "border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {heatParam!=="ninguno" && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <p className="text-[10px] text-slate-500 mb-2">Intensidad</p>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-slate-500">Bajo</span>
                <div className="flex-1 h-3 rounded-full" style={{background:"linear-gradient(to right, #22c55e, #f59e0b, #ef4444, #7f1d1d)"}}/>
                <span className="text-[9px] text-slate-500">Alto</span>
              </div>
            </div>
          )}
          {!heatReady && heatParam!=="ninguno" && (
            <p className="text-[10px] text-amber-400 mt-2">⏳ Cargando plugin...</p>
          )}
        </div>

        {/* INFORMACIÓN — formato compacto */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-3">
          <h3 className="mb-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">{t.informacion}</h3>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t.autor}</span>
              <span className="text-slate-300 font-medium">Nicolás Doria</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t.fecha}</span>
              <span className="text-slate-300 font-medium">Mayo 2026</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t.proyeccion}</span>
              <span className="text-slate-300 font-medium">WGS 84 / EPSG:4326</span>
            </div>
            <div className="pt-1 border-t border-slate-800">
              <span className="text-slate-500">{t.referencia}: </span>
              <span className="text-slate-400">{t.refTexto}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAP ===== */}
      <MapContainer
        center={[-28.0373,-65.5962]} zoom={8}
        style={{ height:"calc(100vh - 56px)", width:"calc(100% - 360px)", marginLeft:"360px", marginTop:"56px" }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name={t.oscuro}>
            <TileLayer attribution="Carto" url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/>
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer attribution="OSM" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name={t.satelite}>
            <TileLayer attribution="Google" url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"/>
          </LayersControl.BaseLayer>
        </LayersControl>

        {showCuencas && cuencas && <GeoJSON data={cuencas} style={cuencaStyle}/>}
        {heatParam!=="ninguno" && heatReady && (
          <HeatLayer points={visiblePoints} param={heatParam} />
        )}
        {showRios && rios && <GeoJSON data={rios} style={{color:"#0c2dc4",weight:2,opacity:1}}/>}
        {showDepartamentos && departamentos && <GeoJSON data={departamentos} style={{color:"#39ff14",weight:2,fillOpacity:0}}/>}

        {/* Capas personalizadas */}
        {customLayers.map((cl,i)=>(
          <GeoJSON key={i} data={cl.data} style={{color:cl.color,weight:2,fillOpacity:0.2}}/>
        ))}

        {visiblePoints.map((point,index)=>{
          const lat=parseFloat(point.Latitud?.toString().replace(",","."));
          const lng=parseFloat(point.Longitud?.toString().replace(",","."));
          if(isNaN(lat)||isNaN(lng)) return null;

          const campaigns=points
            .filter(p=>p.PUNTO_DE_MUESTREO===point.PUNTO_DE_MUESTREO&&p.Localidad===point.Localidad)
            .sort((a,b)=>new Date(a.Fecha_de_monitoreo).getTime()-new Date(b.Fecha_de_monitoreo).getTime());

          const chartData=campaigns.map(c=>({
            fecha:c.Fecha_de_monitoreo,
            As:parseAs(c.As_mg_l),
            TDS:parseFloat(String(c.TDS_mg_l||"0").replace(",",".")),
            Ph:parseAs(c.Ph),
            Fluor:parseFloat(String(c.Fluor_mg_l||"0").replace(",",".")),
            NO3:parseFloat(String(c.NO3_mg_l||"0").replace(",",".")),
            Turb:parseFloat(String(c.Turb_NTU||"0").replace(",",".")),
            Clorofila:parseFloat(String(c.Clorofila_ug_l||"0").replace(",",".")),
            BGA:parseFloat(String(c.Algas_BGA||"0").replace(",",".")),
            Cloro:parseFloat(String(c.Cloro_libre_mg_l||"0").replace(",",".")),
            OD:parseFloat(String(c.OD_mg_l||"0").replace(",",".")),
            SatO2:parseFloat(String(c.Sat_O2_pct||"0").replace(",",".")),
            DBO:parseFloat(String(c.DBO_mg_l||"0").replace(",",".")),
            DQO:parseFloat(String(c.DQO_mg_l||"0").replace(",",".")),
            Detergentes:parseFloat(String(c.Detergentes_mg_l||"0").replace(",",".")),
            GrasasAceites:parseFloat(String(c.Grasas_Aceites_mg_l||"0").replace(",",".")),
          }));

          // Cards del popup — dependen del tipo de punto
          const baseCards = [
            {key:"As",   label:"As",    val:point.As_mg_l,    color:"#22d3ee"},
            {key:"TDS",  label:"TDS",   val:point.TDS_mg_l,   color:"#f59e0b"},
            {key:"Ph",   label:"pH",    val:point.Ph,         color:"#a78bfa"},
          ];
          const diqueCards = [
            {key:"OD",        label:"Oxígeno Disuelto",val:point.OD_mg_l||"-",        color:"#38bdf8"},
            {key:"TDS",       label:"TDS",            val:point.TDS_mg_l||"-",       color:"#f59e0b"},
            {key:"Turb",      label:"Turbidez (NTU)", val:point.Turb_NTU||"-",       color:"#c084fc"},
            {key:"Clorofila", label:"Clorofila",      val:point.Clorofila_ug_l||"-", color:"#22c55e"},
            {key:"BGA",       label:"Algas BGA",      val:point.Algas_BGA||"-",      color:"#ef4444"},
          ];
          const redCards = [
            {key:"Turb", label:"Turbidez (NTU)", val:point.Turb_NTU||"-",         color:"#c084fc"},
            {key:"Cloro",label:"Cloro libre",    val:point.Cloro_libre_mg_l||"-", color:"#34d399"},
            {key:"TDS",  label:"TDS",            val:point.TDS_mg_l||"-",         color:"#f59e0b"},
          ];
          const efluenteCards = [
            {key:"DBO",           label:"DBO5",            val:point.DBO_mg_l||"-",            color:"#f97316"},
            {key:"DQO",           label:"DQO",             val:point.DQO_mg_l||"-",            color:"#fb923c"},
            {key:"TDS",           label:"TDS",             val:point.TDS_mg_l||"-",            color:"#f59e0b"},
            {key:"Detergentes",   label:"Detergentes",     val:point.Detergentes_mg_l||"-",     color:"#38bdf8"},
            {key:"GrasasAceites", label:"Grasas y Aceites",val:point.Grasas_Aceites_mg_l||"-",  color:"#a3a3a3"},
          ];
          const pozoCards = [
            {key:"Fluor",label:"Flúor", val:point.Fluor_mg_l, color:"#34d399"},
            {key:"NO3",  label:"NO3",   val:point.NO3_mg_l,   color:"#f87171"},
          ];
          const cards = point.Tipo_Punto==="DIQUE"
            ? diqueCards
            : point.Tipo_Punto==="RED"
            ? redCards
            : point.Tipo_Punto==="EFLUENTE"
            ? efluenteCards
            : [...baseCards, ...pozoCards];

          const popupKey = `${point.PUNTO_DE_MUESTREO}_${point.Localidad}`;
          const activeVar = popupVar[popupKey] ?? cards[0]?.key ?? selectedVariable;

          return (
            <Marker key={index} position={[lat,lng]} icon={esAutenticado ? getMarkerIcon(point) : greenIcon}>
              <Popup maxWidth={300}>
                <div style={{width:"260px"}}>
                  <h2 style={{fontSize:"22px",fontWeight:800,marginBottom:"4px"}}>{point.Localidad}</h2>
                  <div style={{opacity:0.8,marginBottom:"10px",fontSize:"13px",lineHeight:1.6}}>
                    <div><strong>{t.departamentos}:</strong> {point.Departamento}</div>
                    {esAutenticado && (
                      <>
                        <div><strong>{t.punto}:</strong> {point.PUNTO_DE_MUESTREO}</div>
                        <div><strong>{t.campanas}:</strong> {campaigns.length}</div>
                        <div><strong>{t.fuente}:</strong> {point.Fuente}</div>
                      </>
                    )}
                  </div>
                  {esAutenticado ? (
                    <>
                      {/* CARDS clicables — dinámicas según tipo de punto */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"10px"}}>
                        {cards.map(card=>(
                          <div
                            key={card.key}
                            onClick={()=>setPopupVar(prev=>({...prev,[popupKey]:card.key}))}
                            style={{
                              background: activeVar===card.key
                                ? "rgba(6,182,212,0.15)" : "#0f172a",
                              border: `1px solid ${activeVar===card.key
                                ? card.color : "rgba(255,255,255,0.08)"}`,
                              borderRadius:"10px", padding:"8px", cursor:"pointer",
                              transition:"all 0.15s",
                            }}
                          >
                            <div style={{fontSize:"10px",opacity:0.7,marginBottom:"2px"}}>{card.label}</div>
                            <div style={{fontSize:"16px",fontWeight:700,color:card.color}}>{card.val}</div>
                          </div>
                        ))}
                      </div>
                      {/* GRÁFICO del parámetro seleccionado */}
                      <div style={{fontSize:"10px",color:"#94a3b8",marginBottom:"4px",textAlign:"center"}}>
                        Evolución histórica — <strong style={{color:"#22d3ee"}}>
                          {activeVar}
                        </strong>
                      </div>
                      <div style={{width:"100%",height:"200px"}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                            <XAxis dataKey="fecha" fontSize={9}/>
                            <YAxis fontSize={9}/>
                            <Tooltip/>
                            <Line
                              type="monotone"
                              dataKey={activeVar}
                              stroke="#22d3ee"
                              strokeWidth={2.5}
                              dot={{r:3}}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {esAdmin && (
                        <button
                          onClick={()=>abrirNuevaCampana(point)}
                          style={{
                            width:"100%", marginTop:"12px", display:"flex", alignItems:"center", gap:"8px",
                            background:"rgba(34,211,238,0.1)", border:"1px solid rgba(34,211,238,0.4)",
                            borderRadius:"10px", padding:"9px 10px", cursor:"pointer",
                          }}
                        >
                          <span style={{
                            width:"22px", height:"22px", borderRadius:"6px", background:"#22d3ee",
                            color:"#022c33", display:"flex", alignItems:"center", justifyContent:"center",
                            fontWeight:700, fontSize:"13px", flexShrink:0,
                          }}>+</span>
                          <span style={{fontSize:"11px", color:"#67e8f9", fontWeight:600}}>Agregar nueva campaña acá</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div style={{textAlign:"center",padding:"16px 0"}}>
                      <p style={{fontSize:"24px",marginBottom:"8px"}}>🔒</p>
                      <p style={{fontSize:"12px",color:"#94a3b8",marginBottom:"12px"}}>Iniciá sesión para ver datos hidroquímicos</p>
                      <button
                        onClick={()=>setLoginVisible(true)}
                        style={{background:"rgba(6,182,212,0.15)",border:"1px solid #06b6d4",borderRadius:"10px",padding:"8px 16px",color:"#67e8f9",fontSize:"12px",fontWeight:"bold",cursor:"pointer"}}
                      >
                        🔑 Iniciar sesión
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
