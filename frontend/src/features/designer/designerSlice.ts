import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CardField, CardTemplate, CardType, PrintSide, Orientation,
  ChipType, Finish, Material, PrinterType, DesignSide, FieldType,
} from "../../shared/types";
import { uid, withIds } from "../../shared/utils";
import { createField } from "./services/objectFactory";

// ── Multi-design types ──────────────────────────────────────────
export interface DesignData {
  id: string;
  name: string;
  frontFields: CardField[];
  backFields: CardField[];
  frontBg: string;
  backBg: string;
  frontBgUrl: string;
  backBgUrl: string;
}

function makeBlankDesign(name: string): DesignData {
  return { id: uid(), name, frontFields: [], backFields: [], frontBg: "", backBg: "", frontBgUrl: "", backBgUrl: "" };
}

interface DesignerState {
  printer: PrinterType;
  printSide: PrintSide;
  cardType: CardType;
  orientation: Orientation;
  chipType: ChipType;
  finish: Finish;
  material: Material;
  quantity: number;
  activeTab: "CONTENT" | "TEMPLATE";
  designingSide: DesignSide;
  selectedFieldId: string | null;
  showFieldPicker: boolean;
  // Multi-design
  designs: DesignData[];
  activeDesignId: string;
  // Active design mirrors (for backward-compat with DesignerPage)
  frontFields: CardField[];
  backFields: CardField[];
  frontBg: string;
  backBg: string;
  frontBgUrl: string;
  backBgUrl: string;
  showPreview: boolean;
  savedToast: boolean;
}

function syncActive(state: DesignerState) {
  const d = state.designs.find(x => x.id === state.activeDesignId);
  if (!d) return;
  state.frontFields = d.frontFields;
  state.backFields = d.backFields;
  state.frontBg = d.frontBg;
  state.backBg = d.backBg;
  state.frontBgUrl = d.frontBgUrl;
  state.backBgUrl = d.backBgUrl;
}

function getActive(state: DesignerState): DesignData | undefined {
  return state.designs.find(x => x.id === state.activeDesignId);
}

// ── Persist / restore ──────────────────────────────────────────
function loadSaved(): Partial<DesignerState> | null {
  try {
    const raw = localStorage.getItem("idcard_designs_v2");
    return raw ? JSON.parse(raw) as Partial<DesignerState> : null;
  } catch { return null; }
}

const saved = loadSaved();
const defaultDesign = makeBlankDesign("Design 1");

const initialState: DesignerState = {
  printer: "Thermal",
  printSide: "Single Side",
  cardType: "Company",
  orientation: "Horizontal",
  chipType: "LED",
  finish: "Matte",
  material: "PVC Plastic",
  quantity: 10,
  activeTab: "CONTENT",
  designingSide: "front",
  selectedFieldId: null,
  showFieldPicker: false,
  designs: saved?.designs ?? [defaultDesign],
  activeDesignId: saved?.activeDesignId ?? defaultDesign.id,
  frontFields: [],
  backFields: [],
  frontBg: "",
  backBg: "",
  frontBgUrl: "",
  backBgUrl: "",
  showPreview: false,
  savedToast: false,
};

// Sync mirrors on init
{
  const d = initialState.designs.find(x => x.id === initialState.activeDesignId)
    ?? initialState.designs[0];
  if (d) {
    initialState.activeDesignId = d.id;
    initialState.frontFields = d.frontFields;
    initialState.backFields = d.backFields;
    initialState.frontBg = d.frontBg;
    initialState.backBg = d.backBg;
    initialState.frontBgUrl = d.frontBgUrl;
    initialState.backBgUrl = d.backBgUrl;
  }
}

function persist(state: DesignerState) {
  try {
    localStorage.setItem("idcard_designs_v2", JSON.stringify({ designs: state.designs, activeDesignId: state.activeDesignId }));
  } catch { /* quota exceeded — ignore */ }
}

export const designerSlice = createSlice({
  name: "designer",
  initialState,
  reducers: {
    setPrinter(state, action: PayloadAction<PrinterType>) {
      state.printer = action.payload;
      state.showFieldPicker = false;
    },
    setPrintSide(state, action: PayloadAction<PrintSide>) {
      state.printSide = action.payload;
      if (action.payload === "Single Side") state.designingSide = "front";
    },
    setCardType(state, action: PayloadAction<CardType>) {
      state.cardType = action.payload;
    },
    setOrientation(state, action: PayloadAction<Orientation>) {
      state.orientation = action.payload;
    },
    setChipType(state, action: PayloadAction<ChipType>) {
      state.chipType = action.payload;
    },
    setFinish(state, action: PayloadAction<Finish>) {
      state.finish = action.payload;
    },
    setMaterial(state, action: PayloadAction<Material>) {
      state.material = action.payload;
    },
    setQuantity(state, action: PayloadAction<number>) {
      state.quantity = Math.max(10, action.payload);
    },
    incrementQuantity(state) {
      state.quantity += 10;
    },
    decrementQuantity(state) {
      state.quantity = Math.max(10, state.quantity - 10);
    },
    setActiveTab(state, action: PayloadAction<"CONTENT" | "TEMPLATE">) {
      state.activeTab = action.payload;
    },
    setDesigningSide(state, action: PayloadAction<DesignSide>) {
      state.designingSide = action.payload;
      state.selectedFieldId = null;
    },
    selectField(state, action: PayloadAction<string | null>) {
      state.selectedFieldId = action.payload;
    },
    toggleFieldPicker(state) {
      state.showFieldPicker = !state.showFieldPicker;
    },
    hideFieldPicker(state) {
      state.showFieldPicker = false;
    },
    addField(state, action: PayloadAction<FieldType>) {
      const d = getActive(state);
      if (!d) return;
      const currentFields = state.designingSide === "front" ? d.frontFields : d.backFields;
      const nf = createField(action.payload, currentFields.length);
      if (state.designingSide === "front") d.frontFields.push(nf);
      else d.backFields.push(nf);
      syncActive(state);
      state.selectedFieldId = nf.id;
      state.showFieldPicker = false;
      persist(state);
    },
    removeField(state, action: PayloadAction<string>) {
      const d = getActive(state);
      if (!d) return;
      d.frontFields = d.frontFields.filter(f => f.id !== action.payload);
      d.backFields = d.backFields.filter(f => f.id !== action.payload);
      syncActive(state);
      if (state.selectedFieldId === action.payload) state.selectedFieldId = null;
      persist(state);
    },
    updateField(state, action: PayloadAction<{ id: string; patch: Partial<CardField> }>) {
      const { id, patch } = action.payload;
      const d = getActive(state);
      if (!d) return;
      const update = (fields: CardField[]) => fields.map(f => f.id === id ? { ...f, ...patch } : f);
      d.frontFields = update(d.frontFields);
      d.backFields = update(d.backFields);
      syncActive(state);
      persist(state);
    },
    clearFields(state) {
      const d = getActive(state);
      if (!d) return;
      if (state.designingSide === "front") d.frontFields = [];
      else d.backFields = [];
      syncActive(state);
      persist(state);
    },
    applyTemplate(state, action: PayloadAction<CardTemplate>) {
      const tpl = action.payload;
      const d = getActive(state);
      if (!d) return;
      d.frontFields = withIds(tpl.frontFields);
      d.backFields = withIds(tpl.backFields);
      d.frontBg = tpl.frontBg ?? "";
      d.backBg = tpl.backBg ?? "";
      d.frontBgUrl = tpl.frontBgUrl ?? "";
      d.backBgUrl = tpl.backBgUrl ?? "";
      syncActive(state);
      if (tpl.backFields.length > 0 || tpl.backBgUrl) state.printSide = "Both Sides";
      if (tpl.orientation !== undefined) state.orientation = tpl.orientation as Orientation;
      state.selectedFieldId = null;
      state.activeTab = "CONTENT";
      persist(state);
    },
    setFrontBg(state, action: PayloadAction<{ svg?: string; url?: string }>) {
      const d = getActive(state);
      if (!d) return;
      if (action.payload.svg !== undefined) d.frontBg = action.payload.svg;
      if (action.payload.url !== undefined) d.frontBgUrl = action.payload.url;
      syncActive(state);
      persist(state);
    },
    setBackBg(state, action: PayloadAction<{ svg?: string; url?: string }>) {
      const d = getActive(state);
      if (!d) return;
      if (action.payload.svg !== undefined) d.backBg = action.payload.svg;
      if (action.payload.url !== undefined) d.backBgUrl = action.payload.url;
      syncActive(state);
      persist(state);
    },
    setShowPreview(state, action: PayloadAction<boolean>) {
      state.showPreview = action.payload;
    },
    showSavedToast(state) {
      state.savedToast = true;
    },
    hideSavedToast(state) {
      state.savedToast = false;
    },
    loadDesign(state, action: PayloadAction<{
      frontFields: CardField[];
      backFields: CardField[];
      settings?: Partial<DesignerState>;
    }>) {
      const { frontFields, backFields, settings } = action.payload;
      const d = getActive(state);
      if (d) {
        d.frontFields = frontFields;
        d.backFields = backFields;
      }
      syncActive(state);
      if (settings) Object.assign(state, settings);
      persist(state);
    },

    // ── Multi-design actions ──────────────────────────────────────
    newDesign(state) {
      const name = `Design ${state.designs.length + 1}`;
      const d = makeBlankDesign(name);
      state.designs.push(d);
      state.activeDesignId = d.id;
      syncActive(state);
      state.selectedFieldId = null;
      persist(state);
    },
    switchDesign(state, action: PayloadAction<string>) {
      const d = state.designs.find(x => x.id === action.payload);
      if (!d) return;
      state.activeDesignId = action.payload;
      syncActive(state);
      state.selectedFieldId = null;
    },
    removeDesign(state, action: PayloadAction<string>) {
      if (state.designs.length <= 1) return; // keep at least one
      state.designs = state.designs.filter(x => x.id !== action.payload);
      if (state.activeDesignId === action.payload) {
        state.activeDesignId = state.designs[0].id;
        syncActive(state);
        state.selectedFieldId = null;
      }
      persist(state);
    },
    duplicateDesign(state, action: PayloadAction<string>) {
      const src = state.designs.find(x => x.id === action.payload);
      if (!src) return;
      const copy: DesignData = {
        ...JSON.parse(JSON.stringify(src)) as DesignData,
        id: uid(),
        name: `${src.name} Copy`,
      };
      state.designs.push(copy);
      state.activeDesignId = copy.id;
      syncActive(state);
      state.selectedFieldId = null;
      persist(state);
    },
    renameDesign(state, action: PayloadAction<{ id: string; name: string }>) {
      const d = state.designs.find(x => x.id === action.payload.id);
      if (d) d.name = action.payload.name;
      persist(state);
    },
  },
});

export const designerActions = designerSlice.actions;
export default designerSlice.reducer;
