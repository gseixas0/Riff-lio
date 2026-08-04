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
  guitar: "border-brass/50 bg-brass/10 text-brass",
  bass: "border-copper/40 bg-copper/10 text-copper",
  drums: "border-line-2 bg-panel-2 text-dim",
  other: "border-line-2 bg-panel-2 text-dim",
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
    <section
      aria-label="Mixer"
      className="max-h-[45vh] overflow-y-auto border-t border-line bg-panel"
    >
      <div className="sticky top-0 flex items-center gap-3 border-b border-line bg-panel px-3 py-2.5 sm:px-4">
        <h2 className="font-display text-sm text-bright">Mixer</h2>
        <p className="hidden text-xs text-dim sm:block">
          Silencie o instrumento que você vai tocar, ou isole um para estudar
        </p>
        <button
          type="button"
          onClick={onReset}
          className="ml-auto rounded-lg border border-line px-2.5 py-1 text-xs text-soft transition hover:border-line-2 hover:text-bright"
        >
          Restaurar
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar mixer"
          className="grid h-8 w-8 place-items-center rounded-full text-dim transition hover:bg-panel-2 hover:text-bright"
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

      <ul className="divide-y divide-line">
        {tracks.map((track) => {
          const state = mix[track.index] ?? { mute: false, solo: false, volume: 1 };
          // A solo elsewhere silences this track even though its own mute is off.
          const silenced = state.mute || (anySolo && !state.solo);
          const name = track.name || `Faixa ${track.index + 1}`;

          return (
            <li
              key={track.index}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 sm:px-4"
            >
              <span
                className={`w-40 min-w-0 truncate text-sm ${
                  silenced ? "text-dim line-through" : "text-bright"
                }`}
              >
                {name}
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
                  label={`Silenciar ${name}`}
                  activeClass="border-copper bg-copper/15 text-copper"
                >
                  M
                </MixButton>
                <MixButton
                  active={state.solo}
                  onClick={() => onChange(track.index, { solo: !state.solo })}
                  label={`Solo ${name}`}
                  activeClass="border-brass bg-brass/15 text-brass"
                >
                  S
                </MixButton>
                <button
                  type="button"
                  onClick={() => onSoloOnly(track.index)}
                  className="rounded-lg border border-line px-2 py-1.5 text-[11px] text-dim transition hover:border-line-2 hover:text-bright"
                >
                  só esta
                </button>
              </div>

              <div className="flex flex-1 items-center gap-2">
                <input
                  type="range"
                  aria-label={`Volume de ${name}`}
                  aria-valuetext={`${Math.round(state.volume * 100)} por cento`}
                  min={0}
                  max={2}
                  step={0.05}
                  value={state.volume}
                  onChange={(e) =>
                    onChange(track.index, { volume: Number(e.target.value) })
                  }
                  className="w-full min-w-24 cursor-pointer"
                />
                <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-dim">
                  {Math.round(state.volume * 100)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
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
      className={`h-8 w-8 rounded-lg border font-mono text-[11px] font-semibold transition ${
        active
          ? activeClass
          : "border-line bg-panel-2 text-dim hover:border-line-2 hover:text-bright"
      }`}
    >
      {children}
    </button>
  );
}
