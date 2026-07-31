"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AlphaTabApi } from "@coderline/alphatab";
import Mixer from "@/components/mixer";
import PlayerControls, {
  type StaveView,
} from "@/components/player-controls";

export type TrackRole = "guitar" | "bass" | "drums" | "other";

export type TrackInfo = {
  index: number;
  name: string;
  role: TrackRole;
};

export type TrackMix = {
  mute: boolean;
  solo: boolean;
  volume: number;
};

/**
 * General MIDI program ranges: 24-31 are guitars, 32-39 basses, and channel 9 is
 * always percussion. Used only to label tracks in the mixer.
 */
function trackRole(program: number, channel: number): TrackRole {
  if (channel === 9) return "drums";
  if (program >= 24 && program <= 31) return "guitar";
  if (program >= 32 && program <= 39) return "bass";
  return "other";
}

type Props = {
  fileUrl: string;
};

const ALPHATAB_BASE = "/alphatab";

type AlphaTabModule = typeof import("@coderline/alphatab");
let alphaTabModule: Promise<AlphaTabModule> | null = null;

/**
 * AlphaTab spawns its worker and audio worklet from URLs it derives from its own
 * `import.meta.url`, through an indirection that no bundler can rewrite. If the
 * library were bundled, those URLs would point at a Turbopack chunk path and the
 * worker would 404 asynchronously — silently killing rendering and playback.
 * Loading the copy in /public at runtime (turbopackIgnore keeps the bundler out)
 * makes `import.meta.url` resolve next to the worker files, so it just works.
 */
function loadAlphaTab(): Promise<AlphaTabModule> {
  alphaTabModule ??= import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */
    `${ALPHATAB_BASE}/alphaTab.mjs`
  ) as Promise<AlphaTabModule>;
  return alphaTabModule;
}

/** AlphaTab is browser-only, so the whole player runs client-side. */
export default function TabPlayer({ fileUrl }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<AlphaTabApi | null>(null);

  const [isRendering, setIsRendering] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [activeTrack, setActiveTrack] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState({ current: 0, end: 0 });

  const [speed, setSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionLabel, setSelectionLabel] = useState<string | null>(null);
  const [metronome, setMetronome] = useState(false);
  const [countIn, setCountIn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [staveView, setStaveView] = useState<StaveView>("both");

  const [mix, setMix] = useState<Record<number, TrackMix>>({});
  const [isMixerOpen, setIsMixerOpen] = useState(false);

  useEffect(() => {
    const surface = surfaceRef.current;
    const viewport = viewportRef.current;
    if (!surface || !viewport) return;

    let api: AlphaTabApi | null = null;
    let disposed = false;

    (async () => {
      const alphaTab = await loadAlphaTab();
      if (disposed) return;

      api = new alphaTab.AlphaTabApi(surface, {
        core: {
          file: fileUrl,
          fontDirectory: `${ALPHATAB_BASE}/font/`,
          scriptFile: `${ALPHATAB_BASE}/alphaTab.mjs`,
        },
        importer: {
          // Guitar Pro 3-5 files store text in Latin-1, not UTF-8. Decoding them
          // as UTF-8 mangles every accent, which is most Brazilian song lyrics
          // and titles ("O Papa É Pop" → "O Papa � Pop").
          encoding: "windows-1252",
        },
        display: {
          scale: 1,
          layoutMode: alphaTab.LayoutMode.Page,
          staveProfile: alphaTab.StaveProfile.ScoreTab,
        },
        player: {
          playerMode: alphaTab.PlayerMode.EnabledAutomatic,
          soundFont: `${ALPHATAB_BASE}/soundfont/sonivox.sf3`,
          scrollElement: viewport,
          scrollMode: alphaTab.ScrollMode.Continuous,
          scrollOffsetY: -30,
          enableCursor: true,
          enableAnimatedBeatCursor: true,
          enableElementHighlighting: true,
          enableUserInteraction: true,
        },
      });
      apiRef.current = api;

      api.error.on((e) => setError(e.message || "Erro ao carregar a tablatura."));
      api.renderStarted.on(() => setIsRendering(true));
      api.renderFinished.on(() => setIsRendering(false));
      api.playerReady.on(() => setIsPlayerReady(true));

      api.scoreLoaded.on((score) => {
        setTracks(
          score.tracks.map((t) => ({
            index: t.index,
            name: t.name,
            role: trackRole(t.playbackInfo.program, t.playbackInfo.primaryChannel),
          })),
        );
        setMix(
          Object.fromEntries(
            score.tracks.map((t) => [
              t.index,
              { mute: false, solo: false, volume: 1 },
            ]),
          ),
        );
        setActiveTrack(0);
      });

      api.playerStateChanged.on((e) => {
        setIsPlaying(e.state === alphaTab.synth.PlayerState.Playing);
      });

      api.playerPositionChanged.on((e) => {
        setPosition({ current: e.currentTime, end: e.endTime });
      });

      api.playbackRangeChanged.on((e) => {
        const range = e.playbackRange;
        setHasSelection(range !== null);
        setSelectionLabel(range ? describeRange(api!, range.startTick, range.endTick) : null);
      });
    })();

    return () => {
      disposed = true;
      apiRef.current = null;
      api?.destroy();
    };
  }, [fileUrl]);

  const togglePlay = useCallback(() => apiRef.current?.playPause(), []);
  const stop = useCallback(() => apiRef.current?.stop(), []);

  const seek = useCallback((ms: number) => {
    const api = apiRef.current;
    if (!api) return;
    api.timePosition = ms;
    setPosition((p) => ({ ...p, current: ms }));
  }, []);

  const changeSpeed = useCallback((value: number) => {
    setSpeed(value);
    if (apiRef.current) apiRef.current.playbackSpeed = value;
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((was) => {
      const next = !was;
      if (apiRef.current) apiRef.current.isLooping = next;
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    if (apiRef.current) apiRef.current.playbackRange = null;
  }, []);

  const toggleMetronome = useCallback(() => {
    setMetronome((was) => {
      const next = !was;
      if (apiRef.current) apiRef.current.metronomeVolume = next ? 1 : 0;
      return next;
    });
  }, []);

  const toggleCountIn = useCallback(() => {
    setCountIn((was) => {
      const next = !was;
      if (apiRef.current) apiRef.current.countInVolume = next ? 1 : 0;
      return next;
    });
  }, []);

  const changeZoom = useCallback((value: number) => {
    setZoom(value);
    const api = apiRef.current;
    if (!api) return;
    api.settings.display.scale = value;
    api.updateSettings();
    api.render();
  }, []);

  const changeStaveView = useCallback(async (view: StaveView) => {
    setStaveView(view);
    const api = apiRef.current;
    if (!api) return;
    const alphaTab = await loadAlphaTab();
    api.settings.display.staveProfile =
      view === "tab"
        ? alphaTab.StaveProfile.Tab
        : view === "score"
          ? alphaTab.StaveProfile.Score
          : alphaTab.StaveProfile.ScoreTab;
    api.updateSettings();
    api.render();
  }, []);

  // Mixer changes go straight to the synth; React state only mirrors them so the
  // UI stays in sync. AlphaTab keeps playing every track of the score regardless
  // of which one is rendered on screen, so this is what actually controls sound.
  const updateMix = useCallback(
    (index: number, patch: Partial<TrackMix>) => {
      const api = apiRef.current;
      const track = api?.score?.tracks[index];
      if (!api || !track) return;

      if (patch.mute !== undefined) api.changeTrackMute([track], patch.mute);
      if (patch.solo !== undefined) api.changeTrackSolo([track], patch.solo);
      if (patch.volume !== undefined) api.changeTrackVolume([track], patch.volume);

      setMix((current) => ({
        ...current,
        [index]: { ...current[index], ...patch },
      }));
    },
    [],
  );

  const soloOnly = useCallback(
    (index: number) => {
      const api = apiRef.current;
      if (!api?.score) return;

      for (const track of api.score.tracks) {
        const solo = track.index === index;
        api.changeTrackSolo([track], solo);
        api.changeTrackMute([track], false);
      }
      setMix((current) =>
        Object.fromEntries(
          Object.entries(current).map(([key, value]) => [
            key,
            { ...value, solo: Number(key) === index, mute: false },
          ]),
        ),
      );
    },
    [],
  );

  const resetMix = useCallback(() => {
    const api = apiRef.current;
    if (!api?.score) return;

    for (const track of api.score.tracks) {
      api.changeTrackSolo([track], false);
      api.changeTrackMute([track], false);
      api.changeTrackVolume([track], 1);
    }
    setMix((current) =>
      Object.fromEntries(
        Object.keys(current).map((key) => [
          key,
          { mute: false, solo: false, volume: 1 },
        ]),
      ),
    );
  }, []);

  const selectTrack = useCallback((index: number) => {
    const api = apiRef.current;
    if (!api?.score) return;
    setActiveTrack(index);
    api.renderTracks([api.score.tracks[index]]);
  }, []);

  // Space toggles playback like every other tab player, but never while the
  // user is typing in a control.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.code !== "Space") return;
      event.preventDefault();
      apiRef.current?.playPause();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {tracks.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b border-ink-800 bg-ink-900 px-4 py-2">
          {tracks.map((track) => (
            <button
              key={track.index}
              type="button"
              onClick={() => selectTrack(track.index)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                activeTrack === track.index
                  ? "bg-glow text-ink-950"
                  : "bg-ink-800 text-ink-300 hover:bg-ink-700 hover:text-ink-100"
              }`}
            >
              {track.name || `Faixa ${track.index + 1}`}
            </button>
          ))}
        </div>
      )}

      <div ref={viewportRef} className="at-surface min-h-0 flex-1 overflow-auto">
        {error ? (
          <div className="p-10 text-center text-sm text-red-700">
            Não foi possível carregar a tablatura.
            <span className="mt-1 block font-mono text-xs opacity-70">{error}</span>
          </div>
        ) : (
          <>
            {isRendering && (
              <p className="p-10 text-center text-sm text-neutral-500">
                Carregando tablatura…
              </p>
            )}
            <div ref={surfaceRef} />
          </>
        )}
      </div>

      {isMixerOpen && tracks.length > 0 && (
        <Mixer
          tracks={tracks}
          mix={mix}
          onChange={updateMix}
          onSoloOnly={soloOnly}
          onReset={resetMix}
          onClose={() => setIsMixerOpen(false)}
        />
      )}

      <PlayerControls
        isMixerOpen={isMixerOpen}
        onToggleMixer={() => setIsMixerOpen((open) => !open)}
        isPlaying={isPlaying}
        isPlayerReady={isPlayerReady}
        position={position}
        onTogglePlay={togglePlay}
        onStop={stop}
        onSeek={seek}
        speed={speed}
        onSpeedChange={changeSpeed}
        isLooping={isLooping}
        onToggleLoop={toggleLoop}
        hasSelection={hasSelection}
        selectionLabel={selectionLabel}
        onClearSelection={clearSelection}
        metronome={metronome}
        onToggleMetronome={toggleMetronome}
        countIn={countIn}
        onToggleCountIn={toggleCountIn}
        zoom={zoom}
        onZoomChange={changeZoom}
        staveView={staveView}
        onStaveViewChange={changeStaveView}
      />
    </div>
  );
}

/** Turns a tick range into a human "compassos 5–8" label. */
function describeRange(api: AlphaTabApi, startTick: number, endTick: number) {
  const masterBars = api.score?.masterBars;
  if (!masterBars?.length) return null;

  const barAt = (tick: number) => {
    let result = masterBars[0];
    for (const bar of masterBars) {
      if (bar.start > tick) break;
      result = bar;
    }
    return result.index + 1;
  };

  const first = barAt(startTick);
  const last = barAt(Math.max(startTick, endTick - 1));
  return first === last ? `compasso ${first}` : `compassos ${first}–${last}`;
}
