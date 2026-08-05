import Link from "next/link";
import { STATUS_LABELS, type Song } from "@/lib/types";

const STATUS_DOT: Record<Song["status"], string> = {
  "quero aprender": "bg-line-2",
  aprendendo: "bg-neon",
  aprendida: "bg-mint",
};

/** Fret positions that carry an inlay dot on a real fretboard. */
const INLAY_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);

export default function SongCard({ song, index }: { song: Song; index: number }) {
  return (
    <Link
      href={`/musicas/${song.id}`}
      aria-label={`${song.titulo}, ${song.artista}. ${STATUS_LABELS[song.status]}.`}
      className="group relative flex items-center gap-4 border-b border-line py-4 pl-4 pr-3 transition-colors hover:bg-panel sm:gap-5"
    >
      {/* Brass edge that lights up on hover, standing in for a fret wire. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-0.5 origin-center scale-y-0 bg-neon transition-transform duration-200 group-hover:scale-y-100 group-focus-visible:scale-y-100"
      />

      <span
        aria-hidden
        className="relative w-6 shrink-0 text-right font-mono text-xs tabular-nums text-dim transition-opacity group-hover:opacity-0"
      >
        {String(index).padStart(2, "0")}
        {INLAY_FRETS.has(index) && (
          <span className="absolute -left-2 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-line-2" />
        )}
      </span>

      {/* Play glyph takes the index slot on hover — same footprint, no reflow. */}
      <span
        aria-hidden
        className="absolute left-4 w-6 shrink-0 text-neon opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5.14v13.72L19 12 8 5.14Z" />
        </svg>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-lg leading-snug text-bright">
          {song.titulo}
        </span>
        <span className="block truncate text-sm text-dim">{song.artista}</span>
      </span>

      <span className="flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-dim">
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[song.status]}`}
        />
        <span className="hidden sm:inline">{STATUS_LABELS[song.status]}</span>
      </span>
    </Link>
  );
}
