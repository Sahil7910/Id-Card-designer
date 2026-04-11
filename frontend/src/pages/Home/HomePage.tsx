import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { authActions, selectIsAuthenticated, selectAuthUser } from "../../features/auth/authSlice";

// ── Google Fonts ───────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("hp-fonts")) {
  const link = document.createElement("link");
  link.id = "hp-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Playfair+Display:wght@700;900&display=swap";
  document.head.appendChild(link);
}

// ── Animated floating card ─────────────────────────────────────────
function FloatingCard({
  accent, delay, rotate, top, left, width, label, fields,
}: {
  accent: string; delay: number; rotate: number;
  top: string; left: string; width: number; label: string;
  fields: { h: number; w: number; y: number; x: number; type: "block" | "line" | "dot" }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: rotate - 4 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute",
        top, left,
        width,
        height: width * 0.63,
        background: "linear-gradient(135deg, #1a1f2e 0%, #0f1420 100%)",
        borderRadius: 14,
        border: `1px solid ${accent}33`,
        boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.04)`,
        overflow: "hidden",
        pointerEvents: "none",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
      {/* Corner glow */}
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${accent}18`, filter: "blur(20px)" }} />
      {/* Label */}
      <div style={{ position: "absolute", top: 14, left: 14, fontSize: 8, fontWeight: 700, color: accent, letterSpacing: 2, fontFamily: "'Bebas Neue', sans-serif", opacity: 0.9 }}>
        {label}
      </div>
      {/* Fields */}
      {fields.map((f, i) => (
        <div key={i} style={{
          position: "absolute",
          top: `${f.y}%`, left: `${f.x}%`,
          width: `${f.w}%`, height: f.type === "dot" ? 10 : f.h,
          background: f.type === "block" ? `${accent}28` : f.type === "dot" ? accent : "rgba(255,255,255,0.08)",
          borderRadius: f.type === "dot" ? "50%" : f.type === "block" ? 6 : 3,
          border: f.type === "block" ? `1px solid ${accent}44` : "none",
        }} />
      ))}
    </motion.div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: "#f1f5f9", lineHeight: 1, letterSpacing: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#475569", letterSpacing: 1.5, marginTop: 2, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      style={{ background: "linear-gradient(135deg, #141824 0%, #0f1320 100%)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 26px", cursor: "default", transition: "box-shadow 0.3s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(224,92,26,0.12)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(224,92,26,0.3)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 12, background: "#e05c1a18", border: "1px solid #e05c1a33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "#f1f5f9", letterSpacing: 1, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{desc}</div>
    </motion.div>
  );
}

// ── Step Card ─────────────────────────────────────────────────────
function StepCard({ num, title, desc, delay }: { num: string; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      style={{ position: "relative", padding: "32px 28px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", overflow: "hidden" }}
    >
      {/* BIG number bg */}
      <div style={{ position: "absolute", top: -10, right: 16, fontFamily: "'Bebas Neue', sans-serif", fontSize: 100, color: "rgba(224,92,26,0.06)", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>{num}</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: "#e05c1a", letterSpacing: 2, marginBottom: 12 }}>STEP {num}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#f1f5f9", fontWeight: 700, marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{desc}</div>
    </motion.div>
  );
}

// ── Testimonial ───────────────────────────────────────────────────
function Testimonial({ quote, name, role, accent, delay }: { quote: string; name: string; role: string; accent: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      style={{ background: "linear-gradient(135deg, #12151f 0%, #0e1119 100%)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 26px" }}
    >
      <div style={{ fontSize: 28, color: accent, marginBottom: 14, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>"</div>
      <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, marginBottom: 20 }}>{quote}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${accent}28`, border: `2px solid ${accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          {name[0]}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{name}</div>
          <div style={{ fontSize: 11, color: "#475569" }}>{role}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectAuthUser);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 900, transition: "all 0.4s", background: scrolled ? "rgba(8,10,18,0.92)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none", padding: "0 40px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #e05c1a, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🪪</div>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#f1f5f9", letterSpacing: 2 }}>CARDCRAFT</span>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {["Templates", "Pricing", "Examples"].map(item => (
          <button key={item} onClick={() => navigate("/templates")}
            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f1f5f9")}
            onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
            {item}
          </button>
        ))}
      </div>

      {/* Auth buttons */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {isAuthenticated && user ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #e05c1a, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {(user.first_name?.[0] ?? user.email[0]).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif" }}>
                {user.first_name || user.email.split("@")[0]}
              </span>
            </div>
            {user.is_admin && (
              <Link
                to="/admin"
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(224,92,26,0.4)", background: "rgba(224,92,26,0.1)", color: "#e05c1a", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textDecoration: "none" }}
              >
                Admin
              </Link>
            )}
            <button onClick={() => dispatch(authActions.logout())}
              style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "transparent"; }}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <button onClick={() => dispatch(authActions.openAuthModal("login"))}
              style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "transparent"; }}>
              Sign In
            </button>
            <button onClick={() => dispatch(authActions.openAuthModal("signup"))}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #e05c1a, #f97316)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(224,92,26,0.35)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(224,92,26,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(224,92,26,0.35)"; }}>
              Get Started
            </button>
          </>
        )}
      </div>
    </motion.nav>
  );
}

// ── Main ───────────────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const requireAuth = (cb: () => void) => () => {
    if (!isAuthenticated) { dispatch(authActions.openAuthModal("login")); return; }
    cb();
  };

  return (
    <div style={{ width: "100%", overflowX: "hidden", background: "#080a12", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0" }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::selection { background: #e05c1a44; }
        @keyframes float { 0%,100% { transform: translateY(0) rotate(var(--r,0deg)) } 50% { transform: translateY(-14px) rotate(var(--r,0deg)) } }
        @keyframes gradshift { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity:0.6 } 100% { transform: scale(1.8); opacity:0 } }
        @keyframes ticker { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "100px 40px 60px" }}>

        {/* Gradient mesh bg */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, #1a0a0022 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, #0a1a3a44 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 20% 60%, #e05c1a0a 0%, transparent 60%)", pointerEvents: "none" }} />

        {/* Grid lines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

        {/* Floating ID cards */}
        <FloatingCard accent="#e05c1a" delay={0.4} rotate={-8} top="12%" left="6%" width={200}
          label="EMPLOYEE ID" fields={[
            { type: "block", h: 42, w: 28, y: 28, x: 8 },
            { type: "line",  h: 6,  w: 55, y: 28, x: 40 },
            { type: "line",  h: 4,  w: 40, y: 44, x: 40 },
            { type: "line",  h: 3,  w: 60, y: 72, x: 8 },
            { type: "line",  h: 3,  w: 45, y: 82, x: 8 },
          ]} />

        <FloatingCard accent="#0ea5e9" delay={0.6} rotate={6} top="55%" left="2%" width={170}
          label="SCHOOL ID" fields={[
            { type: "block", h: 50, w: 30, y: 22, x: 35 },
            { type: "line",  h: 5,  w: 60, y: 78, x: 20 },
            { type: "line",  h: 4,  w: 40, y: 88, x: 30 },
          ]} />

        <FloatingCard accent="#8b5cf6" delay={0.5} rotate={5} top="10%" left="78%" width={190}
          label="EVENT PASS" fields={[
            { type: "line", h: 8,  w: 65, y: 24, x: 8 },
            { type: "line", h: 5,  w: 50, y: 38, x: 8 },
            { type: "dot",  h: 10, w: 10, y: 60, x: 8 },
            { type: "block",h: 30, w: 30, y: 55, x: 62 },
          ]} />

        <FloatingCard accent="#10b981" delay={0.7} rotate={-4} top="62%" left="74%" width={160}
          label="ACCESS CARD" fields={[
            { type: "line",  h: 7,  w: 70, y: 28, x: 8 },
            { type: "line",  h: 4,  w: 50, y: 42, x: 8 },
            { type: "block", h: 18, w: 80, y: 65, x: 8 },
          ]} />

        {/* Hero content */}
        <div style={{ position: "relative", textAlign: "center", maxWidth: 760, zIndex: 10 }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(224,92,26,0.12)", border: "1px solid rgba(224,92,26,0.3)", borderRadius: 20, padding: "6px 16px", marginBottom: 28 }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e05c1a", boxShadow: "0 0 0 3px rgba(224,92,26,0.3)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#e05c1a", letterSpacing: 1.5, fontFamily: "'Bebas Neue', sans-serif" }}>PROFESSIONAL ID CARD DESIGNER</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(58px, 9vw, 100px)", lineHeight: 0.95, letterSpacing: 2, color: "#f1f5f9", marginBottom: 24 }}
          >
            DESIGN YOUR
            <br />
            <span style={{ background: "linear-gradient(135deg, #e05c1a 0%, #f97316 50%, #fbbf24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              IDENTITY
            </span>
            <br />
            IN MINUTES
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{ fontSize: 17, color: "#64748b", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.75 }}
          >
            Create stunning, professional-grade ID cards, event passes, and membership cards with our drag-and-drop designer. Print-ready in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}
          >
            <button onClick={requireAuth(() => navigate("/designer/default"))}
              style={{ padding: "16px 36px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #e05c1a, #f97316)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", letterSpacing: 0.5, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(174, 88, 45, 0.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(24,92,26,0.4)"; }}>
              ⚡ Start Designing Free
            </button>

            <button onClick={requireAuth(() => navigate("/templates"))}
              style={{ padding: "16px 36px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}>
              Browse Templates →
            </button>
          </motion.div>

          {/* Social proof */}
          
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{ background: "#e05c1a", padding: "14px 0", overflow: "hidden", borderTop: "1px solid #f9731622", borderBottom: "1px solid #f9731622" }}>
        <div style={{ display: "flex", animation: "ticker 20s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
          {[...Array(2)].map((_, rep) => (
            <span key={rep} style={{ display: "flex", gap: 0 }}>
              {["EMPLOYEE CARDS", "SCHOOL IDs", "EVENT PASSES", "MEMBERSHIP CARDS", "GOVERNMENT IDs", "ACCESS CARDS", "CONFERENCE BADGES", "LOYALTY CARDS"].map((item, i) => (
                <span key={i} style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 3, color: "#fff", padding: "0 32px", opacity: 0.9 }}>
                  {item} <span style={{ opacity: 0.5, marginLeft: 8 }}>✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section style={{ padding: "80px 40px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40, textAlign: "center" }}>
          {[
            { value: "50K+", label: "Cards Designed" },
            { value: "99.9%", label: "Uptime" },
            { value: "4.9★", label: "Rating" },
            { value: "2MIN", label: "Avg. Design Time" },
          ].map((stat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}>
              <StatPill value={stat.value} label={stat.label} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e05c1a", letterSpacing: 2.5, marginBottom: 12, fontFamily: "'Bebas Neue', sans-serif" }}>EVERYTHING YOU NEED</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 44px)", color: "#f1f5f9", fontWeight: 900 }}>Designed for Professionals</h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {[
              { icon: "🎨", title: "DRAG & DROP DESIGNER", desc: "Intuitive canvas with pixel-perfect field placement, resize handles, and real-time preview.", delay: 0 },
              { icon: "📐", title: "PRE-BUILT TEMPLATES", desc: "10+ professionally designed templates across Business, Education, Medical, and Government.", delay: 0.1 },
              { icon: "🖨️", title: "THERMAL & INKJET", desc: "Compatible with all major printer types. Choose from PVC, paper, or composite materials.", delay: 0.2 },
              { icon: "✨", title: "CUSTOM FONTS & STYLES", desc: "50+ Google Fonts, bold/italic/underline, custom colors, and advanced text styling.", delay: 0.3 },
              { icon: "📦", title: "BULK ORDERING", desc: "Order from 10 to 10,000+ cards with automatic bulk pricing discounts up to 25% off.", delay: 0.4 },
              { icon: "🔒", title: "SECURITY FEATURES", desc: "RFID chips, LED, barcodes, and custom security elements to protect your cards.", delay: 0.5 },
            ].map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── WHAT WE CREATE ── */}
      <section style={{ padding: "100px 40px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 70 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e05c1a", letterSpacing: 2.5, marginBottom: 12, fontFamily: "'Bebas Neue', sans-serif" }}>WHAT WE CREATE</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 44px)", color: "#0f172a", fontWeight: 900 }}>Every Card Type, Covered</h2>
          </motion.div>

          {/* ID Cards row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", marginBottom: 80 }}>
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }}>
              <div style={{ display: "inline-block", background: "#e05c1a12", border: "1px solid #e05c1a33", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#e05c1a", letterSpacing: 1.5, marginBottom: 16, fontFamily: "'Bebas Neue', sans-serif" }}>ID CARDS</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#0f172a", fontWeight: 900, marginBottom: 14, lineHeight: 1.2 }}>Custom Employee & Student ID Cards</h3>
              <p style={{ color: "#64748b", lineHeight: 1.75, marginBottom: 16, fontSize: 15 }}>Design professional ID cards tailored to your brand. Add photos, logos, barcodes, RFID chips, and custom fields — then order in bulk with free shipping on standard delivery.</p>
              <ul style={{ listStyle: "none", marginBottom: 24, display: "flex", flexDirection: "column", gap: 8 }}>
                {["Professional photo-quality printing", "Security features & RFID chips", "PVC, Paper & Composite materials"].map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#475569" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#e05c1a18", border: "1px solid #e05c1a44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#e05c1a", flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={requireAuth(() => navigate("/designer/default"))}
                style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: "#e05c1a", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(224,92,26,0.35)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                Design ID Card →
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              style={{ height: 320, borderRadius: 20, background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0ea5e9 100%)", boxShadow: "0 24px 64px rgba(14,165,233,0.25)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "24px 28px", width: 220, backdropFilter: "blur(20px)" }}>
                <div style={{ height: 4, background: "#0ea5e9", borderRadius: 2, marginBottom: 16 }} />
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 46, height: 56, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "1px dashed rgba(255,255,255,0.2)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 8, background: "rgba(255,255,255,0.25)", borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 6, background: "rgba(14,165,233,0.6)", borderRadius: 4, marginBottom: 6, width: "70%" }} />
                    <div style={{ height: 5, background: "rgba(255,255,255,0.12)", borderRadius: 4, width: "50%" }} />
                  </div>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 4, marginBottom: 5 }} />
                <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 4, width: "65%" }} />
              </div>
            </motion.div>
          </div>

          {/* Lanyards row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              style={{ height: 320, borderRadius: 20, background: "linear-gradient(135deg, #431407 0%, #9a3412 50%, #f97316 100%)", boxShadow: "0 24px 64px rgba(249,115,22,0.25)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
              {/* Lanyard visual */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                <div style={{ width: 60, height: 80, borderLeft: "4px solid rgba(255,255,255,0.4)", borderRight: "4px solid rgba(255,255,255,0.4)", position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 16, height: 16, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.6)" }} />
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "12px 16px", width: 130, backdropFilter: "blur(10px)" }}>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.35)", borderRadius: 3, marginBottom: 6 }} />
                  <div style={{ height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 3, width: "60%" }} />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }}>
              <div style={{ display: "inline-block", background: "#f9731618", border: "1px solid #f9731633", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#f97316", letterSpacing: 1.5, marginBottom: 16, fontFamily: "'Bebas Neue', sans-serif" }}>LANYARDS</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#0f172a", fontWeight: 900, marginBottom: 14, lineHeight: 1.2 }}>Custom Lanyards for Events & Corporate</h3>
              <p style={{ color: "#64748b", lineHeight: 1.75, marginBottom: 16, fontSize: 15 }}>Match your brand perfectly with fully customizable lanyards. Choose your material, colors, clip type, and print your logo or message in vivid detail.</p>
              <ul style={{ listStyle: "none", marginBottom: 24, display: "flex", flexDirection: "column", gap: 8 }}>
                {["Multiple material & width options", "Full-color sublimation printing", "Safety breakaway & clip attachments"].map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#475569" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#f9731618", border: "1px solid #f9731644", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#f97316", flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={requireAuth(() => navigate("/templates"))}
                style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: "#f97316", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(249,115,22,0.35)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                Design Lanyard →
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "100px 40px", background: "#080a12" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e05c1a", letterSpacing: 2.5, marginBottom: 12, fontFamily: "'Bebas Neue', sans-serif" }}>SIMPLE PROCESS</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 44px)", color: "#f1f5f9", fontWeight: 900 }}>How It Works</h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            <StepCard num="01" title="Choose Your Template" desc="Browse 10+ professionally designed templates or start from a blank canvas. Pick the one that fits your needs." delay={0} />
            <StepCard num="02" title="Customize & Design" desc="Drag fields, upload your logo, set fonts, colors, and styles. Everything updates in real-time on your live card preview." delay={0.15} />
            <StepCard num="03" title="Order & Receive" desc="Choose quantity, finish, and shipping. We handle printing and delivery with tracked shipping to your door." delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "100px 40px", background: "#0a0c14" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e05c1a", letterSpacing: 2.5, marginBottom: 12, fontFamily: "'Bebas Neue', sans-serif" }}>CUSTOMER LOVE</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 44px)", color: "#f1f5f9", fontWeight: 900 }}>Loved by 50,000+ Users</h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            <Testimonial accent="#e05c1a" delay={0} name="Rohan Mehta" role="HR Manager, TechCorp" quote="Ordered 200 employee cards and the quality was outstanding. The designer was so intuitive our team didn't need any training." />
            <Testimonial accent="#0ea5e9" delay={0.1} name="Priya Sharma" role="Principal, Greenwood Academy" quote="We use CardCraft every year for our student IDs. The school template saved us hours, and the bulk pricing is unbeatable." />
            <Testimonial accent="#8b5cf6" delay={0.2} name="David Kim" role="Event Director, SummitCo" quote="For our annual tech conference, we needed 500 badges in 3 days. CardCraft delivered with 2 days to spare. Incredible service." />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "120px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0f1420 0%, #1a0a04 50%, #0f1420 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(224,92,26,0.12) 0%, transparent 70%)" }} />
        {/* Animated border */}
        <div style={{ position: "absolute", inset: 60, border: "1px solid rgba(224,92,26,0.15)", borderRadius: 24, pointerEvents: "none" }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          style={{ position: "relative", textAlign: "center", maxWidth: 620, margin: "0 auto" }}
        >
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, color: "#e05c1a", letterSpacing: 3, marginBottom: 16 }}>START TODAY — IT'S FREE</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 5vw, 56px)", color: "#f1f5f9", fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
            Ready to Create<br />
            <span style={{ background: "linear-gradient(135deg, #e05c1a, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Your Perfect Card?</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            Join 50,000+ professionals. No credit card required to start designing.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => dispatch(authActions.openAuthModal("signup"))}
              style={{ padding: "16px 40px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #e05c1a, #f97316)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 8px 32px rgba(224,92,26,0.45)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
              Create Free Account →
            </button>
            <button onClick={requireAuth(() => navigate("/designer/default"))}
              style={{ padding: "16px 40px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "#e2e8f0", fontWeight: 600, fontSize: 16, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              Start Designing
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#040508", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "48px 40px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #e05c1a, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🪪</div>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "#f1f5f9", letterSpacing: 2 }}>CARDCRAFT</span>
              </div>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, maxWidth: 260 }}>Professional ID card designer trusted by 50,000+ businesses, schools, and events worldwide.</p>
            </div>
            {[
              { title: "Product", links: ["Templates", "Designer", "Pricing", "Examples"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
              { title: "Support", links: ["Help Center", "Contact", "Privacy", "Terms"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#e05c1a", letterSpacing: 2, marginBottom: 16, fontFamily: "'Bebas Neue', sans-serif" }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(link => (
                    <button key={link} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'DM Sans', sans-serif", padding: 0, transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>
                      {link}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "#1e2330" }}>© 2025 CardCraft. All rights reserved.</div>
            <div style={{ display: "flex", gap: 16 }}>
              {["Twitter", "LinkedIn", "Instagram"].map(s => (
                <button key={s} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#475569", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;