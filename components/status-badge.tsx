import { STATUS_LABELS, type SongStatus } from "@/lib/types";

const STYLES: Record<SongStatus, string> = {
  "quero aprender": "border-line-2 text-soft",
  aprendendo: "border-brass/50 bg-brass/10 text-brass",
  aprendida: "border-sage/40 bg-sage/10 text-sage",
};

const DOTS: Record<SongStatus, string> = {
  "quero aprender": "bg-line-2",
  aprendendo: "bg-brass",
  aprendida: "bg-sage",
};

export default function StatusBadge({ status }: { status: SongStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] ${STYLES[status]}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOTS[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
