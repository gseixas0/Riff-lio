"use client";

export type StaveView = "both" | "tab" | "score";

type Props = {
  isPlaying: boolean;
  isPlayerReady: boolean;
  position: { current: number; end: number };
  bar: { current: number; total: number };
  onTogglePlay: () => void;
  onStop: () => void;
  onSeek: (ms: number) => void;
  speed: number;
  onSpeedChange: (value: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  hasSelection: boolean;
  selectionLabel: string | null;
  onClearSelection: () => void;
  metronome: boolean;
  onToggleMetronome: () => void;
  countIn: boolean;
  onToggleCountIn: () => void;
  zoom: number;
  onZoomChange: (value: number) => void;
  staveView: StaveView;
  onStaveViewChange: (view: StaveView) => void;
  isMixerOpen: boolean;
  onToggleMixer: () => void;
  onOpenShortcuts: () => void;
};

const STAVE_VIEWS: { value: StaveView; label: string }[] = [
  { value: "both", label: "Tab + partitura" },
  { value: "tab", label: "Só tab" },
  { value: "score", label: "Só partitura" },
];

export default function PlayerControls(props: Props) {
  const {
    isPlaying,
    isPlayerReady,
    position,
    bar,
    onTogglePlay,
    onStop,
    onSeek,
    speed,
    onSpeedChange,
    isLooping,
    onToggleLoop,
    hasSelection,
    selectionLabel,
    onClearSelection,
    metronome,
    onToggleMetronome,
    countIn,
    onToggleCountIn,
    zoom,
    onZoomChange,
    staveView,
    onStaveViewChange,
    isMixerOpen,
    onToggleMixer,
    onOpenShortcuts,
  } = props;

  const played = position.end > 0 ? (position.current / position.end) * 100 : 0;

  return (
    <div className="border-t border-line bg-panel/95 backdrop-blur">
      {/*
       * The seek bar is the signature element: a wound string that fills in
       * violet as the song plays and shimmers while it is moving.
       */}
      <input
        type="range"
        aria-label="Posição da música"
        aria-valuetext={`${formatTime(position.current)} de ${formatTime(position.end)}`}
        min={0}
        max={Math.max(position.end, 1)}
        value={Math.min(position.current, position.end)}
        onChange={(e) => onSeek(Number(e.target.value))}
        disabled={!isPlayerReady}
        style={{
          background: `linear-gradient(to right, var(--color-neon) ${played}%, var(--color-line-2) ${played}%)`,
        }}
        className={`block h-1 w-full cursor-pointer rounded-none disabled:cursor-not-allowed ${
          isPlaying ? "string-live" : ""
        }`}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!isPlayerReady}
            aria-label={isPlaying ? "Pausar" : "Tocar"}
            title={isPlaying ? "Pausar (Espaço)" : "Tocar (Espaço)"}
            className="grid h-12 w-12 place-items-center rounded-full bg-neon text-stage transition hover:bg-neon-deep disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-dim"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={!isPlayerReady}
            aria-label="Parar e voltar ao início"
            title="Parar e voltar ao início"
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-soft transition hover:border-line-2 hover:bg-panel-2 hover:text-bright disabled:opacity-40"
          >
            <StopIcon />
          </button>
          <span className="ml-1 flex flex-col leading-tight" aria-hidden>
            <span className="font-mono text-xs tabular-nums text-soft">
              {formatTime(position.current)}
              <span className="text-dim"> / {formatTime(position.end)}</span>
            </span>
            {bar.total > 0 && (
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                comp. {bar.current}
                <span className="opacity-60">/{bar.total}</span>
              </span>
            )}
          </span>
        </div>

        <Divider />

        <div className="flex items-center gap-2.5">
          <label htmlFor="speed" className="text-[11px] uppercase tracking-[0.12em] text-dim">
            Vel.
          </label>
          <input
            id="speed"
            type="range"
            min={0.25}
            max={1.5}
            step={0.05}
            value={speed}
            aria-valuetext={`${Math.round(speed * 100)} por cento`}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-24 cursor-pointer sm:w-28"
          />
          <button
            type="button"
            onClick={() => onSpeedChange(1)}
            aria-label="Voltar a velocidade para 100%"
            title="Voltar para 100%"
            className={`w-12 rounded-md px-1 py-0.5 text-right font-mono text-xs tabular-nums transition hover:bg-panel-2 ${
              speed === 1 ? "text-soft" : "text-neon"
            }`}
          >
            {Math.round(speed * 100)}%
          </button>
        </div>

        <Divider />

        <div className="flex items-center gap-1.5">
          <Toggle active={isLooping} onClick={onToggleLoop} label="Repetir o trecho" hint="L">
            <LoopIcon />
          </Toggle>
          <Toggle active={metronome} onClick={onToggleMetronome} label="Metrônomo" hint="M">
            <MetronomeIcon />
          </Toggle>
          <Toggle
            active={countIn}
            onClick={onToggleCountIn}
            label="Contagem de entrada"
            hint="C"
          >
            <CountInIcon />
          </Toggle>
          <Toggle
            active={isMixerOpen}
            onClick={onToggleMixer}
            label="Mixer, volume por instrumento"
            hint="X"
          >
            <MixerIcon />
          </Toggle>
        </div>

        <Divider />

        <div className="flex items-center gap-2">
          <label htmlFor="zoom" className="sr-only">
            Zoom da tablatura
          </label>
          <select
            id="zoom"
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="h-9 rounded-lg border border-line bg-panel-2 px-2 text-xs text-soft transition hover:border-line-2 hover:text-bright"
          >
            {[0.75, 1, 1.25, 1.5, 2].map((value) => (
              <option key={value} value={value}>
                Zoom {Math.round(value * 100)}%
              </option>
            ))}
          </select>

          <label htmlFor="stave" className="sr-only">
            Notação exibida
          </label>
          <select
            id="stave"
            value={staveView}
            onChange={(e) => onStaveViewChange(e.target.value as StaveView)}
            className="h-9 rounded-lg border border-line bg-panel-2 px-2 text-xs text-soft transition hover:border-line-2 hover:text-bright"
          >
            {STAVE_VIEWS.map((view) => (
              <option key={view.value} value={view.value}>
                {view.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {hasSelection ? (
            <p className="text-xs text-soft">
              Trecho <span className="text-neon">{selectionLabel}</span>{" "}
              <button
                type="button"
                onClick={onClearSelection}
                className="rounded underline underline-offset-2 transition hover:text-bright"
              >
                limpar
              </button>
            </p>
          ) : (
            <p className="hidden text-xs text-dim lg:block">
              Arraste sobre a tab para marcar um trecho
            </p>
          )}

          <button
            type="button"
            onClick={onOpenShortcuts}
            aria-label="Ver atalhos de teclado"
            title="Atalhos de teclado (?)"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line font-mono text-sm text-dim transition hover:border-line-2 hover:text-bright"
          >
            ?
          </button>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="hidden h-7 w-px bg-line sm:block" />;
}

function Toggle({
  active,
  onClick,
  label,
  hint,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={`${label} (${hint})`}
      className={`grid h-10 w-10 place-items-center rounded-lg border transition ${
        active
          ? "border-neon bg-neon/15 text-neon"
          : "border-line bg-panel-2 text-dim hover:border-line-2 hover:text-bright"
      }`}
    >
      {children}
    </button>
  );
}

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function PlayIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72L19 12 8 5.14Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}

function LoopIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function MetronomeIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 3h6l4 18H5L9 3Z" />
      <path d="M6.5 15h11" />
      <path d="M12 21V8" />
    </svg>
  );
}

function MixerIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 21V14M6 10V3M12 21V12M12 8V3M18 21V16M18 12V3" />
      <path d="M3 14h6M9 8h6M15 16h6" />
    </svg>
  );
}

function CountInIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
