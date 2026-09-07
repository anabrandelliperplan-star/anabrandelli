import { getData } from "@/lib/db";
import { Header } from "@/components/Header";
import { BenefitsSection } from "@/components/BenefitsSection";
import { Footer } from "@/components/Footer";
import { DevelopmentCard } from "@/components/DevelopmentCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getData();
  const visibleDevelopments = data.developments.filter((d) => !d.hidden);

  return (
    <div className="mx-auto max-w-2xl lg:max-w-5xl">
      <Header settings={data.settings} developments={data.developments} />

      <main className="px-6 pt-9 pb-2 lg:px-12" style={{ background: "var(--bg)" }}>
        <h2 className="font-display font-extrabold text-2xl">Empreendimentos Perplan em Ribeirão Preto</h2>
        <div id="cards-grid" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleDevelopments.map((dev) => (
            <DevelopmentCard key={dev.id} dev={dev} whatsapp={data.settings.whatsapp} />
          ))}
        </div>
        <div id="cards-no-results" className="no-results" hidden>
          Nenhum empreendimento encontrado.
        </div>
      </main>

      <BenefitsSection />
      <Footer settings={data.settings} />
    </div>
  );
}
