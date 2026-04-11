import { useState, useRef, useEffect } from "react";
import { FONTS } from "../../../shared/utils";

function FontOption({ font, selected, onSelect }: { font: { name: string; family: string }; selected: boolean; onSelect: (f: string) => void }) {
  return (
    <div onClick={() => onSelect(font.family)}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 14px", cursor: "pointer", background: selected ? "#e05c1a18" : "transparent", borderLeft: `3px solid ${selected ? "#e05c1a" : "transparent"}` }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#ffffff08"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}>
      <span style={{ fontFamily: font.family, fontSize: 15, color: selected ? "#e05c1a" : "#e2e8f0", flex: 1 }}>{font.name}</span>
      {selected && <span style={{ fontSize: 11, color: "#e05c1a" }}>{"\u2713"}</span>}
    </div>
  );
}

export function FontPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentFont = FONTS.find(f => f.family === value) ?? FONTS[0];
  const categories = Array.from(new Set(FONTS.map(f => f.category)));
  const filtered = search.trim() ? FONTS.filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : null;

  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 50); }, [open]);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#13161d", border: `1px solid ${open ? "#e05c1a" : "#2a2f3e"}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer" }}>
        <span style={{ fontFamily: value, fontSize: 14, color: "#e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentFont.name}</span>
        <span style={{ color: "#64748b", fontSize: 10, marginLeft: 8, flexShrink: 0, display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>{"\u25BC"}</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#1a1e28", border: "1px solid #3a3f52", borderRadius: 9, zIndex: 300, boxShadow: "0 12px 40px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #2a2f3e" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#13161d", border: "1px solid #2a2f3e", borderRadius: 6, padding: "6px 10px" }}>
              <span style={{ fontSize: 11, color: "#475569" }}>{"\u{1F50D}"}</span>
              <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fonts..."
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontSize: 12 }} />
              {search && <span onClick={() => setSearch("")} style={{ color: "#475569", cursor: "pointer", fontSize: 12 }}>{"\u2715"}</span>}
            </div>
          </div>
          <div style={{ overflowY: "auto", maxHeight: 280 }}>
            {filtered ? (
              filtered.length === 0
                ? <div style={{ padding: "14px 12px", fontSize: 12, color: "#475569", textAlign: "center" }}>No fonts found</div>
                : filtered.map(f => <FontOption key={f.family} font={f} selected={value === f.family} onSelect={fam => { onChange(fam); setOpen(false); setSearch(""); }} />)
            ) : (
              categories.map(cat => (
                <div key={cat}>
                  <div style={{ padding: "6px 12px 3px", fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: 1.5, background: "#13161d33", borderBottom: "1px solid #2a2f3e22" }}>{cat.toUpperCase()}</div>
                  {FONTS.filter(f => f.category === cat).map(f => (
                    <FontOption key={f.family} font={f} selected={value === f.family} onSelect={fam => { onChange(fam); setOpen(false); setSearch(""); }} />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
