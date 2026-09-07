"use client";

import { useEffect, useRef } from "react";
import type { Development } from "@/lib/types";
import { TYPOLOGY_ROWS } from "@/lib/format";
import { Icon, ICON_TABLE } from "@/lib/icons";

function TypologyTable({ typologies }: { typologies: Development["typologies"] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!wrap || !track || !thumb) return;

    function update() {
      if (!wrap || !track || !thumb) return;
      const overflow = wrap.scrollWidth > wrap.clientWidth + 1;
      track.style.display = overflow ? "block" : "none";
      if (!overflow) return;
      const ratio = Math.min(1, wrap.clientWidth / wrap.scrollWidth);
      const maxScroll = wrap.scrollWidth - wrap.clientWidth;
      const scrollRatio = maxScroll > 0 ? wrap.scrollLeft / maxScroll : 0;
      thumb.style.width = ratio * 100 + "%";
      thumb.style.left = scrollRatio * (100 - ratio * 100) + "%";
    }

    let dragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    function onPointerDown(e: PointerEvent) {
      dragging = true;
      startX = e.clientX;
      startScrollLeft = wrap!.scrollLeft;
      try {
        thumb!.setPointerCapture(e.pointerId);
      } catch {}
      e.preventDefault();
    }
    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      const maxScroll = wrap!.scrollWidth - wrap!.clientWidth;
      if (maxScroll <= 0 || track!.clientWidth <= 0) return;
      const deltaX = e.clientX - startX;
      wrap!.scrollLeft = startScrollLeft + (deltaX / track!.clientWidth) * wrap!.scrollWidth;
    }
    function onPointerUp() {
      dragging = false;
    }
    function onTrackPointerDown(e: PointerEvent) {
      if (e.target === thumb) return;
      const rect = track!.getBoundingClientRect();
      const clickRatio = (e.clientX - rect.left) / rect.width;
      wrap!.scrollLeft = clickRatio * wrap!.scrollWidth - wrap!.clientWidth / 2;
    }

    wrap.addEventListener("scroll", update, { passive: true });
    thumb.addEventListener("pointerdown", onPointerDown);
    thumb.addEventListener("pointermove", onPointerMove);
    thumb.addEventListener("pointerup", onPointerUp);
    thumb.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("pointerdown", onTrackPointerDown);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(wrap);
    update();

    return () => {
      wrap.removeEventListener("scroll", update);
      thumb.removeEventListener("pointerdown", onPointerDown);
      thumb.removeEventListener("pointermove", onPointerMove);
      thumb.removeEventListener("pointerup", onPointerUp);
      thumb.removeEventListener("pointercancel", onPointerUp);
      track.removeEventListener("pointerdown", onTrackPointerDown);
      resizeObserver.disconnect();
    };
  }, [typologies]);

  return (
    <>
      <div className="typ-table-wrap" ref={wrapRef}>
        <table className="typ-table">
          <thead>
            <tr>
              <th>Característica</th>
              {typologies.map((t, i) => (
                <th key={i}>{t.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPOLOGY_ROWS.map(([rowLabel, key]) => (
              <tr key={key}>
                <th className="typ-row-label">{rowLabel}</th>
                {typologies.map((t, i) => (
                  <td key={i}>{t[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="typ-scrollbar-track" ref={trackRef}>
        <div className="typ-scrollbar-thumb" ref={thumbRef} />
      </div>
    </>
  );
}

export function TypologyDetails({ dev }: { dev: Development }) {
  const hasTable = dev.typologies && dev.typologies.length > 0;
  const hasText = dev.typology && dev.typology.trim() !== "";
  if (!hasTable && !hasText) {
    return (
      <span className="btn btn-ghost btn-sm w-full" style={{ visibility: "hidden" }} aria-hidden="true">
        ·
      </span>
    );
  }
  return (
    <details id={"typ-" + dev.id} className="typ-details">
      <summary className="btn btn-ghost btn-sm w-full" style={{ justifyContent: "flex-start", textAlign: "left" }}>
        <Icon html={ICON_TABLE} />
        Tipologia
      </summary>
      {hasTable ? (
        <TypologyTable typologies={dev.typologies} />
      ) : (
        <p className="text-sm mt-2" style={{ color: "var(--text-2)" }}>
          {dev.typology}
        </p>
      )}
    </details>
  );
}
