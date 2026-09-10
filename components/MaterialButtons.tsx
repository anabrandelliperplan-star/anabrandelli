import type { Development } from "@/lib/types";
import { driveParts, resolveMapsLink } from "@/lib/format";
import { Icon, ICON_PIN, ICON_BOOK, ICON_LIST, ICON_FOLDER, ICON_DOC, ICON_PARKING } from "@/lib/icons";

interface Slot {
  key: string;
  icon: string;
  label: string;
  href: string | null;
}

// Sempre 6 posicoes, na mesma ordem -- quando o link nao esta preenchido,
// mostra o rotulo esmaecido (nao clicavel) em vez de deixar o espaco em
// branco, assim a fileira de botoes continua com sentido visual mesmo
// incompleta, e ainda alinha entre os cards da vitrine.
export function MaterialButtons({ dev }: { dev: Development }) {
  const slots: Slot[] = [
    { key: "maps", icon: ICON_PIN, label: "Endereço", href: dev.mapsLink ? resolveMapsLink(dev.mapsLink) : null },
    { key: "book", icon: ICON_BOOK, label: "Book", href: dev.bookLink ? driveParts(dev.bookLink)?.view || dev.bookLink : null },
    { key: "tabela", icon: ICON_LIST, label: "Tabela e Espelho", href: dev.tabelaLink ? driveParts(dev.tabelaLink)?.view || dev.tabelaLink : null },
    { key: "materiais", icon: ICON_FOLDER, label: "Todos os materiais", href: dev.driveLink ? driveParts(dev.driveLink)?.view || dev.driveLink : null },
    { key: "descritivo", icon: ICON_DOC, label: "Material Descritivo", href: dev.materialDescritivoLink ? driveParts(dev.materialDescritivoLink)?.view || dev.materialDescritivoLink : null },
    dev.vagasIndeterminadas
      ? { key: "garagem", icon: ICON_PARKING, label: "Vagas indeterminadas", href: null }
      : { key: "garagem", icon: ICON_PARKING, label: "Memorial de Vagas", href: dev.vagasGaragemLink ? driveParts(dev.vagasGaragemLink)?.view || dev.vagasGaragemLink : null },
  ];

  return (
    <div className="materials-grid">
      {slots.map((m) =>
        m.href ? (
          <a
            key={m.key}
            id={m.key + "-" + dev.id}
            href={m.href}
            className="btn btn-ghost btn-sm w-full"
            target="_blank"
            rel="noopener"
          >
            <Icon html={m.icon} />
            <span>{m.label}</span>
          </a>
        ) : (
          <span key={m.key} className="btn btn-ghost btn-sm w-full" style={{ cursor: "default" }} aria-disabled="true">
            <Icon html={m.icon} />
            <span>{m.label}</span>
          </span>
        )
      )}
    </div>
  );
}
