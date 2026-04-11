import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

// ── Constants ──────────────────────────────────────────────────────────────────

const HEADLINE = {
  line1: "Design Professional",
  line2: "ID Cards in",
  line3: "Minutes",
} as const;

const SUBTEXT =
  "Create stunning, professional-grade ID cards with our intuitive drag-and-drop designer. Print-ready in seconds — no design skills needed.";

const CTA_PRIMARY   = "⚡ Start Designing";
const CTA_SECONDARY = "View Templates →";

const TRUST_COUNT  = "10,000+";
const TRUST_SUFFIX = "professionals trust CardCraft";

const TRUST_AVATARS = [
  { letter: "S", from: "#e05c1a", to: "#f97316" },
  { letter: "A", from: "#0ea5e9", to: "#38bdf8" },
  { letter: "R", from: "#8b5cf6", to: "#a78bfa" },
  { letter: "M", from: "#10b981", to: "#34d399" },
  { letter: "P", from: "#f97316", to: "#fbbf24" },
] as const;

const ORBIT_BADGES = [
  {
    label: "PVC Card",
    emoji: "💳",
    textClass: "text-[#e05c1a]",
    bgClass: "bg-[#e05c1a]/10",
    borderClass: "border-[#e05c1a]/30",
    position: { top: "-20px", right: "-30px" },
    floatDelay: 0.55,
  },
  {
    label: "RFID Chip",
    emoji: "📡",
    textClass: "text-[#0ea5e9]",
    bgClass: "bg-[#0ea5e9]/10",
    borderClass: "border-[#0ea5e9]/30",
    position: { bottom: "28%", left: "-34px" },
    floatDelay: 0.85,
  },
  {
    label: "Bulk Print",
    emoji: "🖨️",
    textClass: "text-[#8b5cf6]",
    bgClass: "bg-[#8b5cf6]/10",
    borderClass: "border-[#8b5cf6]/30",
    position: { bottom: "-20px", right: "18%" },
    floatDelay: 1.1,
  },
] as const;

// ── Animation Variants ─────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.13, delayChildren: 0.05 },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 42 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.78, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.65 },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.82 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ── Props ──────────────────────────────────────────────────────────────────────
interface HeroSectionProps {
  onStartDesigning: () => void;
  onViewTemplates:  () => void;
}

// ── AnimatedBackground ─────────────────────────────────────────────────────────
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Orange blob — upper-right */}
      <motion.div
        className="absolute w-[640px] h-[640px] rounded-full blur-[130px] bg-[#e05c1a]/[0.09]"
        animate={{ x: [0, 55, -25, 0], y: [0, -45, 18, 0], scale: [1, 1.12, 0.92, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "-12%", right: "-6%" }}
      />
      {/* Blue blob — lower-left */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[110px] bg-[#0ea5e9]/[0.07]"
        animate={{ x: [0, -45, 25, 0], y: [0, 38, -18, 0], scale: [1, 0.9, 1.08, 1] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        style={{ bottom: "2%", left: "-8%" }}
      />
      {/* Purple blob — center */}
      <motion.div
        className="absolute w-[420px] h-[420px] rounded-full blur-[90px] bg-[#8b5cf6]/[0.06]"
        animate={{ x: [0, 35, -18, 0], y: [0, -28, 36, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "28%", left: "42%" }}
      />
    </div>
  );
}

// ── GridOverlay ────────────────────────────────────────────────────────────────
function GridOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }}
    />
  );
}



// ── HeroHeading ────────────────────────────────────────────────────────────────
function HeroHeading() {
  const headingStyle: React.CSSProperties = {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "clamp(52px, 6.5vw, 90px)",
    lineHeight: 0.97,
    letterSpacing: "0.03em",
  };

  return (
    <div className="flex flex-col gap-0.5">
      <motion.div variants={fadeUpVariants}>
        <span className="block text-[#f1f5f9]" style={headingStyle}>
          {HEADLINE.line1}
        </span>
      </motion.div>

      <motion.div variants={fadeUpVariants}>
        <span
          className="block"
          style={{
            ...headingStyle,
            background: "linear-gradient(135deg, #e05c1a 0%, #f97316 45%, #fbbf24 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {HEADLINE.line2}
        </span>
      </motion.div>

      <motion.div variants={fadeUpVariants}>
        <span className="block text-[#f1f5f9]" style={headingStyle}>
          {HEADLINE.line3}
        </span>
      </motion.div>
    </div>
  );
}

// ── HeroDescription ────────────────────────────────────────────────────────────
function HeroDescription() {
  return (
    <motion.p
      variants={fadeUpVariants}
      className="text-[#64748b] text-base md:text-lg leading-relaxed max-w-[490px]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {SUBTEXT}
    </motion.p>
  );
}

// ── CTAButtons ─────────────────────────────────────────────────────────────────
function CTAButtons({
  onStartDesigning,
  onViewTemplates,
}: {
  onStartDesigning: () => void;
  onViewTemplates:  () => void;
}) {
  return (
    <motion.div variants={fadeUpVariants} className="flex flex-wrap gap-4">
      {/* Primary */}
      <motion.button
        onClick={onStartDesigning}
        whileHover={{
          scale: 1.055,
          boxShadow: "0 18px 50px rgba(224,92,26,0.58)",
        }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 18 }}
        className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base cursor-pointer border-0"
        style={{
          background: "linear-gradient(135deg, #e05c1a 0%, #f97316 100%)",
          boxShadow: "0 8px 28px rgba(224,92,26,0.42)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {CTA_PRIMARY}
      </motion.button>

      {/* Secondary */}
      <motion.button
        onClick={onViewTemplates}
        whileHover={{
          scale: 1.03,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderColor: "rgba(255,255,255,0.28)",
        }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 18 }}
        className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#e2e8f0] text-base cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.14)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {CTA_SECONDARY}
      </motion.button>
    </motion.div>
  );
}

// ── TrustBar ───────────────────────────────────────────────────────────────────
function TrustBar() {
  return (
    <motion.div
      variants={fadeInVariants}
      className="flex items-center gap-4 pt-1"
    >
      {/* Stacked avatars */}
      <div className="flex -space-x-2.5">
        {TRUST_AVATARS.map((av, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full border-2 border-[#080a12] flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${av.from}, ${av.to})`,
              zIndex: TRUST_AVATARS.length - i,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {av.letter}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-0.5">
        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-[#f59e0b] text-xs leading-none">★</span>
          ))}
          <span
            className="text-[#64748b] text-xs ml-1.5"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            4.9 / 5
          </span>
        </div>
        {/* Caption */}
        <p
          className="text-[#475569] text-xs leading-none"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <span className="text-[#94a3b8] font-semibold">{TRUST_COUNT}</span>{" "}
          {TRUST_SUFFIX}
        </p>
      </div>
    </motion.div>
  );
}

// ── IDCardMockup ───────────────────────────────────────────────────────────────
function IDCardMockup() {
  const barHeights = [4, 7, 3, 6, 5, 8, 3, 5, 7, 4, 6, 3, 7, 5, 4] as const;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/10"
      style={{
        background:
          "linear-gradient(148deg, rgba(26,31,46,0.96) 0%, rgba(12,16,28,0.97) 100%)",
        boxShadow:
          "0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(224,92,26,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
        aspectRatio: "1.586 / 1",
        maxWidth: 340,
      }}
    >
      {/* Accent gradient bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: "linear-gradient(90deg, #e05c1a, #f97316, #fbbf24)" }}
      />

      {/* Corner glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle at top right, rgba(224,92,26,0.12), transparent 70%)",
        }}
      />

      <div className="p-5 pt-6 h-full flex flex-col justify-between">
        {/* Top: photo + info */}
        <div className="flex items-start gap-4">
          {/* Photo placeholder */}
          <div
            className="w-16 h-[72px] rounded-lg border border-[#e05c1a]/25 flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "rgba(224,92,26,0.08)" }}
          >
            👤
          </div>

          {/* Info fields */}
          <div className="flex flex-col gap-2 flex-1 pt-0.5">
            <span
              className="text-[#e05c1a]"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 9,
                letterSpacing: "0.22em",
              }}
            >
              EMPLOYEE ID
            </span>
            {/* Name */}
            <div className="h-2.5 rounded-full bg-white/20 w-28" />
            {/* Dept */}
            <div className="h-2 rounded-full bg-white/10 w-20" />
            {/* ID # */}
            <div className="h-2 rounded-full bg-white/[0.07] w-16 mt-0.5" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mx-0.5" />

        {/* Bottom: barcode + chips */}
        <div className="flex items-end justify-between">
          {/* Barcode lines */}
          <div className="flex items-end gap-[2px]">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="w-[2px] rounded-sm bg-white/25"
                style={{ height: h * 3 }}
              />
            ))}
          </div>

          {/* RFID + hologram */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-sm">📡</span>
              <span
                className="text-[#0ea5e9]/70"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 8,
                  letterSpacing: "0.18em",
                }}
              >
                RFID
              </span>
            </div>
            <div
              className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-xs text-white/50"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(224,92,26,0.2), rgba(14,165,233,0.2), rgba(139,92,246,0.2), rgba(224,92,26,0.2))",
              }}
            >
              ✦
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── OrbitBadge ────────────────────────────────────────────────────────────────
function OrbitBadge({
  label,
  emoji,
  textClass,
  bgClass,
  borderClass,
  floatDelay,
}: {
  label: string;
  emoji: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  floatDelay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.65 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: floatDelay, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{
          duration: 2.8 + floatDelay * 0.4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: floatDelay * 0.6,
        }}
        className={`flex items-center gap-1.5 ${bgClass} ${borderClass} border backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg`}
      >
        <span className="text-sm leading-none">{emoji}</span>
        <span
          className={`${textClass} text-xs font-semibold`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {label}
        </span>
      </motion.div>
    </motion.div>
  );
}

// ── CardPreview (parallax + float) ─────────────────────────────────────────────
function CardPreview() {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-220, 220], [9, -9]), {
    stiffness: 200,
    damping: 28,
  });
  const rotateY = useSpring(useTransform(mouseX, [-220, 220], [-13, 13]), {
    stiffness: 200,
    damping: 28,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - (rect.left + rect.width  / 2));
    mouseY.set(e.clientY - (rect.top  + rect.height / 2));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.95, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-center justify-center w-full lg:justify-end"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1200 }}
    >
      {/* Tilt + float wrapper */}
      <motion.div
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* Glow halo */}
        <div
          className="absolute pointer-events-none rounded-full blur-3xl"
          style={{
            inset: "-40px",
            background:
              "radial-gradient(ellipse at center, rgba(224,92,26,0.28) 0%, rgba(249,115,22,0.12) 50%, transparent 70%)",
          }}
        />

        {/* Second subtle halo */}
        <div
          className="absolute pointer-events-none rounded-full blur-2xl"
          style={{
            inset: "-20px",
            background:
              "radial-gradient(ellipse at 70% 30%, rgba(139,92,246,0.1) 0%, transparent 60%)",
          }}
        />

        {/* The card */}
        <IDCardMockup />

        {/* Orbit badges */}
        {ORBIT_BADGES.map((badge) => (
          <div
            key={badge.label}
            className="absolute"
            style={badge.position}
          >
            <OrbitBadge {...badge} />
          </div>
        ))}
      </motion.div>

      {/* Decorative rings */}
      <div className="absolute w-72 h-72 rounded-full border border-[#e05c1a]/[0.06] pointer-events-none" />
      <div className="absolute w-96 h-96 rounded-full border border-[#e05c1a]/[0.03] pointer-events-none" />
    </motion.div>
  );
}

// ── HeroSection (main export) ──────────────────────────────────────────────────
export default function HeroSection({
  onStartDesigning,
  onViewTemplates,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#080a12]">
      <AnimatedBackground />
      <GridOverlay />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-20 xl:px-24 pt-28 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* ── Left Column — Copy ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-7"
          >
          
            <HeroHeading />
            <HeroDescription />
            <CTAButtons
              onStartDesigning={onStartDesigning}
              onViewTemplates={onViewTemplates}
            />
           
          </motion.div>

          {/* ── Right Column — Preview ── */}
          <CardPreview />
        </div>
      </div>
    </section>
  );
}
