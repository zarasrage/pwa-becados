// Recolor en tiempo real de los sprites de doctor (PNG pixel-art) vía canvas.
// Hace "palette swap": mapea las rampas de piel/pelo originales a rampas nuevas,
// conservando el sombreado. Los resultados se cachean como data URLs.

// Rampas ORIGINALES del sprite (base, sombra, sombra2)
const SRC_SKIN = [[250,193,177],[244,178,161],[191,135,106]];
const SRC_HAIR = [[104,79,71],[73,54,48],[62,43,38]];

// Paletas disponibles (cada una = rampa de 3 tonos)
export const SKIN_RAMPS = {
  claro:     [[250,193,177],[244,178,161],[191,135,106]], // = original
  medio:     [[224,172,105],[198,150,88],[150,110,64]],
  moreno:    [[198,134,66],[176,116,54],[140,88,40]],
  oscuro:    [[141,85,36],[120,70,30],[92,52,22]],
  muyOscuro: [[92,58,38],[74,46,30],[54,32,20]],
};
export const HAIR_RAMPS = {
  negro:      [[30,30,34],[18,18,20],[10,10,12]],
  castanoOsc: [[104,79,71],[73,54,48],[62,43,38]], // = original
  castano:    [[120,90,60],[96,70,46],[72,52,34]],
  rubio:      [[212,184,150],[184,150,110],[150,118,80]],
  pelirrojo:  [[160,82,45],[130,64,34],[100,48,24]],
  canoso:     [[200,200,205],[170,170,176],[140,140,148]],
};

export const SKIN_DEFAULT = "claro";
export const HAIR_DEFAULT = "castanoOsc";

const FRAME_COUNT = 4;
let basesPromise = null;      // Promise<ImageData[]>
const urlCache = new Map();   // key "skin|hair" -> [url0..3]

function loadFrame(i) {
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
    img.src = `/sprites/doctor/frame_00${i}.png`;
  });
}

export function ensureBases() {
  if (!basesPromise) {
    basesPromise = Promise.all(Array.from({ length: FRAME_COUNT }, (_, i) => loadFrame(i)));
  }
  return basesPromise;
}

function keyStr([r,g,b]) { return r+","+g+","+b; }

// Genera los 4 data URLs recoloreados para una combinación piel/pelo.
export async function getRecoloredFrames(skinKey, hairKey) {
  // Defaults == original: no recolorear, usar PNGs tal cual
  if ((skinKey || SKIN_DEFAULT) === SKIN_DEFAULT && (hairKey || HAIR_DEFAULT) === HAIR_DEFAULT) {
    return null;
  }
  const ck = `${skinKey}|${hairKey}`;
  if (urlCache.has(ck)) return urlCache.get(ck);

  const bases = await ensureBases();
  const skinRamp = SKIN_RAMPS[skinKey] || SKIN_RAMPS[SKIN_DEFAULT];
  const hairRamp = HAIR_RAMPS[hairKey] || HAIR_RAMPS[HAIR_DEFAULT];

  const map = new Map();
  SRC_SKIN.forEach((src, i) => map.set(keyStr(src), skinRamp[i]));
  SRC_HAIR.forEach((src, i) => map.set(keyStr(src), hairRamp[i]));

  const urls = bases.map((base) => {
    if (!base) return null;
    const cv = document.createElement("canvas");
    cv.width = base.width; cv.height = base.height;
    const ctx = cv.getContext("2d");
    const out = ctx.createImageData(base.width, base.height);
    const s = base.data, d = out.data;
    for (let p = 0; p < s.length; p += 4) {
      const a = s[p+3];
      if (a === 0) { d[p+3] = 0; continue; }
      const repl = map.get(s[p]+","+s[p+1]+","+s[p+2]);
      if (repl) { d[p]=repl[0]; d[p+1]=repl[1]; d[p+2]=repl[2]; d[p+3]=a; }
      else { d[p]=s[p]; d[p+1]=s[p+1]; d[p+2]=s[p+2]; d[p+3]=a; }
    }
    ctx.putImageData(out, 0, 0);
    return cv.toDataURL("image/png");
  });

  urlCache.set(ck, urls);
  return urls;
}
