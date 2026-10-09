"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker        = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup         = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });

const SESSION_KEY = "watergis_session"; // misma sesión que ya usa Map.tsx / campo

type Sesion = { user: string; nombre: string; avatar?: string; acceso_perforaciones?: string };

type Perforacion = {
  id: number; nombre: string; establecimiento: string; provincia: string; departamento: string; localidad: string;
  uso_previsto: string; profundidad_total_m: string; potencia_bomba_hp: string; latitud: string; longitud: string;
  ultima_fecha?: string; nivel_estatico_m?: string; nivel_dinamico_m?: string; abatimiento_m?: string;
  caudal_actual_m3h?: string; conductividad_us_cm?: string; tds_mg_l?: string; presencia_arena?: string;
};

const num = (v: any) => parseFloat(String(v ?? "0").replace(",", ".")) || 0;

// Clasificación simple de alerta por pozo, basada en la última campaña cargada
function clasificarAlerta(p: Perforacion): { nivel: "OK"|"ATENCION"|"ALERTA"; color: string; motivo: string } {
  if (!p.ultima_fecha) return { nivel:"OK", color:"#22c55e", motivo:"Sin campañas cargadas todavía" };
  const arena = (p.presencia_arena||"").toUpperCase();
  if (arena === "SI") return { nivel:"ALERTA", color:"#ef4444", motivo:"Presencia de arena confirmada" };
  if (arena === "TRAZAS") return { nivel:"ATENCION", color:"#eab308", motivo:"Trazas de arena detectadas" };
  const abat = num(p.abatimiento_m);
  if (abat > 15) return { nivel:"ATENCION", color:"#eab308", motivo:`Abatimiento elevado (${abat} m)` };
  return { nivel:"OK", color:"#22c55e", motivo:"Dentro de parámetros normales" };
}

export default function PerforacionesPage() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [perforaciones, setPerforaciones] = useState<Perforacion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCampanaForm, setShowCampanaForm] = useState<Perforacion | null>(null);
  const [campanasSel, setCampanasSel] = useState<any[]>([]);
  const [L, setL] = useState<any>(null);
  useEffect(() => { import("leaflet").then((m: any) => setL(m.default || m)); }, []);
  const iconoColor = (color: string) => L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 8px ${color}"></div>`,
    iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10],
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) setSesion(JSON.parse(saved));
    } catch {}
    setCargandoSesion(false);
  }, []);

  const cargarPerforaciones = async () => {
    try {
      const res = await fetch("/api/perforaciones");
      const data = await res.json();
      if (data.ok) setPerforaciones(data.perforaciones);
    } catch {}
  };
  useEffect(() => { cargarPerforaciones(); }, []);

  const cargarCampanas = async (perforacionId: number) => {
    try {
      const res = await fetch(`/api/perforaciones/campanas?perforacion_id=${perforacionId}`);
      const data = await res.json();
      if (data.ok) setCampanasSel(data.campanas);
    } catch {}
  };

  const esAutenticado = !!sesion && sesion.user !== "publico";
  const esAdmin = esAutenticado && (
    ["nicolas.doria","admin","inspector1"].includes(sesion!.user) ||
    sesion?.acceso_perforaciones === "admin"
  );

  const enAlerta = useMemo(() => perforaciones.filter(p => clasificarAlerta(p).nivel !== "OK"), [perforaciones]);
  const caudalTotal = useMemo(() => perforaciones.reduce((acc,p) => acc + num(p.caudal_actual_m3h), 0), [perforaciones]);

  if (cargandoSesion) return null;

  if (!esAutenticado) {
    return (
      <div style={{minHeight:"100vh",background:"#020a0d",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
        <div style={{textAlign:"center",color:"#fff"}}>
          <div style={{fontSize:34,marginBottom:10}}>⛰️</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>PerforacionesGIS</div>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:16}}>Iniciá sesión desde WATERGIS para entrar a este módulo.</div>
          <a href="/" style={{color:"#22d3ee",fontSize:12}}>← Volver al login</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#020a0d",fontFamily:"sans-serif",color:"#e2e8f0"}}>
      <style>{`.tiles-oscuros{filter:invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.95) saturate(0.7);}`}</style>
      {/* HEADER */}
      <div style={{padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #1e293b"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{fontSize:14,fontWeight:700,color:"#fbbf24"}}>⛰️ PerforacionesGIS</div>
          <div style={{display:"flex",background:"#0f172a",borderRadius:8,padding:3}}>
            <a href="/" style={{color:"#64748b",fontSize:10,fontWeight:600,padding:"5px 12px",textDecoration:"none"}}>💧 Hidroquímica</a>
            <div style={{background:"#a16207",color:"#fff",fontSize:10,fontWeight:600,padding:"5px 12px",borderRadius:6}}>⛰️ Perforaciones</div>
          </div>
          {enAlerta.length>0 && (
            <span style={{display:"inline-flex",alignItems:"center",gap:6,borderRadius:20,border:"1px solid rgba(239,68,68,0.4)",background:"rgba(239,68,68,0.15)",padding:"4px 11px",fontSize:11,fontWeight:600,color:"#fca5a5"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#ef4444"}}></span>
              {enAlerta.length} {enAlerta.length===1?"pozo requiere atención":"pozos requieren atención"}
            </span>
          )}
        </div>
        {esAdmin && (
          <button onClick={()=>setShowForm(true)} style={{background:"#eab308",color:"#422006",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            ➕ Nueva perforación
          </button>
        )}
      </div>

      {/* DASHBOARD */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,padding:"16px 20px"}}>
        <div style={{background:"#0f172a",borderRadius:8,padding:12}}><div style={{fontSize:9,color:"#64748b"}}>Pozos activos</div><div style={{fontSize:20,fontWeight:700,color:"#fff"}}>{perforaciones.length}</div></div>
        <div style={{background:"#0f172a",borderRadius:8,padding:12}}><div style={{fontSize:9,color:"#64748b"}}>Requieren atención</div><div style={{fontSize:20,fontWeight:700,color:"#ef4444"}}>{enAlerta.length}</div></div>
        <div style={{background:"#0f172a",borderRadius:8,padding:12}}><div style={{fontSize:9,color:"#64748b"}}>Caudal total</div><div style={{fontSize:20,fontWeight:700,color:"#4ade80"}}>{caudalTotal.toFixed(0)} <span style={{fontSize:10}}>m³/h</span></div></div>
        <div style={{background:"#0f172a",borderRadius:8,padding:12}}><div style={{fontSize:9,color:"#64748b"}}>Potabilidad / Riego</div><div style={{fontSize:14,fontWeight:700,color:"#22d3ee"}}>
          {perforaciones.filter(p=>p.uso_previsto==="POTABLE").length} / {perforaciones.filter(p=>p.uso_previsto==="RIEGO").length}
        </div></div>
      </div>

      {/* MAPA */}
      <div style={{height:"60vh",margin:"0 20px 20px",borderRadius:12,overflow:"hidden",border:"1px solid #1e293b"}}>
        {L && <MapContainer center={[-28.46, -65.78]} zoom={9} style={{height:"100%",width:"100%"}}>
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" className="tiles-oscuros" />
          {perforaciones.map(p => {
            const lat = num(p.latitud), lng = num(p.longitud);
            if (!lat || !lng) return null;
            const alerta = clasificarAlerta(p);
            return (
              <Marker key={p.id} position={[lat,lng]} icon={iconoColor(alerta.color)}>
                <Popup minWidth={260}>
                  <div style={{fontFamily:"sans-serif"}}>
                    <div style={{fontWeight:700,fontSize:13}}>{p.nombre}</div>
                    <div style={{fontSize:10,color:"#64748b",marginBottom:6}}>{p.establecimiento} · {p.localidad}, {p.departamento}</div>
                    <div style={{background:alerta.color+"22",border:`1px solid ${alerta.color}`,borderRadius:6,padding:"5px 8px",fontSize:10,marginBottom:8}}>
                      <span style={{color:alerta.color,fontWeight:700}}>●</span> {alerta.motivo}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:8,fontSize:10}}>
                      <div>N. estático: <strong>{p.nivel_estatico_m||"-"} m</strong></div>
                      <div>N. dinámico: <strong>{p.nivel_dinamico_m||"-"} m</strong></div>
                      <div>Caudal: <strong>{p.caudal_actual_m3h||"-"} m³/h</strong></div>
                      <div>TDS: <strong>{p.tds_mg_l||"-"} mg/L</strong></div>
                    </div>
                    {esAdmin && (
                      <button onClick={()=>{ setShowCampanaForm(p); cargarCampanas(p.id); }} style={{width:"100%",background:"#eab308",color:"#422006",border:"none",borderRadius:6,padding:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                        + Agregar campaña
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>}
      </div>

      {/* MODAL: nueva perforación */}
      {showForm && <FormNuevaPerforacion usuario={sesion!.user} onClose={()=>setShowForm(false)} onGuardado={()=>{ setShowForm(false); cargarPerforaciones(); }} />}

      {/* MODAL: nueva campaña + evolución histórica */}
      {showCampanaForm && (
        <FormCampana
          perforacion={showCampanaForm}
          campanas={campanasSel}
          usuario={sesion!.user}
          onClose={()=>setShowCampanaForm(null)}
          onGuardado={()=>{ cargarPerforaciones(); cargarCampanas(showCampanaForm.id); }}
        />
      )}
    </div>
  );
}

function FormNuevaPerforacion({ usuario, onClose, onGuardado }: { usuario: string; onClose: ()=>void; onGuardado: ()=>void }) {
  const [form, setForm] = useState({
    nombre:"", establecimiento:"", provincia:"Catamarca", departamento:"", localidad:"",
    uso_previsto:"RIEGO", profundidad_total_m:"", diametro_perforacion_pulg:"", diametro_entubado_pulg:"",
    engravillado:"", potencia_bomba_hp:"", latitud:"", longitud:"",
  });
  const [error, setError] = useState("");
  const set = (k:string) => (e:any) => setForm(prev=>({...prev,[k]:e.target.value}));

  const guardar = async () => {
    setError("");
    if (!form.nombre || !form.departamento || !form.localidad || !form.latitud || !form.longitud) {
      setError("Completá al menos Nombre, Departamento, Localidad y Coordenadas."); return;
    }
    const res = await fetch("/api/perforaciones", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({...form, usuario}) });
    const data = await res.json();
    if (data.ok) onGuardado(); else setError(data.error||"No se pudo guardar.");
  };

  const inputCls = {width:"100%",border:"1px solid #334155",background:"#0f172a",borderRadius:8,padding:9,color:"#e2e8f0",fontSize:12,boxSizing:"border-box" as const};
  const labelCls = {fontSize:10,color:"#64748b",marginBottom:4,display:"block"};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{width:420,maxHeight:"85vh",overflowY:"auto",background:"#0a1622",border:"1px solid #1e293b",borderRadius:14,padding:20}}>
        <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:14}}>➕ Nueva perforación</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={labelCls}>Nombre / N° de pozo *</label><input style={inputCls} value={form.nombre} onChange={set("nombre")} placeholder="Pozo N°2 — Lote Norte"/></div>
          <div><label style={labelCls}>Establecimiento</label><input style={inputCls} value={form.establecimiento} onChange={set("establecimiento")} placeholder="Finca Los Olivos"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={labelCls}>Departamento *</label><input style={inputCls} value={form.departamento} onChange={set("departamento")}/></div>
          <div><label style={labelCls}>Localidad *</label><input style={inputCls} value={form.localidad} onChange={set("localidad")}/></div>
        </div>
        <div style={{marginBottom:8}}>
          <label style={labelCls}>Uso previsto *</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {["POTABLE","RIEGO"].map(op=>(
              <div key={op} onClick={()=>setForm(p=>({...p,uso_previsto:op}))} style={{textAlign:"center",padding:8,borderRadius:8,cursor:"pointer",fontSize:11,
                border:`1px solid ${form.uso_previsto===op?"#eab308":"#334155"}`, background: form.uso_previsto===op?"rgba(234,179,8,0.15)":"transparent",
                color: form.uso_previsto===op?"#fde68a":"#64748b"}}>
                {op==="POTABLE"?"🚰 Potable":"🌾 Riego"}
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={labelCls}>Profundidad (m)</label><input style={inputCls} value={form.profundidad_total_m} onChange={set("profundidad_total_m")}/></div>
          <div><label style={labelCls}>Diám. perf. (pulg)</label><input style={inputCls} value={form.diametro_perforacion_pulg} onChange={set("diametro_perforacion_pulg")}/></div>
          <div><label style={labelCls}>Diám. entub. (pulg)</label><input style={inputCls} value={form.diametro_entubado_pulg} onChange={set("diametro_entubado_pulg")}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={labelCls}>Engravillado</label><input style={inputCls} value={form.engravillado} onChange={set("engravillado")} placeholder="Grava silícea 2-4mm"/></div>
          <div><label style={labelCls}>Potencia bomba (HP)</label><input style={inputCls} value={form.potencia_bomba_hp} onChange={set("potencia_bomba_hp")}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          <div><label style={labelCls}>Latitud *</label><input style={inputCls} value={form.latitud} onChange={set("latitud")} placeholder="-28.4696"/></div>
          <div><label style={labelCls}>Longitud *</label><input style={inputCls} value={form.longitud} onChange={set("longitud")} placeholder="-65.7852"/></div>
        </div>
        {error && <div style={{color:"#fca5a5",fontSize:11,marginBottom:10,textAlign:"center"}}>{error}</div>}
        <div style={{display:"flex",gap:8}}>
          <div onClick={onClose} style={{flex:1,border:"1px solid #334155",borderRadius:8,padding:10,textAlign:"center",fontSize:12,color:"#94a3b8",cursor:"pointer"}}>Cancelar</div>
          <div onClick={guardar} style={{flex:1,background:"#eab308",borderRadius:8,padding:10,textAlign:"center",fontSize:12,fontWeight:700,color:"#422006",cursor:"pointer"}}>Guardar</div>
        </div>
      </div>
    </div>
  );
}

function FormCampana({ perforacion, campanas, usuario, onClose, onGuardado }: { perforacion: Perforacion; campanas: any[]; usuario: string; onClose: ()=>void; onGuardado: ()=>void }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0,10), hora:"", responsable:"",
    nivel_estatico_m:"", nivel_dinamico_m:"", abatimiento_m:"", tiempo_bombeo_h:"",
    caudal_actual_m3h:"", presion_boca_psi:"", consumo_motor_a:"", lectura_medidor_m3:"",
    temp_agua_c:"", ph:"", conductividad_us_cm:"", tds_mg_l:"", presencia_arena:"NO",
    nitratos_mg_l:"", ras:"", bacterias:"", notas:"",
  });
  const [error, setError] = useState("");
  const set = (k:string) => (e:any) => setForm(prev=>({...prev,[k]:e.target.value}));

  const chartData = campanas.map(c => ({
    fecha: c.fecha, nivel_dinamico: num(c.nivel_dinamico_m), caudal: num(c.caudal_actual_m3h),
  }));

  const guardar = async () => {
    setError("");
    if (!form.fecha) { setError("Falta la fecha."); return; }
    const res = await fetch("/api/perforaciones/campanas", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({...form, perforacion_id: perforacion.id, usuario}) });
    const data = await res.json();
    if (data.ok) onGuardado(); else setError(data.error||"No se pudo guardar.");
  };

  const inputCls = {width:"100%",border:"1px solid #334155",background:"#0f172a",borderRadius:7,padding:7,color:"#e2e8f0",fontSize:11,boxSizing:"border-box" as const};
  const labelCls = {fontSize:9,color:"#64748b",marginBottom:3,display:"block"};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{width:440,maxHeight:"88vh",overflowY:"auto",background:"#0a1622",border:"1px solid #1e293b",borderRadius:14,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{perforacion.nombre}</div>
        <div style={{fontSize:10,color:"#64748b",marginBottom:12}}>{campanas.length} campañas registradas</div>

        {chartData.length>1 && (
          <div style={{height:120,marginBottom:14,background:"#0f172a",borderRadius:8,padding:8}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="fecha" fontSize={8}/><YAxis fontSize={8}/><Tooltip/>
                <Line type="monotone" dataKey="nivel_dinamico" stroke="#eab308" strokeWidth={2} dot={{r:3}} name="N. Dinámico"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{fontSize:9,color:"#eab308",fontWeight:700,margin:"10px 0 6px"}}>NUEVA CAMPAÑA</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:7}}>
          <div><label style={labelCls}>Fecha</label><input type="date" style={inputCls} value={form.fecha} onChange={set("fecha")}/></div>
          <div><label style={labelCls}>Responsable</label><input style={inputCls} value={form.responsable} onChange={set("responsable")}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:7}}>
          <div><label style={labelCls}>N. Estático (m)</label><input style={inputCls} value={form.nivel_estatico_m} onChange={set("nivel_estatico_m")}/></div>
          <div><label style={labelCls}>N. Dinámico (m)</label><input style={inputCls} value={form.nivel_dinamico_m} onChange={set("nivel_dinamico_m")}/></div>
          <div><label style={labelCls}>Caudal (m³/h)</label><input style={inputCls} value={form.caudal_actual_m3h} onChange={set("caudal_actual_m3h")}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:7}}>
          <div><label style={labelCls}>pH</label><input style={inputCls} value={form.ph} onChange={set("ph")}/></div>
          <div><label style={labelCls}>Conduct. (µS/cm)</label><input style={inputCls} value={form.conductividad_us_cm} onChange={set("conductividad_us_cm")}/></div>
          <div><label style={labelCls}>TDS (mg/L)</label><input style={inputCls} value={form.tds_mg_l} onChange={set("tds_mg_l")}/></div>
        </div>
        <div style={{marginBottom:10}}>
          <label style={labelCls}>¿Presencia de arena?</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {["NO","TRAZAS","SI"].map(op=>(
              <div key={op} onClick={()=>setForm(p=>({...p,presencia_arena:op}))} style={{textAlign:"center",padding:7,borderRadius:6,cursor:"pointer",fontSize:10,
                border:`1px solid ${form.presencia_arena===op?"#eab308":"#334155"}`, background: form.presencia_arena===op?"rgba(234,179,8,0.15)":"transparent",
                color: form.presencia_arena===op?"#fde68a":"#64748b"}}>{op}</div>
            ))}
          </div>
        </div>
        {error && <div style={{color:"#fca5a5",fontSize:11,marginBottom:8,textAlign:"center"}}>{error}</div>}
        <div style={{display:"flex",gap:8}}>
          <div onClick={onClose} style={{flex:1,border:"1px solid #334155",borderRadius:8,padding:10,textAlign:"center",fontSize:12,color:"#94a3b8",cursor:"pointer"}}>Cerrar</div>
          <div onClick={guardar} style={{flex:1,background:"#eab308",borderRadius:8,padding:10,textAlign:"center",fontSize:12,fontWeight:700,color:"#422006",cursor:"pointer"}}>Guardar campaña</div>
        </div>
      </div>
    </div>
  );
}
