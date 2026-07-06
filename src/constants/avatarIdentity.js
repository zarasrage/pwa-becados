// Identidad HARDCODEADA de cada avatar (no editable por usuarios).
// Campos: sexo ("h"|"m"), piel, pelo, ojos, labios (hex).
// Se llena desde el export del "modo admin" del editor del mapa.
// Los campos que falten usan el default del sprite base.
export const AVATAR_IDENTITY = {
  "Navia":     { sexo:"m", piel:"#C68642", pelo:"#3D2B1F", ojos:"#111111", labios:"#E8556F" },
  "Miño":      { piel:"#F1C27D", pelo:"#0A0A0A", ojos:"#111111" },
  "Diaz":      { piel:"#F1C27D", pelo:"#6A4E42", ojos:"#111111" },
  "Alvarez":   { sexo:"m", piel:"#F5CBA0", pelo:"#0A0A0A", ojos:"#111111" },
  "Chahin":    { sexo:"m", piel:"#FFE0C4", pelo:"#0A0A0A", ojos:"#111111", labios:"#E8556F" },
  "Gonzalez":  { piel:"#FFE0C4", pelo:"#0A0A0A", ojos:"#704429", labios:"#C94A5A" },
  "Valencia":  { piel:"#E0AC69", pelo:"#caa92f", ojos:"#1774de" },
  "Beulieau":  { piel:"#A9744F", pelo:"#3D2B1F", ojos:"#3E2A1E" },
  "Carcamo":   { piel:"#F5CBA0", pelo:"#0A0A0A", ojos:"#3E2A1E", labios:"#C94A5A" },
  "Albert":    { sexo:"m", piel:"#F5CBA0", pelo:"#d2bb46", ojos:"#3B7CC4" },
  "Marre":     { sexo:"m", piel:"#E0AC69", pelo:"#B87333", ojos:"#784526" },
  "Fuentes":   { sexo:"m", piel:"#E0AC69", pelo:"#0A0A0A", ojos:"#111111" },
  "Teuber":    { piel:"#F5CBA0", pelo:"#b9853c", ojos:"#2f69ac" },
  "Baeza":     { piel:"#F5CBA0", pelo:"#0A0A0A", ojos:"#111111" },
  "Larrain":   { piel:"#F5CBA0", pelo:"#9f6c3c", ojos:"#3B7CC4" },
  "Uribe":     { piel:"#F5CBA0", pelo:"#cca928", ojos:"#3E2A1E" },
  "Rojas":     { piel:"#F5CBA0", pelo:"#C8C8CE", ojos:"#3E2A1E" },
  "Miranda":   { piel:"#D19A6A", pelo:"#0A0A0A", ojos:"#6a462f" },
};

// Escala de tamaño por becado (multiplicador sobre el tamaño base del avatar)
export const AVATAR_SCALE = {
  Teuber: 1.10, Larrain: 1.10, Gonzalez: 1.10,
  Valencia: 1.05, Marre: 1.05, Albert: 1.05, "Miño": 1.05, Beulieau: 1.05,
  Navia: 0.95, Chahin: 0.95,
};

// Campos de identidad (fijos) vs personalizables (compartidos en Supabase)
export const IDENTITY_COLOR_PARTS = ["piel", "pelo", "ojos", "labios"];
export const SHARED_COLOR_PARTS   = ["ropa", "zapatos"];
export const SHARED_ACC_SLOTS     = ["aros", "sombrero", "mascara"];
