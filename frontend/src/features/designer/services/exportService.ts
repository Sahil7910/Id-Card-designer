import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { CardField } from "../../../shared/types";
import { getPrintWarning } from "./colorUtils";

export interface ExportColorWarning {
  fieldLabel: string;
  hex: string;
  warning: string;
}

export function checkExportColors(fields: CardField[]): ExportColorWarning[] {
  const warnings: ExportColorWarning[] = [];
  for (const f of fields) {
    if (f.color) {
      const w = getPrintWarning(f.color);
      if (w) warnings.push({ fieldLabel: f.label, hex: f.color, warning: w });
    }
    if (f.borderColor && f.borderStyle && f.borderStyle !== "none") {
      const w = getPrintWarning(f.borderColor);
      if (w) warnings.push({ fieldLabel: `${f.label} (border)`, hex: f.borderColor, warning: w });
    }
  }
  return warnings;
}

export async function exportToPNG(
  element: HTMLElement,
  filename: string,
  scale = 3,
): Promise<void> {
  // Temporarily hide selection handles
  const handles = element.querySelectorAll<HTMLElement>("[data-handle]");
  handles.forEach(h => (h.style.display = "none"));
  const selected = element.querySelectorAll<HTMLElement>("[data-selected-border]");
  selected.forEach(s => (s.style.display = "none"));

  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
    });
    const link = document.createElement("a");
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } finally {
    handles.forEach(h => (h.style.display = ""));
    selected.forEach(s => (s.style.display = ""));
  }
}

export async function exportToPDF(
  frontEl: HTMLElement,
  backEl: HTMLElement | null,
  filename: string,
): Promise<void> {
  const CARD_W_MM = 85.6;
  const CARD_H_MM = 54;

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [CARD_W_MM, CARD_H_MM] });

  const addPage = async (el: HTMLElement, addNewPage: boolean) => {
    if (addNewPage) pdf.addPage([CARD_W_MM, CARD_H_MM], "landscape");
    const canvas = await html2canvas(el, { scale: 3, useCORS: true, allowTaint: true, backgroundColor: null });
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, CARD_W_MM, CARD_H_MM);
  };

  await addPage(frontEl, false);
  if (backEl) await addPage(backEl, true);

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
