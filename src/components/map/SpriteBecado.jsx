import { useEffect, useState } from "react";
import { SEXO_DEFAULT, baseSrc, accSrc, accLayers, getRecoloredFrames } from "./recolorSprites.js";

// Sprite pixel art de un becado, con su piel, pelo, ojos y accesorios.
// Vive aparte del mapa porque también se usa en la grilla del congreso.
export function SpriteBecado({ look, size = 44, alt = "" }) {
  const fallback = baseSrc(look?.sexo || SEXO_DEFAULT, 0);
  const [src, setSrc] = useState(fallback);
  const key = look ? JSON.stringify(look) : "";
  useEffect(() => {
    let vivo = true;
    getRecoloredFrames(look)
      .then(urls => { if (vivo) setSrc(urls?.[0] || fallback); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <img src={src} width={size} height={size} alt={alt}
        style={{imageRendering:"pixelated",display:"block"}}/>
      {accLayers(look).map(k => (
        <img key={k} src={accSrc(k,0)} width={size} height={size} alt=""
          style={{position:"absolute",top:0,left:0,imageRendering:"pixelated"}}/>
      ))}
    </div>
  );
}
