# MimApp — Contexto del proyecto

## Qué es
PWA para becados (residentes) de Traumatología en hospital chileno. Muestra horarios, rotaciones, turnos, pabellones quirúrgicos y un mapa pixel art del hospital.

## Stack
- **Frontend:** React + Vite, modularizado en `src/`
- **Backend primario:** Supabase (activo, `USE_SUPABASE=true` en `src/constants/api.js`)
- **Backend legacy:** Google Apps Script (`code.gs`) + Google Sheets (fallback)
- **Serverless:** Netlify Functions (`netlify/functions/`)
- **Deploy:** Netlify via GitHub (https://github.com/zarasrage/pwa-becados.git)
- **API GAS URL:** https://script.google.com/macros/s/AKfycbz9Zme-RquoB2GVh6yj9v9Yl2xFAq2JKO5RnM_Cm5-EYgEQV6CWsD5H4ai3ZtmKiq4U/exec
- **Token GAS:** queseyo_calendriobecados2026
- **Sheet ID:** 10rsV7iRYehwWIyZGG6neEr1-kXUWVjya_ZZLnqUVKYk
- **Supabase:** credenciales en variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY

## Estructura del proyecto

```
src/
  App.jsx                  # Raíz: tema, becado seleccionado, modales, efectos
  main.jsx
  App.css / index.css
  constants/
    api.js                 # API_URL, USE_SUPABASE, API_TOKEN, SHEET_ID, sheet names
    themes.js              # 14 temas con paleta completa (bg/surface/border/text/accent)
    rotations.js           # ROT: H/M/CyP/R/TyP/Col + especiales (I/A/rx/F/V/T/CPQ)
    turnos.js              # TURNO: P/p/D/N/A con horarios y colores
    universities.js        # UNAB (0-14), UANDES (15-32), IST (33-35) + grupos por año
    map.js                 # MAP_BUILDINGS: 4 edificios con sprite + floor spots
  hooks/
    useApiData.js          # SWR hook: { data, updating, error, refresh }
    usePullToRefresh.js    # Gesto pull-to-refresh (threshold 72px, damping 0.45x)
    useSplash.js           # Splash en primera carga o tras 8h de inactividad
    useOnline.js           # Estado de red online/offline
  utils/
    api.js                 # apiGet(), apiSWR(), prefetch(), checkDataVersion(), supabaseGet()
    cache.js               # localStorage con TTL 30 días, cacheGet/Set/TTL/Key
    dates.js               # todayISO(), offsetDate(), getWeekDates(), getMonthDates(), t2m/m2t
    schedule.js            # groupItems(), resolveItems() (merge horas consecutivas)
    storage.js             # safeStorage wrapper + purgeCacheStorage()
  lib/
    supabase.js            # Cliente Supabase (desde VITE env vars)
    supabaseApi.js         # getBecados, getDaily, getWeek, getSummary, getMonthly,
                           # getPersonalMonth, bumpDataVersion
  data/
    demo.js                # Datos falsos: DEMO_ROTATIONS, demoDaily/Monthly/PersonalMonth
    fellows.js             # FELLOWS (9 por especialidad), ESPECIALIDADES_FELLOWS
  effects/
    index.js               # Re-export de 12 efectos ambientales
    SakuraPetals.jsx       # pink
    OceanBubbles.jsx       # ocean
    AuroraEffect.jsx       # aurora
    ForestFireflies.jsx    # forest
    SunsetEmbers.jsx       # sunset
    NeonGrid.jsx           # neon
    SynthwaveEffect.jsx    # synthwave
    CryoEffect.jsx         # cryo
    CosmosEffect.jsx       # cosmos
    StormEffect.jsx        # tormenta
    WabiEffect.jsx         # wabi
    AmanecerEffect.jsx     # amanecer
  styles/
    globalCSS.js           # CSS global como string (animaciones, variables, reset)
  tabs/
    TabDia.jsx             # Vista diaria con horario, turnos, rotación
    TabSemana.jsx          # Vista semanal (lun-dom) con rotación + turno por día
    TabMes.jsx             # Calendario mensual, popup de día
    TabTurnos.jsx          # Turnos globales del mes + sub-tab Seminarios
    TabRotaciones.jsx      # Todos los becados agrupados por rotación del día
    TabEquipos.jsx         # Equipos de la semana (5 días × 6 especialidades)
    TabFellows.jsx         # Directorio fellows + staff por especialidad
    TabEstadisticas.jsx    # Ranking por "peso" (P×4 D×6 N×12 A×1 S×6 + feriados)
    TabEditor.jsx          # Editor de turnos/seminarios (4 semanas, undo ×5)
    TabPabellones.jsx      # Tabla quirúrgica del día + asignación de becados/fellows
  components/
    map/
      MapaVivo.jsx         # Mapa pixel art interactivo (beta)
      BuildingCard.jsx
      PixelBuilding.jsx
      PixelAvatar.jsx
      DoctorSprite.jsx     # Animación 4 frames con setInterval
    settings/
      SettingsPanel.jsx
      ThemePicker.jsx      # Menú secreto temas (5 taps en ⚙️) + acceso Mapa
      SubirTabla.jsx       # Upload Excel de tabla quirúrgica
    splash/
      SplashScreen.jsx
    swap/
      SwapTurnos.jsx
      TurnoSelector.jsx
    ui/
      ActivityCard.jsx, TurnoCard.jsx, DateNav.jsx, CalendarGrid.jsx
      SemCard.jsx, SectionDivider.jsx, SkeletonCard.jsx
      Spinner.jsx, ErrorBox.jsx, GearBtn.jsx
      PullIndicator.jsx, OfflineBanner.jsx
  screens/
    SelectScreen.jsx       # Pantalla de selección de becado + accesos directos
    TabBar.jsx             # Tab bar inferior: Día / Semana / Mes

netlify/functions/
  asignaciones.js          # POST: guarda asignación de becados a cirugía en Supabase
  procesar-tabla.js        # POST: parsea Excel, enriquece con Claude API (diagnóstico),
                           #       guarda en tabla_quirurgica Supabase

code.gs                    # GAS legacy: rutas becados/daily/summary/monthly/version/swap
public/
  sprites/                 # PNGs isométricos de edificios + frames de doctor
  spot-picker.html         # Herramienta para definir floor spots del mapa
  fotos/                   # Fotos de becados (WhatsApp, usadas en SelectScreen)
```

## Rotaciones
H=Hombro🟠, M=Mano🔴, CyP=Cadera🔵, R=Rodilla🟡, TyP=Tobillo🟢, Col=Columna🟣  
Especiales: I=Infantil, A=Adulto, rx=Radiología, F=Fisiátría, V=Vacaciones, T=Trauma, CPQ=CPQ

## Universidades
UNAB (índices 0–14), UANDES (15–32), IST (33–35)

## Turnos
P=Poli tarde(#06B6D4), p=Poli mañana, D=Día(#F59E0B), N=Noche(#4F6EFF), A=Artroscopía(#72FF00)  
Seminarios: S (#E879F9)

## Temas (14 total)
dark, light, pink(Sakura), ocean(Abismo), sunset(Volcán), forest(Bosque), aurora, neon(Glitch), synthwave, cryo, cosmos, tormenta, wabi, amanecer  
- Acceso: 5 taps en ⚙️ → ThemePicker
- Cada tema tiene efecto ambiental en `src/effects/`
- Efectos: `position:fixed; zIndex:0` — tabs: `zIndex:1`

## Caché
- TTL: 30 días localStorage (excepto daily de hoy que expira a medianoche)
- SWR: datos cacheados inmediatos, revalida en background si >24h o versión cambió
- `checkDataVersion()`: consulta `config.data_version` en Supabase, limpia caché si cambió
- `bumpDataVersion()`: incrementa el timestamp en Supabase para forzar invalidación global
- Principio: NUNCA borrar caché antes de tener datos nuevos

## Backend Supabase (activo)
Tablas clave: `becados`, `rotaciones`, `turnos`, `seminarios`, `horario_items`, `config`, `tabla_quirurgica`, `asignaciones_pabellones`  
- `supabaseApi.js` maneja todas las queries
- `getDaily()` hace joins: becados + rotaciones + turnos + seminarios + horario_items
- Invalidación: `bumpDataVersion()` → todos los clientes detectan cambio al abrir la app

## Backend GAS (legacy/fallback)
`code.gs` — Rutas: becados, daily, summary, monthly, personal-month, version, swap  
- Menú "🔄 MimApp" en el Sheet para invalidar caché manualmente

## Netlify Functions
- `asignaciones.js`: guarda/actualiza asignación de asistentes a una cirugía en Supabase
- `procesar-tabla.js`: recibe Excel de tabla quirúrgica → parsea con xlsx → enriquece diagnóstico con Claude API (claude-opus-4-8, chunks de 15 filas) → guarda en `tabla_quirurgica`

## Mapa pixel art (beta, acceso desde ThemePicker)
- 4 edificios: Pabellones, Jofré, Policlínicos, Urgencia
- Sprites isométricos en `public/sprites/`
- Doctores: 4 frames en `public/sprites/doctor/frame_00{0-3}.png`, animados con setInterval
- Floor spots definidos con `public/spot-picker.html`
- Slider de hora + DateNav para simular cualquier momento

## Design Skills (Plugin "Design" de Anthropic)

Estos skills están disponibles. Úsalos invocando `/nombre-skill` o cuando la tarea lo requiera.

### /design-critique
Feedback estructurado de diseño sobre usabilidad, jerarquía y consistencia. Evalúa: primera impresión, usabilidad, jerarquía visual, consistencia y accesibilidad. Output en tabla con severidad (🔴🟡🟢) y recomendaciones priorizadas.

### /accessibility-review
Auditoría WCAG 2.1 AA. Cubre: contraste de color (≥4.5:1 texto normal, ≥3:1 texto grande), touch targets (≥44×44px), navegación por teclado, ARIA, screen readers. Output con tabla de hallazgos por categoría WCAG (Perceivable/Operable/Understandable/Robust).

### /design-handoff
Genera specs de handoff para desarrollo: medidas exactas, tokens de diseño, variantes de componentes, estados (hover/active/disabled/loading/error), breakpoints responsive, edge cases, animaciones (duración + easing) y notas de accesibilidad.

### /design-system
Audita, documenta o extiende el sistema de diseño. Tres modos:
- `audit`: detecta valores hardcodeados, inconsistencias de naming, cobertura de estados
- `document [componente]`: documenta variantes, props, estados, a11y, do's/don'ts
- `extend [patrón]`: diseña nuevo componente respetando el sistema existente

### /research-synthesis
Sintetiza datos de investigación de usuarios (entrevistas, encuestas, tests de usabilidad, tickets de soporte) en temas, insights y recomendaciones priorizadas. Separa observaciones de interpretaciones, cuantifica hallazgos, identifica segmentos de usuarios.

### /user-research
Planifica y ejecuta estudios de investigación. Métodos: entrevistas (5-8p), usability testing (5-8p), surveys (100+), card sorting (15-30p), diary studies, A/B testing. Incluye guía de entrevista estructurada y frameworks de análisis (affinity mapping, journey mapping, JTBD).

### /ux-copy
Escribe o revisa microcopy: CTAs (verbo + acción específica), mensajes de error (qué pasó + por qué + cómo arreglar), empty states (qué es + por qué vacío + cómo empezar), diálogos de confirmación, tooltips, onboarding. Adapta tono al contexto (error=empático, éxito=celebratorio, neutro=conciso).

---

## Reglas importantes
- **Parches quirúrgicos**, no reescrituras completas
- Ser preciso con str_replace — ha introducido bugs antes
- Scroll container es `#root` (no body ni tabs individuales)
- PTR chequea `document.getElementById("root").scrollTop`
- Zoom deshabilitado (`touch-action:manipulation` + viewport meta)
- Los efectos ambientales usan `position:fixed; zIndex:0`; tabs usan `zIndex:1`
- `USE_SUPABASE` en `src/constants/api.js` alterna entre Supabase y GAS
