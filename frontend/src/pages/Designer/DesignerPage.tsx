import DOMPurify from "dompurify";
import html2canvas from "html2canvas";
import { useRef, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { designerActions } from "../../features/designer/designerSlice";
import { cartActions } from "../../features/cart/cartSlice";
import type { CardField, CardTemplate, RHandle, DesignSide, DragState, ChipType } from "../../shared/types";
import { TEXT_TYPES } from "../../shared/types";
import type { CartItem } from "../../shared/types";
import { calcUnitPrice, calcTotal, uid, loadDesignerFonts, api } from "../../shared/utils";
import { uploadFile } from "../../shared/utils/api";
import { API_BASE } from "../../shared/utils/apiBase";
import {
  fetchPublicOptions,
  fetchPublicPricing,
  selectChipTypeOptions,
  selectFinishOptions,
  selectMaterialOptions,
  selectPricingConfig,
} from "../../features/config/configSlice";
import { safeSetItem } from "../../shared/utils/storage";
import { selectIsAuthenticated, selectAuthUser, authActions } from "../../features/auth/authSlice";
import { Btn, Section, FieldRow, RadioGroup, Select } from "../../shared/components";
import { FIELD_TEMPLATES, FIELD_COLORS } from "../../features/designer/constants";
import { CardCanvas } from "../../features/designer/components/CardCanvas";
import { PreviewField } from "../../features/designer/components/PreviewField";
import { FontPicker } from "../../features/designer/components/FontPicker";
import { ColorPicker } from "../../features/designer/components/ColorPicker";
import { useFabricCanvas } from "../../features/designer/hooks/useFabricCanvas";
import { checkExportColors } from "../../features/designer/services/exportService";
import TemplatePage from "./Templategallery";
import Checkout from "../Checkout";

import type {
  PrinterType, PrintSide, Orientation, Finish, Material, CardType,
} from "../../shared/types";

// ── Load fonts once ──────────────────────────────────────────────
loadDesignerFonts();

// ── Main Component ───────────────────────────────────────────────
export default function IDCardDesigner() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const d = useAppSelector(s => s.designer);
  const cart = useAppSelector(s => s.cart);
  const chipTypeOptions = useAppSelector(selectChipTypeOptions);
  const finishOptions = useAppSelector(selectFinishOptions);
  const materialOptions = useAppSelector(selectMaterialOptions);
  const pricingConfig = useAppSelector(selectPricingConfig);

  const {
    printer, printSide, cardType, orientation, chipType, finish, material, quantity,
    activeTab, designingSide, selectedFieldId, showFieldPicker,
    frontFields, backFields, frontBg, backBg, frontBgUrl, backBgUrl, showPreview, savedToast,
    designs, activeDesignId,
  } = d;

  const { canUndo, canRedo, undo, redo } = useFabricCanvas();
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [exportWarnings, setExportWarnings] = useState<{ fieldLabel: string; hex: string; warning: string }[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [saveTemplateError, setSaveTemplateError] = useState<string | null>(null);
  const [saveTemplateSuccess, setSaveTemplateSuccess] = useState(false);

  const fields = designingSide === "front" ? frontFields : backFields;

  const isHorizontal = orientation === "Horizontal";
  const cardW = isHorizontal ? 380 : 240;
  const cardH = isHorizontal ? 240 : 380;

  // Fetch dynamic card options and pricing config from backend
  useEffect(() => {
    dispatch(fetchPublicOptions());
    dispatch(fetchPublicPricing());
  }, [dispatch]);

  const dragging = useRef<DragState | null>(null);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const previewFrontRef = useRef<HTMLDivElement>(null);
  const previewBackRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, fieldId: string) => {
    e.preventDefault(); e.stopPropagation();
    const all = designingSide === "front" ? frontFields : backFields;
    const f = all.find(x => x.id === fieldId);
    if (!f) return;
    dispatch(designerActions.selectField(fieldId));
    dragging.current = { id: fieldId, mode: "move", startX: e.clientX, startY: e.clientY, origX: f.x, origY: f.y };
  }, [designingSide, frontFields, backFields, dispatch]);

  const handleResizeDown = useCallback((e: React.MouseEvent, fieldId: string, handle: RHandle) => {
    e.preventDefault(); e.stopPropagation();
    const all = designingSide === "front" ? frontFields : backFields;
    const f = all.find(x => x.id === fieldId);
    if (!f) return;
    dispatch(designerActions.selectField(fieldId));
    dragging.current = { id: fieldId, mode: "resize", handle, startX: e.clientX, startY: e.clientY, origX: f.x, origY: f.y, origW: f.width, origH: f.height };
  }, [designingSide, frontFields, backFields, dispatch]);

  useEffect(() => {
    const activeRef = designingSide === "front" ? frontCardRef : backCardRef;
    const SNAP_GUIDES = [25, 50, 75];
    const SNAP_THRESHOLD = 2;
    const snapVal = (v: number) => {
      for (const g of SNAP_GUIDES) { if (Math.abs(v - g) < SNAP_THRESHOLD) return g; }
      return v;
    };

    const onMove = (e: MouseEvent) => {
      const dr = dragging.current;
      if (!dr || !activeRef.current) return;
      const rect = activeRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dr.startX) / rect.width) * 100;
      const dy = ((e.clientY - dr.startY) / rect.height) * 100;
      if (dr.mode === "move") {
        dispatch(designerActions.updateField({
          id: dr.id,
          patch: {
            x: snapVal(Math.max(0, Math.min(95, dr.origX + dx))),
            y: snapVal(Math.max(0, Math.min(95, dr.origY + dy))),
          },
        }));
      } else {
        const h = dr.handle;
        let nx = dr.origX, ny = dr.origY, nw = dr.origW, nh = dr.origH;
        if (h === "e" || h === "se" || h === "ne") nw = Math.max(5, dr.origW + dx);
        if (h === "w" || h === "sw" || h === "nw") { nw = Math.max(5, dr.origW - dx); nx = Math.min(dr.origX + dr.origW - 5, dr.origX + dx); }
        if (h === "s" || h === "se" || h === "sw") nh = Math.max(3, dr.origH + dy);
        if (h === "n" || h === "ne" || h === "nw") { nh = Math.max(3, dr.origH - dy); ny = Math.min(dr.origY + dr.origH - 3, dr.origY + dy); }
        nx = Math.max(0, Math.min(90, nx)); ny = Math.max(0, Math.min(90, ny));
        nw = Math.min(100 - nx, nw); nh = Math.min(100 - ny, nh);
        dispatch(designerActions.updateField({ id: dr.id, patch: { x: nx, y: ny, width: nw, height: nh } }));
      }
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [designingSide, dispatch]);

  const updateField = (id: string, patch: Partial<CardField>) =>
    dispatch(designerActions.updateField({ id, patch }));

  const applyTemplate = (tpl: CardTemplate) => dispatch(designerActions.applyTemplate(tpl));

  // Keyboard arrow-key handler: pan photo image or move any field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedFieldId) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) === -1) return;
      // Don't intercept when typing in an input/textarea
      if (document.activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes((document.activeElement as HTMLElement).tagName)) return;
      e.preventDefault();
      const fields = designingSide === "front" ? frontFields : backFields;
      const field = fields.find(f => f.id === selectedFieldId);
      if (!field) return;
      const step = e.shiftKey ? 5 : 1;
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      if (field.type === "photo") {
        // Arrow keys pan the image inside the field
        updateField(field.id, {
          imageOffsetX: Math.round(Math.max(-50, Math.min(50, (field.imageOffsetX ?? 0) + dx))),
          imageOffsetY: Math.round(Math.max(-50, Math.min(50, (field.imageOffsetY ?? 0) + dy))),
        });
      } else {
        // Arrow keys move the field position on the canvas
        updateField(field.id, {
          x: Math.round(Math.max(0, Math.min(90, field.x + dx))),
          y: Math.round(Math.max(0, Math.min(90, field.y + dy))),
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedFieldId, designingSide, frontFields, backFields]);

  const handleTemplateUpload = async (file: File, side: "front" | "back") => {
    const fd = new FormData();
    fd.append("file", file, file.name);
    try {
      const { url } = await uploadFile<{ url: string }>("/api/uploads/image", fd);
      if (side === "front") dispatch(designerActions.setFrontBg({ url }));
      else dispatch(designerActions.setBackBg({ url }));
    } catch {
      // upload failed silently — canvas stays blank
    }
  };

  const handleOrderClick = () => {
    const warnings = checkExportColors([...frontFields, ...backFields]);
    if (warnings.length > 0) {
      setExportWarnings(warnings);
      return;
    }
    placeOrder();
  };

  const placeOrder = async () => {
    // Merge card_options price_addon into pricingConfig so calculation matches what the dropdowns show
    const addonFromOptions = (opts: { value: string; price_addon: number }[], val: string) =>
      opts.find(o => o.value === val)?.price_addon;
    const mergedConfig: Record<string, number> = {
      ...pricingConfig,
      addon_rfid:     addonFromOptions(chipTypeOptions, "RFID")    ?? pricingConfig.addon_rfid,
      addon_led:      addonFromOptions(chipTypeOptions, "LED")     ?? pricingConfig.addon_led,
      addon_glossy:   addonFromOptions(finishOptions,   "Glossy")  ?? pricingConfig.addon_glossy,
      addon_metallic: addonFromOptions(finishOptions,   "Metallic")?? pricingConfig.addon_metallic,
    };
    const unitPrice = calcUnitPrice(printer, finish, chipType, printSide, mergedConfig);
    const totalPrice = calcTotal(unitPrice, quantity, mergedConfig);

    // Save design + capture thumbnail (best-effort — never blocks adding to cart)
    let designId: string | undefined;
    if (isAuthenticated) {
      try {
        // 1. Save design record
        const saved = await api.post<{ id: string }>("/api/designs/", {
          name: "Untitled Design",
          printer, print_side: printSide, card_type: cardType,
          orientation, chip_type: chipType, finish, material,
          front_fields: frontFields,
          back_fields: backFields,
        });
        designId = saved.id;

        // 2. Capture front card as PNG using html2canvas (runs in background)
        if (frontCardRef.current) {
          const savedId = designId;
          html2canvas(frontCardRef.current, {
            backgroundColor: null,
            scale: 1,
            useCORS: true,
            logging: false,
          }).then(canvas => {
            return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
          }).then(async (blob) => {
            if (!blob) return;
            const fd = new FormData();
            fd.append("file", blob, "thumbnail.png");
            const { url } = await uploadFile<{ url: string }>("/api/uploads/image", fd);
            await api.put(`/api/designs/${savedId}`, { thumbnail_url: url });
          }).catch(() => {
            // thumbnail capture/upload failed silently
          });
        }
      } catch {
        // design save failed — cart item still added without design_id
      }
    }

    const newItem: CartItem = {
      id: uid(),
      designId,
      cardType, printer, printSide, orientation,
      chipType, finish, material, quantity,
      unitPrice, totalPrice,
      frontFieldCount: frontFields.length,
      backFieldCount: backFields.length,
      addedAt: new Date().toLocaleString(),
    };
    dispatch(cartActions.addItem(newItem));
    setTimeout(() => dispatch(cartActions.setOrderPlaced(false)), 2500);
  };



  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authUser = useAppSelector(selectAuthUser);

  const saveDesign = async () => {
    const design = {
      frontFields, backFields,
      settings: { printer, printSide, orientation, cardType, chipType, finish, material, quantity },
    };
    safeSetItem("idcard_draft", design);

    if (isAuthenticated) {
      try {
        await api.post("/api/designs/", {
          name: "Untitled Design",
          printer,
          print_side: printSide,
          card_type: cardType,
          orientation,
          chip_type: chipType,
          finish,
          material,
          front_fields: frontFields,
          back_fields: backFields,
        });
      } catch {
        // Server save failed — localStorage save already succeeded
      }
    }

    dispatch(designerActions.showSavedToast());
    setTimeout(() => dispatch(designerActions.hideSavedToast()), 2500);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setSaveTemplateError("Please enter a template name");
      return;
    }
    setSavingTemplate(true);
    setSaveTemplateError(null);
    try {
      await api.post("/api/templates/my", {
        name: templateName.trim(),
        front_fields: frontFields,
        back_fields: backFields,
        front_bg_url: frontBgUrl || null,
        back_bg_url: backBgUrl || null,
        orientation,
        accent_color: null,
        bg_color: null,
      });
      setSaveTemplateSuccess(true);
      setTimeout(() => {
        setShowSaveTemplate(false);
        setSaveTemplateSuccess(false);
        setTemplateName("");
      }, 1800);
    } catch (err: unknown) {
      setSaveTemplateError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const selectedField = fields.find(f => f.id === selectedFieldId) ?? null;
  const showTemplatePage = activeTab === "TEMPLATE";

  // ── Show Checkout ──
  if (cart.showCheckout) return (
    <Checkout
      cartItems={cart.items}
      onBack={() => dispatch(cartActions.setShowCheckout(false))}
      onUpdateCart={items => dispatch(cartActions.updateItems(items))}
    />
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#13161d", minHeight: "100vh", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>

      {/* Top Bar */}
      <div style={{ background: "#1a1e28", borderBottom: "1px solid #2a2f3e", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 56, gap: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Btn ghost>{"\u2190"} BACK</Btn>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: 1.5, color: "#f1f5f9" }}>ID CARD DESIGNER</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
            style={{ background: "#1e2330", border: `1px solid ${canUndo ? "#3a3f52" : "#2a2f3e"}`, color: canUndo ? "#94a3b8" : "#3a3f52", borderRadius: 6, padding: "7px 12px", cursor: canUndo ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 600, transition: "all 0.15s" }}>
            ↩
          </button>
          <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
            style={{ background: "#1e2330", border: `1px solid ${canRedo ? "#3a3f52" : "#2a2f3e"}`, color: canRedo ? "#94a3b8" : "#3a3f52", borderRadius: 6, padding: "7px 12px", cursor: canRedo ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 600, transition: "all 0.15s" }}>
            ↪
          </button>
          <button onClick={saveDesign}
            style={{ background: "#1e2330", border: "1px solid #3a3f52", color: "#94a3b8", borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#16a34a55"; e.currentTarget.style.color = "#16a34a"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#3a3f52"; e.currentTarget.style.color = "#94a3b8"; }}>
            {"\u{1F4BE}"} SAVE & FINISH LATER
          </button>
          {isAuthenticated && (
            <button onClick={() => { setShowSaveTemplate(true); setSaveTemplateError(null); setSaveTemplateSuccess(false); setTemplateName(""); }}
              style={{ background: "#1e2330", border: "1px solid #3a3f52", color: "#94a3b8", borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#a855f755"; e.currentTarget.style.color = "#a855f7"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#3a3f52"; e.currentTarget.style.color = "#94a3b8"; }}
              title="Save current design as a personal template">
              {"\u{1F4CB}"} SAVE AS TEMPLATE
            </button>
          )}
          <button onClick={() => dispatch(designerActions.setShowPreview(true))}
            style={{ background: "#1e2330", border: "1px solid #3a3f52", color: "#94a3b8", borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e955"; e.currentTarget.style.color = "#0ea5e9"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#3a3f52"; e.currentTarget.style.color = "#94a3b8"; }}>
            {"\u{1F441}"} PREVIEW
          </button>
          <Btn accent>CONTINUE TO DESIGN</Btn>
          <button
            onClick={() => dispatch(cartActions.setShowCart(true))}
            style={{ background: "#1e2330", border: `1px solid ${cart.items.length > 0 ? "#e05c1a55" : "#3a3f52"}`, color: "#94a3b8", borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, position: "relative", display: "flex", alignItems: "center", gap: 6 }}
          >
            {"\u{1F6D2}"}
            {cart.items.length > 0 && (
              <span style={{ background: "#e05c1a", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: -6, right: -6 }}>
                {cart.items.length}
              </span>
            )}
          </button>
          {isAuthenticated && authUser ? (
            <>
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
                {authUser.first_name || authUser.email.split("@")[0]}
              </span>
              <Btn ghost onClick={() => { dispatch(authActions.logout()); navigate("/"); }}>LOGOUT</Btn>
            </>
          ) : (
            <Btn ghost onClick={() => dispatch(authActions.openAuthModal("login"))}>SIGN IN</Btn>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left Panel ── */}
        <div style={{ width: 300, background: "#1a1e28", borderRight: "1px solid #2a2f3e", overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 14, flexShrink: 0 }}>

          <Section title="PRINTER COMPATIBILITY">
            <RadioGroup options={["Thermal", "Inkjet"]} value={printer}
              onChange={v => dispatch(designerActions.setPrinter(v as PrinterType))} />
            {printer === "Inkjet" && (
              <div style={{ marginTop: 10, background: "#2d1f0e", border: "1px solid #f59e0b55", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{"\u26A0\uFE0F"}</span>
                <p style={{ fontSize: 11, color: "#f59e0b", margin: 0, lineHeight: 1.5 }}>
                  <strong>Inkjet selected:</strong> Design tools are disabled for this printer type.
                </p>
              </div>
            )}
          </Section>

          {printer === "Thermal" && (
            <>
              {/* Design Tools */}
              <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 10, padding: 13 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, marginBottom: 11 }}>DESIGN TOOLS</div>
                <div style={{ display: "flex", background: "#13161d", borderRadius: 7, padding: 3, marginBottom: activeTab === "TEMPLATE" ? 0 : 13, gap: 2 }}>
                  {(["CONTENT", "TEMPLATE"] as const).map(tab => (
                    <button key={tab} onClick={() => dispatch(designerActions.setActiveTab(tab))}
                      style={{ flex: 1, background: activeTab === tab ? "#e05c1a" : "transparent", border: "none", color: activeTab === tab ? "#fff" : "#64748b", borderRadius: 5, padding: "6px 3px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                      {tab === "CONTENT" ? "\u270F " : "\u229E "}{tab}
                    </button>
                  ))}
                </div>

                {activeTab !== "TEMPLATE" && (
                  <>
                    <FieldRow label="Print Side">
                      <RadioGroup options={["Single Side", "Both Sides"]} value={printSide}
                        onChange={v => dispatch(designerActions.setPrintSide(v as PrintSide))} />
                    </FieldRow>

                    {printSide === "Both Sides" && (
                      <FieldRow label="Designing Side">
                        <div style={{ display: "flex", gap: 6 }}>
                          {(["front", "back"] as DesignSide[]).map(side => (
                            <button key={side} onClick={() => dispatch(designerActions.setDesigningSide(side))}
                              style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: `2px solid ${designingSide === side ? "#e05c1a" : "#2a2f3e"}`, background: designingSide === side ? "#e05c1a18" : "#13161d", color: designingSide === side ? "#e05c1a" : "#64748b", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}>
                              {side === "front" ? "\u25E7 FRONT" : "\u25E8 BACK"}
                            </button>
                          ))}
                        </div>
                        <p style={{ fontSize: 10, color: "#475569", margin: "5px 0 0" }}>
                          Editing <span style={{ color: "#e05c1a", fontWeight: 700 }}>{designingSide.toUpperCase()}</span> side.
                        </p>
                      </FieldRow>
                    )}

                    <FieldRow label="Card Type">
                      <RadioGroup options={["Company", "School", "Others"]} value={cardType} onChange={v => dispatch(designerActions.setCardType(v as CardType))} />
                      <p style={{ fontSize: 10, color: "#475569", margin: "4px 0 0" }}>Select a card type to load default fields.</p>
                    </FieldRow>

                    <FieldRow label="ID Card Size">
                      <Select value="Standard (87 mm \u00D7 57 mm)" options={["Standard (87 mm \u00D7 57 mm)", "Custom"]} />
                    </FieldRow>

                    <FieldRow label="Card Orientation">
                      <RadioGroup options={["Horizontal", "Vertical"]} value={orientation} onChange={v => dispatch(designerActions.setOrientation(v as Orientation))} />
                    </FieldRow>

                    <div style={{ position: "relative" }}>
                      <button onClick={() => dispatch(designerActions.toggleFieldPicker())}
                        style={{ width: "100%", background: "#e05c1a", border: "none", color: "#fff", borderRadius: 7, padding: "10px 0", cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <span style={{ fontSize: 16 }}>+</span> Add Fields
                      </button>
                      {showFieldPicker && (
                        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#1a1e28", border: "1px solid #3a3f52", borderRadius: 9, zIndex: 200, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.55)" }}>
                          <div style={{ padding: "8px 12px 5px", fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: 1.5 }}>ADD FIELD</div>
                          {([
                            { type: "photo",   icon: "👤", label: "Photo",      desc: "Upload a person photo",     color: "#6366f1" },
                            { type: "text",    icon: "T",  label: "Text Label", desc: "Any text — name, title…",   color: "#e05c1a" },
                            { type: "barcode", icon: "▦",  label: "Barcode",    desc: "CODE128 scannable barcode", color: "#64748b" },
                            { type: "qr",      icon: "⬛", label: "QR Code",   desc: "URL or text as QR code",    color: "#0f172a" },
                          ] as const).map((t, i, arr) => (
                            <button key={t.type}
                              onClick={() => dispatch(designerActions.addField(t.type))}
                              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "transparent", border: "none", borderBottom: i < arr.length - 1 ? "1px solid #2a2f3e33" : "none", color: "#e2e8f0", cursor: "pointer", textAlign: "left" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#e05c1a12")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                              <span style={{ width: 34, height: 34, borderRadius: 8, background: t.color + "22", border: `1px solid ${t.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, fontWeight: 700, color: t.color }}>{t.icon}</span>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginBottom: 1 }}>{t.label}</div>
                                <div style={{ fontSize: 10, color: "#475569" }}>{t.desc}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                      <button onClick={saveDesign}
                        style={{ flex: 1, background: "#14532d22", border: "1px solid #16a34a44", color: "#16a34a", borderRadius: 6, padding: "6px 4px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                        {"\u{1F4BE}"} Save
                      </button>
                      <button onClick={() => dispatch(designerActions.clearFields())}
                        style={{ flex: 1, background: "#7f1d1d22", border: "1px solid #dc262644", color: "#dc2626", borderRadius: 6, padding: "6px 4px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                        {"\u2715"} Clear
                      </button>
                      <button onClick={undo} disabled={!canUndo}
                        style={{ flex: 1, background: canUndo ? "#1e2a4022" : "transparent", border: `1px solid ${canUndo ? "#0ea5e944" : "#2a2f3e"}`, color: canUndo ? "#0ea5e9" : "#3a3f52", borderRadius: 6, padding: "6px 4px", cursor: canUndo ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 600 }}>
                        ↩ Undo
                      </button>
                      <button onClick={redo} disabled={!canRedo}
                        style={{ flex: 1, background: canRedo ? "#1e2a4022" : "transparent", border: `1px solid ${canRedo ? "#0ea5e944" : "#2a2f3e"}`, color: canRedo ? "#0ea5e9" : "#3a3f52", borderRadius: 6, padding: "6px 4px", cursor: canRedo ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 600 }}>
                        ↪ Redo
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Field List (only in CONTENT tab) */}
              {activeTab === "CONTENT" && fields.length > 0 && (
                <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, marginBottom: 8 }}>
                    {designingSide.toUpperCase()} FIELDS ({fields.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {fields.map(f => (
                      <div key={f.id} onClick={() => dispatch(designerActions.selectField(f.id))}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, background: selectedFieldId === f.id ? "#e05c1a18" : "#13161d", border: `1px solid ${selectedFieldId === f.id ? "#e05c1a55" : "#2a2f3e"}`, cursor: "pointer", transition: "all 0.15s" }}>
                        <span style={{ width: 22, height: 22, borderRadius: 5, background: FIELD_COLORS[f.type] + "28", border: `1px solid ${FIELD_COLORS[f.type]}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
                          {FIELD_TEMPLATES.find(t => t.type === f.type)?.icon}
                        </span>
                        <span style={{ fontSize: 11, flex: 1, color: selectedFieldId === f.id ? "#e2e8f0" : "#94a3b8" }}>{f.label}</span>
                        <button onClick={e => { e.stopPropagation(); dispatch(designerActions.removeField(f.id)); }}
                          style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 13, padding: "0 2px" }}>{"\u2715"}</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Field Properties */}
              {activeTab === "CONTENT" && selectedField && (
                <div style={{ background: "#1e2330", border: "1px solid #e05c1a33", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#e05c1a", letterSpacing: 1.5, marginBottom: 10 }}>FIELD PROPERTIES</div>

                  {/* Field label rename */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", letterSpacing: 1, marginBottom: 5 }}>FIELD NAME</div>
                    <input value={selectedField.label} onChange={e => updateField(selectedField.id, { label: e.target.value })}
                      style={{ width: "100%", background: "#13161d", border: "1px solid #e05c1a55", color: "#e2e8f0", borderRadius: 6, padding: "8px 10px", fontSize: 13, fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: selectedField.fontFamily ?? "inherit" }} />
                  </div>

                  {/* Align to another field */}
                  {(() => {
                    const otherFields = fields.filter(f => f.id !== selectedField.id);
                    if (otherFields.length === 0) return null;
                    return (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", letterSpacing: 1, marginBottom: 6 }}>ALIGN TO FIELD</div>
                        <select
                          id="align-ref-select"
                          defaultValue=""
                          style={{ width: "100%", background: "#13161d", border: "1px solid #2a2f3e", color: "#94a3b8", borderRadius: 6, padding: "6px 8px", fontSize: 11, marginBottom: 6, outline: "none", boxSizing: "border-box" }}>
                          <option value="" disabled>Select reference field…</option>
                          {otherFields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                        <div style={{ display: "flex", gap: 3 }}>
                          {([
                            { label: "⬅ Left",   title: "Match left edge",       apply: (ref: typeof selectedField) => ({ x: ref.x }) },
                            { label: "↔ Center", title: "Match horizontal center",apply: (ref: typeof selectedField) => ({ x: Math.round(ref.x + (ref.width - selectedField.width) / 2) }) },
                            { label: "Right ➡", title: "Match right edge",       apply: (ref: typeof selectedField) => ({ x: Math.round(ref.x + ref.width - selectedField.width) }) },
                            { label: "⬆ Top",    title: "Match top edge",        apply: (ref: typeof selectedField) => ({ y: ref.y }) },
                            { label: "↕ Mid",    title: "Match vertical center", apply: (ref: typeof selectedField) => ({ y: Math.round(ref.y + (ref.height - selectedField.height) / 2) }) },
                            { label: "Bot ⬇",   title: "Match bottom edge",     apply: (ref: typeof selectedField) => ({ y: Math.round(ref.y + ref.height - selectedField.height) }) },
                          ]).map(a => (
                            <button key={a.title} title={a.title}
                              onClick={() => {
                                const sel = document.getElementById("align-ref-select") as HTMLSelectElement;
                                const refId = sel?.value;
                                const ref = otherFields.find(f => f.id === refId);
                                if (!ref) return;
                                updateField(selectedField.id, a.apply(ref));
                              }}
                              style={{ flex: 1, padding: "4px 1px", borderRadius: 5, border: "1px solid #2a2f3e", background: "#13161d", color: "#94a3b8", cursor: "pointer", fontSize: 8, fontWeight: 600, whiteSpace: "nowrap" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = "#e05c1a66"; e.currentTarget.style.color = "#e05c1a"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2f3e"; e.currentTarget.style.color = "#94a3b8"; }}>
                              {a.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {TEXT_TYPES.includes(selectedField.type) && (
                    <>
                      <FieldRow label="Font Family">
                        <FontPicker value={selectedField.fontFamily ?? "Arial, sans-serif"} onChange={v => updateField(selectedField.id, { fontFamily: v })} />
                      </FieldRow>
                      <FieldRow label={`Font Size: ${selectedField.fontSize ?? 12}px`}>
                        <input type="range" min={8} max={40} value={selectedField.fontSize ?? 12}
                          onChange={e => updateField(selectedField.id, { fontSize: +e.target.value })}
                          style={{ width: "100%", accentColor: "#e05c1a" }} />
                      </FieldRow>
                      <FieldRow label="Style">
                        <div style={{ display: "flex", gap: 5 }}>
                          {[
                            { key: "bold", label: "B", active: !!selectedField.bold, extraStyle: { fontWeight: 700 as const } },
                            { key: "italic", label: "I", active: !!selectedField.italic, extraStyle: { fontStyle: "italic" as const } },
                            { key: "underline", label: "U", active: !!selectedField.underline, extraStyle: { textDecoration: "underline" as const } },
                          ].map(s => (
                            <button key={s.key}
                              onClick={() => updateField(selectedField.id, { [s.key]: !(selectedField as unknown as Record<string, unknown>)[s.key] })}
                              style={{ width: 34, height: 34, borderRadius: 6, border: `1px solid ${s.active ? "#e05c1a" : "#2a2f3e"}`, background: s.active ? "#e05c1a22" : "#13161d", color: s.active ? "#e05c1a" : "#64748b", cursor: "pointer", fontSize: 14, ...s.extraStyle }}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </FieldRow>
                      <FieldRow label="Text Color">
                        <ColorPicker value={selectedField.color ?? "#1e293b"} onChange={c => updateField(selectedField.id, { color: c })} />
                      </FieldRow>
                      <FieldRow label="Alignment">
                        <div style={{ display: "flex", gap: 5 }}>
                          {(["left", "center", "right"] as const).map(a => (
                            <button key={a} onClick={() => updateField(selectedField.id, { align: a })}
                              style={{ flex: 1, padding: "5px 0", borderRadius: 5, border: `1px solid ${selectedField.align === a ? "#e05c1a" : "#2a2f3e"}`, background: selectedField.align === a ? "#e05c1a22" : "#13161d", color: selectedField.align === a ? "#e05c1a" : "#64748b", cursor: "pointer", fontSize: 13 }}>
                              {a === "left" ? "\u2BF7" : a === "center" ? "\u2261" : "\u2BF8"}
                            </button>
                          ))}
                        </div>
                      </FieldRow>
                      <div style={{ background: "#13161d", border: "1px solid #2a2f3e", borderRadius: 6, padding: "10px 12px", textAlign: selectedField.align ?? "left", marginTop: 4 }}>
                        <span style={{ fontFamily: selectedField.fontFamily ?? "inherit", fontSize: Math.min(selectedField.fontSize ?? 12, 18), fontWeight: selectedField.bold ? 700 : 400, fontStyle: selectedField.italic ? "italic" : "normal", textDecoration: selectedField.underline ? "underline" : "none", color: selectedField.color ?? "#1e293b", background: (!selectedField.color || selectedField.color === "#1e293b") ? "#e2e8f0" : "transparent", padding: "0 2px", borderRadius: 2 }}>
                          {selectedField.label || "Preview"}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Barcode properties */}
                  {selectedField.type === "barcode" && (
                    <>
                      <div style={{ height: 1, background: "#2a2f3e", margin: "6px 0 12px" }} />
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, marginBottom: 10 }}>BARCODE DATA</div>
                      <FieldRow label="Barcode Value">
                        <input value={selectedField.barcodeValue ?? "1234567890"}
                          onChange={e => updateField(selectedField.id, { barcodeValue: e.target.value })}
                          style={{ width: "100%", background: "#13161d", border: "1px solid #2a2f3e", color: "#e2e8f0", borderRadius: 6, padding: "7px 10px", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} />
                      </FieldRow>
                      <FieldRow label="Bar Color">
                        <ColorPicker value={selectedField.color ?? "#000000"} onChange={c => updateField(selectedField.id, { color: c })} />
                      </FieldRow>
                    </>
                  )}

                  {/* QR properties */}
                  {selectedField.type === "qr" && (
                    <>
                      <div style={{ height: 1, background: "#2a2f3e", margin: "6px 0 12px" }} />
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, marginBottom: 10 }}>QR CODE DATA</div>
                      <FieldRow label="QR Content (URL or text)">
                        <input value={selectedField.qrValue ?? "https://example.com"}
                          onChange={e => updateField(selectedField.id, { qrValue: e.target.value })}
                          style={{ width: "100%", background: "#13161d", border: "1px solid #2a2f3e", color: "#e2e8f0", borderRadius: 6, padding: "7px 10px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </FieldRow>
                      <FieldRow label="QR Color">
                        <ColorPicker value={selectedField.color ?? "#000000"} onChange={c => updateField(selectedField.id, { color: c })} />
                      </FieldRow>
                    </>
                  )}

                  {selectedField.type === "photo" && (
                    <>
                      <div style={{ height: 1, background: "#2a2f3e", margin: "6px 0 12px" }} />
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: 1.5, marginBottom: 10 }}>PHOTO</div>

                      {selectedField.imageUrl ? (
                        <div style={{ position: "relative", marginBottom: 12 }}>
                          <img src={selectedField.imageUrl} alt="Uploaded"
                            style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8, border: "1px solid #2a2f3e", display: "block" }} />
                          <button onClick={() => updateField(selectedField.id, { imageUrl: undefined })}
                            style={{ position: "absolute", top: 6, right: 6, background: "#ef444499", border: "none", color: "#fff", borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u2715"}</button>
                          <div style={{ position: "absolute", bottom: 6, left: 6, background: "#16a34a", borderRadius: 4, padding: "2px 7px", fontSize: 9, fontWeight: 700, color: "#fff" }}>{"\u2713"} Photo uploaded</div>
                        </div>
                      ) : (
                        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "2px dashed #6366f133", background: "#13161d", cursor: "pointer", marginBottom: 12 }}>
                          <span style={{ fontSize: 20, opacity: 0.4 }}>{"\u{1F464}"}</span>
                          <div>
                            <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, marginBottom: 2 }}>Upload Photo</div>
                            <div style={{ fontSize: 9, color: "#475569" }}>Click here or click the photo frame on canvas</div>
                          </div>
                          <input type="file" accept="image/*" style={{ display: "none" }}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = ev => updateField(selectedField.id, { imageUrl: ev.target?.result as string });
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }} />
                        </label>
                      )}

                      <div style={{ height: 1, background: "#2a2f3e", margin: "0 0 12px" }} />
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: 1.5, marginBottom: 10 }}>PHOTO BORDER</div>
                      <FieldRow label="Border Style">
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {(["none", "solid", "dashed", "dotted", "double"] as const).map(s => {
                            const active = (selectedField.borderStyle ?? "none") === s;
                            return <button key={s} onClick={() => updateField(selectedField.id, { borderStyle: s })}
                              style={{ flex: 1, minWidth: 44, padding: "6px 4px", borderRadius: 6, border: `1px solid ${active ? "#6366f1" : "#2a2f3e"}`, background: active ? "#6366f122" : "#13161d", color: active ? "#6366f1" : "#64748b", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                              {s === "none" ? "None" : s === "solid" ? "\u2014" : s === "dashed" ? "- -" : s === "dotted" ? "\u00B7\u00B7\u00B7" : "\u2550\u2550"}
                            </button>;
                          })}
                        </div>
                      </FieldRow>
                      {(selectedField.borderStyle ?? "none") !== "none" && (
                        <>
                          <FieldRow label={`Border Width: ${selectedField.borderWidth ?? 2}px`}>
                            <input type="range" min={1} max={12} value={selectedField.borderWidth ?? 2}
                              onChange={e => updateField(selectedField.id, { borderWidth: +e.target.value })}
                              style={{ width: "100%", accentColor: "#6366f1" }} />
                          </FieldRow>
                          <FieldRow label="Border Color">
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              {["#1e293b", "#ffffff", "#e05c1a", "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#f97316", "#8b5cf6"].map(c => {
                                const active = (selectedField.borderColor ?? "#1e293b") === c;
                                return <div key={c} onClick={() => updateField(selectedField.id, { borderColor: c })}
                                  style={{ width: 22, height: 22, borderRadius: 5, background: c, border: active ? "2px solid #6366f1" : "2px solid #2a2f3e", cursor: "pointer", boxShadow: active ? "0 0 0 2px #6366f144" : "none" }} />;
                              })}
                              <label style={{ width: 22, height: 22, borderRadius: 5, border: "1px dashed #3a3f52", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#64748b", position: "relative" }}>
                                <span>+</span>
                                <input type="color" value={selectedField.borderColor ?? "#1e293b"} onChange={e => updateField(selectedField.id, { borderColor: e.target.value })}
                                  style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
                              </label>
                            </div>
                          </FieldRow>
                        </>
                      )}
                      <FieldRow label={`Corner Radius: ${selectedField.borderRadius ?? 6}px`}>
                        <input type="range" min={0} max={80} value={selectedField.borderRadius ?? 6}
                          onChange={e => updateField(selectedField.id, { borderRadius: +e.target.value })}
                          style={{ width: "100%", accentColor: "#6366f1" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                          {[{ label: "Square", val: 0 }, { label: "Slight", val: 8 }, { label: "Round", val: 20 }, { label: "Circle", val: 80 }].map(p => {
                            const active = (selectedField.borderRadius ?? 6) === p.val;
                            return <button key={p.label} onClick={() => updateField(selectedField.id, { borderRadius: p.val })}
                              style={{ fontSize: 9, padding: "3px 6px", borderRadius: 4, border: `1px solid ${active ? "#6366f1" : "#2a2f3e"}`, background: active ? "#6366f122" : "#13161d", color: active ? "#6366f1" : "#64748b", cursor: "pointer" }}>{p.label}</button>;
                          })}
                        </div>
                      </FieldRow>
                      <FieldRow label="Drop Shadow">
                        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <button onClick={() => updateField(selectedField.id, { shadowSize: (selectedField.shadowSize ?? 0) > 0 ? 0 : 6, shadowColor: selectedField.shadowColor ?? "#00000055" })}
                            style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${(selectedField.shadowSize ?? 0) > 0 ? "#6366f1" : "#2a2f3e"}`, background: (selectedField.shadowSize ?? 0) > 0 ? "#6366f122" : "#13161d", color: (selectedField.shadowSize ?? 0) > 0 ? "#6366f1" : "#64748b", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                            {(selectedField.shadowSize ?? 0) > 0 ? "\u2713 On" : "Off"}
                          </button>
                          {(selectedField.shadowSize ?? 0) > 0 && (
                            <input type="range" min={2} max={20} value={selectedField.shadowSize ?? 6}
                              onChange={e => updateField(selectedField.id, { shadowSize: +e.target.value })}
                              style={{ flex: 1, accentColor: "#6366f1" }} />
                          )}
                        </div>
                      </FieldRow>
                      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                        <div style={{ width: 60, height: 72, background: "#e2e8f0", border: (selectedField.borderStyle ?? "none") !== "none" ? `${selectedField.borderWidth ?? 2}px ${selectedField.borderStyle} ${selectedField.borderColor ?? "#1e293b"}` : "1px dashed #94a3b8", borderRadius: selectedField.borderRadius ?? 6, boxShadow: (selectedField.shadowSize ?? 0) > 0 ? `0 ${selectedField.shadowSize}px ${(selectedField.shadowSize ?? 6) * 2}px ${selectedField.shadowColor ?? "#00000055"}` : "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, transition: "all 0.2s" }}>
                          <span style={{ fontSize: 20, opacity: 0.4 }}>{"\u{1F464}"}</span>
                          <span style={{ fontSize: 7, color: "#64748b", fontWeight: 700 }}>PREVIEW</span>
                        </div>
                      </div>

                      {/* Photo zoom/fit/pan */}
                      <div style={{ height: 1, background: "#2a2f3e", margin: "12px 0" }} />
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: 1.5, marginBottom: 10 }}>IMAGE FIT &amp; ZOOM</div>
                      <FieldRow label="Image Fit">
                        <div style={{ display: "flex", gap: 5 }}>
                          {(["cover", "contain", "fill"] as const).map(fit => {
                            const active = (selectedField.imageFit ?? "cover") === fit;
                            return <button key={fit} onClick={() => updateField(selectedField.id, { imageFit: fit })}
                              style={{ flex: 1, padding: "5px 0", borderRadius: 5, border: `1px solid ${active ? "#6366f1" : "#2a2f3e"}`, background: active ? "#6366f122" : "#13161d", color: active ? "#6366f1" : "#64748b", cursor: "pointer", fontSize: 10, fontWeight: 600, textTransform: "capitalize" }}>
                              {fit}
                            </button>;
                          })}
                        </div>
                      </FieldRow>
                      <div style={{ background: "#13161d", border: "1px solid #2a2f3e", borderRadius: 7, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontSize: 9, color: "#6366f1", fontWeight: 700, letterSpacing: 0.5 }}>🖱 Scroll on photo to zoom</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>⬆⬇⬅➡ Arrow keys to pan image</div>
                      </div>
                    </>
                  )}

                </div>
              )}

              {/* ── Card Options ── */}
              <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #2a2f3e", display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 13 }}>{"\u2699\uFE0F"}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5 }}>CARD OPTIONS</span>
                </div>

                {/* Chip Type */}
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #2a2f3e22" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 11 }}>{"\u{1F4A1}"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Chip Type</span>
                  </div>
                  <select
                    value={chipType}
                    onChange={e => dispatch(designerActions.setChipType(e.target.value as ChipType))}
                    style={{ width: "100%", background: "#13161d", border: "1px solid #2a2f3e", borderRadius: 7, padding: "8px 10px", color: "#e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
                  >
                    {chipTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}{opt.price_addon > 0 ? ` (+₹${opt.price_addon.toFixed(2)})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Finish */}
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #2a2f3e22" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 11 }}>{"\u2728"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Finish</span>
                  </div>
                  <select
                    value={finish}
                    onChange={e => dispatch(designerActions.setFinish(e.target.value as Finish))}
                    style={{ width: "100%", background: "#13161d", border: "1px solid #2a2f3e", borderRadius: 7, padding: "8px 10px", color: "#e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
                  >
                    {finishOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}{opt.price_addon > 0 ? ` (+₹${opt.price_addon.toFixed(2)})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Material */}
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #2a2f3e22" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 11 }}>{"\u{1FAAA}"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Material</span>
                  </div>
                  <select
                    value={material}
                    onChange={e => dispatch(designerActions.setMaterial(e.target.value as Material))}
                    style={{ width: "100%", background: "#13161d", border: "1px solid #2a2f3e", borderRadius: 7, padding: "8px 10px", color: "#e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
                  >
                    {materialOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}{opt.price_addon > 0 ? ` (+₹${opt.price_addon.toFixed(2)})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11 }}>{"\u{1F4E6}"}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Quantity</span>
                    </div>
                    {quantity >= 50 && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981", background: "#10b98118", border: "1px solid #10b98133", borderRadius: 4, padding: "2px 6px" }}>
                        {quantity >= 500 ? `${pricingConfig.discount_500 ?? 25}%` : quantity >= 200 ? `${pricingConfig.discount_200 ?? 18}%` : quantity >= 100 ? `${pricingConfig.discount_100 ?? 12}%` : `${pricingConfig.discount_50 ?? 7}%`} OFF BULK
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", boxSizing: "border-box" }}>
                    <button onClick={() => dispatch(designerActions.decrementQuantity())}
                      style={{ width: 34, height: 34, borderRadius: 7, border: "1px solid #2a2f3e", background: "#13161d", color: "#94a3b8", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#e05c1a55"; e.currentTarget.style.color = "#e05c1a"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2f3e"; e.currentTarget.style.color = "#94a3b8"; }}>{"\u2212"}</button>
                    <input type="number" value={quantity} min={25} onChange={e => dispatch(designerActions.setQuantity(parseInt(e.target.value) || 25))}
                      style={{ flex: 1, minWidth: 0, background: "#13161d", border: "1px solid #2a2f3e", color: "#e2e8f0", borderRadius: 7, padding: "8px 10px", fontSize: 14, outline: "none", textAlign: "center", fontWeight: 700 }} />
                    <button onClick={() => dispatch(designerActions.incrementQuantity())}
                      style={{ width: 34, height: 34, borderRadius: 7, border: "1px solid #2a2f3e", background: "#13161d", color: "#94a3b8", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#e05c1a55"; e.currentTarget.style.color = "#e05c1a"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2f3e"; e.currentTarget.style.color = "#94a3b8"; }}>+</button>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {[
                      { min: 10, color: "#64748b" },
                      { min: 50, color: "#f59e0b" },
                      { min: 100, color: "#f97316" },
                      { min: 200, color: "#ef4444" },
                      { min: 500, color: "#10b981" },
                    ].map(tier => (
                      <div key={tier.min} style={{ flex: 1, height: 3, borderRadius: 2, background: quantity >= tier.min ? tier.color : "#2a2f3e", transition: "background 0.3s" }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 9, color: "#475569", margin: "5px 0 0" }}>Min. 25 {"\u00B7"} Bulk discounts from 50+ cards</p>
                </div>
              </div>

              <button onClick={placeOrder} style={{ width: "100%", background: "#e05c1a", border: "none", color: "#fff", borderRadius: 8, padding: "13px 0", cursor: "pointer", fontWeight: 700, fontSize: 14, letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {"\u{1F6D2}"} PLACE ORDER
              </button>
            </>
          )}

          {printer === "Inkjet" && (
            <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5 }}>INKJET ORDER</div>
              <FieldRow label={<>Chip Type <span style={{ color: "#e05c1a" }}>*</span></>}>
                <Select value={chipType} options={chipTypeOptions.map(o => o.value)}
                  onChange={v => dispatch(designerActions.setChipType(v as ChipType))} placeholder="Select Chip Type" />
                <p style={{ fontSize: 10, color: "#475569", margin: "5px 0 0" }}>Select chip type for your Inkjet cards.</p>
              </FieldRow>
              <FieldRow label="Quantity">
                <input type="number" value={quantity} min={25} onChange={e => dispatch(designerActions.setQuantity(parseInt(e.target.value) || 25))}
                  style={{ width: "100%", background: "#13161d", border: "1px solid #2a2f3e", color: "#e2e8f0", borderRadius: 7, padding: "9px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </FieldRow>
              <button onClick={placeOrder} style={{ width: "100%", background: "#e05c1a", border: "none", color: "#fff", borderRadius: 8, padding: "13px 0", cursor: "pointer", fontWeight: 700, fontSize: 14, letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {"\u{1F6D2}"} PLACE ORDER
              </button>
            </div>
          )}
        </div>

        {/* ── Right Panel ── */}
        {showTemplatePage ? (
          <TemplatePage
            isHorizontal={isHorizontal}
            onApply={applyTemplate}
            onClose={() => dispatch(designerActions.setActiveTab("CONTENT"))}
            onCreateTemplate={isAuthenticated ? () => {
              dispatch(designerActions.clearDesign());
              dispatch(designerActions.setActiveTab("CONTENT"));
            } : undefined}
          />
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}
            onClick={() => { dispatch(designerActions.hideFieldPicker()); dispatch(designerActions.selectField(null)); }}>

            {/* Multi-design tabs */}
            <div style={{ background: "#1a1e28", borderBottom: "1px solid #2a2f3e", padding: "0 24px", display: "flex", alignItems: "center", gap: 4, overflowX: "auto", flexShrink: 0 }}>
              {designs.map(d => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
                  {renamingId === d.id ? (
                    <input autoFocus value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => { dispatch(designerActions.renameDesign({ id: d.id, name: renameValue || d.name })); setRenamingId(null); }}
                      onKeyDown={e => { if (e.key === "Enter") { dispatch(designerActions.renameDesign({ id: d.id, name: renameValue || d.name })); setRenamingId(null); } if (e.key === "Escape") setRenamingId(null); }}
                      style={{ background: "#13161d", border: "1px solid #e05c1a", color: "#e2e8f0", borderRadius: 4, padding: "4px 8px", fontSize: 11, outline: "none", width: 100 }} />
                  ) : (
                    <button onClick={e => { e.stopPropagation(); dispatch(designerActions.switchDesign(d.id)); }}
                      onDoubleClick={e => { e.stopPropagation(); setRenamingId(d.id); setRenameValue(d.name); }}
                      style={{ padding: "8px 12px", background: "transparent", border: "none", borderBottom: `2px solid ${d.id === activeDesignId ? "#e05c1a" : "transparent"}`, color: d.id === activeDesignId ? "#e05c1a" : "#64748b", cursor: "pointer", fontSize: 11, fontWeight: d.id === activeDesignId ? 700 : 400, transition: "all 0.15s", whiteSpace: "nowrap" }}>
                      {d.name}
                    </button>
                  )}
                  {designs.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); dispatch(designerActions.removeDesign(d.id)); }}
                      style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 11, padding: "0 2px 0 0", lineHeight: 1 }}
                      title="Remove design">×</button>
                  )}
                </div>
              ))}
              <button onClick={e => { e.stopPropagation(); dispatch(designerActions.newDesign()); }}
                style={{ padding: "8px 10px", background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, fontWeight: 700, lineHeight: 1, flexShrink: 0 }}
                title="New design">+</button>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 32px", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1.5 }}>LIVE PREVIEW</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Zoom controls */}
                <div style={{ display: "flex", gap: 2, background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 6, padding: 2 }}>
                  {[0.5, 0.75, 1].map(z => (
                    <button key={z} onClick={e => { e.stopPropagation(); setCanvasZoom(z); }}
                      style={{ padding: "3px 7px", borderRadius: 4, border: "none", background: canvasZoom === z ? "#e05c1a" : "transparent", color: canvasZoom === z ? "#fff" : "#64748b", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#64748b" }}>
                  <span>{isHorizontal ? "\u2194" : "\u2195"}</span>
                  <span style={{ fontWeight: 600, color: "#94a3b8" }}>{orientation}</span>
                  <span>{"\u00B7"}</span>
                  <span>{printSide}</span>
                </div>
              </div>
            </div>

            {printer === "Inkjet" ? (
              <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                  <div style={{ width: isHorizontal ? 340 : 215, height: isHorizontal ? 215 : 340, background: "#1e2330", borderRadius: 14, border: "2px dashed #2a2f3e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ fontSize: 36, opacity: 0.25 }}>{"\u{1F5A8}\uFE0F"}</span>
                    <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, letterSpacing: 1 }}>BLANK CARD</span>
                  </div>
                  <div style={{ background: "#2d1f0e", border: "1px solid #f59e0b55", borderRadius: 10, padding: "12px 16px", maxWidth: 340 }}>
                    <p style={{ fontSize: 12, color: "#f59e0b", margin: 0, lineHeight: 1.6 }}>{"\u26A0\uFE0F"} Inkjet selected {"\u2014"} Switch to <strong>Thermal</strong> to use the card designer.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 48, flexWrap: "wrap", paddingTop: 8, transform: `scale(${canvasZoom})`, transformOrigin: "top center", transition: "transform 0.2s" }}>
                  <CardCanvas label="FRONT" side="front"
                    isActive={designingSide === "front" || printSide === "Single Side"}
                    isEditing={designingSide === "front"}
                    fields={frontFields} cardW={cardW} cardH={cardH}
                    cardRef={frontCardRef}
                    onMouseDown={handleMouseDown} onResizeDown={handleResizeDown}
                    selectedFieldId={designingSide === "front" ? selectedFieldId : null}
                    onCardClick={() => { dispatch(designerActions.selectField(null)); if (printSide === "Both Sides") { dispatch(designerActions.setDesigningSide("front")); } }}
                    printSide={printSide}
                    onPhotoUpload={(fieldId, dataUrl) => updateField(fieldId, { imageUrl: dataUrl })}
                    onImageUpdate={(fieldId, updates) => updateField(fieldId, updates)}
                    bgSvg={frontBg} bgUrl={frontBgUrl}
                    onTemplateUpload={file => handleTemplateUpload(file, "front")}
                    onRemoveBackground={() => dispatch(designerActions.setFrontBg({ url: "" }))}
                    onLabelChange={(fieldId, label) => updateField(fieldId, { label })} />
                  {printSide === "Both Sides" && (
                    <CardCanvas label="BACK" side="back"
                      isActive={designingSide === "back"}
                      isEditing={designingSide === "back"}
                      fields={backFields} cardW={cardW} cardH={cardH}
                      cardRef={backCardRef}
                      onMouseDown={handleMouseDown} onResizeDown={handleResizeDown}
                      selectedFieldId={designingSide === "back" ? selectedFieldId : null}
                      onCardClick={() => { dispatch(designerActions.selectField(null)); dispatch(designerActions.setDesigningSide("back")); }}
                      printSide={printSide}
                      onPhotoUpload={(fieldId, dataUrl) => updateField(fieldId, { imageUrl: dataUrl })}
                      onImageUpdate={(fieldId, updates) => updateField(fieldId, updates)}
                      bgSvg={backBg} bgUrl={backBgUrl}
                      onTemplateUpload={file => handleTemplateUpload(file, "back")}
                      onRemoveBackground={() => dispatch(designerActions.setBackBg({ url: "" }))}
                      onLabelChange={(fieldId, label) => updateField(fieldId, { label })} />
                  )}
                </div>
                {(frontFields.length > 0 || backFields.length > 0) && (
                  <div style={{ textAlign: "center", fontSize: 11, color: "#475569" }}>
                    {"\u2726"} Drag to move {"\u00B7"} Drag corners/edges to resize {"\u00B7"} Click to select &amp; edit properties
                  </div>
                )}
                <div style={{ background: "#1a1e28", border: "1px solid #2a2f3e", borderRadius: 10, padding: "14px 18px", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, marginBottom: 12 }}>SPECIFICATIONS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 24px" }}>
                    {[["Quantity", `${quantity} cards`], ["Size", "Standard (87 mm \u00D7 57 mm)"], ["Material", material], ["Finish", finish.toUpperCase()], ["Printer", printer.toUpperCase()], ["Chip", chipType], ["Print Side", printSide.split(" ")[0]], ["Orientation", orientation]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                        <span style={{ fontSize: 11, color: "#64748b" }}>{k}:</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        )}
      </div>

      {/* ── Saved Toast ── */}
      {savedToast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#16a34a", color: "#fff", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 1001, animation: "fadeUp 0.3s ease", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 18 }}>{"\u{1F4BE}"}</span> Design saved successfully!
          <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8, marginLeft: 4 }}>{"\u2014"} you can continue later</span>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {showPreview && (
        <>
          <div onClick={() => dispatch(designerActions.setShowPreview(false))} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1100, backdropFilter: "blur(6px)" }} />
          <div style={{ position: "fixed", inset: 0, zIndex: 1101, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, pointerEvents: "none" }}>
            <div style={{ background: "#1a1e28", borderRadius: 20, border: "1px solid #2a2f3e", boxShadow: "0 40px 100px rgba(0,0,0,0.7)", maxWidth: 900, width: "100%", maxHeight: "90vh", overflow: "auto", pointerEvents: "all" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #2a2f3e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>Card Preview</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Actual print output {"\u2014"} {orientation} {"\u00B7"} {printSide}</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button onClick={handleOrderClick}
                    style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#e05c1a", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#c9501a"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#e05c1a"; }}>
                    {"\u{1F6D2}"} Order This Design
                  </button>
                  <button onClick={() => dispatch(designerActions.setShowPreview(false))}
                    style={{ background: "#2a2f3e", border: "none", color: "#94a3b8", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u2715"}</button>
                </div>
              </div>
              {exportWarnings.length > 0 && (
                <div style={{ margin: "12px 24px 0", background: "#78350f22", border: "1px solid #f59e0b55", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>⚠️ Print Color Warnings</div>
                  {exportWarnings.map((w, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: w.hex, flexShrink: 0, border: "1px solid #ffffff33" }} />
                      <span><strong>{w.fieldLabel}</strong> — {w.warning}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={() => { setExportWarnings([]); placeOrder(); }}
                      style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#e05c1a", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                      Continue Anyway
                    </button>
                    <button onClick={() => setExportWarnings([])}
                      style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #f59e0b55", background: "transparent", color: "#f59e0b", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                      Fix Colors
                    </button>
                  </div>
                </div>
              )}
              <div style={{ padding: "40px 24px", display: "flex", gap: 48, justifyContent: "center", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1.5 }}>FRONT SIDE</div>
                  <div ref={previewFrontRef} style={{ width: isHorizontal ? 420 : 260, height: isHorizontal ? 260 : 420, background: "#fff", borderRadius: 16, boxShadow: "0 0 0 3px #e05c1a, 0 20px 60px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden" }}>
                    {frontBgUrl ? <img src={`${API_BASE}${frontBgUrl}`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} /> : frontBg ? <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(frontBg) }} /> : null}
                    {frontFields.length === 0 && !frontBg && !frontBgUrl && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#94a3b8" }}>
                        <span style={{ fontSize: 32, opacity: 0.2 }}>{"\u{1FAAA}"}</span>
                        <span style={{ fontSize: 12, opacity: 0.4, fontWeight: 600 }}>No fields added</span>
                      </div>
                    )}
                    {frontFields.map(field => <PreviewField key={field.id} field={field} />)}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{frontFields.length} field{frontFields.length !== 1 ? "s" : ""} {"\u00B7"} {isHorizontal ? "87 \u00D7 57 mm" : "57 \u00D7 87 mm"}</div>
                </div>
                {printSide === "Both Sides" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1.5 }}>BACK SIDE</div>
                    <div ref={previewBackRef} style={{ width: isHorizontal ? 420 : 260, height: isHorizontal ? 260 : 420, background: "#f8fafc", borderRadius: 16, boxShadow: "0 0 0 3px #6366f1, 0 20px 60px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden", border: "1px dashed #e2e8f033" }}>
                      {backBgUrl ? <img src={`${API_BASE}${backBgUrl}`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} /> : backBg ? <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(backBg) }} /> : null}
                      {backFields.length === 0 && !backBg && !backBgUrl && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#94a3b8" }}>
                          <span style={{ fontSize: 32, opacity: 0.2 }}>{"\u{1FAAA}"}</span>
                          <span style={{ fontSize: 12, opacity: 0.4, fontWeight: 600 }}>No fields added</span>
                        </div>
                      )}
                      {backFields.map(field => <PreviewField key={field.id} field={field} />)}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{backFields.length} field{backFields.length !== 1 ? "s" : ""} {"\u00B7"} {isHorizontal ? "87 \u00D7 57 mm" : "57 \u00D7 87 mm"}</div>
                  </div>
                )}
              </div>
              <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #2a2f3e", display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[["Printer", printer], ["Material", material], ["Finish", finish], ["Chip", chipType], ["Qty", `${quantity} cards`], ["Orientation", orientation]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 5 }}>
                    <span style={{ fontSize: 11, color: "#475569" }}>{k}:</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Order Toast ── */}
      {cart.orderPlaced && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#16a34a", color: "#fff", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 1000, animation: "fadeUp 0.3s ease" }}>
          <span style={{ fontSize: 18 }}>{"\u2713"}</span> Order added to cart!
          <button onClick={() => dispatch(cartActions.setShowCart(true))} style={{ marginLeft: 8, background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>View Cart</button>
        </div>
      )}

      {/* ── Cart Overlay backdrop ── */}
      {cart.showCart && (
        <div onClick={() => dispatch(cartActions.setShowCart(false))} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1200 }} />
      )}

      {/* ── Cart Slide-in Panel ── */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: "#1a1e28", borderLeft: "1px solid #2a2f3e", zIndex: 1250, display: "flex", flexDirection: "column", transform: cart.showCart ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s cubic-bezier(.4,0,.2,1)", boxShadow: cart.showCart ? "-12px 0 48px rgba(0,0,0,0.5)" : "none" }}>
        <style>{`@keyframes fadeUp { from { opacity:0; transform: translateX(-50%) translateY(16px) } to { opacity:1; transform: translateX(-50%) translateY(0) } }`}</style>

        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #2a2f3e", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{"\u{1F6D2}"}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>Your Cart</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{cart.items.length} {cart.items.length === 1 ? "item" : "items"}</div>
            </div>
          </div>
          <button onClick={() => dispatch(cartActions.setShowCart(false))} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}>{"\u2715"}</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {cart.items.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#475569" }}>
              <span style={{ fontSize: 48, opacity: 0.3 }}>{"\u{1F6D2}"}</span>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Your cart is empty</div>
              <div style={{ fontSize: 12 }}>Place an order to see it here.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cart.items.map((item, idx) => (
                <div key={item.id} style={{ background: "#13161d", border: "1px solid #2a2f3e", borderRadius: 12, padding: "14px 16px", position: "relative" }}>
                  <div style={{ position: "absolute", top: -8, left: 14, background: "#e05c1a", color: "#fff", borderRadius: 4, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
                    ORDER #{cart.items.length - idx}
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 4, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{item.cardType} Card {"\u2014"} {item.printer}</div>
                      <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{item.addedAt}</div>
                    </div>
                    <button onClick={() => dispatch(cartActions.removeItem(item.id))}
                      style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>{"\u2715"}</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 12px", marginBottom: 12 }}>
                    {[["Qty", `${item.quantity} cards`], ["Print Side", item.printSide.split(" ")[0]], ["Orientation", item.orientation], ["Finish", item.finish], ["Material", item.material], ["Chip", item.chipType], ["Front Fields", `${item.frontFieldCount}`], ["Back Fields", `${item.backFieldCount}`]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", gap: 5 }}>
                        <span style={{ fontSize: 10, color: "#64748b" }}>{k}:</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #2a2f3e", paddingTop: 10 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      ₹{item.unitPrice.toFixed(2)} {"\u00D7"} {item.quantity}
                      {item.quantity >= 50 && <span style={{ marginLeft: 6, fontSize: 10, color: "#10b981", fontWeight: 600 }}>BULK DISCOUNT {"\u2713"}</span>}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#e05c1a" }}>₹{item.totalPrice.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.items.length > 0 && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid #2a2f3e", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Subtotal ({cart.items.length} {cart.items.length === 1 ? "item" : "items"})</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>₹{cart.items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>Total cards</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{cart.items.reduce((s, i) => s + i.quantity, 0).toLocaleString()} cards</span>
            </div>
            <button onClick={() => { dispatch(cartActions.setShowCart(false)); dispatch(cartActions.setShowCheckout(true)); }} style={{ width: "100%", background: "#e05c1a", border: "none", color: "#fff", borderRadius: 8, padding: "13px 0", cursor: "pointer", fontWeight: 700, fontSize: 14, letterSpacing: 0.5, marginBottom: 8 }}>
              Proceed to Checkout {"\u2192"}
            </button>
            <button onClick={() => dispatch(cartActions.clearCart())}
              style={{ width: "100%", background: "transparent", border: "1px solid #3a3f52", color: "#64748b", borderRadius: 8, padding: "8px 0", cursor: "pointer", fontSize: 12 }}>
              Clear Cart
            </button>
          </div>
        )}
      </div>

      {/* ── Save as Template Modal ── */}
      {showSaveTemplate && (
        <>
          <div onClick={() => setShowSaveTemplate(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1300, backdropFilter: "blur(4px)" }} />
          <div style={{ position: "fixed", inset: 0, zIndex: 1301, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, pointerEvents: "none" }}>
            <div style={{ background: "#1a1e28", borderRadius: 16, border: "1px solid #2a2f3e", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", width: "100%", maxWidth: 440, pointerEvents: "all" }}>
              <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #2a2f3e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>📋 Save as Template</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>This template will be visible only to you</div>
                </div>
                <button onClick={() => setShowSaveTemplate(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18 }}>✕</button>
              </div>
              <div style={{ padding: "20px 22px" }}>
                {saveTemplateSuccess ? (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>Template saved!</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Find it in your "My Templates" tab on the Templates page</div>
                  </div>
                ) : (
                  <>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { void handleSaveTemplate(); } }}
                      placeholder="e.g. My Corporate Card"
                      autoFocus
                      style={{ width: "100%", background: "#13161d", border: `1px solid ${saveTemplateError ? "#ef4444" : "#2a2f3e"}`, borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                    {saveTemplateError && (
                      <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>{saveTemplateError}</div>
                    )}
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 10 }}>
                      Saves {frontFields.length} front field{frontFields.length !== 1 ? "s" : ""}{backFields.length > 0 ? ` + ${backFields.length} back field${backFields.length !== 1 ? "s" : ""}` : ""} as a reusable template.
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                      <button
                        onClick={() => void handleSaveTemplate()}
                        disabled={savingTemplate || !templateName.trim()}
                        style={{ flex: 1, background: savingTemplate || !templateName.trim() ? "#334155" : "#a855f7", border: "none", color: "#fff", borderRadius: 8, padding: "10px 0", cursor: savingTemplate || !templateName.trim() ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, transition: "background 0.15s" }}>
                        {savingTemplate ? "Saving…" : "💾 Save Template"}
                      </button>
                      <button
                        onClick={() => setShowSaveTemplate(false)}
                        style={{ padding: "10px 18px", background: "transparent", border: "1px solid #2a2f3e", color: "#64748b", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
