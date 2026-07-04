// Recolor por REGIONES con soporte de sexo (hombre/mujer).
// Cada sexo tiene su base + máscaras de piel/pelo/ropa; ojos/labios/zapatos son
// unisex (compartidos). Se recolorea cada zona preservando el sombreado, sin que
// se escape ningún pixel y sin tocar el contorno negro.
import REGIONS from "./spriteRegions.json";

export const PART_LABELS = {
  piel: "Piel",
  pelo: "Pelo",
  ropa: "Ropa",
  ojos: "Ojos",
  labios: "Labios",
  zapatos: "Zapatos",
};
export const PART_ORDER = ["piel","pelo","ropa","ojos","labios","zapatos"];
export const SEXO_DEFAULT = "h";

const FRAME_COUNT = 4;
export const baseSrc = (sexo, i) => `/sprites/avatars/${sexo}_${i}.png`;

const basesPromise = {};      // sexo -> Promise<ImageData[]>
const urlCache = new Map();   // key -> [url0..3]

function loadFrame(sexo, i) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, cv.width, cv.height));
    };
    img.onerror = () => resolve(null);
    img.src = baseSrc(sexo, i);
  });
}

export function ensureBases(sexo) {
  if (!basesPromise[sexo]) {
    basesPromise[sexo] = Promise.all(Array.from({ length: FRAME_COUNT }, (_, i) => loadFrame(sexo, i)));
  }
  return basesPromise[sexo];
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function lum(r,g,b) { return 0.299*r + 0.587*g + 0.114*b; }

function lookKey(look) {
  const sexo = look?.sexo || SEXO_DEFAULT;
  return sexo + ":" + PART_ORDER.map(p => look?.[p] || "").join("|");
}
function hasColors(look) {
  return look && PART_ORDER.some(p => look[p]);
}

// look: { sexo?:"h"|"m", piel?:"#rrggbb", pelo?:..., ropa?:..., ojos?:..., ... }
// Devuelve null si no hay colores personalizados (usar el base del sexo tal cual).
export async function getRecoloredFrames(look) {
  if (!hasColors(look)) return null;
  const sexo = look.sexo || SEXO_DEFAULT;
  const ck = lookKey(look);
  if (urlCache.has(ck)) return urlCache.get(ck);

  const bases = await ensureBases(sexo);
  const region = REGIONS[sexo] || REGIONS[SEXO_DEFAULT];
  const { w, h, frames } = region;

  const urls = bases.map((base, fi) => {
    if (!base) return null;
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    const out = ctx.createImageData(w, h);
    out.data.set(base.data);
    const d = out.data;
    const parts = frames[fi];

    for (const part of PART_ORDER) {
      const hex = look[part];
      if (!hex) continue;
      const target = hexToRgb(hex);
      const idxs = parts[part] || [];
      if (!idxs.length) continue;

      if (part === "ojos") {
        // Ojos: el blanco (esclerótica) queda casi blanco tintado; el iris pleno.
        for (const idx of idxs) {
          const p = idx*4;
          const r = base.data[p], g = base.data[p+1], b = base.data[p+2];
          const maxc = Math.max(r,g,b), minc = Math.min(r,g,b);
          const isWhite = (maxc - minc) < 45 && lum(r,g,b) > 170;
          if (isWhite) {
            d[p]   = Math.round(target[0]*0.15 + 255*0.85);
            d[p+1] = Math.round(target[1]*0.15 + 255*0.85);
            d[p+2] = Math.round(target[2]*0.15 + 255*0.85);
          } else {
            d[p]=target[0]; d[p+1]=target[1]; d[p+2]=target[2];
          }
        }
        continue;
      }

      // tono base de la zona = píxel más claro (para mapear base→target)
      let baseL = 1;
      for (const idx of idxs) {
        const p = idx*4;
        const l = lum(base.data[p], base.data[p+1], base.data[p+2]);
        if (l > baseL) baseL = l;
      }
      for (const idx of idxs) {
        const p = idx*4;
        const ratio = lum(base.data[p], base.data[p+1], base.data[p+2]) / baseL;
        d[p]   = Math.min(255, Math.round(target[0]*ratio));
        d[p+1] = Math.min(255, Math.round(target[1]*ratio));
        d[p+2] = Math.min(255, Math.round(target[2]*ratio));
      }
    }
    ctx.putImageData(out, 0, 0);
    return cv.toDataURL("image/png");
  });

  urlCache.set(ck, urls);
  return urls;
}
