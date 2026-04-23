import type { PrinterType, PrintSide, Orientation, ChipType, Finish, Material } from "./card.types";

export interface CartItem {
  id: string;
  designId?: string;
  cardType: string;
  printer: PrinterType;
  printSide: PrintSide;
  orientation: Orientation;
  chipType: ChipType;
  finish: Finish;
  material: Material;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  frontFieldCount: number;
  backFieldCount: number;
  addedAt: string;
}

// Address block used by CheckoutForm (district is UI-only, NOT sent to API)
export interface AddressForm {
  address1: string;
  address2: string;
  city:     string;
  state:    string;
  district: string;
  zip:      string;
  country:  string;
}

export interface ShippingForm {
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
  company:   string;
  address1:  string;
  address2:  string;
  city:      string;
  state:     string;
  district:  string;   // UI-only; excluded from API payload
  zip:       string;
  country:   string;
}

export interface PaymentForm {
  cardHolder: string;
  cardNumber: string;
  expiry:     string;
  cvv:        string;
  saveCard:   boolean;
}

export type ShippingMethod = "standard" | "express" | "overnight";
export type PaymentMethod  = "card" | "upi" | "netbanking" | "cod";
export type CheckoutStep   = "cart" | "shipping" | "payment" | "review" | "confirmed";
