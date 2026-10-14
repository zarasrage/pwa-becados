// Nombres que se muestran distinto en la UI. Internamente (Supabase, cachés,
// comparaciones, asignaciones) se sigue usando el nombre original.
const DISPLAY_NAMES = {
  "Alvarez": "otra becada 👎👎",
};

export function displayName(nombre) {
  if (typeof nombre !== "string") return nombre;
  return DISPLAY_NAMES[nombre.trim()] ?? nombre;
}
