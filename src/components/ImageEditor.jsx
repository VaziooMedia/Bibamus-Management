import React, { useState, useRef, useEffect } from "react";

// Vrai éditeur d'image pour les Stories — cadre fixe au ratio 9:16 (comme une vraie Story),
// image déplaçable à la souris/au doigt à l'intérieur, plus zoom et rotation via sliders.
// getFinalBlob() rend le vrai résultat sur un canvas hors-écran aux dimensions finales (720x1280)
// en appliquant exactement les mêmes transformations, mises à l'échelle proportionnellement.
//
// interactive=false désactive le déplacement de l'image (utilisé à l'étape taguage, pour ne pas
// interférer avec le déplacement des vrais tags par-dessus). showControls=false masque les
// sliders zoom/rotation (inutiles hors de l'étape cadrage). children se rend par-dessus l'image,
// dans le même vrai cadre — c'est là que passent les vraies pastilles de tag positionnables.
export const ImageEditor = React.forwardRef(function ImageEditor({ file, interactive = true, showControls = true, children }, ref) {
  const PREVIEW_W = 240;
  const PREVIEW_H = 426.67; // ratio 9:16
  const FINAL_W = 720;
  const FINAL_H = 1280;

  const [imgUrl, setImgUrl] = useState(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const dragState = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onImgLoad = () => {
    if (imgRef.current) setNaturalSize({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
  };

  const startDrag = (clientX, clientY) => {
    if (!interactive) return;
    dragState.current = { startX: clientX, startY: clientY, origOffset: offset };
  };
  const moveDrag = (clientX, clientY) => {
    if (!interactive || !dragState.current) return;
    const dx = clientX - dragState.current.startX;
    const dy = clientY - dragState.current.startY;
    setOffset({ x: dragState.current.origOffset.x + dx, y: dragState.current.origOffset.y + dy });
  };
  const endDrag = () => {
    dragState.current = null;
  };

  // Rend l'image finale sur un vrai canvas hors-écran, avec les mêmes transformations que
  // l'aperçu mises à l'échelle par le rapport final/aperçu (les deux cadres ont le même ratio
  // 9:16, donc ce facteur est uniforme en x comme en y).
  const getFinalBlob = () => {
    return new Promise((resolve) => {
      if (!naturalSize || !imgRef.current) {
        resolve(null);
        return;
      }
      const scaleFactor = FINAL_W / PREVIEW_W;
      const canvas = document.createElement("canvas");
      canvas.width = FINAL_W;
      canvas.height = FINAL_H;
      const ctx = canvas.getContext("2d");
      const baseScale = Math.max(FINAL_W / naturalSize.w, FINAL_H / naturalSize.h);
      ctx.save();
      ctx.translate(FINAL_W / 2 + offset.x * scaleFactor, FINAL_H / 2 + offset.y * scaleFactor);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.drawImage(imgRef.current, (-naturalSize.w * baseScale) / 2, (-naturalSize.h * baseScale) / 2, naturalSize.w * baseScale, naturalSize.h * baseScale);
      ctx.restore();
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  };

  React.useImperativeHandle(ref, () => ({ getFinalBlob }));

  const baseScalePreview = naturalSize ? Math.max(PREVIEW_W / naturalSize.w, PREVIEW_H / naturalSize.h) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <div
        style={{
          width: `${PREVIEW_W}px`,
          height: `${PREVIEW_H}px`,
          borderRadius: "12px",
          overflow: "hidden",
          background: "#0D1B2A",
          border: "2px solid #28405C",
          position: "relative",
          cursor: interactive ? "grab" : "default",
          touchAction: "none",
        }}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={endDrag}
      >
        {imgUrl && (
          <img
            ref={imgRef}
            src={imgUrl}
            alt=""
            onLoad={onImgLoad}
            draggable={false}
            style={
              naturalSize
                ? {
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: `${naturalSize.w * baseScalePreview}px`,
                    height: `${naturalSize.h * baseScalePreview}px`,
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                    userSelect: "none",
                    pointerEvents: "none",
                  }
                : { display: "none" }
            }
          />
        )}
        {children}
      </div>

      {showControls && (
        <div style={{ width: `${PREVIEW_W}px`, display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "10px", color: "#8792A6" }}>
            Zoom (en-dessous de 1, l'image entière devient visible)
            <input type="range" min="0.3" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ width: "100%", height: "14px" }} />
          </label>
          <label style={{ fontSize: "10px", color: "#8792A6" }}>
            Rotation
            <input type="range" min="-45" max="45" step="1" value={rotation} onChange={(e) => setRotation(parseFloat(e.target.value))} style={{ width: "100%", height: "14px" }} />
          </label>
        </div>
      )}
    </div>
  );
});
