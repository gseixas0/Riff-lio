import { STATUS_LABELS, type SongStatus } from "@/lib/types";

const STYLES: Record<SongStatus, string> = {
  "quero aprender": "border-ink-600 bg-ink-800 text-ink-300",
  aprendendo: "border-glow/50 bg-glow/10 text-glow",
  aprendida: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
};

export default function StatusBadge({ status }: { status: SongStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
