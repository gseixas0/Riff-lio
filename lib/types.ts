export const SONG_STATUSES = [
  "quero aprender",
  "aprendendo",
  "aprendida",
] as const;

export type SongStatus = (typeof SONG_STATUSES)[number];

/** Row of the `musicas` table. Column names stay in Portuguese to match the DB. */
export type Song = {
  id: string;
  titulo: string;
  artista: string;
  arquivo_tab: string;
  status: SongStatus;
  data_adicionada: string;
};

export const STATUS_LABELS: Record<SongStatus, string> = {
  "quero aprender": "Quero aprender",
  aprendendo: "Aprendendo",
  aprendida: "Aprendida",
};
