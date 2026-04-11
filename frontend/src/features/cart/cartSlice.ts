import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartItem } from "../../shared/types";

interface CartState {
  items: CartItem[];
  showCart: boolean;
  showCheckout: boolean;
  orderPlaced: boolean;
}

const initialState: CartState = {
  items: [],
  showCart: false,
  showCheckout: false,
  orderPlaced: false,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      state.items.unshift(action.payload);
      state.orderPlaced = true;
      state.showCart = true;
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
    updateItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
    },
    setShowCart(state, action: PayloadAction<boolean>) {
      state.showCart = action.payload;
    },
    setShowCheckout(state, action: PayloadAction<boolean>) {
      state.showCheckout = action.payload;
    },
    setOrderPlaced(state, action: PayloadAction<boolean>) {
      state.orderPlaced = action.payload;
    },
  },
});

export const cartActions = cartSlice.actions;
export default cartSlice.reducer;
