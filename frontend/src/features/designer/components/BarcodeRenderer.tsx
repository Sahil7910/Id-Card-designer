import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeRendererProps {
  value: string;
  dark?: string;
}

export function BarcodeRenderer({ value, dark = "#000000" }: BarcodeRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      JsBarcode(svg, value || "0000000000", {
        format: "CODE128",
        width: 1.5,
        height: 36,
        displayValue: true,
        fontSize: 9,
        textMargin: 2,
        lineColor: dark,
        background: "transparent",
        margin: 4,
      });
      // Convert fixed pixel dimensions to a responsive viewBox so the SVG
      // fills its parent container at any size
      const w = svg.getAttribute("width");
      const h = svg.getAttribute("height");
      if (w && h) {
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      }
    } catch {
      svg.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${dark}" font-size="10" font-family="monospace">Invalid barcode</text>`;
    }
  }, [value, dark]);

  return (
    <svg
      ref={svgRef}
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
