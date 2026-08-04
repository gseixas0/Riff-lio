"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SongCard from "@/components/song-card";
import { SONG_STATUSES, STATUS_LABELS, type Song, type SongStatus } from "@/lib/types";

type Filter = SongStatus | "todas";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "todas", label: "Todas" },
  ...SONG_STATUSES.map((status) => ({
    value: status as Filter,
    label: STATUS_LABELS[status],
  })),
];

const EMPTY_MESSAGES: Record<Filter, string> = {
  todas: "Nenhuma música por aqui ainda.",
  "quero aprender": "Nada na fila. Toda música já saiu do papel.",
  aprendendo: "Nenhuma em andamento no momento.",
  aprendida: "Nenhuma fechada ainda — o que não é pouco, é começo.",
};

export default function SongList({ songs }: { songs: Song[] }) {
  const [filter, setFilter] = useState<Filter>("todas");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return songs.filter((song) => {
      const matchesStatus = filter === "todas" || song.status === filter;
      const matchesQuery =
        needle === "" ||
        song.titulo.toLowerCase().includes(needle) ||
        song.artista.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [songs, filter, query]);

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      todas: songs.length,
      "quero aprender": 0,
      aprendendo: 0,
      aprendida: 0,
    };
    for (const song of songs) result[song.status] += 1;
    return result;
  }, [songs]);

  // "/" jumps to the search box the way every library UI does, but never while
  // the user is already typing somewhere.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Up/down walks the list without leaving the keyboard, like a file browser.
  function onListKeyDown(event: React.KeyboardEvent<HTMLOListElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const links = Array.from(
      listRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? [],
    );
    const current = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (current === -1) return;
    event.preventDefault();
    const next = event.key === "ArrowDown" ? current + 1 : current - 1;
    links[Math.max(0, Math.min(links.length - 1, next))]?.focus();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por status">
          {FILTERS.map((item) => {
            const active = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-brass bg-brass text-stage"
                    : "border-line bg-panel text-soft hover:border-line-2 hover:text-bright"
                }`}
              >
                {item.label}
                <span className={`ml-1.5 font-mono tabular-nums ${active ? "opacity-70" : "opacity-50"}`}>
                  {counts[item.value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative sm:ml-auto sm:w-64">
          <label htmlFor="busca" className="sr-only">
            Buscar por título ou artista
          </label>
          <input
            id="busca"
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar"
            className="w-full rounded-full border border-line bg-panel py-2 pl-4 pr-10 text-sm text-bright transition placeholder:text-dim hover:border-line-2 focus:border-brass focus:outline-none"
          />
          <kbd
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line-2 px-1.5 font-mono text-[11px] text-dim"
          >
            /
          </kbd>
        </div>
      </div>

      {/* Announces the result count to screen readers as the filters change. */}
      <p aria-live="polite" className="sr-only">
        {visible.length === 1
          ? "1 música encontrada"
          : `${visible.length} músicas encontradas`}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-2 px-6 py-14 text-center text-sm text-dim">
          {query.trim()
            ? `Nada encontrado para “${query.trim()}”.`
            : EMPTY_MESSAGES[filter]}
        </p>
      ) : (
        <ol ref={listRef} onKeyDown={onListKeyDown} className="border-t border-line">
          {visible.map((song, index) => (
            <li key={song.id}>
              <SongCard song={song} index={index + 1} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
