import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/status-badge";
import TabPlayer from "@/components/tab-player";
import { getSong } from "@/lib/songs";
import { getTabFileUrl, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  if (!isSupabaseConfigured) return {};
  const { id } = await params;
  const song = await getSong(id);
  return song ? { title: `${song.titulo} — ${song.artista}` } : {};
}

export default async function SongPage({ params }: Params) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const song = await getSong(id);
  if (!song) notFound();

  const fileUrl = getTabFileUrl(song.arquivo_tab);
  if (!fileUrl) notFound();

  return (
    <div id="conteudo" className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-panel px-3 py-2.5 sm:gap-4 sm:px-4">
        <Link
          href="/"
          aria-label="Voltar para a lista de músicas"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-soft transition hover:border-line-2 hover:bg-panel-2 hover:text-bright"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl leading-tight text-bright">
            {song.titulo}
          </h1>
          <p className="truncate text-sm text-dim">{song.artista}</p>
        </div>

        <StatusBadge status={song.status} />
      </header>

      <TabPlayer fileUrl={fileUrl} />
    </div>
  );
}
