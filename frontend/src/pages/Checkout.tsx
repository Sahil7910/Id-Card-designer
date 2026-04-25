import { useState, useEffect, useCallback } from "react";
import type { CartItem, ShippingForm, AddressForm, PaymentForm, ShippingMethod, PaymentMethod, CheckoutStep } from "../shared/types";
import { CheckoutForm } from "../features/order/components/CheckoutForm";
import { api } from "../shared/utils";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { selectIsAuthenticated, authActions } from "../features/auth/authSlice";

type Step = CheckoutStep;

// ── Constants ──────────────────────────────────────────────────────
const SHIPPING_META: { id: ShippingMethod; label: string; desc: string; days: string }[] = [
  { id: "standard",  label: "Standard Shipping",  desc: "Regular delivery",  days: "5–7 business days" },
  { id: "express",   label: "Express Shipping",   desc: "Priority handling", days: "2–3 business days" },
  { id: "overnight", label: "Overnight Shipping", desc: "Next day delivery", days: "1 business day"    },
];

const STEP_LIST: { key: Step; label: string; icon: string }[] = [
  { key: "cart",      label: "Cart",     icon: "🛒" },
  { key: "shipping",  label: "Shipping", icon: "📦" },
  { key: "payment",   label: "Payment",  icon: "💳" },
  { key: "review",    label: "Review",   icon: "✅" },
];

// ── Main Checkout Component ────────────────────────────────────────
export default function Checkout({
  cartItems,
  onBack,
  onUpdateCart,
}: {
  cartItems: CartItem[];
  onBack: () => void;
  onUpdateCart: (items: CartItem[]) => void;
}) {
  const [step, setStep] = useState<Step>("cart");
  const [shipping, setShipping] = useState<ShippingForm>({
    firstName: "", lastName: "", email: "", phone: "", company: "",
    address1: "", address2: "", city: "", state: "", district: "", zip: "", country: "India",
  });
  const [billing, setBilling] = useState<AddressForm>({
    address1: "", address2: "", city: "", state: "", district: "", zip: "", country: "India",
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [payment, setPayment] = useState<PaymentForm>({
    cardHolder: "", cardNumber: "", expiry: "", cvv: "", saveCard: false,
  });
  const [, /* promoCode */ _setPromoCode] = useState("");
  const [promoApplied, _setPromoApplied] = useState(false);
  const [, /* promoError */ _setPromoError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [shippingPrices, setShippingPrices] = useState<Record<string, number>>({
    shipping_standard: 0, shipping_express: 9.99, shipping_overnight: 24.99,
  });
  const [billingAddrValid,  setBillingAddrValid]  = useState(false);
  const [shippingAddrValid, setShippingAddrValid] = useState(false);
  const handleBillingValidityChange = useCallback((v: boolean) => setBillingAddrValid(v),  []);
  const handleShippingAddrValidity  = useCallback((v: boolean) => setShippingAddrValid(v), []);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();

  useEffect(() => {
    api.get<Record<string, number>>("/api/pricing/config")
      .then(cfg => {
        setShippingPrices({
          shipping_standard:  cfg.shipping_standard  ?? 0,
          shipping_express:   cfg.shipping_express   ?? 9.99,
          shipping_overnight: cfg.shipping_overnight ?? 24.99,
        });
      })
      .catch(() => {});
  }, []);

  const SHIPPING_OPTIONS = SHIPPING_META.map(m => ({
    ...m,
    price: shippingPrices[`shipping_${m.id}`] ?? 0,
  }));

  // ── Pricing ──
  const subtotal    = cartItems.reduce((s, i) => s + i.totalPrice, 0);
  const shippingCost = SHIPPING_OPTIONS.find(o => o.id === shippingMethod)!.price;
  const promoDiscount = promoApplied ? parseFloat((subtotal * 0.1).toFixed(2)) : 0;
  const tax         = parseFloat(((subtotal - promoDiscount) * 0.05).toFixed(2));
  const grandTotal  = parseFloat((subtotal + shippingCost - promoDiscount + tax).toFixed(2));
  const totalCards  = cartItems.reduce((s, i) => s + i.quantity, 0);



  const placeOrder = async () => {
    if (!isAuthenticated) {
      dispatch(authActions.openAuthModal("login"));
      return;
    }
    setOrderLoading(true);
    setOrderError("");
    try {
      const res = await api.post<{ order_number: string }>("/api/orders/", {
        items: cartItems.map(item => ({
          card_type: item.cardType,
          printer: item.printer,
          print_side: item.printSide,
          orientation: item.orientation,
          chip_type: item.chipType,
          finish: item.finish,
          material: item.material,
          quantity: item.quantity,
          design_id: item.designId ?? null,
          front_field_count: item.frontFieldCount,
          back_field_count: item.backFieldCount,
        })),
        shipping: {
          first_name: shipping.firstName,
          last_name: shipping.lastName,
          email: shipping.email,
          phone: shipping.phone,
          company: shipping.company,
          address1: sameAsBilling ? billing.address1 : shipping.address1,
          address2: sameAsBilling ? billing.address2 : shipping.address2,
          city: sameAsBilling ? billing.city : shipping.city,
          state: sameAsBilling ? billing.state : shipping.state,
          zip: sameAsBilling ? billing.zip : shipping.zip,
          country: sameAsBilling ? billing.country : shipping.country,
        },
        billing: {
          address1: billing.address1,
          address2: billing.address2,
          city: billing.city,
          state: billing.state,
          zip: billing.zip,
          country: billing.country,
        },
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
      });
      setOrderId(res.order_number);
      setStep("confirmed");
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const detail = status === 401
        ? "You must be signed in to place an order. Please log in and try again."
        : ((err as { detail?: string })?.detail ?? "Failed to place order. Please try again.");
      setOrderError(detail);
    } finally {
      setOrderLoading(false);
    }
  };

  const shippingValid = !!(
    shipping.firstName &&
    shipping.lastName &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email) &&
    /^\d{10}$/.test(shipping.phone.replace(/\D/g, "")) &&
    billingAddrValid &&
    (sameAsBilling || shippingAddrValid)
  );
  const paymentValid  = paymentMethod === "cod" || (paymentMethod === "card" ? (payment.cardHolder && payment.cardNumber.length >= 16 && payment.expiry && payment.cvv) : true);

  const stepIndex = STEP_LIST.findIndex(s => s.key === step);

  if (step === "confirmed") return (
    <OrderConfirmed orderId={orderId} grandTotal={grandTotal} shipping={shipping} shippingMethod={shippingMethod} totalCards={totalCards} onBackToDesigner={() => { onUpdateCart([]); onBack(); }} />
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#13161d", minHeight: "100vh", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>

      {/* ── Top Bar ── */}
      <div style={{ background: "#1a1e28", borderBottom: "1px solid #2a2f3e", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "transparent", border: "1px solid #3a3f52", color: "#94a3b8", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>← Back</button>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: 1.5, color: "#f1f5f9" }}>CHECKOUT</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          🔒 <span style={{ fontSize: 12, color: "#64748b" }}>Secure Checkout</span>
        </div>
      </div>

      {/* ── Step Progress ── */}
      <div style={{ background: "#1a1e28", borderBottom: "1px solid #2a2f3e", padding: "14px 28px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", maxWidth: 640, margin: "0 auto" }}>
          {STEP_LIST.map((s, i) => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", flex: i < STEP_LIST.length - 1 ? 1 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: i < stepIndex ? "pointer" : "default" }}
                onClick={() => i < stepIndex && setStep(s.key)}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: i < stepIndex ? 14 : 13, background: i === stepIndex ? "#e05c1a" : i < stepIndex ? "#16a34a" : "#1e2330", border: `2px solid ${i === stepIndex ? "#e05c1a" : i < stepIndex ? "#16a34a" : "#2a2f3e"}`, transition: "all 0.2s" }}>
                  {i < stepIndex ? "✓" : s.icon}
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: i === stepIndex ? "#e05c1a" : i < stepIndex ? "#16a34a" : "#475569", letterSpacing: 0.5 }}>
                  {s.label}
                </span>
              </div>
              {i < STEP_LIST.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < stepIndex ? "#16a34a" : "#2a2f3e", margin: "0 8px", marginBottom: 18, transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden" }}>

        {/* ── Main content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>

          {/* CART STEP */}
          {step === "cart" && (
            <div style={{ maxWidth: 680 }}>
              <SectionHeader title="Review Your Order" subtitle={`${cartItems.length} item${cartItems.length !== 1 ? "s" : ""} · ${totalCards.toLocaleString()} total cards`} />

              {cartItems.length === 0 ? (
                <EmptyCart onBack={onBack} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {cartItems.map((item, idx) => (
                    <CartItemCard key={item.id} item={item} index={cartItems.length - idx}
                      onRemove={() => onUpdateCart(cartItems.filter(i => i.id !== item.id))}
                      onQtyChange={qty => onUpdateCart(cartItems.map(i => i.id === item.id ? { ...i, quantity: qty, totalPrice: parseFloat((i.unitPrice * qty).toFixed(2)) } : i))}
                    />
                  ))}

               
                </div>
              )}

              {cartItems.length > 0 && (
                <NavButtons onNext={() => setStep("shipping")} nextLabel="Continue to Shipping →" />
              )}
            </div>
          )}

          {/* SHIPPING STEP */}
          {step === "shipping" && (
            <div style={{ maxWidth: 680 }}>
              <SectionHeader title="Shipping Details" subtitle="Where should we deliver your cards?" />

              <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 12, padding: "20px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1.2, marginBottom: 14 }}>CONTACT INFORMATION</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <FormField label="First Name *" value={shipping.firstName} onChange={v => setShipping(s => ({ ...s, firstName: v }))} placeholder="John" />
                  <FormField label="Last Name *" value={shipping.lastName} onChange={v => setShipping(s => ({ ...s, lastName: v }))} placeholder="Smith" />
                  <FormField label="Email *" value={shipping.email} onChange={v => setShipping(s => ({ ...s, email: v }))} placeholder="john@company.com" type="email" />
                  <FormField label="Phone *" value={shipping.phone} onChange={v => setShipping(s => ({ ...s, phone: v }))} placeholder="+1 555 000 1234" type="tel" />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FormField label="Company (optional)" value={shipping.company} onChange={v => setShipping(s => ({ ...s, company: v }))} placeholder="Company name" />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <CheckoutForm
                title="BILLING ADDRESS"
                values={billing}
                onChange={setBilling}
                onValidityChange={handleBillingValidityChange}
              />

              {/* Same as billing checkbox */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 20, padding: "12px 16px", background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 10 }}>
                <div onClick={() => setSameAsBilling(v => !v)}
                  style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${sameAsBilling ? "#e05c1a" : "#3a3f52"}`, background: sameAsBilling ? "#e05c1a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                  {sameAsBilling && <span style={{ fontSize: 12, color: "#fff", lineHeight: 1, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500, userSelect: "none" }}>Shipping address is same as billing address</span>
              </label>

              {/* Shipping Address */}
              {!sameAsBilling && (
                <CheckoutForm
                  title="SHIPPING ADDRESS"
                  values={{
                    address1: shipping.address1, address2: shipping.address2,
                    city:     shipping.city,     state:    shipping.state,
                    district: shipping.district, zip:      shipping.zip,
                    country:  shipping.country,
                  }}
                  onChange={addr => setShipping(s => ({ ...s, ...addr }))}
                  onValidityChange={handleShippingAddrValidity}
                />
              )}

              {/* Shipping methods */}
              <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 12, padding: "20px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1.2, marginBottom: 14 }}>SHIPPING METHOD</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {SHIPPING_OPTIONS.map(opt => (
                    <div key={opt.id} onClick={() => setShippingMethod(opt.id)}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 9, border: `2px solid ${shippingMethod === opt.id ? "#e05c1a" : "#2a2f3e"}`, background: shippingMethod === opt.id ? "#e05c1a0e" : "#13161d", cursor: "pointer", transition: "all 0.15s" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${shippingMethod === opt.id ? "#e05c1a" : "#3a3f52"}`, background: shippingMethod === opt.id ? "#e05c1a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {shippingMethod === opt.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: shippingMethod === opt.id ? "#e2e8f0" : "#94a3b8" }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{opt.desc} · {opt.days}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: shippingMethod === opt.id ? "#e05c1a" : "#64748b" }}>
                        {opt.price === 0 ? "FREE" : `₹${opt.price.toFixed(2)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <NavButtons onBack={() => setStep("cart")} onNext={() => setStep("payment")} nextLabel="Continue to Payment →" nextDisabled={!shippingValid} />
            </div>
          )}

          {/* PAYMENT STEP */}
          {step === "payment" && (
            <div style={{ maxWidth: 680 }}>
              <SectionHeader title="Payment" subtitle="All transactions are encrypted and secure." />

              {/* Payment method tabs */}
              <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1.2, marginBottom: 14 }}>PAYMENT METHOD</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {([
                    { id: "card" as PaymentMethod,       icon: "💳", label: "Card" },
                    { id: "upi"  as PaymentMethod,       icon: "📱", label: "UPI" },
                    { id: "netbanking" as PaymentMethod,  icon: "🏦", label: "Net Banking" },
                    { id: "cod"  as PaymentMethod,       icon: "💵", label: "Cash on Delivery" },
                  ]).map(pm => (
                    <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                      style={{ flex: 1, minWidth: 100, padding: "10px 8px", borderRadius: 8, border: `2px solid ${paymentMethod === pm.id ? "#e05c1a" : "#2a2f3e"}`, background: paymentMethod === pm.id ? "#e05c1a0e" : "#13161d", color: paymentMethod === pm.id ? "#e05c1a" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.15s" }}>
                      <span style={{ fontSize: 20 }}>{pm.icon}</span>
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card form */}
              {paymentMethod === "card" && (
                <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 12, padding: "20px 20px", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1.2, marginBottom: 14 }}>CARD DETAILS</div>

                  {/* Card visual */}
                  <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)", borderRadius: 12, padding: "20px 22px", marginBottom: 18, aspectRatio: "1.586", maxWidth: 320, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                    <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                    <div style={{ fontSize: 22, marginBottom: 16, letterSpacing: 2, color: "rgba(255,255,255,0.3)" }}>💳</div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: 15, letterSpacing: 3, color: "#fff", marginBottom: 16, position: "relative" }}>
                      {payment.cardNumber ? payment.cardNumber.replace(/(.{4})/g, "$1 ").trim() || "•••• •••• •••• ••••" : "•••• •••• •••• ••••"}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginBottom: 2 }}>CARD HOLDER</div>
                        <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{payment.cardHolder || "YOUR NAME"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginBottom: 2 }}>EXPIRES</div>
                        <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{payment.expiry || "MM/YY"}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <FormField label="Card Holder Name" value={payment.cardHolder} onChange={v => setPayment(p => ({ ...p, cardHolder: v.toUpperCase() }))} placeholder="JOHN SMITH" />
                    <FormField label="Card Number" value={payment.cardNumber} onChange={v => setPayment(p => ({ ...p, cardNumber: v.replace(/\D/g, "").slice(0, 16) }))} placeholder="1234 5678 9012 3456" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <FormField label="Expiry Date" value={payment.expiry} onChange={v => {
                        const clean = v.replace(/\D/g, "").slice(0, 4);
                        setPayment(p => ({ ...p, expiry: clean.length > 2 ? clean.slice(0, 2) + "/" + clean.slice(2) : clean }));
                      }} placeholder="MM/YY" />
                      <FormField label="CVV" value={payment.cvv} onChange={v => setPayment(p => ({ ...p, cvv: v.replace(/\D/g, "").slice(0, 4) }))} placeholder="•••" type="password" />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 12, color: "#94a3b8" }}>
                      <div onClick={() => setPayment(p => ({ ...p, saveCard: !p.saveCard }))}
                        style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${payment.saveCard ? "#e05c1a" : "#3a3f52"}`, background: payment.saveCard ? "#e05c1a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {payment.saveCard && <span style={{ fontSize: 11, color: "#fff", lineHeight: 1 }}>✓</span>}
                      </div>
                      Save card for future orders
                    </label>
                  </div>
                </div>
              )}

              {/* UPI */}
              {paymentMethod === "upi" && (
                <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 12, padding: "20px 20px", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1.2, marginBottom: 14 }}>UPI PAYMENT</div>
                  <FormField label="UPI ID" value="" onChange={() => {}} placeholder="yourname@upi" />
                  <p style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>Enter your UPI ID (e.g. name@okaxis, name@paytm)</p>
                </div>
              )}

              {/* Net Banking */}
              {paymentMethod === "netbanking" && (
                <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 12, padding: "20px 20px", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1.2, marginBottom: 14 }}>SELECT BANK</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Other"].map(bank => (
                      <button key={bank} style={{ padding: "12px 8px", borderRadius: 8, border: "1px solid #2a2f3e", background: "#13161d", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#e05c1a"; e.currentTarget.style.color = "#e05c1a"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2f3e"; e.currentTarget.style.color = "#94a3b8"; }}>
                        🏦 {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* COD */}
              {paymentMethod === "cod" && (
                <div style={{ background: "#2d1f0e", border: "1px solid #f59e0b44", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>💵</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>Cash on Delivery</div>
                    <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>Pay cash when your order arrives. A ₹50 COD handling fee applies. Available for selected pin codes only.</div>
                  </div>
                </div>
              )}

              <NavButtons onBack={() => setStep("shipping")} onNext={() => setStep("review")} nextLabel="Review Order →" nextDisabled={!paymentValid} />
            </div>
          )}

          {/* REVIEW STEP */}
          {step === "review" && (
            <div style={{ maxWidth: 680 }}>
              <SectionHeader title="Review & Confirm" subtitle="Please review your order before placing it." />

              {/* Summary blocks */}
              <ReviewBlock title="🛒 Order Items" onEdit={() => setStep("cart")}>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #2a2f3e22" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{item.cardType} Card · {item.printer}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{item.quantity} cards · {item.finish} · {item.chipType}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e05c1a" }}>₹{item.totalPrice.toFixed(2)}</div>
                  </div>
                ))}
              </ReviewBlock>

              <ReviewBlock title="📦 Shipping" onEdit={() => setStep("shipping")}>
                <div style={{ fontSize: 13, color: "#e2e8f0" }}>{shipping.firstName} {shipping.lastName}</div>
                {(() => {
                  const addr = sameAsBilling ? billing : shipping;
                  return (
                    <>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{addr.address1}{addr.address2 ? ", " + addr.address2 : ""}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{addr.city}{addr.state ? ", " + addr.state : ""} {addr.zip}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{addr.country} · {shipping.phone}</div>
                    </>
                  );
                })()}
                {!sameAsBilling && (
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                    Billing: {billing.address1}, {billing.city} {billing.zip}
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 12, color: "#e05c1a", fontWeight: 600 }}>
                  {SHIPPING_OPTIONS.find(o => o.id === shippingMethod)!.label} — {SHIPPING_OPTIONS.find(o => o.id === shippingMethod)!.days}
                </div>
              </ReviewBlock>

              <ReviewBlock title="💳 Payment" onEdit={() => setStep("payment")}>
                {paymentMethod === "card" && <div style={{ fontSize: 13, color: "#e2e8f0" }}>Card ending in {payment.cardNumber.slice(-4) || "••••"}</div>}
                {paymentMethod === "upi" && <div style={{ fontSize: 13, color: "#e2e8f0" }}>UPI Payment</div>}
                {paymentMethod === "netbanking" && <div style={{ fontSize: 13, color: "#e2e8f0" }}>Net Banking</div>}
                {paymentMethod === "cod" && <div style={{ fontSize: 13, color: "#e2e8f0" }}>Cash on Delivery</div>}
              </ReviewBlock>

              {/* T&C */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 12, color: "#94a3b8", marginBottom: 20, lineHeight: 1.5 }}>
                <div onClick={() => setAgreeTerms(v => !v)}
                  style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${agreeTerms ? "#e05c1a" : "#3a3f52"}`, background: agreeTerms ? "#e05c1a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  {agreeTerms && <span style={{ fontSize: 11, color: "#fff", lineHeight: 1 }}>✓</span>}
                </div>
                I agree to the <span style={{ color: "#e05c1a", marginLeft: 4 }}>Terms & Conditions</span> and <span style={{ color: "#e05c1a", marginLeft: 4 }}>Privacy Policy</span>. I confirm all design files are approved for printing.
              </label>

              {orderError && (
                <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "#ef444412", borderRadius: 8, border: "1px solid #ef444433" }}>
                  {orderError}
                </div>
              )}

              <NavButtons onBack={() => setStep("payment")}
                onNext={placeOrder}
                nextLabel={orderLoading ? "Placing Order..." : "✓ Place Order"}
                nextDisabled={!agreeTerms || orderLoading}
                nextAccent
              />
            </div>
          )}
        </div>

        {/* ── Order Summary Sidebar ── */}
        <div style={{ width: 320, background: "#1a1e28", borderLeft: "1px solid #2a2f3e", overflowY: "auto", padding: "24px 20px", flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, marginBottom: 16 }}>ORDER SUMMARY</div>

          {/* Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {cartItems.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e2e8f0", fontWeight: 600 }}>{item.cardType} Card</div>
                  <div style={{ color: "#64748b", marginTop: 1 }}>{item.quantity} × ₹{item.unitPrice.toFixed(2)}</div>
                </div>
                <div style={{ color: "#e2e8f0", fontWeight: 700 }}>₹{item.totalPrice.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: "#2a2f3e", marginBottom: 14 }} />

          {/* Pricing breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Subtotal", value: `₹${subtotal.toFixed(2)}`, dim: true },
              { label: `Shipping (${SHIPPING_OPTIONS.find(o => o.id === shippingMethod)!.label})`, value: shippingCost === 0 ? "FREE" : `₹${shippingCost.toFixed(2)}`, dim: true },
              ...(promoApplied ? [{ label: "Promo SAVE10 (10%)", value: `-₹${promoDiscount.toFixed(2)}`, green: true, dim: false }] : []),
              { label: "Tax (5%)", value: `₹${tax.toFixed(2)}`, dim: true },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#64748b" }}>{row.label}</span>
                <span style={{ color: (row as any).green ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: "#2a2f3e", margin: "14px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#e05c1a" }}>₹{grandTotal.toFixed(2)}</span>
          </div>

          <div style={{ marginTop: 6, fontSize: 11, color: "#475569", textAlign: "right" }}>
            {totalCards.toLocaleString()} cards total
          </div>

          {/* Trust badges */}
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
            {["🔒 SSL Encrypted Payment", "🔄 Easy 30-day Returns", "🎨 Print Quality Guaranteed", "🚚 Tracked Shipping"].map(badge => (
              <div key={badge} style={{ fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>{badge}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Order Confirmed Screen ─────────────────────────────────────────
function OrderConfirmed({ orderId, grandTotal, shipping, shippingMethod, totalCards, onBackToDesigner }:
  { orderId: string; grandTotal: number; shipping: ShippingForm; shippingMethod: ShippingMethod; totalCards: number; onBackToDesigner: () => void }) {
  const eta = SHIPPING_META.find(o => o.id === shippingMethod)!.days;
  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#13161d", minHeight: "100vh", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        {/* Animated checkmark */}
        <div style={{ width: 88, height: 88, borderRadius: "50%", background: "#16a34a22", border: "3px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 40 }}>
          ✓
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>Order Placed!</div>
        <div style={{ fontSize: 15, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
          Thank you for your order. Your ID cards are being prepared for printing.
        </div>

        {/* Order details card */}
        <div style={{ background: "#1a1e28", border: "1px solid #2a2f3e", borderRadius: 16, padding: "24px 28px", marginBottom: 24, textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, marginBottom: 4 }}>ORDER ID</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#e05c1a", fontFamily: "'Courier New', monospace" }}>{orderId}</div>
            </div>
            <div style={{ background: "#16a34a22", border: "1px solid #16a34a44", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, color: "#16a34a" }}>CONFIRMED</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            {[
              ["Cards Ordered", `${totalCards.toLocaleString()} cards`],
              ["Total Paid", `₹${grandTotal.toFixed(2)}`],
              ["Shipping To", `${shipping.firstName} ${shipping.lastName}`],
              ["Delivery Time", eta],
              ["Email", shipping.email],
              ["Phone", shipping.phone],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: 0.5, marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery address */}
        <div style={{ background: "#1a1e28", border: "1px solid #2a2f3e", borderRadius: 12, padding: "16px 20px", marginBottom: 28, textAlign: "left" }}>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, marginBottom: 8 }}>DELIVERY ADDRESS</div>
          <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.7 }}>
            {shipping.address1}{shipping.address2 ? ", " + shipping.address2 : ""}<br />
            {shipping.city}, {shipping.state} {shipping.zip}<br />
            {shipping.country}
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 32, background: "#1a1e28", border: "1px solid #2a2f3e", borderRadius: 12, overflow: "hidden" }}>
          {[
            { icon: "✅", label: "Order Confirmed" },
            { icon: "🖨️", label: "Printing" },
            { icon: "📦", label: "Packaging" },
            { icon: "🚚", label: "Shipped" },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: "14px 8px", textAlign: "center", borderRight: i < 3 ? "1px solid #2a2f3e" : "none", background: i === 0 ? "#16a34a18" : "transparent" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: i === 0 ? "#16a34a" : "#475569", letterSpacing: 0.3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <button onClick={onBackToDesigner}
          style={{ width: "100%", background: "#e05c1a", border: "none", color: "#fff", borderRadius: 10, padding: "14px 0", cursor: "pointer", fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>
          ← Design Another Card
        </button>

        <div style={{ marginTop: 16, fontSize: 12, color: "#475569" }}>
          A confirmation email has been sent to <strong style={{ color: "#94a3b8" }}>{shipping.email}</strong>
        </div>
      </div>
    </div>
  );
}

// ── Cart Item Card ─────────────────────────────────────────────────
function CartItemCard({ item, index, onRemove, onQtyChange }:
  { item: CartItem; index: number; onRemove: () => void; onQtyChange: (qty: number) => void }) {
  return (
    <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 12, padding: "16px", position: "relative" }}>
      <div style={{ position: "absolute", top: -8, left: 14, background: "#e05c1a", color: "#fff", borderRadius: 4, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
        ITEM #{index}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 6 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{item.cardType} Card — {item.printer}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{item.printSide} · {item.orientation} · {item.finish} · {item.chipType}</div>
        </div>
        <button onClick={onRemove} style={{ background: "#7f1d1d22", border: "1px solid #ef444433", color: "#ef4444", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Remove</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 12px", margin: "12px 0", fontSize: 11 }}>
        {[["Material", item.material], ["Front Fields", item.frontFieldCount.toString()], ["Back Fields", item.backFieldCount.toString()]].map(([k, v]) => (
          <div key={k}><span style={{ color: "#475569" }}>{k}: </span><span style={{ color: "#94a3b8", fontWeight: 600 }}>{v}</span></div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #2a2f3e", paddingTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Qty:</span>
          <button onClick={() => onQtyChange(Math.max(25, item.quantity - 1))}
            style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #3a3f52", background: "#13161d", color: "#94a3b8", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", minWidth: 40, textAlign: "center" }}>{item.quantity}</span>
          <button onClick={() => onQtyChange(item.quantity + 1)}
            style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #3a3f52", background: "#13161d", color: "#94a3b8", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
        <div>
          <span style={{ fontSize: 12, color: "#64748b" }}>₹{item.unitPrice.toFixed(2)} × {item.quantity} = </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#e05c1a" }}>₹{item.totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>{subtitle}</p>}
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div style={{ background: "#1e2330", border: "1px solid #2a2f3e", borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{title}</div>
        <button onClick={onEdit} style={{ background: "none", border: "1px solid #3a3f52", color: "#94a3b8", borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 11 }}>Edit</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{children}</div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 5 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: "#13161d", border: "1px solid #2a2f3e", color: "#e2e8f0", borderRadius: 7, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
        onFocus={e => (e.target.style.borderColor = "#e05c1a")}
        onBlur={e => (e.target.style.borderColor = "#2a2f3e")} />
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel, nextDisabled, nextAccent: _nextAccent }:
  { onBack?: () => void; onNext: () => void; nextLabel: string; nextDisabled?: boolean; nextAccent?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
      {onBack && (
        <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: 8, border: "1px solid #3a3f52", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          ← Back
        </button>
      )}
      <button onClick={onNext} disabled={nextDisabled}
        style={{ flex: 1, padding: "13px 0", borderRadius: 8, border: "none", background: nextDisabled ? "#2a2f3e" : "#e05c1a", color: nextDisabled ? "#475569" : "#fff", cursor: nextDisabled ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, letterSpacing: 0.5, transition: "background 0.15s" }}>
        {nextLabel}
      </button>
    </div>
  );
}

function EmptyCart({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
      <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.3 }}>🛒</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#64748b" }}>Your cart is empty</div>
      <div style={{ fontSize: 13, marginBottom: 24 }}>Design a card and place an order to continue.</div>
      <button onClick={onBack} style={{ background: "#e05c1a", border: "none", color: "#fff", borderRadius: 8, padding: "11px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
        ← Back to Designer
      </button>
    </div>
  );
}
