"use client";

export type StaveView = "both" | "tab" | "score";

type Props = {
  isPlaying: boolean;
  isPlayerReady: boolean;
  position: { current: number; end: number };
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
  } = props;

  return (
    <div className="border-t border-ink-800 bg-ink-900/95 backdrop-blur">
      <input
        type="range"
        aria-label="Posição da música"
        min={0}
        max={Math.max(position.end, 1)}
        value={Math.min(position.current, position.end)}
        onChange={(e) => onSeek(Number(e.target.value))}
        disabled={!isPlayerReady}
        className="block h-1 w-full cursor-pointer rounded-none disabled:cursor-not-allowed"
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!isPlayerReady}
            aria-label={isPlaying ? "Pausar" : "Tocar"}
            className="grid h-11 w-11 place-items-center rounded-full bg-glow text-ink-950 transition hover:bg-glow-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={!isPlayerReady}
            aria-label="Parar"
            className="grid h-9 w-9 place-items-center rounded-full bg-ink-800 text-ink-300 transition hover:bg-ink-700 hover:text-ink-100 disabled:opacity-40"
          >
            <StopIcon />
          </button>
          <span className="ml-1 font-mono text-xs tabular-nums text-ink-400">
            {formatTime(position.current)} / {formatTime(position.end)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="speed" className="text-xs text-ink-400">
            Velocidade
          </label>
          <input
            id="speed"
            type="range"
            min={0.25}
            max={1.5}
            step={0.05}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-28 cursor-pointer"
          />
          <span className="w-10 font-mono text-xs tabular-nums text-ink-100">
            {Math.round(speed * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Toggle active={isLooping} onClick={onToggleLoop} label="Repetir">
            <LoopIcon />
          </Toggle>
          <Toggle active={metronome} onClick={onToggleMetronome} label="Metrônomo">
            <MetronomeIcon />
          </Toggle>
          <Toggle active={countIn} onClick={onToggleCountIn} label="Contagem de entrada">
            <CountInIcon />
          </Toggle>
          <Toggle
            active={isMixerOpen}
            onClick={onToggleMixer}
            label="Mixer (volume por instrumento)"
          >
            <MixerIcon />
          </Toggle>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="zoom" className="text-xs text-ink-400">
            Zoom
          </label>
          <select
            id="zoom"
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="rounded-md border border-ink-700 bg-ink-800 px-2 py-1 text-xs text-ink-100"
          >
            {[0.75, 1, 1.25, 1.5, 2].map((value) => (
              <option key={value} value={value}>
                {Math.round(value * 100)}%
              </option>
            ))}
          </select>

          <select
            aria-label="Notação exibida"
            value={staveView}
            onChange={(e) => onStaveViewChange(e.target.value as StaveView)}
            className="rounded-md border border-ink-700 bg-ink-800 px-2 py-1 text-xs text-ink-100"
          >
            {STAVE_VIEWS.map((view) => (
              <option key={view.value} value={view.value}>
                {view.label}
              </option>
            ))}
          </select>
        </div>

        <p className="ml-auto text-xs text-ink-400">
          {hasSelection ? (
            <>
              Trecho: <span className="text-glow">{selectionLabel}</span>{" "}
              <button
                type="button"
                onClick={onClearSelection}
                className="underline underline-offset-2 hover:text-ink-100"
              >
                limpar
              </button>
            </>
          ) : (
            "Arraste sobre a tab para marcar um trecho e ative Repetir"
          )}
        </p>
      </div>
    </div>
  );
}

function Toggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-md border transition ${
        active
          ? "border-glow/60 bg-glow/15 text-glow"
          : "border-ink-700 bg-ink-800 text-ink-400 hover:text-ink-100"
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72L19 12 8 5.14Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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
