import { useState, useEffect } from "react";
import type { AddressForm } from "../../../shared/types/order.types";
import {
  COUNTRIES,
  getStates,
  getDistricts,
  getCities,
  getPincode,
} from "../../../data/locationData";
import type { CityData } from "../../../data/locationData";

// ── Props ──────────────────────────────────────────────────────────
interface CheckoutFormProps {
  title:            string;
  values:           AddressForm;
  onChange:         (v: AddressForm) => void;
  onValidityChange: (valid: boolean) => void;
}

// ── Validation ─────────────────────────────────────────────────────
function validate(v: AddressForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.address1.trim()) e.address1 = "Address Line 1 is required";
  if (!v.country.trim())  e.country  = "Country is required";
  if (v.country === "India") {
    if (!v.state.trim())    e.state    = "State is required";
    if (!v.district.trim()) e.district = "District is required";
    if (!v.city.trim())     e.city     = "City is required";
    if (!v.zip.trim())      e.zip      = "Pincode is required";
  } else {
    if (!v.city.trim()) e.city = "City is required";
    if (!v.zip.trim())  e.zip  = "ZIP / Postal is required";
  }
  return e;
}

// ── Design tokens ──────────────────────────────────────────────────
const T = {
  bg:         "#13161d",
  card:       "#1e2330",
  border:     "#2a2f3e",
  borderHi:   "#3a3f52",
  text:       "#e2e8f0",
  muted:      "#94a3b8",
  dim:        "#64748b",
  accent:     "#e05c1a",
  error:      "#ef4444",
  disabled:   "#0d1017",
} as const;

const inputBase: React.CSSProperties = {
  width: "100%",
  background: T.bg,
  border: `1px solid ${T.border}`,
  color: T.text,
  borderRadius: 7,
  padding: "9px 12px",
  fontSize: 13,
  outline: "none",
  fontFamily: "'DM Sans','Segoe UI',sans-serif",
  boxSizing: "border-box",
};

const selectBase: React.CSSProperties = {
  ...inputBase,
  appearance: "none",
  cursor: "pointer",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 32,
};

// ── Sub-components ─────────────────────────────────────────────────

function FieldLabel({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 5 }}>
      {text}
    </div>
  );
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ fontSize: 11, color: T.error, marginTop: 4 }}>{msg}</div>;
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return { ...inputBase, border: `1px solid ${hasError ? T.error : T.border}` };
}

function selectStyle(hasError: boolean, disabled = false): React.CSSProperties {
  return {
    ...selectBase,
    border: `1px solid ${hasError ? T.error : T.border}`,
    opacity: disabled ? 0.45 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    color: disabled ? T.dim : T.text,
  };
}

// ── Main Component ─────────────────────────────────────────────────
export function CheckoutForm({
  title,
  values,
  onChange,
  onValidityChange,
}: CheckoutFormProps) {
  const [errors,          setErrors]          = useState<Record<string, string>>({});
  const [touched,         setTouched]         = useState<Record<string, boolean>>({});
  const [stateOptions,    setStateOptions]    = useState<string[]>([]);
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [cityOptions,     setCityOptions]     = useState<CityData[]>([]);

  const isIndia = values.country === "India";

  // Initialise dropdown option lists from existing values (e.g. back-navigation)
  useEffect(() => {
    setStateOptions(getStates(values.country));
    if (values.state)    setDistrictOptions(getDistricts(values.country, values.state));
    if (values.district) setCityOptions(getCities(values.country, values.state, values.district));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bubble validity up to parent on every values change
  useEffect(() => {
    const e = validate(values);
    onValidityChange(Object.keys(e).length === 0);
  }, [values, onValidityChange]);

  // ── Handlers ──────────────────────────────────────────────────────

  function handleCountryChange(country: string) {
    onChange({ ...values, country, state: "", district: "", city: "", zip: "" });
    setStateOptions(getStates(country));
    setDistrictOptions([]);
    setCityOptions([]);
    touch("country");
  }

  function handleStateChange(state: string) {
    onChange({ ...values, state, district: "", city: "", zip: "" });
    setDistrictOptions(getDistricts(values.country, state));
    setCityOptions([]);
    touch("state");
  }

  function handleDistrictChange(district: string) {
    onChange({ ...values, district, city: "", zip: "" });
    setCityOptions(getCities(values.country, values.state, district));
    touch("district");
  }

  function handleCityChange(city: string) {
    const zip = getPincode(values.country, values.state, values.district, city);
    onChange({ ...values, city, zip });
    touch("city");
  }

  function touch(field: string) {
    setTouched(t => ({ ...t, [field]: true }));
  }

  function handleBlur(field: string) {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validate(values));
  }

  function handleTextChange(field: keyof AddressForm, value: string) {
    onChange({ ...values, [field]: value });
  }

  // Helper: should we show the error for this field?
  function err(field: string): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "20px 20px",
      marginBottom: 20,
    }}>
      {/* Section title */}
      <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, letterSpacing: 1.2, marginBottom: 16 }}>
        {title}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Address Line 1 */}
        <div>
          <FieldLabel text="Address Line 1 *" />
          <input
            value={values.address1}
            placeholder="123 Main Street"
            style={inputStyle(!!err("address1"))}
            onChange={e => handleTextChange("address1", e.target.value)}
            onBlur={() => handleBlur("address1")}
          />
          <ErrorMsg msg={err("address1")} />
        </div>

        {/* Address Line 2 */}
        <div>
          <FieldLabel text="Address Line 2" />
          <input
            value={values.address2}
            placeholder="Apt, Suite, Floor (optional)"
            style={inputStyle(false)}
            onChange={e => handleTextChange("address2", e.target.value)}
          />
        </div>

        {/* Country + State row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

          {/* Country */}
          <div>
            <FieldLabel text="Country *" />
            <select
              value={values.country}
              style={selectStyle(!!err("country"))}
              onChange={e => handleCountryChange(e.target.value)}
              onBlur={() => handleBlur("country")}
            >
              <option value="" disabled>Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ErrorMsg msg={err("country")} />
          </div>

          {/* State */}
          {isIndia ? (
            <div>
              <FieldLabel text="State *" />
              <select
                value={values.state}
                style={selectStyle(!!err("state"))}
                onChange={e => handleStateChange(e.target.value)}
                onBlur={() => handleBlur("state")}
              >
                <option value="" disabled>Select state</option>
                {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ErrorMsg msg={err("state")} />
            </div>
          ) : (
            <div>
              <FieldLabel text="State / Province" />
              <input
                value={values.state}
                placeholder="State or Province"
                style={inputStyle(false)}
                onChange={e => handleTextChange("state", e.target.value)}
              />
            </div>
          )}
        </div>

        {/* District + City row (India only) */}
        {isIndia && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

            {/* District */}
            <div>
              <FieldLabel text="District *" />
              <select
                value={values.district}
                disabled={!values.state}
                style={selectStyle(!!err("district"), !values.state)}
                onChange={e => handleDistrictChange(e.target.value)}
                onBlur={() => handleBlur("district")}
              >
                <option value="" disabled>
                  {values.state ? "Select district" : "Select state first"}
                </option>
                {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ErrorMsg msg={err("district")} />
            </div>

            {/* City */}
            <div>
              <FieldLabel text="City *" />
              <select
                value={values.city}
                disabled={!values.district}
                style={selectStyle(!!err("city"), !values.district)}
                onChange={e => handleCityChange(e.target.value)}
                onBlur={() => handleBlur("city")}
              >
                <option value="" disabled>
                  {values.district ? "Select city" : "Select district first"}
                </option>
                {cityOptions.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <ErrorMsg msg={err("city")} />
            </div>
          </div>
        )}

        {/* City (non-India) */}
        {!isIndia && (
          <div>
            <FieldLabel text="City *" />
            <input
              value={values.city}
              placeholder="City"
              style={inputStyle(!!err("city"))}
              onChange={e => handleTextChange("city", e.target.value)}
              onBlur={() => handleBlur("city")}
            />
            <ErrorMsg msg={err("city")} />
          </div>
        )}

        {/* ZIP / Pincode */}
        <div>
          <FieldLabel text={isIndia ? "Pincode" : "ZIP / Postal Code *"} />
          {isIndia ? (
            /* Auto-filled read-only for India */
            <input
              value={values.zip}
              readOnly
              placeholder="Auto-filled on city selection"
              style={{
                ...inputBase,
                background: T.disabled,
                color: values.zip ? T.muted : T.dim,
                cursor: "not-allowed",
                border: `1px solid ${T.border}`,
              }}
            />
          ) : (
            <input
              value={values.zip}
              placeholder="ZIP or Postal Code"
              style={inputStyle(!!err("zip"))}
              onChange={e => handleTextChange("zip", e.target.value)}
              onBlur={() => handleBlur("zip")}
            />
          )}
          <ErrorMsg msg={err("zip")} />
        </div>

      </div>
    </div>
  );
}
