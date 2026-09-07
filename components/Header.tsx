import type { Development, Settings } from "@/lib/types";
import { waLink } from "@/lib/format";
import { Icon, ICON_PIN, ICON_WHATSAPP, ICON_INSTAGRAM, ICON_MAIL, PERPLAN_MARK } from "@/lib/icons";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "./ThemeToggle";

function Brandmark({ settings }: { settings: Settings }) {
  const darkSrc = settings.logoImage || settings.logoImageLight || "";
  const lightSrc = settings.logoImageLight || settings.logoImage || "";
  if (!darkSrc) {
    return (
      <>
        <Icon html={PERPLAN_MARK} />
        <span style={{ color: "var(--text)" }}>perplan</span>
      </>
    );
  }
  const style = { height: "6rem", width: "auto", maxWidth: "20rem" } as const;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={darkSrc} alt="Perplan" style={style} className="object-contain logo-dark" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={lightSrc} alt="Perplan" style={style} className="object-contain logo-light" />
    </>
  );
}

export function Header({ settings, developments }: { settings: Settings; developments: Development[] }) {
  const waGeneric = waLink(settings.whatsapp, "Olá Ana Lívia, sou corretor(a) parceiro(a) e gostaria de informações");

  return (
    <header
      style={{ background: "var(--bg)", color: "var(--text)" }}
      className="px-6 pt-9 pb-8 sm:pt-12 sm:pb-10 lg:px-12 lg:pt-16 lg:pb-14"
    >
      <div className="flex flex-wrap items-center gap-5 sm:gap-6">
        <div className="w-full sm:w-auto sm:flex-1 sm:order-2">
          <SearchBar developments={developments} />
        </div>
        {/* Espaçador do mesmo tamanho do botão de tema, só no mobile: sem ele
            a logo (que ocupa o espaço restante da linha) fica centralizada em
            relação a uma largura menor que a linha inteira, por causa do
            botão do outro lado. */}
        <div className="w-[2.4rem] shrink-0 sm:hidden" aria-hidden="true" />
        <div className="flex-1 flex justify-center sm:flex-none sm:justify-start sm:order-1">
          <div className="brandmark">
            <Brandmark settings={settings} />
          </div>
        </div>
        <div className="shrink-0 sm:order-3">
          <ThemeToggle />
        </div>
      </div>
      <div className="hero-card mt-6">
        <div className="hero-person">
          {settings.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.profilePhoto}
              alt="Ana Lívia Brandelli"
              className="h-32 w-24 sm:h-40 sm:w-28 lg:h-44 lg:w-32 rounded-2xl object-cover shrink-0"
              style={{ border: "1px solid var(--border)" }}
            />
          ) : (
            <div
              className="h-32 w-24 sm:h-40 sm:w-28 lg:h-44 lg:w-32 rounded-2xl flex items-center justify-center font-display font-extrabold text-xl sm:text-2xl shrink-0"
              style={{ background: "var(--elevate)", color: "var(--accent-text)", border: "1px solid var(--border)" }}
            >
              ALB
            </div>
          )}
          <div className="pt-1">
            <h1 className="font-display font-extrabold text-2xl sm:text-[1.75rem] leading-tight">Ana Lívia Brandelli</h1>
            <p className="mt-1 text-sm sm:text-base" style={{ color: "var(--text-2)" }}>
              Supervisora de Parcerias — Perplan Incorporação
            </p>
            <p className="eyebrow mt-2.5 flex items-center gap-1.5" style={{ color: "var(--accent-text)" }}>
              <Icon html={ICON_PIN} />
              Ribeirão Preto · SP
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed" style={{ color: "var(--text-2)" }}>
              Estou aqui para apoiar suas negociações na Perplan em Ribeirão Preto. Acesse tabelas atualizadas,
              materiais de venda exclusivos e conte com suporte rápido para fechar seus negócios.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-7 flex justify-center">
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
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm" style={{ color: "var(--text-2)" }}>
        <a
          href={"https://instagram.com/" + settings.instagram}
          className="inline-flex items-center gap-1.5 hover:opacity-80"
          target="_blank"
          rel="noopener"
        >
          <Icon html={ICON_INSTAGRAM} />@{settings.instagram}
        </a>
        <a href={"mailto:" + settings.email} className="inline-flex items-center gap-1.5 hover:opacity-80">
          <Icon html={ICON_MAIL} />
          {settings.email}
        </a>
      </div>
    </header>
  );
}
