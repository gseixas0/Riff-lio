"use client";

import { useMemo, useState } from "react";
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

export default function SongList({ songs }: { songs: Song[] }) {
  const [filter, setFilter] = useState<Filter>("todas");
  const [query, setQuery] = useState("");

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === item.value
                  ? "bg-glow text-ink-950"
                  : "bg-ink-800 text-ink-300 hover:bg-ink-700 hover:text-ink-100"
              }`}
            >
              {item.label}
              <span className="ml-1.5 opacity-60">{counts[item.value]}</span>
            </button>
          ))}
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título ou artista"
          className="ml-auto w-full max-w-64 rounded-full border border-ink-700 bg-ink-900 px-4 py-2 text-sm text-ink-100 placeholder:text-ink-400 focus:border-glow/60 focus:outline-none"
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-700 p-10 text-center text-sm text-ink-400">
          Nenhuma música por aqui ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((song) => (
            <li key={song.id}>
              <SongCard song={song} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
