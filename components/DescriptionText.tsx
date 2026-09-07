"use client";

import { useEffect, useRef, useState } from "react";

export function DescriptionText({ id, text }: { id: string; text: string }) {
  const hasText = Boolean(text && text.trim() !== "");
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!hasText) return;
    const el = ref.current;
    if (!el) return;
    function checkTruncated() {
      if (!el || expanded) return;
      setTruncated(el.scrollHeight > el.clientHeight + 1);
    }
    checkTruncated();
    const resizeObserver = new ResizeObserver(checkTruncated);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [hasText, expanded, text]);

  if (!hasText) {
    return (
      <p id={id} className="description-text is-empty">
        ·
      </p>
    );
  }

  return (
    <div>
      <p id={id} ref={ref} className={"description-text" + (expanded ? " is-expanded" : "")}>
        {text}
      </p>
      {truncated || expanded ? (
        <button type="button" className="description-toggle" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      ) : null}
    </div>
  );
}
