import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { store } from "../../app/store";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { login, forgotPassword, googleAuth } from "../../features/auth/authSlice";

const ROLE_REDIRECTS: Record<string, string> = {
  ADMIN: "/admin",
  DESIGN: "/design-queue",
  PRINTING: "/print-queue",
  SHIPPING: "/shipping-queue",
};

function LoadingSpinner() {
  return (
    <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(s => s.auth.user);
  const isLoading = useAppSelector(s => s.auth.isLoading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Forgot password state
  const [view, setView] = useState<"login" | "forgot" | "forgot-sent" | "forgot-google" | "forgot-not-found">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  // Redirect already-authenticated users
  useEffect(() => {
    if (!isLoading && user) {
      const dest = ROLE_REDIRECTS[user.role] ?? "/";
      navigate(dest, { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async () => {
    if (!email.includes("@")) return setError("Enter a valid email.");
    if (!password) return setError("Enter your password.");

    setLoading(true);
    setError("");
    try {
      await dispatch(login({ email, password })).unwrap();
      setSuccess(true);
      setTimeout(() => {
        const authUser = store.getState().auth.user;
        const dest = ROLE_REDIRECTS[authUser?.role ?? ""] ?? "/";
        navigate(dest, { replace: true });
      }, 700);
    } catch (err: unknown) {
      const errAny = err as { message?: string };
      setError(errAny?.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setLoading(true);
      setError("");
      try {
        await dispatch(googleAuth(access_token)).unwrap();
        setSuccess(true);
        setTimeout(() => {
          const authUser = store.getState().auth.user;
          const dest = ROLE_REDIRECTS[authUser?.role ?? ""] ?? "/";
          navigate(dest, { replace: true });
        }, 700);
      } catch (err: unknown) {
        const errAny = err as { message?: string };
        setError(errAny?.message ?? "Google sign-in failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  const handleForgot = async () => {
    if (!forgotEmail.includes("@")) return setForgotError("Enter a valid email address.");
    setForgotLoading(true);
    try {
      const res = await dispatch(forgotPassword(forgotEmail)).unwrap();
      if (!res?.exists) {
        setView("forgot-not-found");
      } else if (res?.oauth) {
        setView("forgot-google");
      } else {
        setView("forgot-sent");
      }
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f1a" }}>
        <div style={{ color: "#e05c1a", fontSize: 18 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f1a", padding: 20, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Background glow */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 300, borderRadius: "50%", background: "#e05c1a08", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative" }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e05c1a", letterSpacing: 3, marginBottom: 10, fontFamily: "'Bebas Neue', sans-serif" }}>ID CARD DESIGNER</div>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 1 }}>STAFF & CUSTOMER PORTAL</div>
        </div>

        {/* Card */}
        <div style={{ background: "linear-gradient(160deg, #12151f 0%, #0a0d16 100%)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", boxShadow: "0 48px 128px rgba(0,0,0,0.6)" }}>
          <div style={{ height: 3, background: "linear-gradient(90deg, #e05c1a, #f97316, #fbbf24)" }} />

          <div style={{ padding: "36px 40px 40px" }}>

            {/* ── Forgot Password view ── */}
            {view === "forgot" && (
              <>
                <button onClick={() => { setView("login"); setForgotError(""); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 24, padding: 0 }}>
                  ← Back to Sign In
                </button>
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#e05c1a", letterSpacing: 2.5, marginBottom: 8, fontFamily: "'Bebas Neue', sans-serif" }}>ACCOUNT RECOVERY</div>
                  <h2 style={{ fontSize: 26, fontWeight: 900, color: "#f1f5f9", margin: 0, fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>Reset your password</h2>
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: 8, marginBottom: 0 }}>Enter your email and we'll send you a reset link.</p>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Email Address</div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none" }}>✉️</span>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => { setForgotEmail(e.target.value); setForgotError(""); }}
                      placeholder="you@company.com"
                      style={{ width: "100%", padding: "11px 14px 11px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                      onFocus={e => (e.target.style.borderColor = "#e05c1a66")}
                      onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                </div>
                {forgotError && (
                  <div style={{ background: "#7f1d1d22", border: "1px solid #ef444444", borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#ef4444", display: "flex", gap: 8, alignItems: "center" }}>
                    ⚠️ {forgotError}
                  </div>
                )}
                <button
                  disabled={forgotLoading}
                  onClick={handleForgot}
                  style={{ width: "100%", marginTop: 20, padding: "14px 0", borderRadius: 10, border: "none", background: forgotLoading ? "#2a2f3e" : "linear-gradient(135deg, #e05c1a, #f97316)", color: forgotLoading ? "#64748b" : "#fff", fontWeight: 700, fontSize: 15, cursor: forgotLoading ? "not-allowed" : "pointer", letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s", boxShadow: forgotLoading ? "none" : "0 8px 24px rgba(224,92,26,0.35)" }}>
                  {forgotLoading ? <><LoadingSpinner /> Sending…</> : "Send Reset Link →"}
                </button>
              </>
            )}

            {/* ── Forgot sent view ── */}
            {view === "forgot-sent" && (
              <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#16a34a22", border: "2px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✓</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>Check your email</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 28 }}>
                  We sent a reset link to <strong style={{ color: "#e2e8f0" }}>{forgotEmail}</strong>.<br />
                  The link expires in 1 hour.
                </div>
                <button onClick={() => setView("login")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", borderRadius: 10, padding: "11px 28px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Back to Sign In
                </button>
              </div>
            )}

            {/* ── Account not found ── */}
            {view === "forgot-not-found" && (
              <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#7f1d1d22", border: "2px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✕</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>No account found</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 28 }}>
                  There's no account registered with<br />
                  <strong style={{ color: "#e2e8f0" }}>{forgotEmail}</strong>.<br />
                  Would you like to create one?
                </div>
                <Link to="/" style={{ display: "block", width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #e05c1a, #f97316)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 12, textDecoration: "none", textAlign: "center" }}>
                  Create Account →
                </Link>
                <button onClick={() => setView("forgot")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", borderRadius: 10, padding: "11px 28px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Try another email
                </button>
              </div>
            )}

            {/* ── Google account — no password reset ── */}
            {view === "forgot-google" && (
              <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#4285f422", border: "2px solid #4285f4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28, fontWeight: 900, color: "#4285f4" }}>G</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>Google account detected</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 28 }}>
                  This email is linked to a Google account.<br />
                  You don't need a password — just sign in with Google.
                </div>
                <button
                  onClick={() => handleGoogleLogin()}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "13px 0", borderRadius: 10, border: "none", background: "#4285f4", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 12 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 4, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#4285f4" }}>G</span>
                  Continue with Google
                </button>
                <button onClick={() => setView("login")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", borderRadius: 10, padding: "11px 28px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Back to Sign In
                </button>
              </div>
            )}

            {/* ── Login view ── */}
            {view === "login" && (
              <>
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#e05c1a", letterSpacing: 2.5, marginBottom: 8, fontFamily: "'Bebas Neue', sans-serif" }}>WELCOME BACK</div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", margin: 0, fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>Sign in to your account</h2>
                </div>

                {success ? (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#16a34a22", border: "2px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#16a34a" }}>Welcome back!</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Redirecting you now…</div>
                  </div>
                ) : (
                  <>
                    {/* Google Sign In */}
                    <button
                      onClick={() => handleGoogleLogin()}
                      disabled={loading}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, opacity: loading ? 0.4 : 1, transition: "opacity 0.2s", marginBottom: 16 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 5, background: "#4285f4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff" }}>G</span>
                      Continue with Google
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                      <span style={{ fontSize: 11, color: "#475569", letterSpacing: 1 }}>OR</span>
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {/* Email */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Email Address</div>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none" }}>✉️</span>
                          <input
                            type="email"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setError(""); }}
                            placeholder="you@company.com"
                            onKeyDown={e => e.key === "Enter" && handleSubmit()}
                            style={{ width: "100%", padding: "11px 14px 11px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                            onFocus={e => (e.target.style.borderColor = "#e05c1a66")}
                            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Password</div>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none" }}>🔒</span>
                          <input
                            type={showPass ? "text" : "password"}
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(""); }}
                            placeholder="Your password"
                            onKeyDown={e => e.key === "Enter" && handleSubmit()}
                            style={{ width: "100%", padding: "11px 60px 11px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                            onFocus={e => (e.target.style.borderColor = "#e05c1a66")}
                            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                          />
                          <button
                            onClick={() => setShowPass(v => !v)}
                            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                            {showPass ? "HIDE" : "SHOW"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", marginTop: 8 }}>
                      <button
                        onClick={() => { setView("forgot"); setForgotEmail(email); setForgotError(""); }}
                        style={{ background: "none", border: "none", color: "#e05c1a", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        Forgot password?
                      </button>
                    </div>

                    {error && (
                      <div style={{ background: "#7f1d1d22", border: "1px solid #ef444444", borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#ef4444", display: "flex", gap: 8, alignItems: "center" }}>
                        ⚠️ {error}
                      </div>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      style={{ width: "100%", marginTop: 20, padding: "14px 0", borderRadius: 10, border: "none", background: loading ? "#2a2f3e" : "linear-gradient(135deg, #e05c1a, #f97316)", color: loading ? "#64748b" : "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s", boxShadow: loading ? "none" : "0 8px 24px rgba(224,92,26,0.35)" }}>
                      {loading ? <><LoadingSpinner /> Signing in…</> : "Sign In →"}
                    </button>

                    <div style={{ textAlign: "center", marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: 13, color: "#475569" }}>New customer? </span>
                      <Link to="/" style={{ color: "#e05c1a", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                        Register on our homepage →
                      </Link>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
