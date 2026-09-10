import { Icon, ICON_HEADSET, ICON_GIFT, ICON_BOLT, ICON_REFRESH, ICON_COINS } from "@/lib/icons";

const BENEFITS = [
  { title: "Apoio na Negociação", text: "Suporte presencial e remoto durante todo o atendimento ao seu cliente, para atendimentos agendados.", icon: ICON_HEADSET },
  { title: "Condições comerciais exclusivas", text: "Além da comissão, premiações e sorteios para parceiros ativos.", icon: ICON_GIFT },
  { title: "Suporte direto e ágil", text: "Resposta rápida via WhatsApp para dúvidas técnicas e comerciais.", icon: ICON_BOLT },
  { title: "Materiais sempre atualizados", text: "Fotos, books, plantas e tabelas revisados e disponíveis quando você precisar.", icon: ICON_REFRESH },
  { title: "Comissão desmembrada na mesa", text: "O cliente pode pagar você diretamente pela prestação de serviço, com a comissão já desmembrada no fechamento do negócio.", icon: ICON_COINS },
];

export function BenefitsSection() {
  return (
    <section className="mt-10 px-6 py-9 lg:px-12" style={{ background: "var(--surface-2)" }}>
      <h2 className="font-display font-extrabold text-2xl max-w-sm">Por que ser parceiro(a) Perplan</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {BENEFITS.map((b) => (
          <div className="flex gap-3" key={b.title}>
            <Icon html={b.icon} />
            <div>
              <h3 className="font-display font-bold text-[0.95rem]">{b.title}</h3>
              <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
                {b.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
