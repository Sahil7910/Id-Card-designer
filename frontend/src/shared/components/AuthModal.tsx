import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { login, register, forgotPassword, authActions } from "../../features/auth/authSlice";

type AuthMode = "login" | "signup";
interface AuthForm { name: string; email: string; password: string; confirm: string }

function LoadingSpinner() {
  return (
    <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

const AuthInput = ({ label, type, value, onChange, placeholder, icon, ref }: {
  label: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; icon: string;
  ref?: React.RefObject<HTMLInputElement | null>;
}) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <span style={{ position: "absolute", left: 14, fontSize: 14, pointerEvents: "none" }}>{icon}</span>
      <input ref={ref} type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", padding: "11px 14px 11px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s" }}
        onFocus={e => (e.target.style.borderColor = "#e05c1a66")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
    </div>
  </div>
);

function AuthModalInner({ mode, onClose, onSwitch }: { mode: AuthMode; onClose: () => void; onSwitch: (m: AuthMode) => void }) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<AuthForm>({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Forgot password local state
  const [view, setView] = useState<"auth" | "forgot" | "forgot-sent">("auth");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200); }, [mode]);

  const set = (k: keyof AuthForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setError("");
  };

  const handleSubmit = async () => {
    if (mode === "signup") {
      if (!form.name.trim()) return setError("Name is required.");
      if (!form.email.includes("@")) return setError("Enter a valid email.");
      if (form.password.length < 8) return setError("Password must be at least 8 characters.");
      if (form.password !== form.confirm) return setError("Passwords don't match.");
    } else {
      if (!form.email.includes("@")) return setError("Enter a valid email.");
      if (!form.password) return setError("Enter your password.");
    }
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        const nameParts = form.name.trim().split(/\s+/);
        await dispatch(register({
          email: form.email,
          password: form.password,
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(" ") || "",
        })).unwrap();
      } else {
        await dispatch(login({
          email: form.email,
          password: form.password,
        })).unwrap();
      }
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err: unknown) {
      const errAny = err as { message?: string };
      setError(errAny?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", maxWidth: 440, background: "linear-gradient(160deg, #12151f 0%, #0a0d16 100%)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", position: "relative", boxShadow: "0 48px 128px rgba(0,0,0,0.8)" }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #e05c1a, #f97316, #fbbf24)" }} />
        <div style={{ position: "absolute", top: -60, right: -60, width: 180, height: 180, borderRadius: "50%", background: "#e05c1a12", filter: "blur(40px)", pointerEvents: "none" }} />

        <div style={{ padding: "36px 40px 40px", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 18, right: 20, background: "rgba(255,255,255,0.06)", border: "none", color: "#64748b", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

          {/* ── Forgot Password view ── */}
          {view === "forgot" && (
            <>
              <button onClick={() => setView("auth")} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 24, padding: 0 }}>
                ← Back to Sign In
              </button>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#e05c1a", letterSpacing: 2.5, marginBottom: 8, fontFamily: "'Bebas Neue', sans-serif" }}>ACCOUNT RECOVERY</div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "#f1f5f9", margin: 0, fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>Reset your password</h2>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 8, marginBottom: 0 }}>Enter your email and we'll send you a reset link.</p>
              </div>
              <AuthInput label="Email Address" type="email" value={forgotEmail}
                onChange={e => { setForgotEmail(e.target.value); setForgotError(""); }}
                placeholder="you@company.com" icon="✉️" />
              {forgotError && (
                <div style={{ background: "#7f1d1d22", border: "1px solid #ef444444", borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#ef4444", display: "flex", gap: 8, alignItems: "center" }}>
                  ⚠️ {forgotError}
                </div>
              )}
              <button
                disabled={forgotLoading}
                onClick={async () => {
                  if (!forgotEmail.includes("@")) return setForgotError("Enter a valid email address.");
                  setForgotLoading(true);
                  try {
                    await dispatch(forgotPassword(forgotEmail)).unwrap();
                    setView("forgot-sent");
                  } catch {
                    setForgotError("Something went wrong. Please try again.");
                  } finally {
                    setForgotLoading(false);
                  }
                }}
                style={{ width: "100%", marginTop: 20, padding: "14px 0", borderRadius: 10, border: "none", background: forgotLoading ? "#2a2f3e" : "linear-gradient(135deg, #e05c1a, #f97316)", color: forgotLoading ? "#64748b" : "#fff", fontWeight: 700, fontSize: 15, cursor: forgotLoading ? "not-allowed" : "pointer", letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s", boxShadow: forgotLoading ? "none" : "0 8px 24px rgba(224,92,26,0.35)" }}>
                {forgotLoading ? <><LoadingSpinner /> Sending…</> : "Send Reset Link →"}
              </button>
            </>
          )}

          {/* ── Forgot Password sent view ── */}
          {view === "forgot-sent" && (
            <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#16a34a22", border: "2px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✓</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>Check your email</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 28 }}>
                We sent a reset link to <strong style={{ color: "#e2e8f0" }}>{forgotEmail}</strong>.<br />
                The link expires in 1 hour.
              </div>
              <button onClick={() => setView("auth")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", borderRadius: 10, padding: "11px 28px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Back to Sign In
              </button>
            </div>
          )}

          {/* ── Login / Signup view ── */}
          {view === "auth" && <>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#e05c1a", letterSpacing: 2.5, marginBottom: 8, fontFamily: "'Bebas Neue', sans-serif" }}>
              {mode === "login" ? "WELCOME BACK" : "GET STARTED"}
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", margin: 0, fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>
              {mode === "login" ? "Sign in to your\naccount" : "Create your\nfree account"}
            </h2>
          </div>

          {success ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#16a34a22", border: "2px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#16a34a" }}>{mode === "login" ? "Welcome back!" : "Account created!"}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Redirecting you now…</div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
                {[{ icon: "G", label: "Google", bg: "#4285f4" }, { icon: "in", label: "LinkedIn", bg: "#0a66c2" }].map(btn => (
                  <button key={btn.label} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
                    <span style={{ width: 20, height: 20, borderRadius: 5, background: btn.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#fff" }}>{btn.icon}</span>
                    {btn.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                <span style={{ fontSize: 11, color: "#475569", letterSpacing: 1 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {mode === "signup" && (
                  <AuthInput ref={inputRef} label="Full Name" type="text" value={form.name} onChange={set("name")} placeholder="John Smith" icon="👤" />
                )}
                <AuthInput ref={mode === "login" ? inputRef : undefined} label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" icon="✉️" />
                <div style={{ position: "relative" }}>
                  <AuthInput label="Password" type={showPass ? "text" : "password"} value={form.password} onChange={set("password")} placeholder={mode === "signup" ? "Min. 8 chars, uppercase, lowercase, number" : "Your password"} icon="🔒" />
                  <button onClick={() => setShowPass(v => !v)}
                    style={{ position: "absolute", right: 14, bottom: 11, background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                    {showPass ? "HIDE" : "SHOW"}
                  </button>
                </div>
                {mode === "signup" && (
                  <AuthInput label="Confirm Password" type={showPass ? "text" : "password"} value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" icon="🔒" />
                )}
              </div>

              {mode === "login" && (
                <div style={{ textAlign: "right", marginTop: 8 }}>
                  <button onClick={() => { setView("forgot"); setForgotError(""); }} style={{ background: "none", border: "none", color: "#e05c1a", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Forgot password?</button>
                </div>
              )}

              {error && (
                <div style={{ background: "#7f1d1d22", border: "1px solid #ef444444", borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#ef4444", display: "flex", gap: 8, alignItems: "center" }}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading}
                style={{ width: "100%", marginTop: 20, padding: "14px 0", borderRadius: 10, border: "none", background: loading ? "#2a2f3e" : "linear-gradient(135deg, #e05c1a, #f97316)", color: loading ? "#64748b" : "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s", boxShadow: loading ? "none" : "0 8px 24px rgba(224,92,26,0.35)" }}>
                {loading ? (
                  <><LoadingSpinner /> {mode === "login" ? "Signing in…" : "Creating account…"}</>
                ) : (
                  mode === "login" ? "Sign In →" : "Create Account →"
                )}
              </button>

              <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#64748b" }}>
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => onSwitch(mode === "login" ? "signup" : "login")}
                  style={{ background: "none", border: "none", color: "#e05c1a", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                  {mode === "login" ? "Sign up free" : "Sign in"}
                </button>
              </div>
            </>
          )}
          </>}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Global auth modal — reads state from Redux authSlice */
export function AuthModal() {
  const dispatch = useAppDispatch();
  const authModal = useAppSelector(s => s.auth.authModal);

  if (!authModal) return null;

  return (
    <AnimatePresence>
      <AuthModalInner
        key={authModal}
        mode={authModal}
        onClose={() => dispatch(authActions.closeAuthModal())}
        onSwitch={mode => dispatch(authActions.openAuthModal(mode))}
      />
    </AnimatePresence>
  );
}
