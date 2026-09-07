"use client";

import { useState } from "react";
import { uploadImage } from "@/lib/upload";

export function SinglePhotoField({
  label,
  hint,
  value,
  onChange,
  pathPrefix,
  thumbStyle,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  pathPrefix: string;
  thumbStyle?: React.CSSProperties;
}) {
  const [uploading, setUploading] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, pathPrefix);
      onChange(url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="field">
      <label>{label}</label>
      {value ? (
        <div className="flex flex-wrap gap-2 mb-2 mt-1">
          <div className="photo-thumb" style={thumbStyle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" style={thumbStyle ? { objectFit: "contain" } : undefined} />
            <button type="button" onClick={() => onChange("")} aria-label="Remover foto">
              ×
            </button>
          </div>
        </div>
      ) : null}
      <input type="file" accept="image/*" onChange={onPick} disabled={uploading} />
      {hint ? (
        <p className="text-xs mt-1" style={{ color: "var(--text-2)" }}>
          {uploading ? "Enviando..." : hint}
        </p>
      ) : uploading ? (
        <p className="text-xs mt-1" style={{ color: "var(--text-2)" }}>
          Enviando...
        </p>
      ) : null}
    </div>
  );
}

export function MultiPhotoField({
  value,
  onChange,
  pathPrefix,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  pathPrefix: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f, pathPrefix)));
      onChange([...value, ...urls]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="field">
      <label>Fotos do empreendimento</label>
      {value.length ? (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((src, i) => (
            <div className="photo-thumb" key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
              <button type="button" onClick={() => removeAt(i)} aria-label="Remover foto">
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <input type="file" accept="image/*" multiple onChange={onPick} disabled={uploading} />
      <p className="text-xs mt-1" style={{ color: "var(--text-2)" }}>
        {uploading ? "Enviando..." : "Com mais de uma foto, elas trocam sozinhas a cada 4 segundos no card."}
      </p>
    </div>
  );
}
