import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/status-badge";
import TabPlayer from "@/components/tab-player";
import { getSong } from "@/lib/songs";
import { getTabFileUrl, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const song = await getSong(id);
  if (!song) notFound();

  const fileUrl = getTabFileUrl(song.arquivo_tab);
  if (!fileUrl) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-4 border-b border-ink-800 bg-ink-900 px-4 py-3">
        <Link
          href="/"
          aria-label="Voltar para a lista"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-800 text-ink-300 transition hover:bg-ink-700 hover:text-ink-100"
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
          <h1 className="truncate font-medium text-ink-100">{song.titulo}</h1>
          <p className="truncate text-sm text-ink-400">{song.artista}</p>
        </div>

        <StatusBadge status={song.status} />
      </header>

      <TabPlayer fileUrl={fileUrl} />
    </div>
  );
}
