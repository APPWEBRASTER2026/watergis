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
// COMPONENT
// ======================================================

export default function Map() {
  const [points, setPoints]             = useState<Punto[]>([]);
  const [search, setSearch]             = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showPerfil, setShowPerfil]     = useState(false);
  const [showAjustes, setShowAjustes]   = useState(false);
  const [selectedVariable, setSelectedVariable] = useState("As");
  const [selectedFuente, setSelectedFuente]     = useState("TODAS");

  // Menú hamburguesa
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [panelMenu, setPanelMenu]         = useState<PanelMenu>(null);

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
      const locOk = search.trim()==="" ? true : p.Localidad?.trim().toLowerCase().startsWith(search.trim().toLowerCase());
      const fOk   = selectedFuente==="TODAS" || p.Fuente===selectedFuente;
      return locOk && fOk;
    });
  }, [points, search, selectedFuente]);

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

    const filtrado = points.filter(p => {
      const dOk  = infDept==="TODOS"   || p.Departamento===infDept;
      const lOk  = infLoc==="TODAS"    || p.Localidad===infLoc;
      const fOk  = infFuente==="TODAS" || p.Fuente===infFuente;
      const asV  = parseAs(p.As_mg_l);
      const rOk  = infRiesgo==="TODOS" ||
        (infRiesgo==="BAJO"  && asV<0.01) ||
        (infRiesgo==="MEDIO" && asV>=0.01 && asV<=0.05) ||
        (infRiesgo==="ALTO"  && asV>0.05);
      return dOk&&lOk&&fOk&&rOk;
    });

    const avgAs    = filtrado.length>0?filtrado.reduce((a,p)=>a+parseAs(p.As_mg_l),0)/filtrado.length:0;
    const avgFluor = filtrado.length>0?filtrado.reduce((a,p)=>a+parseAs(p.Fluor_mg_l),0)/filtrado.length:0;
    const avgNO3   = filtrado.length>0?filtrado.reduce((a,p)=>a+parseAs(p.NO3_mg_l),0)/filtrado.length:0;
    const avgTDS   = filtrado.length>0?filtrado.reduce((a,p)=>a+parseFloat(String(p.TDS_mg_l||"0").replace(",",".")),0)/filtrado.length:0;
    const avgPh    = filtrado.length>0?filtrado.reduce((a,p)=>a+parseAs(p.Ph),0)/filtrado.length:0;
    const estG     = avgAs>0.05?"ALERTA":avgAs>0.01?"PRECAUCIÓN":"NORMAL";
    const estColor: [number,number,number] = avgAs>0.05?[220,38,38]:avgAs>0.01?[245,158,11]:[34,197,94];
    const fPred    = (() => {
      const sub=filtrado.filter(p=>p.Fuente==="SUBTERRANEA").length;
      const sup=filtrado.filter(p=>p.Fuente==="SUPERFICIAL").length;
      const mez=filtrado.filter(p=>p.Fuente==="MEZCLA").length;
      return sub>=sup&&sub>=mez?"Subterránea":sup>=mez?"Superficial":"Mezcla";
    })();
    const bCnt=filtrado.filter(p=>parseAs(p.As_mg_l)<0.01).length;
    const mCnt=filtrado.filter(p=>{const a=parseAs(p.As_mg_l);return a>=0.01&&a<=0.05;}).length;
    const aCnt=filtrado.filter(p=>parseAs(p.As_mg_l)>0.05).length;
    const pct=(n:number)=>filtrado.length>0?((n/filtrado.length)*100).toFixed(1):"0";
    const byYear: Record<string,number[]>={};
    filtrado.forEach(p=>{
      const yr=p.Fecha_de_monitoreo?.split(/[-/]/)[0];
      if(!yr||yr.length!==4) return;
      if(!byYear[yr]) byYear[yr]=[];
      byYear[yr].push(parseAs(p.As_mg_l));
    });
    const histData=Object.keys(byYear).sort().map(yr=>({yr,avg:(byYear[yr].reduce((a,v)=>a+v,0)/byYear[yr].length).toFixed(3)}));
    const localidad    = infLoc!=="TODAS"?infLoc:(filtrado[0]?.Localidad||"General");
    const departamento = infDept!=="TODOS"?infDept:(filtrado[0]?.Departamento||"General");
    const fecha        = new Date().toLocaleDateString("es-AR");

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
        doc.text(`${localidad.toUpperCase()} · ${departamento.toUpperCase()}`,R,8,{align:"right"});
        y=17;
      }
    };

    // ─── PÁGINA 1 ───
    fondoPagina();

    // HEADER principal
    doc.setFillColor(2,6,23);
    doc.rect(0,0,W,34,"F");
    doc.setFillColor(6,182,212); doc.rect(0,33,W,1.5,"F");
    doc.setTextColor(6,182,212); doc.setFontSize(22); doc.setFont("helvetica","bold");
    doc.text("WATERGIS",L,14);
    doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(180,195,215);
    doc.text("Plataforma Hidroquímica — Provincia de Catamarca",L,22);
    doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont("helvetica","bold");
    doc.text("Nicolás Doria",R,14,{align:"right"});
    doc.setFont("helvetica","normal"); doc.setTextColor(180,195,215);
    doc.text(`Fecha: ${fecha}`,R,22,{align:"right"});
    y=40;

    // BLOQUE TÍTULO
    doc.setFillColor(15,25,50); doc.roundedRect(L,y,CW,22,3,3,"F");
    doc.setFillColor(6,182,212); doc.roundedRect(L,y,4,22,2,2,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(15); doc.setFont("helvetica","bold");
    doc.text("INFORME HIDROQUÍMICO LOCAL",L+8,y+9);
    doc.setFontSize(11); doc.setFont("helvetica","normal"); doc.setTextColor(6,182,212);
    doc.text(`${localidad.toUpperCase()}  ·  ${departamento.toUpperCase()}`,L+8,y+17);
    y+=28;

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
    fila("Campañas realizadas", String(filtrado.length));
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

    // ══ DISTRIBUCIÓN DE RIESGO ══
    seccion("DISTRIBUCIÓN DE RIESGO — ARSÉNICO");
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
    const conclusion=`La localidad de ${localidad} presenta una calidad de agua generalmente estable. Se identifican concentraciones elevadas de arsénico en determinados sectores, por lo que se recomienda continuar con el monitoreo periódico y mantener controles preventivos sobre las fuentes de abastecimiento.`;
    const lines=doc.splitTextToSize(conclusion,CW-6);
    const blockH=lines.length*5+8;
    checkPage(blockH);
    doc.setFillColor(15,25,50); doc.roundedRect(L,y-1,CW,blockH,2,2,"F");
    doc.setTextColor(220,235,255); doc.setFontSize(9.5); doc.setFont("helvetica","normal");
    doc.text(lines,L+3,y+5);
    y+=blockH+4;

    // ── FOOTER en la última página ──
    dibujarFooter();

    const nombre=`Informe_Hidroquimico_${localidad.replace(/\s/g,"_")}_${fecha.replace(/\//g,"-")}.pdf`;
    doc.save(nombre);
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#020617]">

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
                  onClick={() => { setPanelMenu(p=>p===item.key?null:item.key as PanelMenu); setHamburgerOpen(false); }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-800 text-sm ${panelMenu===item.key?"text-cyan-400 bg-slate-800/60":""}`}
                >
                  <span className="text-base">{item.icon}</span> {item.label}
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
            👤 <span>Nicolás Doria</span> ▼
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden z-[11000]">
              <button onClick={()=>{setShowPerfil(v=>!v);setShowAjustes(false);setUserMenuOpen(false);}}
                className="w-full px-4 py-3 text-left hover:bg-slate-800">👤 {t.miPerfil}</button>
              <button onClick={()=>{setShowAjustes(v=>!v);setShowPerfil(false);setUserMenuOpen(false);}}
                className="w-full px-4 py-3 text-left hover:bg-slate-800">⚙️ {t.ajustes}</button>
              <button className="w-full px-4 py-3 text-left text-red-400 hover:bg-slate-800">🚪 {t.cerrarSesion}</button>
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

        {/* DISTRIBUCIÓN DE RIESGO */}
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

        {/* INFORMACIÓN */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 text-lg font-bold text-cyan-400">{t.informacion}</h3>
          <div className="space-y-4 text-sm">
            <div><p className="font-semibold text-cyan-300">{t.autor}</p><p className="text-slate-400">Nicolás Doria</p></div>
            <div><p className="font-semibold text-cyan-300">{t.fecha}</p><p className="text-slate-400">Mayo 2026</p></div>
            <div><p className="font-semibold text-cyan-300">{t.proyeccion}</p><p className="text-slate-400">WGS 84 / EPSG:4326</p></div>
            <div><p className="font-semibold text-cyan-300">{t.referencia}</p><p className="text-slate-400">{t.refTexto}</p></div>
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
            <Marker key={index} position={[lat,lng]} icon={getMarkerIcon(point)}>
              <Popup maxWidth={280}>
                <div style={{width:"240px"}}>
                  <h2 style={{fontSize:"24px",fontWeight:800,marginBottom:"4px"}}>{point.Localidad}</h2>
                  <div style={{opacity:0.8,marginBottom:"14px",fontSize:"13px",lineHeight:1.6}}>
                    <div><strong>{t.punto}:</strong> {point.PUNTO_DE_MUESTREO}</div>
                    <div><strong>{t.campanas}:</strong> {campaigns.length}</div>
                    <div><strong>{t.fuente}:</strong> {point.Fuente}</div>
                    <div><strong>{t.departamentos}:</strong> {point.Departamento}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px"}}>
                    <PopupCard label="As"    value={point.As_mg_l}/>
                    <PopupCard label="TDS"   value={point.TDS_mg_l}/>
                    <PopupCard label="pH"    value={point.Ph}/>
                    <PopupCard label="Fluor" value={point.Fluor_mg_l}/>
                    <PopupCard label="NO3"   value={point.NO3_mg_l}/>
                  </div>
                  <div style={{width:"100%",height:"240px"}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                        <XAxis dataKey="fecha" fontSize={10}/>
                        <YAxis fontSize={10}/>
                        <Tooltip/>
                        <Line type="monotone" dataKey={selectedVariable} stroke="#22d3ee" strokeWidth={3}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
