import { supabase } from "@/lib/supabase";
import type { Song } from "@/lib/types";

export async function listSongs(): Promise<Song[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("musicas")
    .select("*")
    .order("data_adicionada", { ascending: false });

  if (error) throw new Error(`Falha ao carregar músicas: ${error.message}`);
  return (data ?? []) as Song[];
}

export async function getSong(id: string): Promise<Song | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("musicas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar a música: ${error.message}`);
  return (data as Song) ?? null;
}
