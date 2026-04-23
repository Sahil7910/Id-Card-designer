import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeRendererProps {
  value: string;
  dark?: string;
  light?: string;
}

export function QRCodeRenderer({ value, dark = "#000000", light = "#ffffff" }: QRCodeRendererProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const render = () => {
      const size = Math.max(wrap.clientWidth, wrap.clientHeight, 40);
      QRCode.toCanvas(canvas, value || "https://example.com", {
        width: size,
        margin: 1,
        color: { dark, light },
      }).catch(() => { /* silent */ });
    };

    render();

    const ro = new ResizeObserver(render);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [value, dark, light]);

  return (
    <div ref={wrapRef} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }} />
    </div>
  );
}
