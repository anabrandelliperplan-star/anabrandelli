import Link from "next/link";
import type { Settings } from "@/lib/types";
import { waLink } from "@/lib/format";
import { Icon, ICON_WHATSAPP, ICON_PHONE, ICON_MAIL, ICON_INSTAGRAM, ICON_LOCK } from "@/lib/icons";

export function Footer({ settings }: { settings: Settings }) {
  const waGeneric = waLink(settings.whatsapp, "Olá Ana Lívia, sou corretor(a) parceiro(a) e gostaria de informações");
  const linkStyle = { color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: "2px" } as const;

  return (
    <footer className="px-6 pt-9 pb-10 lg:px-12" style={{ background: "var(--bg)" }}>
      <div className="flex justify-center">
        <a
          href={waGeneric}
          className="btn btn-brand"
          style={{ padding: "1.15rem 2.4rem", fontSize: "1.05rem" }}
          target="_blank"
          rel="noopener"
        >
          <Icon html={ICON_WHATSAPP} />
          Falar no WhatsApp
        </a>
      </div>
      <div
        className="mt-8 pt-6 text-sm text-center"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-2)" }}
      >
        <p className="font-display font-bold" style={{ color: "var(--text)" }}>
          Ana Lívia Brandelli
        </p>
        <p className="mt-1">Supervisora de Parcerias · Perplan Incorporação</p>
        <div className="mt-3 flex flex-col items-center gap-2">
          <a href={"tel:+" + settings.whatsapp} className="inline-flex items-center gap-1.5 hover:opacity-80" style={linkStyle}>
            <Icon html={ICON_PHONE} />
            {settings.phoneDisplay}
          </a>
          <a href={"mailto:" + settings.email} className="inline-flex items-center gap-1.5 hover:opacity-80" style={linkStyle}>
            <Icon html={ICON_MAIL} />
            {settings.email}
          </a>
          <a
            href={"https://instagram.com/" + settings.instagram}
            className="inline-flex items-center gap-1.5 hover:opacity-80"
            style={linkStyle}
            target="_blank"
            rel="noopener"
          >
            <Icon html={ICON_INSTAGRAM} />@{settings.instagram}
          </a>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Link href="/admin" className="admin-toggle" title="Área administrativa" aria-label="Área administrativa">
          <Icon html={ICON_LOCK} />
        </Link>
      </div>
    </footer>
  );
}
