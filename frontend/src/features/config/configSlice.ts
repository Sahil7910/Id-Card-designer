import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { api } from "../../shared/utils/api";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CardOptionEntry {
  value: string;
  label: string;
  price_addon: number;
}

interface ConfigState {
  chipTypeOptions: CardOptionEntry[];
  finishOptions: CardOptionEntry[];
  materialOptions: CardOptionEntry[];
  pricingConfig: Record<string, number>;
  loaded: boolean;
}

const DEFAULT_CHIP_TYPES: CardOptionEntry[] = [
  { value: "LED", label: "LED", price_addon: 2.0 },
  { value: "RFID", label: "RFID", price_addon: 1.5 },
  { value: "None", label: "None", price_addon: 0 },
];

const DEFAULT_FINISHES: CardOptionEntry[] = [
  { value: "Matte", label: "Matte", price_addon: 0 },
  { value: "Glossy", label: "Glossy", price_addon: 0.3 },
  { value: "Metallic", label: "Metallic", price_addon: 0.8 },
];

const DEFAULT_MATERIALS: CardOptionEntry[] = [
  { value: "PVC Plastic", label: "PVC Plastic", price_addon: 0 },
  { value: "Paper", label: "Paper", price_addon: 0 },
  { value: "Composite", label: "Composite", price_addon: 0 },
];

const DEFAULT_PRICING: Record<string, number> = {
  base_thermal: 2.5,
  base_inkjet: 1.2,
  addon_glossy: 0.3,
  addon_metallic: 0.8,
  addon_rfid: 1.5,
  addon_led: 2.0,
  addon_both_sides: 0.4,
  discount_50: 7,
  discount_100: 12,
  discount_200: 18,
  discount_500: 25,
};

// ── Thunks ─────────────────────────────────────────────────────────────────────

export const fetchPublicOptions = createAsyncThunk(
  "config/fetchOptions",
  async () => {
    const data = await api.get<Record<string, CardOptionEntry[]>>("/api/pricing/card-options");
    return data;
  }
);

export const fetchPublicPricing = createAsyncThunk(
  "config/fetchPricing",
  async () => {
    const data = await api.get<Record<string, number>>("/api/pricing/config");
    return data;
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────────

const initialState: ConfigState = {
  chipTypeOptions: DEFAULT_CHIP_TYPES,
  finishOptions: DEFAULT_FINISHES,
  materialOptions: DEFAULT_MATERIALS,
  pricingConfig: DEFAULT_PRICING,
  loaded: false,
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicOptions.fulfilled, (state, action) => {
        const data = action.payload;
        if (data.chip_type?.length) state.chipTypeOptions = data.chip_type;
        if (data.finish?.length) state.finishOptions = data.finish;
        if (data.material?.length) state.materialOptions = data.material;
        state.loaded = true;
      })
      .addCase(fetchPublicPricing.fulfilled, (state, action) => {
        state.pricingConfig = { ...DEFAULT_PRICING, ...action.payload };
      });
  },
});

export default configSlice.reducer;

// ── Selectors ──────────────────────────────────────────────────────────────────
export const selectChipTypeOptions = (state: RootState) => state.config.chipTypeOptions;
export const selectFinishOptions = (state: RootState) => state.config.finishOptions;
export const selectMaterialOptions = (state: RootState) => state.config.materialOptions;
export const selectPricingConfig = (state: RootState) => state.config.pricingConfig;
export const selectConfigLoaded = (state: RootState) => state.config.loaded;
