import { useEffect, useState } from "react";
import "../styles/graff.css";

type GlyphPos = { x: number; y: number };

const MONTH_MAP: Record<number, GlyphPos> = {
  0: { x: 0, y: 0 },
  1: { x: 1, y: 0 },
  2: { x: 2, y: 0 },
  3: { x: 3, y: 0 },
  4: { x: 0, y: 1 },
  5: { x: 1, y: 1 },
  6: { x: 2, y: 1 },
  7: { x: 3, y: 1 },
  8: { x: 0, y: 2 },
  9: { x: 1, y: 2 },
  10: { x: 2, y: 2 },
  11: { x: 3, y: 2 },
};

const GLYPH_MAP: Record<string, GlyphPos> = {
  "0": { x: 0, y: 0 },
  "1": { x: 1, y: 0 },
  "2": { x: 2, y: 0 },
  "3": { x: 3, y: 0 },
  "4": { x: 0, y: 1 },
  "5": { x: 1, y: 1 },
  "6": { x: 2, y: 1 },
  "7": { x: 3, y: 1 },
  "8": { x: 0, y: 2 },
  "9": { x: 1, y: 2 },
  ":": { x: 2, y: 2 },
  "-": { x: 3, y: 2 },
};

function fmtDateTime(d: Date) {
  const day = String(d.getDate()).padStart(2, "0");
  const year = String(d.getFullYear());
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return { day, year, time: `${hours}${minutes}`, monthIndex: d.getMonth() };
}

export default function SpriteClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { day, year, time, monthIndex } = fmtDateTime(now);

  return (
    <div className="sprite-clock">
      <span
        className="months-glyph"
        style={{
          ["--mx" as any]: String(MONTH_MAP[monthIndex].x),
          ["--my" as any]: String(MONTH_MAP[monthIndex].y),
          
        }}
      />
      <span className="sprite-gap gap-md" />
      {day.split("").map((ch, idx) => {
        const pos = GLYPH_MAP[ch];
        if (!pos) return null;
        return (
          <span
            key={`d-${ch}-${idx}`}
            className="sprite-glyph"
            style={{
              ["--gx" as any]: String(pos.x),
              ["--gy" as any]: String(pos.y),
              ["--gmr" as any]: ch === "1" ? "-0.30" : "-0.18",
            }}
          />
        );
      })}
      <span className="sprite-gap gap-yr" />
      {year.split("").map((ch, idx) => {
        const pos = GLYPH_MAP[ch];
        if (!pos) return null;
        return (
          <span
            key={`y-${ch}-${idx}`}
            className="sprite-glyph"
            style={{
              ["--gx" as any]: String(pos.x),
              ["--gy" as any]: String(pos.y),
              ["--gmr" as any]: ch === "1" ? "-0.30" : "-0.18",
            }}
          />
        );
      })}
      <span className="sprite-gap gap-yt" />
      {time.split("").map((ch, idx) => {
        const pos = GLYPH_MAP[ch];
        if (!pos) return null;
        return (
          <span
            key={`t-${ch}-${idx}`}
            className="sprite-glyph"
            style={{
              ["--gx" as any]: String(pos.x),
              ["--gy" as any]: String(pos.y),
              ["--gmr" as any]: ch === "1" ? "-0.30" : "-0.18",
            }}
          />
        );
      })}
      <span className="sprite-gap gap-tail" />
    </div>
  );
}
