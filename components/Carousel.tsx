"use client";

import { useEffect, useState } from "react";
import { Icon, ICON_BUILDING } from "@/lib/icons";

// Foto individual OU galeria. Um link de PASTA do Drive nunca funciona como
// imagem, e qualquer foto que falhe ao carregar some sozinha, então nunca
// aparece imagem quebrada para o corretor.
function photoImgSrc(src: string): string {
  if (/^data:image\//.test(src) || /^https?:\/\//.test(src)) {
    if (/^data:image\//.test(src)) return src;
    const m = src.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || src.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
    if (m) return "https://drive.google.com/uc?export=view&id=" + m[1];
    return src;
  }
  return src;
}

export function Carousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [loadedCount, setLoadedCount] = useState(1);

  const visiblePhotos = photos.filter((_, i) => !failed[i]);

  useEffect(() => {
    if (photos.length < 2) return;
    const timer = setInterval(() => {
      setActiveIdx((i) => (i + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [photos.length]);

  // So ativa quando a quantidade de fotos muda, nao a cada nova referencia do array.
  useEffect(() => {
    if (photos.length < 2) return;
    const timers = photos.slice(1).map((_, i) =>
      setTimeout(() => setLoadedCount((c) => Math.max(c, i + 2)), 250 * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  if (!visiblePhotos.length) {
    return <Icon html={ICON_BUILDING} />;
  }

  if (photos.length === 1) {
    if (failed[0]) return <Icon html={ICON_BUILDING} />;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoImgSrc(photos[0])}
        alt={alt}
        loading="lazy"
        onError={() => setFailed((f) => ({ ...f, 0: true }))}
      />
    );
  }

  return (
    <>
      {photos.map((src, i) => {
        if (failed[i]) return null;
        if (i > 0 && i >= loadedCount) return null;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={photoImgSrc(src)}
            className={"carousel-slide" + (i === activeIdx ? " active" : "")}
            alt={alt}
            onError={() => setFailed((f) => ({ ...f, [i]: true }))}
          />
        );
      })}
    </>
  );
}
