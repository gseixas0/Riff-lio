import SetupNotice from "@/components/setup-notice";
import SongList from "@/components/song-list";
import { listSongs } from "@/lib/songs";
import { isSupabaseConfigured } from "@/lib/supabase";

// Personal library that changes from the Supabase dashboard: always read fresh.
export const dynamic = "force-dynamic";

export default async function Home() {
  const songs = isSupabaseConfigured ? await listSongs() : [];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">
          Riff<span className="text-glow">ólio</span>
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          Músicas que estou aprendendo no violão e no baixo, com tablatura interativa e
          player sincronizado.
        </p>
      </header>

      {isSupabaseConfigured ? <SongList songs={songs} /> : <SetupNotice />}
    </main>
  );
}
