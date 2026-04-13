import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../app/hooks";
import { authActions } from "../features/auth/authSlice";
import { api } from "../shared/utils/api";

function LoadingSpinner() {
  return (
    <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f1a", padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>Invalid Reset Link</div>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 28 }}>This link is missing a reset token. Please request a new one.</div>
          <button onClick={() => navigate("/")} style={{ padding: "10px 28px", background: "#e05c1a", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (!/[A-Z]/.test(newPassword)) return setError("Password must contain at least one uppercase letter.");
    if (!/[a-z]/.test(newPassword)) return setError("Password must contain at least one lowercase letter.");
    if (!/\d/.test(newPassword)) return setError("Password must contain at least one number.");
    if (newPassword !== confirmPassword) return setError("Passwords don't match.");

    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth/reset-password", { token, new_password: newPassword });
      setDone(true);
      setTimeout(() => {
        dispatch(authActions.openAuthModal("login"));
        navigate("/");
      }, 2000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f1a", padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440, background: "linear-gradient(160deg, #12151f 0%, #0a0d16 100%)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", boxShadow: "0 48px 128px rgba(0,0,0,0.8)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #e05c1a, #f97316, #fbbf24)" }} />

        <div style={{ padding: "36px 40px 40px" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#16a34a22", border: "2px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✓</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>Password updated!</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Redirecting you to sign in…</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#e05c1a", letterSpacing: 2.5, marginBottom: 8, fontFamily: "'Bebas Neue', sans-serif" }}>ACCOUNT RECOVERY</div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "#f1f5f9", margin: 0, fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>Choose a new password</h2>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 8, marginBottom: 0 }}>Must be at least 8 characters with uppercase, lowercase, and a number.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>New Password</div>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{ position: "absolute", left: 14, fontSize: 14, pointerEvents: "none" }}>🔒</span>
                    <input
                      type={showPass ? "text" : "password"}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(""); }}
                      placeholder="Min. 8 chars, uppercase, lowercase, number"
                      style={{ width: "100%", padding: "11px 14px 11px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}
                      onFocus={e => (e.target.style.borderColor = "#e05c1a66")}
                      onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                    <button onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 14, background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      {showPass ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Confirm Password</div>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{ position: "absolute", left: 14, fontSize: 14, pointerEvents: "none" }}>🔒</span>
                    <input
                      type={showPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                      placeholder="Repeat password"
                      style={{ width: "100%", padding: "11px 14px 11px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}
                      onFocus={e => (e.target.style.borderColor = "#e05c1a66")}
                      onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ background: "#7f1d1d22", border: "1px solid #ef444444", borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#ef4444", display: "flex", gap: 8, alignItems: "center" }}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading}
                style={{ width: "100%", marginTop: 20, padding: "14px 0", borderRadius: 10, border: "none", background: loading ? "#2a2f3e" : "linear-gradient(135deg, #e05c1a, #f97316)", color: loading ? "#64748b" : "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s", boxShadow: loading ? "none" : "0 8px 24px rgba(224,92,26,0.35)" }}>
                {loading ? <><LoadingSpinner /> Updating password…</> : "Set New Password →"}
              </button>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 13 }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
