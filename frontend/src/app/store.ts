import { configureStore } from "@reduxjs/toolkit";
import designerReducer from "../features/designer/designerSlice";
import cartReducer from "../features/cart/cartSlice";
import authReducer from "../features/auth/authSlice";
import adminReducer from "../features/admin/adminSlice";
import configReducer from "../features/config/configSlice";

export const store = configureStore({
  reducer: {
    designer: designerReducer,
    cart: cartReducer,
    auth: authReducer,
    admin: adminReducer,
    config: configReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
