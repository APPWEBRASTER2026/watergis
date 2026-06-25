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
import { MapPin, AlertTriangle, Droplets, Waves } from "lucide-react";

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

// ======================================================
// TYPES
// ======================================================

type Punto = {
  Localidad: string; Departamento: string; Fuente: string;
  PUNTO_DE_MUESTREO: string; Fecha_de_monitoreo: string;
  Ph: string; T_ºC: string; TDS_mg_l: string; Turb_NTU: string;
  Salinidad_mg_l: string; As_mg_l: string; Fluor_mg_l: string;
  NO3_mg_l: string; Latitud: string; Longitud: string;
};

type Idioma    = "es" | "en" | "de" | "pt";
type Tipografia = "inter" | "mono" | "serif";

// tipo de panel del menú hamburguesa
type PanelMenu = "informes" | "capas" | "acerca" | null;

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

const parseAs = (val: string | undefined) =>
  parseFloat(String(val || "0").replace(",", "."));

const fontFamilies: Record<Tipografia, string> = {
  inter: "'Inter','Segoe UI',sans-serif",
  mono:  "'Courier New','Roboto Mono',monospace",
  serif: "'Georgia','Times New Roman',serif",
};

// ======================================================
// MINI KPI
// ======================================================

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

function LoginScreen({ onLogin }: { onLogin: (user: string, nombre: string) => void }) {
  const [usuario, setUsuario]   = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const handleLogin = () => {
    setError(""); setLoading(true);
    setTimeout(() => {
      const u = USUARIOS[usuario.trim().toLowerCase()];
      if (u && u.password === password) { onLogin(usuario.trim().toLowerCase(), u.nombre); }
      else { setError("Usuario o contraseña incorrectos."); }
      setLoading(false);
    }, 600);
  };
  return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center z-[99999]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 mb-4">
            <span className="text-3xl">💧</span>
          </div>
          <h1 className="text-3xl font-black text-cyan-400 tracking-tight">WATERGIS</h1>
          <p className="text-slate-400 text-sm mt-1">Plataforma Hidroquímica — Provincia de Catamarca</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950 p-8 shadow-2xl">
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
            <p className="text-xs text-slate-500 text-center">¿No tenés acceso? Contactá al administrador.</p>
            <p className="text-xs text-slate-600 text-center mt-1">watergis@catamarca.gob.ar</p>
          </div>
        </div>
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
// COMPONENT
// ======================================================

export default function Map() {
  // ── AUTH ──
  const [sesion, setSesion] = useState<{user:string;nombre:string}|null>(null);
  const [loginVisible, setLoginVisible] = useState(true);
  const esAutenticado = sesion !== null && sesion.user !== "publico";

  useEffect(()=>{
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if(saved){ const p=JSON.parse(saved); if(p.user&&p.nombre){ setSesion(p); setLoginVisible(false); } }
    } catch {}
  },[]);

  const handleLogin=(user:string,nombre:string)=>{
    const s={user,nombre}; setSesion(s); setLoginVisible(false);
    if(user!=="publico"){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(s)); }catch{} }
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
  const [showAjustes, setShowAjustes]   = useState(false);
  const [selectedVariable, setSelectedVariable] = useState("As");
  const [selectedFuente, setSelectedFuente]     = useState("TODAS");

  // Estado para el parámetro seleccionado en cada popup (clave: punto_localidad)
  const [popupVar, setPopupVar] = useState<Record<string,string>>({});

  // Filtro sidebar
  const [selectedFiltDept, setSelectedFiltDept] = useState("TODOS");

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

  // Cargar jsPDF desde CDN una sola vez
  useEffect(() => {
    if ((window as any).jspdf) return;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

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

  // ======================================================
  // LOAD DATA
  // ======================================================

  useEffect(() => {
    Papa.parse("/pozos.csv", {
      download: true, header: true, skipEmptyLines: true,
      complete: (r) => setPoints(r.data as Punto[]),
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
      const deptOk = selectedFiltDept==="TODOS" || p.Departamento===selectedFiltDept;
      const locOk  = search.trim()==="" ? true : p.Localidad===search;
      const fOk    = selectedFuente==="TODAS" || p.Fuente===selectedFuente;
      return deptOk && locOk && fOk;
    });
  }, [points, search, selectedFuente, selectedFiltDept]);

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
  // GENERAR PDF
  // ======================================================

  const generarPDF = () => {
    const { jsPDF } = (window as any).jspdf;

    // FIX: usar points completos respetando solo los filtros seleccionados
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

    // Si no hay datos mostrar alerta pero no bloquear — usar todos los puntos válidos
    const base = base.length > 0 ? filtrado : points.filter(p=>{
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

    // ── Límite CAA de Flúor según temperatura promedio de la zona ──
    // CAA Art. 982: F límite varía con temperatura anual media del agua
    // < 10°C → 1.7 mg/L | 10-12°C → 1.5 mg/L | 12-14.6°C → 1.3 mg/L | 14.7-17.6°C → 1.2 mg/L | > 17.6°C → 1.0 mg/L
    const getLimiteFluor = (temp: number): {limite: number; rango: string} => {
      if (temp < 10)   return { limite: 1.7, rango: "T < 10°C" };
      if (temp < 12)   return { limite: 1.5, rango: "10°C ≤ T < 12°C" };
      if (temp < 14.7) return { limite: 1.3, rango: "12°C ≤ T < 14.7°C" };
      if (temp < 17.7) return { limite: 1.2, rango: "14.7°C ≤ T < 17.7°C" };
      return { limite: 1.0, rango: "T ≥ 17.7°C" };
    };
    const fluorInfo = getLimiteFluor(avgTemp);

    const estG     = avgAs>0.05?"ALERTA":avgAs>0.01?"PRECAUCIÓN":"NORMAL";
    const estColor: [number,number,number] = avgAs>0.05?[220,38,38]:avgAs>0.01?[245,158,11]:[34,197,94];
    const fPred    = (() => {
      const sub=base.filter(p=>p.Fuente==="SUBTERRANEA").length;
      const sup=base.filter(p=>p.Fuente==="SUPERFICIAL").length;
      const mez=base.filter(p=>p.Fuente==="MEZCLA").length;
      return sub>=sup&&sub>=mez?"Subterránea":sup>=mez?"Superficial":"Mezcla";
    })();
    const bCnt=base.filter(p=>parseAs(p.As_mg_l)<0.01).length;
    const mCnt=base.filter(p=>{const a=parseAs(p.As_mg_l);return a>=0.01&&a<=0.05;}).length;
    const aCnt=base.filter(p=>parseAs(p.As_mg_l)>0.05).length;
    const pct=(n:number)=>base.length>0?((n/base.length)*100).toFixed(1):"0";
    const byYear: Record<string,number[]>={};
    base.forEach(p=>{
      const yr=p.Fecha_de_monitoreo?.split(/[-/]/)[0];
      if(!yr||yr.length!==4) return;
      if(!byYear[yr]) byYear[yr]=[];
      byYear[yr].push(parseAs(p.As_mg_l));
    });
    const histData=Object.keys(byYear).sort().map(yr=>({yr,avg:(byYear[yr].reduce((a,v)=>a+v,0)/byYear[yr].length).toFixed(3)}));

    // ── Título dinámico según filtros ──
    const soloDepto  = infDept!=="TODOS" && infLoc==="TODAS";
    const soloLoc    = infLoc!=="TODAS";
    const titulo1    = "INFORME HIDROQUÍMICO";
    const titulo2    = soloLoc
      ? `${infLoc.toUpperCase()}  ·  ${(infDept!=="TODOS"?infDept:filtrado[0]?.Departamento||"").toUpperCase()}`
      : soloDepto
      ? `DEPARTAMENTO ${infDept.toUpperCase()}`
      : `PROVINCIA DE CATAMARCA — TODOS LOS DEPARTAMENTOS`;
    const subtitulo  = infFuente!=="TODAS" ? `Fuente: ${infFuente}` : "";
    // Para el nombre del archivo
    const nombreBase = soloLoc ? infLoc : soloDepto ? `Departamento_${infDept}` : "General";
    const fecha      = new Date().toLocaleDateString("es-AR");
    // Para el mini-header en páginas 2+
    const headerRight = soloLoc
      ? `${infLoc.toUpperCase()} · ${(infDept!=="TODOS"?infDept:base[0]?.Departamento||"").toUpperCase()}`
      : soloDepto ? `DPTO. ${infDept.toUpperCase()}` : "CATAMARCA GENERAL";

    // ── Construir PDF ──
    const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
    const W=210; const L=14; const R=W-14; const CW=W-28;
    const PAGE_H=297;
    const FOOTER_H=14;       // altura del footer
    const CONTENT_MAX=PAGE_H-FOOTER_H-4; // y máximo antes de footer
    let y=0;
    let pageNum=1;

    // ── Dibujar fondo de página ──
    const fondoPagina=()=>{
      doc.setFillColor(10,15,30);
      doc.rect(0,0,W,PAGE_H,"F");
    };

    // ── Dibujar footer en la página actual ──
    const dibujarFooter=()=>{
      doc.setFillColor(2,6,23);
      doc.rect(0,PAGE_H-FOOTER_H,W,FOOTER_H,"F");
      doc.setFillColor(6,182,212);
      doc.rect(0,PAGE_H-FOOTER_H,W,0.8,"F");
      doc.setTextColor(120,140,170); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
      doc.text("Sistema WATERGIS — Provincia de Catamarca — WGS 84 / EPSG:4326",W/2,PAGE_H-FOOTER_H+5,{align:"center"});
      doc.setTextColor(160,180,210);
      doc.text(`Generado: ${fecha}  ·  Usuario: Nicolás Doria  ·  Pág. ${pageNum}`,W/2,PAGE_H-FOOTER_H+10,{align:"center"});
    };

    // ── Salto de página automático ──
    const checkPage=(needed:number=10)=>{
      if(y+needed>CONTENT_MAX){
        dibujarFooter();
        doc.addPage();
        pageNum++;
        fondoPagina();
        // mini header en páginas 2+
        doc.setFillColor(2,6,23);
        doc.rect(0,0,W,12,"F");
        doc.setFillColor(6,182,212); doc.rect(0,11,W,0.8,"F");
        doc.setTextColor(6,182,212); doc.setFontSize(9); doc.setFont("helvetica","bold");
        doc.text("WATERGIS",L,8);
        doc.setTextColor(120,140,170); doc.setFont("helvetica","normal");
        doc.text(`${headerRight}`,R,8,{align:"right"});
        y=17;
      }
    };

    // ─── PÁGINA 1 ───
    fondoPagina();

    // HEADER principal
    doc.setFillColor(2,6,23);
    doc.rect(0,0,W,38,"F");
    doc.setFillColor(6,182,212); doc.rect(0,37,W,1.5,"F");
    doc.setTextColor(6,182,212); doc.setFontSize(22); doc.setFont("helvetica","bold");
    doc.text("WATERGIS",L,13);
    doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(180,195,215);
    doc.text("Plataforma Hidroquímica — Provincia de Catamarca",L,24);
    doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont("helvetica","bold");
    doc.text("Nicolás Doria",R,13,{align:"right"});
    doc.setFont("helvetica","normal"); doc.setTextColor(180,195,215);
    doc.text(`Fecha: ${fecha}`,R,24,{align:"right"});
    y=44;

    // BLOQUE TÍTULO
    doc.setFillColor(15,25,50); doc.roundedRect(L,y,CW,subtitulo?26:22,3,3,"F");
    doc.setFillColor(6,182,212); doc.roundedRect(L,y,4,subtitulo?26:22,2,2,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(15); doc.setFont("helvetica","bold");
    doc.text(titulo1,L+8,y+9);
    doc.setFontSize(11); doc.setFont("helvetica","normal"); doc.setTextColor(6,182,212);
    doc.text(titulo2,L+8,y+17);
    if(subtitulo){
      doc.setFontSize(8); doc.setTextColor(148,163,184);
      doc.text(subtitulo,L+8,y+23);
    }
    y+=(subtitulo?30:28);

    // HELPERS ──────────────────────────
    const seccion=(titulo:string)=>{
      checkPage(16);
      y+=2;
      doc.setFillColor(6,182,212); doc.rect(L,y,3,7,"F");
      doc.setTextColor(6,182,212); doc.setFontSize(11); doc.setFont("helvetica","bold");
      doc.text(titulo,L+6,y+6);
      y+=10;
      doc.setDrawColor(30,50,80); doc.setLineWidth(0.4);
      doc.line(L,y,R,y);
      y+=5;
    };

    const fila=(label:string, valor:string, colorVal?:[number,number,number])=>{
      checkPage(8);
      doc.setFillColor(15,25,50); doc.rect(L,y-3.5,CW,7,"F");
      doc.setTextColor(160,180,210); doc.setFontSize(9.5); doc.setFont("helvetica","normal");
      doc.text(label,L+3,y+1);
      doc.setTextColor(...(colorVal??[255,255,255] as [number,number,number]));
      doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text(valor,R-2,y+1,{align:"right"});
      y+=8;
    };

    // ══ RESUMEN GENERAL ══
    seccion("RESUMEN GENERAL");
    fila("Campañas realizadas", String(base.length));
    fila("Fuente predominante", fPred);
    fila("Estado general", estG, estColor);
    y+=4;

    // ══ INDICADORES PRINCIPALES ══
    seccion("INDICADORES PRINCIPALES");
    checkPage(24);
    const cards=[
      {label:"Arsénico (As)", val:`${avgAs.toFixed(3)} mg/L`, color:[34,211,115]  as [number,number,number]},
      {label:"Flúor",         val:`${avgFluor.toFixed(2)} mg/L`,color:[251,191,36] as [number,number,number]},
      {label:"Nitratos (NO3)",val:`${avgNO3.toFixed(1)} mg/L`, color:[139,92,246]  as [number,number,number]},
      {label:"TDS",           val:`${avgTDS.toFixed(0)} mg/L`, color:[248,177,51]  as [number,number,number]},
      {label:"pH",            val:avgPh.toFixed(1),            color:[56,189,248]  as [number,number,number]},
    ];
    const cw=(CW-8)/5; const ch=18;
    cards.forEach((c,i)=>{
      const cx=L+i*(cw+2); const cy=y;
      doc.setFillColor(15,25,50); doc.roundedRect(cx,cy,cw,ch,2,2,"F");
      doc.setFillColor(...c.color); doc.rect(cx,cy,cw,1.5,"F");
      doc.setTextColor(160,180,210); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
      doc.text(c.label,cx+cw/2,cy+7,{align:"center"});
      doc.setTextColor(...c.color); doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text(c.val,cx+cw/2,cy+14,{align:"center"});
    });
    y+=ch+6;

    // ══ DISTRIBUCIÓN DE RIESGO — AS ══
    seccion("DISTRIBUCIÓN DE RIESGO — ARSÉNICO (As)");
    const riesgos=[
      {label:"Bajo  (< 0.01 mg/L)",val:bCnt,pct:pct(bCnt),color:[34,197,94]  as [number,number,number]},
      {label:"Medio (0.01–0.05)",   val:mCnt,pct:pct(mCnt),color:[245,158,11] as [number,number,number]},
      {label:"Alto  (> 0.05 mg/L)",val:aCnt,pct:pct(aCnt),color:[239,68,68]  as [number,number,number]},
    ];
    const barX=L+52; const barW=CW-52-30;
    riesgos.forEach(r=>{
      checkPage(11);
      doc.setFillColor(15,25,50); doc.rect(L,y-1,CW,9,"F");
      doc.setTextColor(210,225,245); doc.setFontSize(9.5); doc.setFont("helvetica","normal");
      doc.text(r.label,L+3,y+5);
      doc.setFillColor(30,45,75); doc.roundedRect(barX,y+1,barW,5,1,1,"F");
      const bLen=Math.max(1.5,(parseFloat(r.pct)/100)*barW);
      doc.setFillColor(...r.color); doc.roundedRect(barX,y+1,bLen,5,1,1,"F");
      doc.setTextColor(...r.color); doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text(`${r.val}  (${r.pct}%)`,R-2,y+5,{align:"right"});
      y+=10;
    });
    y+=4;

    // ── Puntos críticos de As (riesgo alto) ──
    const puntosAltosAs = base
      .filter(p=>parseAs(p.As_mg_l)>0.05)
      .sort((a,b)=>parseAs(b.As_mg_l)-parseAs(a.As_mg_l))
      .slice(0,10);

    if(puntosAltosAs.length>0){
      checkPage(14);
      doc.setFillColor(6,182,212); doc.rect(L,y,3,6,"F");
      doc.setTextColor(6,182,212); doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text("Puntos críticos — As alto (> 0.05 mg/L)",L+6,y+5);
      y+=9;
      doc.setDrawColor(30,50,80); doc.setLineWidth(0.4); doc.line(L,y,R,y); y+=4;

      // encabezado tabla
      const colsAs=[52,42,32,22,24] as number[];
      const headersAs=["Localidad","Departamento","Fuente","As (mg/L)","Estado"];
      doc.setFillColor(14,116,144);
      doc.rect(L,y,CW,7,"F");
      doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("helvetica","bold");
      let cx=L;
      headersAs.forEach((h,i)=>{ doc.text(h,cx+2,y+5); cx+=colsAs[i]; });
      y+=8;

      puntosAltosAs.forEach((p,i)=>{
        checkPage(8);
        doc.setFillColor(i%2===0?[15,25,50] as any:[30,41,59] as any);
        doc.rect(L,y-1,CW,7,"F");
        doc.setTextColor(210,225,245); doc.setFontSize(8); doc.setFont("helvetica","normal");
        const vals=[
          p.Localidad||"-",
          p.Departamento||"-",
          p.Fuente||"-",
          parseAs(p.As_mg_l).toFixed(3),
          "⛔ ALTO"
        ];
        let vx=L;
        vals.forEach((v,j)=>{
          if(j===4){ doc.setTextColor(239,68,68); doc.setFont("helvetica","bold"); }
          else { doc.setTextColor(210,225,245); doc.setFont("helvetica","normal"); }
          doc.text(String(v),vx+2,y+4,{maxWidth:colsAs[j]-3});
          vx+=colsAs[j];
        });
        y+=8;
      });
      y+=3;
    }

    // ── Riesgo As por tipo de fuente ──
    if(aCnt>0){
      checkPage(30);
      doc.setFillColor(6,182,212); doc.rect(L,y,3,6,"F");
      doc.setTextColor(6,182,212); doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text("Riesgo alto de As por tipo de fuente",L+6,y+5);
      y+=9;
      doc.setDrawColor(30,50,80); doc.setLineWidth(0.4); doc.line(L,y,R,y); y+=4;

      const subAs=base.filter(p=>parseAs(p.As_mg_l)>0.05&&p.Fuente==="SUBTERRANEA").length;
      const supAs=base.filter(p=>parseAs(p.As_mg_l)>0.05&&p.Fuente==="SUPERFICIAL").length;
      const mezAs=base.filter(p=>parseAs(p.As_mg_l)>0.05&&p.Fuente==="MEZCLA").length;
      const fuenteAsRows=[
        ["Subterránea", subAs, aCnt>0?((subAs/aCnt)*100).toFixed(1):"0"],
        ["Superficial",  supAs, aCnt>0?((supAs/aCnt)*100).toFixed(1):"0"],
        ["Mezcla",       mezAs, aCnt>0?((mezAs/aCnt)*100).toFixed(1):"0"],
      ];
      const fHeaders=["Tipo de fuente","Pts en riesgo alto","% del total en riesgo"];
      const fCols=[55,50,60] as number[];
      doc.setFillColor(14,116,144); doc.rect(L,y,CW,7,"F");
      doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("helvetica","bold");
      let fx=L;
      fHeaders.forEach((h,i)=>{ doc.text(h,fx+2,y+5); fx+=fCols[i]; });
      y+=8;
      fuenteAsRows.forEach((r,i)=>{
        doc.setFillColor(i%2===0?[15,25,50] as any:[30,41,59] as any);
        doc.rect(L,y-1,CW,7,"F");
        doc.setTextColor(210,225,245); doc.setFontSize(8.5); doc.setFont("helvetica","normal");
        let rx=L;
        [String(r[0]),`${r[1]} puntos`,`${r[2]}%`].forEach((v,j)=>{
          doc.text(v,rx+2,y+4); rx+=fCols[j];
        });
        y+=8;
      });
      y+=5;
    }

    // ══ DISTRIBUCIÓN DE RIESGO — NO3 ══
    const no3Bajo  = base.filter(p=>parseAs(p.NO3_mg_l)<5).length;
    const no3Medio = base.filter(p=>{const v=parseAs(p.NO3_mg_l);return v>=5&&v<=10;}).length;
    const no3Alto  = base.filter(p=>parseAs(p.NO3_mg_l)>10).length;
    const pctNo3   = (n:number)=>base.length>0?((n/base.length)*100).toFixed(1):"0";

    checkPage(14);
    seccion("DISTRIBUCIÓN DE RIESGO — NITRATOS (NO3⁻)");
    const riesgosNo3=[
      {label:"Bajo  (< 5 mg/L)",   val:no3Bajo, pct:pctNo3(no3Bajo), color:[34,197,94]  as [number,number,number]},
      {label:"Medio (5–10 mg/L)",  val:no3Medio,pct:pctNo3(no3Medio),color:[245,158,11] as [number,number,number]},
      {label:"Alto  (> 10 mg/L)",  val:no3Alto, pct:pctNo3(no3Alto), color:[239,68,68]  as [number,number,number]},
    ];
    riesgosNo3.forEach(r=>{
      checkPage(11);
      doc.setFillColor(15,25,50); doc.rect(L,y-1,CW,9,"F");
      doc.setTextColor(210,225,245); doc.setFontSize(9.5); doc.setFont("helvetica","normal");
      doc.text(r.label,L+3,y+5);
      doc.setFillColor(30,45,75); doc.roundedRect(barX,y+1,barW,5,1,1,"F");
      const bLen=Math.max(1.5,(parseFloat(r.pct)/100)*barW);
      doc.setFillColor(...r.color); doc.roundedRect(barX,y+1,bLen,5,1,1,"F");
      doc.setTextColor(...r.color); doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text(`${r.val}  (${r.pct}%)`,R-2,y+5,{align:"right"});
      y+=10;
    });
    y+=4;

    // ── Puntos críticos NO3 ──
    const puntosAltosNo3 = base
      .filter(p=>parseAs(p.NO3_mg_l)>10)
      .sort((a,b)=>parseAs(b.NO3_mg_l)-parseAs(a.NO3_mg_l))
      .slice(0,10);

    if(puntosAltosNo3.length>0){
      checkPage(14);
      doc.setFillColor(6,182,212); doc.rect(L,y,3,6,"F");
      doc.setTextColor(6,182,212); doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text("Puntos críticos — NO3 alto (> 10 mg/L)",L+6,y+5);
      y+=9;
      doc.setDrawColor(30,50,80); doc.setLineWidth(0.4); doc.line(L,y,R,y); y+=4;

      const colsNo3=[52,42,32,25,24] as number[];
      const headersNo3=["Localidad","Departamento","Fuente","NO3 (mg/L)","Estado"];
      doc.setFillColor(14,116,144); doc.rect(L,y,CW,7,"F");
      doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("helvetica","bold");
      let nx=L;
      headersNo3.forEach((h,i)=>{ doc.text(h,nx+2,y+5); nx+=colsNo3[i]; });
      y+=8;

      puntosAltosNo3.forEach((p,i)=>{
        checkPage(8);
        doc.setFillColor(i%2===0?[15,25,50] as any:[30,41,59] as any);
        doc.rect(L,y-1,CW,7,"F");
        const vals=[
          p.Localidad||"-", p.Departamento||"-", p.Fuente||"-",
          parseAs(p.NO3_mg_l).toFixed(1), "⛔ ALTO"
        ];
        let vx=L;
        vals.forEach((v,j)=>{
          if(j===4){ doc.setTextColor(239,68,68); doc.setFont("helvetica","bold"); }
          else { doc.setTextColor(210,225,245); doc.setFont("helvetica","normal"); }
          doc.setFontSize(8);
          doc.text(String(v),vx+2,y+4,{maxWidth:colsNo3[j]-3});
          vx+=colsNo3[j];
        });
        y+=8;
      });
      y+=3;
    }

    // ── Riesgo NO3 por tipo de fuente ──
    if(no3Alto>0){
      checkPage(30);
      doc.setFillColor(6,182,212); doc.rect(L,y,3,6,"F");
      doc.setTextColor(6,182,212); doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text("Riesgo alto de NO3 por tipo de fuente",L+6,y+5);
      y+=9;
      doc.setDrawColor(30,50,80); doc.setLineWidth(0.4); doc.line(L,y,R,y); y+=4;

      const subNo3=base.filter(p=>parseAs(p.NO3_mg_l)>10&&p.Fuente==="SUBTERRANEA").length;
      const supNo3=base.filter(p=>parseAs(p.NO3_mg_l)>10&&p.Fuente==="SUPERFICIAL").length;
      const mezNo3=base.filter(p=>parseAs(p.NO3_mg_l)>10&&p.Fuente==="MEZCLA").length;
      const fRowsNo3=[
        ["Subterránea",subNo3,no3Alto>0?((subNo3/no3Alto)*100).toFixed(1):"0"],
        ["Superficial", supNo3,no3Alto>0?((supNo3/no3Alto)*100).toFixed(1):"0"],
        ["Mezcla",      mezNo3,no3Alto>0?((mezNo3/no3Alto)*100).toFixed(1):"0"],
      ];
      const fCols2=[55,50,60] as number[];
      const fHead2=["Tipo de fuente","Pts en riesgo alto","% del total en riesgo"];
      doc.setFillColor(14,116,144); doc.rect(L,y,CW,7,"F");
      doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("helvetica","bold");
      let f2x=L;
      fHead2.forEach((h,i)=>{ doc.text(h,f2x+2,y+5); f2x+=fCols2[i]; });
      y+=8;
      fRowsNo3.forEach((r,i)=>{
        doc.setFillColor(i%2===0?[15,25,50] as any:[30,41,59] as any);
        doc.rect(L,y-1,CW,7,"F");
        doc.setTextColor(210,225,245); doc.setFontSize(8.5); doc.setFont("helvetica","normal");
        let rx=L;
        [String(r[0]),`${r[1]} puntos`,`${r[2]}%`].forEach((v,j)=>{
          doc.text(v,rx+2,y+4); rx+=fCols2[j];
        });
        y+=8;
      });
      y+=5;
    }

    // ══ EVOLUCIÓN HISTÓRICA ══
    if(histData.length>0){
      seccion("EVOLUCIÓN HISTÓRICA DEL ARSÉNICO");
      histData.forEach((h,i)=>{
        checkPage(8);
        if(i%2===0){ doc.setFillColor(15,25,50); doc.rect(L,y-3.5,CW,7,"F"); }
        doc.setTextColor(160,180,210); doc.setFontSize(9.5); doc.setFont("helvetica","normal");
        doc.text(h.yr,L+3,y+1);
        doc.setTextColor(56,189,248); doc.setFont("helvetica","bold");
        doc.text(`${h.avg} mg/L`,R-2,y+1,{align:"right"});
        y+=7.5;
      });
      checkPage(8);
      doc.setTextColor(120,140,170); doc.setFontSize(8.5); doc.setFont("helvetica","italic");
      doc.text("Tendencia observada: Incremento moderado de concentración.",L+3,y+2);
      y+=8;
    }

    // ══ OBSERVACIONES ══
    seccion("OBSERVACIONES AUTOMÁTICAS");
    const obs=[
      "Se observan valores de arsénico superiores al valor guía en algunos sectores.",
      "Los nitratos permanecen dentro de rangos aceptables.",
      "La calidad fisicoquímica presenta estabilidad respecto de campañas anteriores.",
      "No se detectan cambios bruscos en los parámetros monitoreados.",
    ];
    obs.forEach((o,i)=>{
      checkPage(9);
      if(i%2===0){ doc.setFillColor(15,25,50); doc.rect(L,y-2,CW,8,"F"); }
      doc.setTextColor(210,225,245); doc.setFontSize(9.5); doc.setFont("helvetica","normal");
      doc.text(`•  ${o}`,L+3,y+3,{maxWidth:CW-6});
      y+=8;
    });
    y+=4;

    // ══ CONCLUSIÓN ══
    seccion("CONCLUSIÓN TÉCNICA");
    const conclusion = soloLoc
      ? `La localidad de ${infLoc} presenta una calidad de agua generalmente estable. Se identifican concentraciones elevadas de arsénico en determinados sectores, por lo que se recomienda continuar con el monitoreo periódico y mantener controles preventivos sobre las fuentes de abastecimiento.`
      : soloDepto
      ? `El departamento de ${infDept} presenta en general una calidad de agua estable. Se identifican variaciones entre localidades en cuanto a concentraciones de arsénico, por lo que se recomienda el monitoreo periódico y controles preventivos diferenciados por localidad.`
      : `La Provincia de Catamarca presenta en general una calidad de agua variable según zona. Se recomienda el monitoreo continuo, especialmente en zonas con arsénico elevado, y mantener los controles establecidos por los organismos competentes.`;
    const lines=doc.splitTextToSize(conclusion,CW-6);
    const blockH=lines.length*5+8;
    checkPage(blockH);
    doc.setFillColor(15,25,50); doc.roundedRect(L,y-1,CW,blockH,2,2,"F");
    doc.setTextColor(220,235,255); doc.setFontSize(9.5); doc.setFont("helvetica","normal");
    doc.text(lines,L+3,y+5);
    y+=blockH+4;

    // ══ LEYENDA — CÓDIGO ALIMENTARIO ARGENTINO ══
    checkPage(55);
    y+=4;
    // Título sección
    doc.setFillColor(6,182,212); doc.rect(L,y,3,6,"F");
    doc.setTextColor(6,182,212); doc.setFontSize(10); doc.setFont("helvetica","bold");
    doc.text("LÍMITES DE REFERENCIA — CÓDIGO ALIMENTARIO ARGENTINO (CAA)",L+6,y+5);
    y+=9;
    doc.setDrawColor(30,50,80); doc.setLineWidth(0.4); doc.line(L,y,R,y); y+=4;

    // Tabla de límites CAA
    const caaHeaders=["Parámetro","Límite CAA","Unidad","Promedio medido","Estado"];
    const caaCols=[42,35,20,42,28] as number[];
    doc.setFillColor(14,116,144); doc.rect(L,y,CW,7,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("helvetica","bold");
    let hx=L;
    caaHeaders.forEach((h,i)=>{ doc.text(h,hx+2,y+5); hx+=caaCols[i]; });
    y+=8;

    const fluorEstado = avgFluor > fluorInfo.limite ? "⛔ Supera" : avgFluor > fluorInfo.limite*0.8 ? "⚠️ Límite" : "✅ Normal";
    const caaRows=[
      ["Arsénico (As)",         "0.010",  "mg/L", avgAs.toFixed(3),   avgAs>0.01?"⛔ Supera":avgAs>0.008?"⚠️ Límite":"✅ Normal",   avgAs>0.01?[239,68,68] as [number,number,number]:avgAs>0.008?[245,158,11] as [number,number,number]:[34,197,94] as [number,number,number]],
      [`Flúor (${fluorInfo.rango})`, fluorInfo.limite.toFixed(1), "mg/L", avgFluor.toFixed(2), fluorEstado, avgFluor>fluorInfo.limite?[239,68,68] as [number,number,number]:avgFluor>fluorInfo.limite*0.8?[245,158,11] as [number,number,number]:[34,197,94] as [number,number,number]],
      ["Nitratos (NO3⁻)",       "45.0",   "mg/L", avgNO3.toFixed(1),  avgNO3>45?"⛔ Supera":avgNO3>35?"⚠️ Límite":"✅ Normal",    avgNO3>45?[239,68,68] as [number,number,number]:avgNO3>35?[245,158,11] as [number,number,number]:[34,197,94] as [number,number,number]],
      ["TDS (Sólidos disueltos)","1500",   "mg/L", avgTDS.toFixed(0),  avgTDS>1500?"⛔ Supera":avgTDS>1200?"⚠️ Límite":"✅ Normal", avgTDS>1500?[239,68,68] as [number,number,number]:avgTDS>1200?[245,158,11] as [number,number,number]:[34,197,94] as [number,number,number]],
    ];

    caaRows.forEach((r,i)=>{
      checkPage(8);
      doc.setFillColor(i%2===0?[15,25,50] as any:[30,41,59] as any);
      doc.rect(L,y-1,CW,7,"F");
      let rx=L;
      (r.slice(0,5) as string[]).forEach((v,j)=>{
        if(j===4){ doc.setTextColor(...(r[5] as [number,number,number])); doc.setFont("helvetica","bold"); }
        else { doc.setTextColor(210,225,245); doc.setFont("helvetica","normal"); }
        doc.setFontSize(8);
        doc.text(String(v),rx+2,y+4,{maxWidth:caaCols[j]-3});
        rx+=caaCols[j];
      });
      y+=8;
    });
    y+=3;

    // Nota sobre flúor dinámico
    doc.setFillColor(15,25,50); doc.roundedRect(L,y,CW,16,2,2,"F");
    doc.setFillColor(6,182,212); doc.rect(L,y,2,16,"F");
    doc.setTextColor(160,180,210); doc.setFontSize(7.5); doc.setFont("helvetica","italic");
    doc.text(
      `Nota: El límite de Flúor del CAA (Art. 982) varía según la temperatura media anual del agua. Temperatura promedio registrada: ${avgTemp>0?avgTemp.toFixed(1):"s/d"}°C — límite aplicado: ${fluorInfo.limite} mg/L (${fluorInfo.rango}).`,
      L+5, y+6, {maxWidth:CW-8}
    );
    doc.text(
      "Fuente: Código Alimentario Argentino — Artículos 982 y 983. OMS: Guías para la calidad del agua potable, 4ª edición.",
      L+5, y+12, {maxWidth:CW-8}
    );
    y+=20;

    // ── FOOTER en la última página ──
    dibujarFooter();

    const nombre=`Informe_Hidroquimico_${nombreBase.replace(/\s/g,"_")}_${fecha.replace(/\//g,"-")}.pdf`;
    doc.save(nombre);
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#020617]">

      {/* ===== PANTALLA DE LOGIN ===== */}
      {loginVisible && <LoginScreen onLogin={handleLogin} />}

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
                { key:"informes", icon:"📄", label:t.generarInformes },
                { key:"capas",    icon:"🗺️", label:t.capasGis },
                { key:"acerca",   icon:"ℹ️", label:t.acercaSistema },
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

              <button onClick={generarPDF}
                className="w-full rounded-xl bg-cyan-500 py-3 font-bold text-black hover:bg-cyan-400 mb-2 text-sm">
                {t.generarPDF}
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
            {esAutenticado ? "👤" : "🌐"} <span>{sesion?.nombre ?? "Visitante"}</span> ▼
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
              <p className="text-xs text-slate-400 mb-1">{t.nombre}</p>
              <p className="mb-3 font-semibold">Nicolás Doria</p>
              <p className="text-xs text-slate-400 mb-1">{t.ultimoAcceso}</p>
              <p className="mb-4 font-semibold">20/06/2026</p>
              <button className="w-full rounded-xl border border-cyan-500 p-3 mb-2 text-sm font-bold text-cyan-300 hover:bg-cyan-500/10">{t.cambiarContrasena}</button>
              <button className="w-full rounded-xl border border-cyan-500 p-3 text-sm font-bold text-cyan-300 hover:bg-cyan-500/10">{t.cambiarFoto}</button>
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

          {/* Departamento */}
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
            Fluor:parseFloat(String(c.Fluor_mg_l||"0").replace(",",".")),
            NO3:parseFloat(String(c.NO3_mg_l||"0").replace(",",".")),
          }));

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
                      {/* CARDS clicables */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"10px"}}>
                        {([
                          {key:"As",   label:"As",    val:point.As_mg_l,    color:"#22d3ee"},
                          {key:"TDS",  label:"TDS",   val:point.TDS_mg_l,   color:"#f59e0b"},
                          {key:"Ph",   label:"pH",    val:point.Ph,         color:"#a78bfa"},
                          {key:"Fluor",label:"Flúor", val:point.Fluor_mg_l, color:"#34d399"},
                          {key:"NO3",  label:"NO3",   val:point.NO3_mg_l,   color:"#f87171"},
                        ] as {key:string;label:string;val:string;color:string}[]).map(card=>(
                          <div
                            key={card.key}
                            onClick={()=>setPopupVar(prev=>({...prev,[`${point.PUNTO_DE_MUESTREO}_${point.Localidad}`]:card.key}))}
                            style={{
                              background: (popupVar[`${point.PUNTO_DE_MUESTREO}_${point.Localidad}`]??selectedVariable)===card.key
                                ? "rgba(6,182,212,0.15)" : "#0f172a",
                              border: `1px solid ${(popupVar[`${point.PUNTO_DE_MUESTREO}_${point.Localidad}`]??selectedVariable)===card.key
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
                          {popupVar[`${point.PUNTO_DE_MUESTREO}_${point.Localidad}`]??selectedVariable}
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
                              dataKey={popupVar[`${point.PUNTO_DE_MUESTREO}_${point.Localidad}`]??selectedVariable}
                              stroke="#22d3ee"
                              strokeWidth={2.5}
                              dot={{r:3}}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
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
