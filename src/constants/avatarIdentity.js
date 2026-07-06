// Identidad HARDCODEADA de cada avatar (no editable por usuarios).
// Campos: sexo ("h"|"m"), piel, pelo, ojos, labios (hex).
// Se llena desde el export del "modo admin" del editor del mapa.
// Los campos que falten usan el default del sprite base.
export const AVATAR_IDENTITY = {
  // "Gonzalez": { sexo:"h", piel:"#C68642", pelo:"#0A0A0A", ojos:"#3B7CC4", labios:"#F66C8F" },
};

// Campos de identidad (fijos) vs personalizables (compartidos en Supabase)
export const IDENTITY_COLOR_PARTS = ["piel", "pelo", "ojos", "labios"];
export const SHARED_COLOR_PARTS   = ["ropa", "zapatos"];
export const SHARED_ACC_SLOTS     = ["aros", "sombrero", "mascara"];
