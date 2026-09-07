import type { Development } from "@/lib/types";
import { formatDeliveryDate, money, statusBadge, waLink } from "@/lib/format";
import { normalizeSearch } from "@/lib/search";
import { Icon, ICON_BUILDING, ICON_CALENDAR, ICON_PAYMENT, ICON_TROPHY, ICON_WHATSAPP } from "@/lib/icons";
import { MaterialButtons } from "./MaterialButtons";
import { TypologyDetails } from "./TypologyDetails";
import { Carousel } from "./Carousel";
import { DescriptionText } from "./DescriptionText";

function photosOf(dev: Development): string[] {
  return dev.photos && dev.photos.length ? dev.photos : [];
}

function SpecsRow({ dev }: { dev: Development }) {
  const hasDelivery = Boolean(dev.statusDetail && dev.statusDetail.trim() !== "");
  const deliveryLabel = dev.status === "ready" ? "Entregue em" : "Entrega prevista";
  const deliveryValue = hasDelivery ? formatDeliveryDate(dev.statusDetail) : "";
  const hasPayment = Boolean(dev.fluxoPagamento && dev.fluxoPagamento.trim() !== "");
  return (
    <div className="card-specs">
      <div id={"delivery-" + dev.id} className={"spec" + (hasDelivery ? "" : " is-empty")}>
        <p className="spec-label">
          <Icon html={ICON_CALENDAR} />
          <span>{deliveryLabel}</span>
        </p>
        <p className="spec-value">{deliveryValue}</p>
      </div>
      <div id={"payment-" + dev.id} className={"spec" + (hasPayment ? "" : " is-empty")}>
        <p className="spec-label">
          <Icon html={ICON_PAYMENT} />
          <span>Pagamento</span>
        </p>
        <p className="spec-value">{hasPayment ? dev.fluxoPagamento : ""}</p>
      </div>
    </div>
  );
}

export function DevelopmentCard({ dev, whatsapp }: { dev: Development; whatsapp: string }) {
  const badge = statusBadge(dev);
  const photos = photosOf(dev);

  return (
    <article id={"card-" + dev.id} className="card" data-nome={normalizeSearch(dev.name)}>
      <div className="card-photo" data-carousel={photos.length > 1 ? "" : undefined}>
        {photos.length ? <Carousel photos={photos} alt={"Foto de " + dev.name} /> : <Icon html={ICON_BUILDING} />}
        <span className={"badge " + badge.cls + " card-badge"}>{badge.label}</span>
      </div>
      <div className="p-5 flex flex-col gap-3.5 flex-1">
        <div>
          <p className="eyebrow" style={{ color: "var(--text-2)", fontWeight: 600, letterSpacing: "0.06em" }}>
            {dev.location.toUpperCase()}
          </p>
          <h3 className="font-display font-bold text-lg mt-1 leading-snug">{dev.name}</h3>
        </div>
        <DescriptionText id={"desc-" + dev.id} text={dev.descricao} />
        <SpecsRow dev={dev} />
        <div id={"premio-" + dev.id} className={"premio-chip" + (dev.premiacao ? "" : " is-empty")}>
          {dev.premiacao ? (
            <>
              <Icon html={ICON_TROPHY} />
              <span>{dev.premiacao}</span>
            </>
          ) : null}
        </div>
        <div
          id={"price-" + dev.id}
          className="flex items-end justify-between pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-[0.66rem] uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
              A partir de
            </p>
            <p className="font-display font-extrabold text-xl price-value">{money(dev.priceFrom)}</p>
          </div>
          {dev.unidadesDisponiveis ? (
            <div className="text-right">
              <p className="text-[0.66rem] uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
                Disponíveis
              </p>
              <p className="font-display font-bold text-lg" style={{ color: "var(--accent)" }}>
                {dev.unidadesDisponiveis}
              </p>
            </div>
          ) : null}
        </div>
        <MaterialButtons dev={dev} />
        <TypologyDetails dev={dev} />
        <a
          href={waLink(whatsapp, "Olá Ana Lívia, tenho uma dúvida sobre o " + dev.name)}
          className="btn btn-brand w-full mt-auto"
          target="_blank"
          rel="noopener"
        >
          <Icon html={ICON_WHATSAPP} />
          Falar sobre este imóvel
        </a>
      </div>
    </article>
  );
}
