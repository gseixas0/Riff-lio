import Link from "next/link";
import type { Song } from "@/lib/types";

export default function SongCard({ song }: { song: Song }) {
  return (
    <Link
      href={`/musicas/${song.id}`}
      className="group flex items-center gap-4 rounded-xl border border-ink-800 bg-ink-900 px-4 py-3.5 transition hover:border-ink-600 hover:bg-ink-850"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink-800 text-ink-400 transition group-hover:bg-glow group-hover:text-ink-950">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5.14v13.72L19 12 8 5.14Z" />
        </svg>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink-100">{song.titulo}</span>
        <span className="block truncate text-sm text-ink-400">{song.artista}</span>
      </span>
    </Link>
  );
}
