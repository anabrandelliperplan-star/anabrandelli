"use client";

import { useEffect, useRef, useState } from "react";
import type { Development, SearchItem } from "@/lib/types";
import { buildSearchIndex, normalizeSearch, searchItems } from "@/lib/search";
import { Icon, ICON_MIC, ICON_SEARCH, searchIconFor } from "@/lib/icons";

// Reconhecimento de voz do próprio navegador (Web Speech API) -- funciona no
// Chrome (onde os corretores usam pelo Android), sem suporte no Firefox e
// bem limitado no Safari/iPhone. Sem chave de API, sem custo.
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function filterCardsByName(query: string) {
  const grid = document.getElementById("cards-grid");
  const emptyMsg = document.getElementById("cards-no-results");
  if (!grid) return;
  const q = normalizeSearch(query || "");
  const cards = grid.querySelectorAll<HTMLElement>(".card");
  let visibleCount = 0;
  cards.forEach((card) => {
    const matches = !q || (card.getAttribute("data-nome") || "").indexOf(q) !== -1;
    card.hidden = !matches;
    if (matches) visibleCount++;
  });
  if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
}

function SearchResultRow({ item, idx, onSelect }: { item: SearchItem; idx: number; onSelect: () => void }) {
  const preview = item.value.length > 70 ? item.value.slice(0, 70) + "…" : item.value;
  const inner = (
    <>
      <Icon html={searchIconFor(item.label)} />
      <span className="search-result-text">
        <span className="search-result-label">
          {item.label} <span className="search-result-dev">· {item.dev}</span>
        </span>
        <span className="search-result-value">
          {preview}
          {item.kind === "link" ? " ↗" : ""}
        </span>
      </span>
    </>
  );
  if (item.kind === "link") {
    return (
      <a
        id={"search-row-" + idx}
        href={item.url}
        target="_blank"
        rel="noopener"
        className="search-result-row"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSelect}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      id={"search-row-" + idx}
      type="button"
      className="search-result-row"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
    >
      {inner}
    </button>
  );
}

function SearchAnswer({ item, onClose }: { item: SearchItem; onClose: () => void }) {
  return (
    <div className="search-answer">
      <div className="search-answer-head">
        <Icon html={searchIconFor(item.label)} />
        <span className="search-answer-title">
          {item.label} <span className="search-result-dev">· {item.dev}</span>
        </span>
        <button
          type="button"
          className="search-answer-close"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClose}
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
      <div className="search-answer-value">{item.value}</div>
    </div>
  );
}

export function SearchBar({ developments }: { developments: Development[] }) {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [answer, setAnswer] = useState<SearchItem | null>(null);
  const [open, setOpen] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    setVoiceSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  function runQuery(q: string) {
    setAnswer(null);
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setResults(searchItems(q, developments).slice(0, 8));
    setOpen(true);
  }

  function onInput(val: string) {
    setValue(val);
    runQuery(val);
    filterCardsByName(val);
  }

  function toggleAll() {
    const q = value.trim();
    if (q) {
      runQuery(q);
    } else {
      setAnswer(null);
      setResults(buildSearchIndex(developments));
      setOpen(true);
    }
    inputRef.current?.focus();
  }

  function onFocus() {
    if (value.trim()) {
      runQuery(value);
    } else {
      toggleAll();
    }
  }

  function onBlur() {
    setTimeout(() => setOpen(false), 150);
  }

  function clear() {
    setValue("");
    setAnswer(null);
    setResults([]);
    setOpen(false);
    filterCardsByName("");
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const first = document.getElementById("search-row-0");
      first?.click();
    } else if (e.key === "Escape") {
      clear();
    }
  }

  function afterLinkClick() {
    setValue("");
    setOpen(false);
  }

  function select(item: SearchItem) {
    setAnswer(item);
  }

  function startListening() {
    setVoiceError(null);
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onInput(transcript);
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceError("Permissão de microfone bloqueada -- ative nas configurações do navegador.");
      } else if (event.error === "no-speech") {
        setVoiceError("Não ouvi nada. Tenta de novo.");
      } else {
        setVoiceError("Não deu pra usar o microfone agora.");
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      setVoiceError("Não deu pra usar o microfone agora.");
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return (
    <div className="search-wrap">
      <div className="search-box">
        <button
          type="button"
          className="search-icon-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleAll}
          aria-label="Mostrar todas as opções de busca"
        >
          <Icon html={ICON_SEARCH} />
        </button>
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          placeholder="Buscar: ex. tabela MB Park, book Riverside..."
          autoComplete="off"
          value={value}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {voiceSupported ? (
          <button
            type="button"
            className={"search-icon-btn" + (listening ? " is-listening" : "")}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (listening ? stopListening() : startListening())}
            aria-label={listening ? "Parar busca por voz" : "Buscar por voz"}
          >
            <Icon html={ICON_MIC} />
          </button>
        ) : null}
        <button type="button" className="search-clear" onClick={clear} aria-label="Limpar busca">
          ✕
        </button>
      </div>
      {voiceError ? <div className="search-voice-error">{voiceError}</div> : null}
      <div id="search-results" className="search-results" hidden={!open}>
        {answer ? (
          <SearchAnswer item={answer} onClose={() => setAnswer(null)} />
        ) : results.length ? (
          results.map((item, idx) => (
            <SearchResultRow
              key={idx}
              item={item}
              idx={idx}
              onSelect={() => {
                if (item.kind === "link") afterLinkClick();
                else select(item);
              }}
            />
          ))
        ) : (
          <div className="search-empty">
            {value.trim() ? `Nada encontrado para "${value.trim()}"` : "Nenhuma informação cadastrada ainda"}
          </div>
        )}
      </div>
    </div>
  );
}
