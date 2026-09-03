import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Article {
  id: number;
  category: string;
  title: string;
  subtitle: string;
  body: string[];
  quote: string;
  readTime: string;
  images: string[];
  imageCaption: string;
  author: string;
  date: string;
}

const subjectGradients: Record<string, string> = {
  tamil: "linear-gradient(135deg, #2b1055 0%, #591a75 50%, #b83b5e 100%)",
  english: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
  maths: "linear-gradient(135deg, #11998e 0%, #1d976c 50%, #38ef7d 100%)",
  science: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  social: "linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)",
  activity: "linear-gradient(135deg, #fc4a1a 0%, #f7b731 100%)",
  default: "linear-gradient(135deg, #1e0a3c 0%, #4a0060 25%, #7c3aed 50%, #0891b2 75%, #ec4899 100%)",
};

const sans = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const serif = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

const Icon = ({ d, size = 18, strokeWidth = 1.7 }: { d: string; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  zoomIn:     "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zm-6-3v6m-3-3h6",
  zoomOut:    "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zm-3-3H8",
  search:     "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0",
  sun:        "M12 3v1m0 16v1M4.22 4.22l.7.7m12.16 12.16.7.7M3 12h1m16 0h1M4.92 19.07l.7-.7M18.36 5.64l.7-.7M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z",
  moon:       "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  chevLeft:   "M15 18l-6-6 6-6",
  chevRight:  "M9 18l6-6-6-6",
  toc:        "M3 6h18M3 12h12M3 18h8",
  close:      "M18 6 6 18M6 6l12 12",
  fullscreen: "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3",
  bookmark:   "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
  share:      "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  type:       "M4 7V4h16v3M9 20h6M12 4v16",
};

const glass = {
  background: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow: "0 4px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3)",
} as const;

const glassBtn = (active = false) => ({
  background: active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)",
  border: `1px solid ${active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)"}`,
  borderRadius: 10,
  color: "rgba(255,255,255,0.92)",
  cursor: "pointer",
  width: 38,
  height: 38,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.18s ease",
  flexShrink: 0,
} as const);

function ArticlePage({ article, zoom }: { article: Article; zoom: number }) {
  const scale = 1 + (zoom - 100) / 100;
  return (
    <div style={{
      transform: `scale(${scale})`,
      transformOrigin: "top center",
      transition: "transform 0.25s ease",
      padding: "36px 36px 48px",
      maxWidth: "100%",
      margin: "0 auto",
    }}>
      {/* category + meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <span style={{
          background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          padding: "4px 12px",
          borderRadius: 999,
          fontFamily: sans,
        }}>{article.category}</span>
        <span style={{ width: 1, height: 14, background: "#e5e7eb" }} />
        <span style={{ fontFamily: sans, fontSize: 12, color: "#9ca3af" }}>{article.readTime} read</span>
        <span style={{ width: 1, height: 14, background: "#e5e7eb" }} />
        <span style={{ fontFamily: sans, fontSize: 12, color: "#9ca3af" }}>{article.date}</span>
      </div>

      {/* title */}
      <h1 style={{
        fontFamily: serif,
        fontSize: 42,
        fontWeight: 900,
        lineHeight: 1.12,
        color: "#111827",
        margin: "0 0 12px",
        letterSpacing: "-0.02em",
      }}>{article.title}</h1>

      <p style={{
        fontFamily: serif,
        fontSize: 18,
        fontStyle: "italic",
        color: "#6b7280",
        margin: "0 0 8px",
        lineHeight: 1.4,
      }}>{article.subtitle}</p>

      <p style={{
        fontFamily: sans, fontSize: 13, color: "#9ca3af",
        margin: "0 0 32px", fontWeight: 500,
      }}>By {article.author}</p>

      {/* Enhanced divider */}
      <div style={{
        height: 3,
        background: "linear-gradient(to right, transparent, #8b5cf6 20%, #ec4899 50%, #10b981 80%, transparent)",
        borderRadius: 2,
        marginBottom: 48,
        boxShadow: "0 2px 8px rgba(139,92,246,0.2)"
      }} />

      {/* hero images with captions */}
      <div style={{
        display: "grid",
        gridTemplateColumns: article.images.length > 1 ? "repeat(auto-fit, minmax(220px, 1fr))" : "1fr",
        justifyItems: "center",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        margin: "0 auto 10px auto",
        maxWidth: "100%",
      }}>
        {article.images?.map((url, i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <img
              src={url}
              alt={`${article.title} ${i + 1}`}
              style={{
                width: "100%",
                maxWidth: article.images.length === 1 ? "500px" : "100%",
                height: article.images.length > 1 ? 220 : 340,
                objectFit: "cover",
                borderRadius: 12,
                display: "block",
                margin: "0 auto",
                boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
                transition: "transform 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            />
            <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 8, fontStyle: "italic", textAlign: "center" }}>
              Photo {i + 1}
            </p>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: sans, fontSize: 11, color: "#9ca3af", marginBottom: 32, fontStyle: "italic", textAlign: "center" }}>
        {article.imageCaption}
      </p>

      {/* body */}
      {article.body.map((para, i) => (
        <p key={i} style={{
          fontFamily: serif,
          fontSize: 18,
          lineHeight: 1.8,
          color: "#1f2937",
          margin: "0 0 24px",
        }}>{para}</p>
      ))}

      {/* quote */}
      <blockquote style={{
        margin: "36px 0",
        padding: "20px 28px",
        borderLeft: "4px solid",
        borderImage: "linear-gradient(to bottom, #8b5cf6, #ec4899) 1",
        background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(236,72,153,0.04))",
        borderRadius: "0 12px 12px 0",
      }}>
        <p style={{
          fontFamily: serif,
          fontSize: 20,
          fontStyle: "italic",
          lineHeight: 1.55,
          color: "#374151",
          margin: 0,
        }}>{article.quote}</p>
      </blockquote>

      <button style={{
        marginTop: 8,
        padding: "13px 32px",
        borderRadius: 10,
        background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
        border: "none",
        color: "#fff",
        fontFamily: sans,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        letterSpacing: "0.04em",
        boxShadow: "0 4px 20px rgba(139,92,246,0.4)",
      }}>More to Explore →</button>
    </div>
  );
}

function SearchOverlay({ articles, onClose, onSelect }: { articles: Article[]; onClose: () => void; onSelect: (index: number) => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = q.length > 1
    ? articles
        .map((a, idx) => ({ ...a, originalIndex: idx }))
        .filter(a =>
          a.title.toLowerCase().includes(q.toLowerCase()) ||
          a.category.toLowerCase().includes(q.toLowerCase()) ||
          a.body.some(p => p.toLowerCase().includes(q.toLowerCase()))
        )
    : [];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 60 }} />
      <div style={{
        position: "fixed", top: "12%", left: "50%", transform: "translateX(-50%)",
        width: "min(600px, 90vw)", zIndex: 70,
        ...glass, borderRadius: 18, overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          <Icon d={Icons.search} size={18} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search articles…"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontFamily: sans, fontSize: 16, color: "#fff",
            }}
          />
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", padding: 4 }}>
            <Icon d={Icons.close} size={16} />
          </button>
        </div>
        {results.length > 0 && (
          <div style={{ padding: "8px 0", maxHeight: 320, overflowY: "auto" }}>
            {results.map(a => (
              <div 
                key={a.id} 
                onClick={() => { onSelect(a.originalIndex); onClose(); }}
                style={{
                  padding: "12px 20px", cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontFamily: sans, fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{a.category}</div>
                <div style={{ fontFamily: serif, fontSize: 15, color: "#fff", fontWeight: 700 }}>{a.title}</div>
              </div>
            ))}
          </div>
        )}
        {q.length > 1 && results.length === 0 && (
          <div style={{ padding: "24px 20px", fontFamily: sans, fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
            No results for "{q}"
          </div>
        )}
      </div>
    </>
  );
}

function TOCDrawer({ articles, current, onGoTo, onClose }: { articles: Article[]; current: number; onGoTo: (i: number) => void; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }} />
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 340,
        zIndex: 70, overflowY: "auto",
        ...glass,
        borderRadius: "0 20px 20px 0",
        border: "none",
        borderRight: "1px solid rgba(255,255,255,0.2)",
      }}>
        <div style={{ padding: "24px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 900, color: "#fff" }}>Contents</div>
            <div style={{ fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>Jeevana Journal · Vol. 3</div>
          </div>
          <button onClick={onClose} style={{ ...glassBtn(), borderRadius: 8 }}>
            <Icon d={Icons.close} size={16} />
          </button>
        </div>
        <div style={{ padding: "8px 16px 24px" }}>
          {articles.map((art, i) => (
            <button
              key={art.id}
              onClick={() => { onGoTo(i); onClose(); }}
              style={{
                display: "flex", gap: 14, alignItems: "flex-start", width: "100%",
                padding: "14px 12px", border: "none", cursor: "pointer",
                borderRadius: 12, marginBottom: 4, textAlign: "left",
                outline: i === current ? "2px solid rgba(139,92,246,0.8)" : "none",
                background: i === current ? "rgba(139,92,246,0.15)" : "transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (i !== current) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={e => { if (i !== current) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ width: 60, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                <img src={art.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: sans, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 4,
                }}>{art.category}</div>
                <div style={{
                  fontFamily: serif, fontSize: 13, fontWeight: 700,
                  color: "#fff", lineHeight: 1.3,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>{art.title}</div>
                <div style={{ fontFamily: sans, fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{art.readTime} · p.{i + 1}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [articles, setArticles]   = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage]           = useState(0);
  const [zoom, setZoom]           = useState(100);
  const [searchOpen, setSearch]   = useState(false);
  const [tocOpen, setToc]         = useState(false);
  const [flipping, setFlipping]   = useState(false);
  const [bookmarked, setBookmark] = useState<Set<number>>(new Set());

  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null); // Fixed: Declared missing ref

  // Scroll effect on page change
  useEffect(() => {
    if (pageRef.current) {
      pageRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (headerRef.current) {
      headerRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  useEffect(() => {
    async function loadArticles() {
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const formatted: Article[] = data.map((item, idx) => ({
            id: idx,
            category: item.section_name || item.section_type || 'Activity',
            title: item.heading || 'Untitled',
            subtitle: item.description ? item.description.split('\n')[0] : '',
            body: item.description ? item.description.split('\n\n').filter(Boolean) : ['No content'],
            quote: 'More to Explore →',
            readTime: '5 min',
            images: item.photo_urls?.length ? item.photo_urls : ['https://via.placeholder.com/900x420?text=No+Image'],
            imageCaption: 'From Jeevana Journal',
            author: 'Jeevana School',
            date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          }));
          setArticles(formatted);
        }
      } catch (err) {
        console.error('Supabase error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadArticles();
  }, []);

  const TOTAL_PAGES = articles.length;

  const playSound = (frequency: number = 800, duration: number = 0.05) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;
      
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Audio API unavailable
    }
  };

  const playPageFlip = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;
      
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      // Audio API unavailable
    }
  };

  const goTo = useCallback((idx: number) => {
    if (TOTAL_PAGES === 0) return;
    const clamped = Math.max(0, Math.min(TOTAL_PAGES - 1, idx));
    if (clamped === page) return;
    playPageFlip();
    setFlipping(true);
    setTimeout(() => { setPage(clamped); setFlipping(false); }, 380);
  }, [page, TOTAL_PAGES]);

  const prev = () => goTo(page - 1);
  const next = () => goTo(page + 1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (searchOpen || tocOpen) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "f" || e.key === "F") setSearch(true);
      if (e.key === "Escape") { setSearch(false); setToc(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [page, searchOpen, tocOpen, TOTAL_PAGES]);

  if (isLoading || articles.length === 0) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1e0a3c", color: "#fff", fontFamily: sans }}>
        {isLoading ? "Loading Journal..." : "No journal entries found."}
      </div>
    );
  }

  const art = articles[page];
  const activeBg = subjectGradients[art?.category?.toLowerCase()] || subjectGradients.default;
  const progress = ((page + 1) / TOTAL_PAGES) * 100;

  const pageBg = {
    background: "#ffffff",
    color: "#1f2937",
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      position: "relative",
      overflow: "hidden",
      fontFamily: sans,
    }}>

      <div style={{
        position: "absolute", 
        inset: 0,
        background: activeBg,
        transition: "background 0.8s ease",
      }} />

      <div style={{
        position: "absolute",
        left: 20,
        top: "50%",
        transform: "translateY(-50%) rotate(-90deg)",
        transformOrigin: "center",
        fontFamily: sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.35)",
        textTransform: "uppercase",
        pointerEvents: "none",
        zIndex: 10,
      }}>
        Jeevana School · 2026 Edition
      </div>

      <div style={{
        position: "absolute", top: "8%", left: "8%",
        width: 480, height: 480,
        background: "radial-gradient(circle, rgba(139,92,246,0.55) 0%, transparent 65%)",
        borderRadius: "50%", filter: "blur(2px)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "40%", right: "6%",
        width: 380, height: 380,
        background: "radial-gradient(circle, rgba(16,185,129,0.5) 0%, transparent 65%)",
        borderRadius: "50%", filter: "blur(2px)",
        pointerEvents: "none",
      }} />

      <div 
        ref={headerRef}
        className="bar-top" 
        style={{
          position: "absolute", top: 16, left: 16, right: 16,
          height: 56, borderRadius: 16, zIndex: 30,
          display: "flex", alignItems: "center", gap: 10,
          padding: "0 18px",
          ...glass,
        }}
      >
        <button onClick={() => { playSound(900, 0.04); setToc(true); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: serif, fontSize: 14, fontWeight: 900, color: "#fff" }}>J</span>
          </div>
          <span style={{ fontFamily: serif, fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
            Jeevana Journal
          </span>
        </button>

        <span style={{
          fontFamily: sans, fontSize: 9, fontWeight: 700,
          color: "rgba(255,255,255,0.6)", letterSpacing: "0.14em",
          textTransform: "uppercase",
          border: "1px solid rgba(255,255,255,0.25)",
          padding: "3px 8px", borderRadius: 5, marginLeft: 2,
        }}>Digital Edition</span>

        <div style={{ flex: 1 }} />

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 10,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          maxWidth: 360,
        }}>
          <span style={{ fontFamily: sans, fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>
            {art.category}
          </span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
          <span style={{
            fontFamily: serif, fontSize: 13, color: "rgba(255,255,255,0.85)",
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
          }}>{art.title}</span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setToc(true)}
            style={{ ...glassBtn(), transition: "all 0.2s ease" }}
            title="Table of Contents"
            onMouseEnter={e => { 
              e.currentTarget.style.transform = "scale(1.12)"; 
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.transform = "scale(1)"; 
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
          ><Icon d={Icons.toc} /></button>

          <button
            onClick={() => { playSound(850, 0.04); setSearch(true); }}
            style={{ ...glassBtn(), transition: "all 0.2s ease" }}
            title="Search (F)"
            onMouseEnter={e => { 
              e.currentTarget.style.transform = "scale(1.12)"; 
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.transform = "scale(1)"; 
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
          ><Icon d={Icons.search} /></button>

          <button
            onClick={() => { playSound(1200, 0.03); setZoom(z => Math.min(150, z + 10)); }}
            style={{ ...glassBtn(), transition: "all 0.2s ease" }}
            title="Zoom In"
            onMouseEnter={e => { 
              e.currentTarget.style.transform = "scale(1.12)"; 
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.transform = "scale(1)"; 
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
          ><Icon d={Icons.zoomIn} /></button>

          <span style={{ fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.6)", minWidth: 36, textAlign: "center" }}>{zoom}%</span>

          <button
            onClick={() => { playSound(600, 0.03); setZoom(z => Math.max(70, z - 10)); }}
            style={{ ...glassBtn(), transition: "all 0.2s ease" }}
            title="Zoom Out"
            onMouseEnter={e => { 
              e.currentTarget.style.transform = "scale(1.12)"; 
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.transform = "scale(1)"; 
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
          ><Icon d={Icons.zoomOut} /></button>

          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />

          <button
            onClick={() => { playSound(bookmarked.has(page) ? 500 : 1100, 0.05); setBookmark(b => { const n = new Set(b); n.has(page) ? n.delete(page) : n.add(page); return n; }); }}
            style={{ ...glassBtn(bookmarked.has(page)), transition: "all 0.2s ease" }}
            title="Bookmark"
            onMouseEnter={e => { 
              e.currentTarget.style.transform = "scale(1.12)"; 
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.transform = "scale(1)"; 
              e.currentTarget.style.background = bookmarked.has(page) ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)";
            }}
          ><Icon d={Icons.bookmark} /></button>
        </div>
      </div>

      <div style={{
        position: "absolute", top: 92, bottom: 88, left: "50%",
        transform: "translateX(-50%) scale(0.985)",
        width: "min(780px, calc(100vw - 32px))",
        background: "#f3f4f6",
        borderRadius: 20, opacity: 0.6, zIndex: 1,
      }} />
      <div style={{
        position: "absolute", top: 96, bottom: 92, left: "50%",
        transform: "translateX(-50%) scale(0.97)",
        width: "min(780px, calc(100vw - 32px))",
        background: "#e5e7eb",
        borderRadius: 20, opacity: 0.3, zIndex: 0,
      }} />

      <div style={{
        position: "absolute",
        top: 88,
        bottom: 84,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(780px, calc(100vw - 32px))",
        borderRadius: 20,
        boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.15)",
        overflow: "hidden",
        transition: "background 0.3s",
        zIndex: 2,
        ...pageBg,
      }}>
        <button
          onClick={prev}
          disabled={page === 0}
          style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 72,
            background: "none", border: "none", cursor: page === 0 ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "flex-start",
            paddingLeft: 16, zIndex: 10,
            opacity: page === 0 ? 0 : 1,
            transition: "opacity 0.2s",
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#6b7280", transition: "all 0.18s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.12)"; (e.currentTarget as HTMLElement).style.color = "#8b5cf6"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.06)"; (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}
          >
            <Icon d={Icons.chevLeft} size={20} />
          </div>
        </button>

        <button
          onClick={next}
          disabled={page === TOTAL_PAGES - 1}
          style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 72,
            background: "none", border: "none", cursor: page === TOTAL_PAGES - 1 ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            paddingRight: 16, zIndex: 10,
            opacity: page === TOTAL_PAGES - 1 ? 0 : 1,
            transition: "opacity 0.2s",
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#6b7280", transition: "all 0.18s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.12)"; (e.currentTarget as HTMLElement).style.color = "#8b5cf6"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.06)"; (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}
          >
            <Icon d={Icons.chevRight} size={20} />
          </div>
        </button>

        <div
          ref={pageRef}
          style={{ 
            height: "100%", 
            overflowY: "auto", 
            overflowX: "hidden",
            opacity: flipping ? 0.7 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          <ArticlePage article={art} zoom={zoom} />
        </div>

        {/* Page corner fold */}
        <div style={{
          position: "absolute",
          bottom: 0, right: 0,
          width: 0, height: 0,
          borderStyle: "solid",
          borderWidth: "0 0 40px 40px",
          borderColor: "transparent transparent rgba(0,0,0,0.05) transparent",
          pointerEvents: "none",
        }} />

        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 24,
          background: "linear-gradient(to bottom, #fff, transparent)",
          pointerEvents: "none",
        }} />
      </div>

      <div className="bar-bottom" style={{
        position: "absolute", bottom: 16, left: 16, right: 16,
        height: 52, borderRadius: 16, zIndex: 30,
        display: "flex", alignItems: "center", gap: 12,
        padding: "0 20px",
        ...glass,
      }}>

        <button
          onClick={prev}
          disabled={page === 0}
          style={{
            ...glassBtn(),
            opacity: page === 0 ? 0.3 : 1,
            cursor: page === 0 ? "default" : "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => { 
            if (page > 0) {
              e.currentTarget.style.transform = "scale(1.12)"; 
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
            }
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.transform = "scale(1)"; 
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          }}
        ><Icon d={Icons.chevLeft} /></button>

        <span style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
          {page + 1} / {TOTAL_PAGES}
        </span>

        <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(to right, #8b5cf6, #ec4899, #10b981)",
            borderRadius: 2,
            transition: "width 0.4s cubic-bezier(0.25,1,0.5,1)",
          }} />
        </div>

        <button
          onClick={next}
          disabled={page === TOTAL_PAGES - 1}
          style={{
            ...glassBtn(),
            opacity: page === TOTAL_PAGES - 1 ? 0.3 : 1,
            cursor: page === TOTAL_PAGES - 1 ? "default" : "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => { 
            if (page < TOTAL_PAGES - 1) {
              e.currentTarget.style.transform = "scale(1.12)"; 
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
            }
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.transform = "scale(1)"; 
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          }}
        ><Icon d={Icons.chevRight} /></button>

        <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.15)" }} />

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {articles.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === page ? 22 : 7,
                height: 7,
                borderRadius: 4,
                background: i === page
                  ? "linear-gradient(to right, #8b5cf6, #ec4899)"
                  : "rgba(255,255,255,0.25)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.15)" }} />

        <div style={{ display: "flex", gap: 6 }}>
          {["←", "→"].map(k => (
            <span key={k} style={{
              fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 5,
              padding: "2px 7px",
            }}>{k}</span>
          ))}
        </div>

        <span style={{ fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>arrow keys</span>
      </div>

      {searchOpen && <SearchOverlay articles={articles} onSelect={goTo} onClose={() => setSearch(false)} />}
      {tocOpen    && <TOCDrawer articles={articles} current={page} onGoTo={goTo} onClose={() => setToc(false)} />}
    </div>
  );
}