"use client";

import type { TrackInfo, TrackMix, TrackRole } from "@/components/tab-player";

type Props = {
  tracks: TrackInfo[];
  mix: Record<number, TrackMix>;
  onChange: (index: number, patch: Partial<TrackMix>) => void;
  onSoloOnly: (index: number) => void;
  onReset: () => void;
  onClose: () => void;
};

const ROLE_LABELS: Record<TrackRole, string> = {
  guitar: "Violão / guitarra",
  bass: "Baixo",
  drums: "Bateria",
  other: "Outro",
};

const ROLE_STYLES: Record<TrackRole, string> = {
  guitar: "border-glow/50 bg-glow/10 text-glow",
  bass: "border-sky-500/40 bg-sky-500/10 text-sky-400",
  drums: "border-ink-600 bg-ink-800 text-ink-400",
  other: "border-ink-600 bg-ink-800 text-ink-400",
};

export default function Mixer({
  tracks,
  mix,
  onChange,
  onSoloOnly,
  onReset,
  onClose,
}: Props) {
  const anySolo = Object.values(mix).some((m) => m.solo);

  return (
    <div className="max-h-[45vh] overflow-y-auto border-t border-ink-800 bg-ink-900">
      <div className="flex items-center gap-3 border-b border-ink-800 px-4 py-2">
        <h2 className="text-xs font-medium text-ink-100">Mixer</h2>
        <p className="text-xs text-ink-400">
          Silencie o instrumento que você vai tocar, ou isole um pra estudar
        </p>
        <button
          type="button"
          onClick={onReset}
          className="ml-auto rounded-md border border-ink-700 px-2 py-1 text-xs text-ink-300 transition hover:text-ink-100"
        >
          Restaurar
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar mixer"
          className="grid h-6 w-6 place-items-center rounded text-ink-400 transition hover:text-ink-100"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ul className="divide-y divide-ink-800">
        {tracks.map((track) => {
          const state = mix[track.index] ?? { mute: false, solo: false, volume: 1 };
          // A solo elsewhere silences this track even though its own mute is off.
          const silenced = state.mute || (anySolo && !state.solo);

          return (
            <li
              key={track.index}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5"
            >
              <span
                className={`w-44 min-w-0 truncate text-sm ${
                  silenced ? "text-ink-400 line-through" : "text-ink-100"
                }`}
              >
                {track.name || `Faixa ${track.index + 1}`}
              </span>

              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${ROLE_STYLES[track.role]}`}
              >
                {ROLE_LABELS[track.role]}
              </span>

              <div className="flex shrink-0 items-center gap-1.5">
                <MixButton
                  active={state.mute}
                  onClick={() => onChange(track.index, { mute: !state.mute })}
                  label={`Silenciar ${track.name}`}
                  activeClass="border-red-500/50 bg-red-500/15 text-red-400"
                >
                  M
                </MixButton>
                <MixButton
                  active={state.solo}
                  onClick={() => onChange(track.index, { solo: !state.solo })}
                  label={`Solo ${track.name}`}
                  activeClass="border-glow/60 bg-glow/15 text-glow"
                >
                  S
                </MixButton>
                <button
                  type="button"
                  onClick={() => onSoloOnly(track.index)}
                  className="rounded-md border border-ink-700 px-2 py-1 text-[11px] text-ink-400 transition hover:text-ink-100"
                >
                  só esta
                </button>
              </div>

              <div className="flex flex-1 items-center gap-2">
                <input
                  type="range"
                  aria-label={`Volume ${track.name}`}
                  min={0}
                  max={2}
                  step={0.05}
                  value={state.volume}
                  onChange={(e) =>
                    onChange(track.index, { volume: Number(e.target.value) })
                  }
                  className="w-full min-w-24 cursor-pointer"
                />
                <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-400">
                  {Math.round(state.volume * 100)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MixButton({
  active,
  onClick,
  label,
  activeClass,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  activeClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`h-7 w-7 rounded-md border text-[11px] font-semibold transition ${
        active ? activeClass : "border-ink-700 bg-ink-800 text-ink-400 hover:text-ink-100"
      }`}
    >
      {children}
    </button>
  );
}
