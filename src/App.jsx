import { useEffect, useState } from "react";
import { API_TOKEN } from "./constants/api.js";
import { THEMES, THEME_BG } from "./constants/themes.js";
import { todayISO } from "./utils/dates.js";
import { apiSWR, prefetch } from "./utils/api.js";
import { safeStorage } from "./utils/storage.js";
import { purgeCacheStorage } from "./utils/storage.js";
import { checkDataVersion } from "./utils/api.js";
import { CSS } from "./styles/globalCSS.js";
import { DEMO_BECADO } from "./data/demo.js";
import {
  SakuraPetals, OceanBubbles, AuroraEffect, ForestFireflies,
  SunsetEmbers, NeonGrid, SynthwaveEffect, CryoEffect, CosmosEffect, StormEffect,
  WabiEffect, AmanecerEffect,
} from "./effects/index.js";
import { ACCENT_MAP, ThemePicker } from "./components/settings/ThemePicker.jsx";
import { SettingsPanel } from "./components/settings/SettingsPanel.jsx";
import { SwapTurnos } from "./components/swap/SwapTurnos.jsx";
import { SplashScreen } from "./components/splash/SplashScreen.jsx";
import { Spinner } from "./components/ui/Spinner.jsx";
import { GearBtn } from "./components/ui/GearBtn.jsx";
import { MapaVivo } from "./components/map/MapaVivo.jsx";
import { SelectScreen } from "./screens/SelectScreen.jsx";
import { TabBar } from "./screens/TabBar.jsx";
import { TabHorario } from "./tabs/TabHorario.jsx";
import { TabRotaciones } from "./tabs/TabRotaciones.jsx";
import { TabSemana } from "./tabs/TabSemana.jsx";
import { TabTurnos } from "./tabs/TabTurnos.jsx";
import { TabMes } from "./tabs/TabMes.jsx";
import { TabEstadisticas } from "./tabs/TabEstadisticas.jsx";
import { useSplash } from "./hooks/useSplash.js";

export default function App() {
  const showSplash = useSplash();
  const [previewSplash, setPreviewSplash] = useState(false);
  const [theme, setTheme]             = useState(() => safeStorage.get("theme") || "dark");
  const [showSettings, setShowSettings] = useState(false);
  const [becado, setBecado]           = useState(() => safeStorage.get("selectedBecado") || "");
  const [becados, setBecados]         = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError]     = useState("");
  const [activeTab, setActiveTab]     = useState(() => safeStorage.get("activeTab") || "horario");
  const [showTurnos, setShowTurnos]       = useState(false);
  const [showRotaciones, setShowRotaciones] = useState(false);
  const [showMapa, setShowMapa]           = useState(false);
  const [showEstadisticas, setShowEstadisticas] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const ACCENT = ACCENT_MAP[theme] || "#348FFF";
  const T = { ...THEMES[theme], accent: ACCENT };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    safeStorage.set("activeTab", tab);
    // Scroll al top al cambiar de tab
    const root = document.getElementById("root");
    if (root) root.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  const applyTheme = (next) => {
    setTheme(next);
    safeStorage.set("theme", next);
    const bg = THEME_BG[next] || "#0D1117";
    const meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", bg);
    document.body.style.background = ["wabi","amanecer"].includes(next) ? "transparent" : bg;
    document.body.classList.toggle("theme-pink", next === "pink");
    ["ocean","sunset","forest","aurora","neon","synthwave","cryo","cosmos","tormenta"].forEach(t =>
      document.body.classList.toggle("theme-"+t, next === t)
    );
  };

  useEffect(() => {
    const bg = THEME_BG[theme] || "#0D1117";
    const meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", bg);
    document.body.style.background = ["wabi","amanecer"].includes(theme) ? "transparent" : bg;
    document.body.classList.toggle("theme-pink", theme === "pink");
    ["ocean","sunset","forest","aurora","neon","synthwave","cryo","cosmos","tormenta"].forEach(t =>
      document.body.classList.toggle("theme-"+t, theme === t)
    );
    // Bloquear zoom — PWA no lo necesita
    const vp = document.querySelector("meta[name='viewport']");
    if (vp) vp.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover");
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => purgeCacheStorage());
    } else {
      setTimeout(() => purgeCacheStorage(), 2000);
    }
    // Chequear si el Sheet fue editado — si sí, limpia caché local
    checkDataVersion();
  }, []);

  useEffect(() => {
    const params = {route:"becados",token:API_TOKEN};
    apiSWR(
      params,
      (data) => { if (data.ok && data.becados) { setBecados([...data.becados, DEMO_BECADO]); setLoadingInit(false); } },
      (data) => { if (data.ok && data.becados) { setBecados([...data.becados, DEMO_BECADO]); setLoadingInit(false); } }
    ).catch(e => { setInitError(String(e.message||e)); setLoadingInit(false); });
  }, []);

  useEffect(() => {
    prefetch({route:"summary",date:todayISO(),token:API_TOKEN});
  }, []);

  const handleSelect = name => { safeStorage.set("selectedBecado", name); setBecado(name); };
  const handleChange = () => {
    safeStorage.remove("selectedBecado");
    safeStorage.remove("activeTab");
    setBecado("");
    setActiveTab("horario");
  };
  const handleShowRotaciones = () => { setShowRotaciones(true); };
  const handleShowTurnos     = () => { setShowTurnos(true); };
  const handleShowMapa       = () => { setShowMapa(true); };

  if (loadingInit) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",maxWidth:480,margin:"0 auto"}}>
      <style>{CSS}</style><Spinner/>
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh",
      background: theme === "pink"
        ? "linear-gradient(145deg, #FFD6EA 0%, #FEE6F2 35%, #FCDAED 70%, #FFB3D1 100%)"
        : ["wabi","amanecer"].includes(theme) ? "transparent"
        : T.bg,
      maxWidth:480,
      margin:"0 auto",
      fontFamily:"'Inter',sans-serif",
      paddingBottom: becado ? "calc(72px + min(var(--sab), 20px))" : 0,
      position:"relative",
    }}>
      <style>{CSS}</style>
      {theme === "pink" && <SakuraPetals/>}
      {(showSplash || previewSplash) && <SplashScreen/>}

      <GearBtn onClick={()=>setShowSettings(s=>!s)} T={T}/>
      {showSettings && (
        <SettingsPanel onClose={()=>setShowSettings(false)} onPreviewSplash={()=>{setShowSettings(false);setPreviewSplash(true);setTimeout(()=>setPreviewSplash(false),2700);}} onSwapTurnos={()=>{setShowSettings(false);setShowSwap(true);}} onShowThemePicker={()=>{setShowSettings(false);setShowThemePicker(true);}} T={T}/>
      )}
      {showSwap && <SwapTurnos becados={becados} onClose={()=>setShowSwap(false)} T={T}/>}
      {showThemePicker && <ThemePicker current={theme} onSelect={applyTheme} onClose={()=>setShowThemePicker(false)}/>}
      {theme === "ocean"  && <OceanBubbles/>}
      {theme === "aurora" && <AuroraEffect/>}
      {theme === "forest" && <ForestFireflies/>}
      {theme === "sunset" && <SunsetEmbers/>}
      {theme === "neon"      && <NeonGrid/>}
      {theme === "synthwave" && <SynthwaveEffect/>}
      {theme === "cryo"      && <CryoEffect/>}
      {theme === "cosmos"    && <CosmosEffect/>}
      {theme === "tormenta"  && <StormEffect/>}
      {theme === "wabi"      && <WabiEffect/>}
      {theme === "amanecer"  && <AmanecerEffect/>}

      {!becado ? (
        showRotaciones
          ? <TabRotaciones onChangeBecado={()=>setShowRotaciones(false)} T={T}/>
        : showTurnos
          ? <TabTurnos onBack={() => setShowTurnos(false)} T={T}/>
        : showMapa
          ? <MapaVivo becados={becados} T={T} onBack={() => setShowMapa(false)}/>
        : showEstadisticas
          ? <TabEstadisticas onBack={() => setShowEstadisticas(false)} T={T}/>
          : <SelectScreen becados={becados} onSelect={handleSelect} onShowRotaciones={handleShowRotaciones} onShowTurnos={handleShowTurnos} onShowMapa={handleShowMapa} onShowEstadisticas={() => setShowEstadisticas(true)} error={initError} T={T}/>

      ) : (
        <>
          <div className={activeTab==="horario"?"tab-in":""} style={{display:activeTab==="horario"?"block":"none"}}><TabHorario becado={becado} onChangeBecado={handleChange} T={T}/></div>
          <div className={activeTab==="semana"?"tab-in":""} style={{display:activeTab==="semana"?"block":"none"}}><TabSemana becado={becado} onChangeBecado={handleChange} T={T}/></div>
          <div className={activeTab==="mes"?"tab-in":""} style={{display:activeTab==="mes"?"block":"none"}}><TabMes becado={becado} onChangeBecado={handleChange} T={T}/></div>
          <TabBar active={activeTab} onChange={handleTabChange} T={T}/>
        </>
      )}
    </div>
  );
}
