# MimApp — Contexto del proyecto

## Qué es
PWA para becados (residentes) de Traumatología en hospital chileno. Muestra horarios, rotaciones, turnos y un mapa pixel art del hospital.

## Stack
- **Frontend:** React + Vite, single-file en `src/App.jsx` (~4300 líneas)
- **Backend:** Google Apps Script (`code.gs`) conectado a Google Sheets
- **Deploy:** Netlify via GitHub (https://github.com/zarasrage/pwa-becados.git)
- **API URL:** https://script.google.com/macros/s/AKfycbz9Zme-RquoB2GVh6yj9v9Yl2xFAq2JKO5RnM_Cm5-EYgEQV6CWsD5H4ai3ZtmKiq4U/exec
- **Token:** queseyo_calendriobecados2026
- **Sheet ID:** 10rsV7iRYehwWIyZGG6neEr1-kXUWVjya_ZZLnqUVKYk

## Estructura de App.jsx
Todo está en un solo archivo. Orden aproximado:
1. Constantes: THEMES (12 temas), ROT (rotaciones), colores
2. Utilidades: fechas, caché (SWR 7 días), API
3. Demo mode: datos falsos para testing (DEMO_BECADO, demoSummary, demoMonthly)
4. Efectos ambientales: SakuraPetals, OceanBubbles, AuroraEffect, etc. (1 por tema secreto)
5. ThemePicker: menú secreto de temas (5 taps en ⚙️), también tiene acceso al Mapa beta
6. Componentes de UI: Spinner, ErrorBox, DateNav, ActivityCard, TurnoCard, etc.
7. Tabs principales: TabHorario, TabRotaciones, TabSemana, TabTurnos, TabMes
8. Mapa pixel art: MapaVivo, BuildingCard, DoctorSprite, PixelBuilding, PixelAvatar
9. SelectScreen, TabBar, SplashScreen
10. App (componente raíz)

## Rotaciones
H=Hombro🟠, M=Mano🔴, CyP=Cadera🔵, R=Rodilla🟡, TyP=Tobillo🟢, Col=Columna🟣

## Universidades
UNAB (becados 0-14), UANDES (15-32), IST (33-35)

## Turnos
P=Poli(#06B6D4), D=Día(#F59E0B), N=Noche(#4F6EFF), A=Artroscopía(#72FF00), S=Seminarios(#E879F9)

## Temas secretos (12 total)
dark, light, pink(Sakura), ocean(Abismo), sunset(Volcán), forest(Bosque), aurora, neon(Glitch), synthwave, cryo, cosmos, tormenta
- Se acceden con 5 taps en ⚙️
- Cada tema tiene efecto ambiental con partículas CSS
- THEME_OPTIONS y ACCENT_MAP están como constantes antes de ThemePicker

## Caché
- TTL: 7 días (excepto daily de hoy que expira a medianoche)
- SWR: muestra datos cacheados inmediato, revalida en background cada 1h
- `checkDataVersion()`: compara timestamp con backend al abrir la app
- Principio: NUNCA borrar caché antes de tener datos nuevos

## Backend (code.gs)
Rutas: becados, daily, summary, monthly, personal-month, version, swap
- Menú "🔄 MimApp" en el Sheet para invalidar caché manualmente
- `onOpen()` crea el menú automáticamente

## Mapa pixel art (beta, acceso secreto desde ThemePicker)
- 4 edificios: Pabellones, Jofré, Policlínicos, Urgencia
- Sprites en `public/sprites/` (PNG isométricos)
- Doctores: 4 frames de caminata en `public/sprites/doctor/frame_00{0-3}.png`
- DoctorSprite anima frames con setInterval
- Spots de piso definidos con spot-picker.html (en public/)
- Slider de hora + DateNav para simular cualquier momento
- Modo Demo con datos falsos

## Reglas importantes
- **Parches quirúrgicos**, no reescrituras completas
- App.jsx puede quedar stale entre sesiones — pedir que se suba si hay dudas
- `str_replace` ha introducido bugs antes — ser preciso
- Los efectos ambientales usan position:fixed zIndex:0; tabs usan zIndex:1
- Scroll container es #root (no body ni tabs individuales)
- PTR chequea document.getElementById("root").scrollTop
- Zoom deshabilitado (touch-action:manipulation + viewport meta)
