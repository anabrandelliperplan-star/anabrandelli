import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Empreendimentos Perplan em Ribeirão Preto",
  description: "Materiais e informações dos empreendimentos Perplan para corretores parceiros.",
  appleWebApp: { title: "Empreendimentos Perplan RP" },
  openGraph: {
    title: "Empreendimentos Perplan em Ribeirão Preto",
    description: "Materiais e informações dos empreendimentos Perplan para corretores parceiros.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
};

const ANTI_FLASH_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("tema");if(!t){t=(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches)?"light":"dark";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={spaceGrotesk.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_THEME_SCRIPT }} suppressHydrationWarning />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
