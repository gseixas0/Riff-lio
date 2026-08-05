import SetupNotice from "@/components/setup-notice";
import SongList from "@/components/song-list";
import { listSongs } from "@/lib/songs";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SONG_STATUSES, STATUS_LABELS } from "@/lib/types";

// Personal library that changes from the Supabase dashboard: always read fresh.
export const dynamic = "force-dynamic";

export default async function Home() {
  const songs = isSupabaseConfigured ? await listSongs() : [];

  // Only statuses that actually have songs. A shelf of "00" reads as broken
  // rather than as empty, and today every song here is one being learned.
  const tally = SONG_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: songs.filter((song) => song.status === status).length,
  })).filter((item) => item.count > 0);

  return (
    <main
      id="conteudo"
      className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:px-8 sm:py-16"
    >
      <header className="mb-10">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
          <div>
            <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-bright sm:text-6xl">
              Riff
              <span
                className="text-neon italic"
                style={{ fontVariationSettings: '"WONK" 1, "SOFT" 8' }}
              >
                ólio
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-dim">
              O que estou tirando agora no violão e no baixo.
            </p>
          </div>

          {songs.length > 0 && (
            <dl className="flex gap-6 sm:gap-8">
              {tally.map((item) => (
                <div key={item.status}>
                  <dd className="font-mono text-2xl tabular-nums text-bright">
                    {String(item.count).padStart(2, "0")}
                  </dd>
                  <dt className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-dim">
                    {item.label}
                  </dt>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="fretboard-rule mt-8" aria-hidden />
      </header>

      {isSupabaseConfigured ? <SongList songs={songs} /> : <SetupNotice />}
    </main>
  );
}
