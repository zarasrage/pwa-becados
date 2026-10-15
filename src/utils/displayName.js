// Nombres que se muestran distinto en la UI. Internamente (Supabase, cachés,
// comparaciones, asignaciones) se sigue usando el nombre original.
// Ej: { "Apellido": "Nombre a mostrar" }. Vacío = todos con su nombre real.
const DISPLAY_NAMES = {};

export function displayName(nombre) {
  if (typeof nombre !== "string") return nombre;
  return DISPLAY_NAMES[nombre.trim()] ?? nombre;
}
