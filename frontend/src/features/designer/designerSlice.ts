import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CardField, CardTemplate, CardType, PrintSide, Orientation,
  ChipType, Finish, Material, PrinterType, DesignSide, FieldType,
} from "../../shared/types";
import { uid, withIds } from "../../shared/utils";
import { FIELD_TEMPLATES } from "./constants";

interface DesignerState {
  printer: PrinterType;
  printSide: PrintSide;
  cardType: CardType;
  orientation: Orientation;
  chipType: ChipType;
  finish: Finish;
  material: Material;
  quantity: number;
  activeTab: "CONTENT" | "STYLE" | "TEMPLATE";
  designingSide: DesignSide;
  selectedFieldId: string | null;
  showFieldPicker: boolean;
  frontFields: CardField[];
  backFields: CardField[];
  frontBg: string;
  backBg: string;
  frontBgUrl: string;
  backBgUrl: string;
  showPreview: boolean;
  savedToast: boolean;
}

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
  frontFields: [],
  backFields: [],
  frontBg: "",
  backBg: "",
  frontBgUrl: "",
  backBgUrl: "",
  showPreview: false,
  savedToast: false,
};

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
    setActiveTab(state, action: PayloadAction<"CONTENT" | "STYLE" | "TEMPLATE">) {
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
      const type = action.payload;
      const tpl = FIELD_TEMPLATES.find(t => t.type === type)!;
      const currentFields = state.designingSide === "front" ? state.frontFields : state.backFields;
      const nf: CardField = {
        id: uid(), type, label: tpl.label,
        x: 8, y: 8 + currentFields.length * 13,
        width: tpl.defaultW, height: tpl.defaultH,
        fontSize: type === "name" ? 14 : 11,
        bold: type === "name", color: "#1e293b", align: "left",
        borderStyle: "none", borderWidth: 2, borderColor: "#1e293b", borderRadius: 6,
      };
      if (state.designingSide === "front") state.frontFields.push(nf);
      else state.backFields.push(nf);
      state.selectedFieldId = nf.id;
      state.showFieldPicker = false;
    },
    removeField(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.frontFields = state.frontFields.filter(f => f.id !== id);
      state.backFields = state.backFields.filter(f => f.id !== id);
      if (state.selectedFieldId === id) state.selectedFieldId = null;
    },
    updateField(state, action: PayloadAction<{ id: string; patch: Partial<CardField> }>) {
      const { id, patch } = action.payload;
      const update = (fields: CardField[]) =>
        fields.map(f => f.id === id ? { ...f, ...patch } : f);
      state.frontFields = update(state.frontFields);
      state.backFields = update(state.backFields);
    },
    clearFields(state) {
      if (state.designingSide === "front") state.frontFields = [];
      else state.backFields = [];
    },
    applyTemplate(state, action: PayloadAction<CardTemplate>) {
      const tpl = action.payload;
      state.frontFields = withIds(tpl.frontFields);
      state.backFields = withIds(tpl.backFields);
      state.frontBg = tpl.frontBg ?? "";
      state.backBg = tpl.backBg ?? "";
      state.frontBgUrl = tpl.frontBgUrl ?? "";
      state.backBgUrl = tpl.backBgUrl ?? "";
      if (tpl.backFields.length > 0 || tpl.backBgUrl) state.printSide = "Both Sides";
      if (tpl.orientation !== undefined) state.orientation = tpl.orientation as Orientation;
      state.selectedFieldId = null;
      state.activeTab = "CONTENT";
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
      settings: Partial<DesignerState>;
    }>) {
      const { frontFields, backFields, settings } = action.payload;
      state.frontFields = frontFields;
      state.backFields = backFields;
      Object.assign(state, settings);
    },
  },
});

export const designerActions = designerSlice.actions;
export default designerSlice.reducer;
