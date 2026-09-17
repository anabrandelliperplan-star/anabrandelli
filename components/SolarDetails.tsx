import type { Development } from "@/lib/types";
import { Icon, ICON_SOLAR } from "@/lib/icons";

export function SolarDetails({ dev }: { dev: Development }) {
  const hasText = Boolean(dev.incidenciaSolar && dev.incidenciaSolar.trim() !== "");
  if (!hasText) return null;
  return (
    <details id={"solar-" + dev.id} className="typ-details">
      <summary className="btn btn-ghost btn-sm w-full" style={{ justifyContent: "flex-start", textAlign: "left" }}>
        <Icon html={ICON_SOLAR} />
        Incidência Solar
      </summary>
      <p className="text-sm mt-2" style={{ color: "var(--text-2)", whiteSpace: "pre-line" }}>
        {dev.incidenciaSolar}
      </p>
    </details>
  );
}
