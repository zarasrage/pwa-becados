import { useEffect, useState } from "react";
import { SEXO_DEFAULT, baseSrc, accSrc, accLayers, getRecoloredFrames } from "./recolorSprites.js";

// Recorte de cabeza y tórax dentro del sprite de 56×56: así la cara se ve
// grande en espacios chicos, donde el muñeco entero queda ilegible.
const BUSTO = { x: 16, y: 7, lado: 24, hoja: 56 };

// Sprite pixel art de un becado, con su piel, pelo, ojos y accesorios.
// Vive aparte del mapa porque también se usa en la grilla del congreso.
// Con `busto` se muestra solo de los hombros hacia arriba.
export function SpriteBecado({ look, size = 44, alt = "", busto = false }) {
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
  // Se agranda el sprite y se corre dentro de una ventana del tamaño pedido,
  // en vez de recortar la imagen: las capas de accesorios siguen calzando.
  const k = busto ? size / BUSTO.lado : size / BUSTO.hoja;
  const lado = BUSTO.hoja * k;
  const capa = {
    position:"absolute", width:lado, height:lado,
    top:  busto ? -BUSTO.y * k : 0,
    left: busto ? -BUSTO.x * k : 0,
    imageRendering:"pixelated",
  };
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0,overflow:"hidden"}}>
      <img src={src} alt={alt} style={capa}/>
      {accLayers(look).map(key => (
        <img key={key} src={accSrc(key,0)} alt="" style={capa}/>
      ))}
    </div>
  );
}
