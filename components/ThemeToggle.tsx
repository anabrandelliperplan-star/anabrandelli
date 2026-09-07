"use client";

import { Icon, ICON_SUN, ICON_MOON } from "@/lib/icons";

export function ThemeToggle() {
  function toggle() {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("tema", next);
    } catch {}
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Alternar tema">
      <Icon html={ICON_SUN} />
      <Icon html={ICON_MOON} />
    </button>
  );
}
