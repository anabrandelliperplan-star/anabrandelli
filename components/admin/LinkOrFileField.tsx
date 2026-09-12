"use client";

import { useState } from "react";
import { uploadFile } from "@/lib/upload";

export function LinkOrFileField({
  label,
  value,
  onChange,
  pathPrefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  pathPrefix: string;
}) {
  const [uploading, setUploading] = useState(false);
  const isUploadedPdf = value.startsWith("/api/media/");

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, pathPrefix);
      onChange(url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="field">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cole um link, ou envie um PDF abaixo"
      />
      <div className="flex items-center gap-2 mt-1">
        <input type="file" accept="application/pdf" onChange={onPickFile} disabled={uploading} />
        {uploading ? (
          <span className="text-xs" style={{ color: "var(--text-2)" }}>
            Enviando...
          </span>
        ) : isUploadedPdf ? (
          <span className="text-xs" style={{ color: "var(--text-2)" }}>
            PDF enviado -- cole outro link acima ou envie outro PDF pra substituir.
          </span>
        ) : null}
      </div>
    </div>
  );
}
