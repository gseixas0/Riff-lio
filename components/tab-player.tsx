"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AlphaTabApi } from "@coderline/alphatab";
import KeyboardHints from "@/components/keyboard-hints";
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

/** Colour tab per instrument family, so the track rack is scannable. */
const ROLE_MARKS: Record<TrackRole, string> = {
  guitar: "bg-brass/50",
  bass: "bg-copper/60",
  drums: "bg-line-2",
  other: "bg-line-2",
};

/**
 * Guitar Pro files usually name tracks "Pessoa | Instrumento". The instrument is
 * what you pick a track by, so it leads and the player is the footnote.
 */
function splitTrackName(name: string) {
  const parts = name.split("|").map((part) => part.trim());
  if (parts.length < 2 || !parts[1]) return { instrument: name, player: null };
  return { instrument: parts.slice(1).join(" · "), player: parts[0] };
}

type Props = {
  fileUrl: string;
  title: string;
  artist: string;
};

const ALPHATAB_BASE = "/alphatab";

/**
 * Guitar Pro 3-5 store text in Latin-1, so they need windows-1252 or every
 * accent turns into "�" ("O Papa É Pop" → "O Papa � Pop"). Guitar Pro 7/8
 * (.gp), .gpx and MusicXML are UTF-8 XML instead — and AlphaTab feeds the same
 * `importer.encoding` to all of them, so a global windows-1252 mangles the
 * newer formats the other way round ("Nós" → "NÃ³s"). Pick per extension.
 */
function importerEncoding(fileUrl: string): string {
  const path = fileUrl.split(/[?#]/, 1)[0];
  return /\.gp[345]$/i.test(path) ? "windows-1252" : "utf-8";
}

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
export default function TabPlayer({ fileUrl, title, artist }: Props) {
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
  // Musicians navigate by bar, not by second — the transport shows both.
  const [bar, setBar] = useState({ current: 1, total: 0 });

  const [speed, setSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionLabel, setSelectionLabel] = useState<string | null>(null);
  const [metronome, setMetronome] = useState(false);
  const [countIn, setCountIn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [staveView, setStaveView] = useState<StaveView>("tab");

  const [mix, setMix] = useState<Record<number, TrackMix>>({});
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

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
          encoding: importerEncoding(fileUrl),
        },
        notation: {
          /*
           * AlphaTab engraves its own title block from the file metadata. The
           * page already shows the title and artist, so the engraved one is a
           * duplicate — and it overlaps the tuning line underneath it.
           */
          elements: new Map([
            [alphaTab.NotationElement.ScoreTitle, false],
            [alphaTab.NotationElement.ScoreSubTitle, false],
            [alphaTab.NotationElement.ScoreArtist, false],
            [alphaTab.NotationElement.ScoreAlbum, false],
            [alphaTab.NotationElement.ScoreWords, false],
            [alphaTab.NotationElement.ScoreMusic, false],
            [alphaTab.NotationElement.ScoreWordsAndMusic, false],
            [alphaTab.NotationElement.ScoreCopyright, false],
          ]),
        },
        display: {
          scale: 1,
          layoutMode: alphaTab.LayoutMode.Page,
          staveProfile: alphaTab.StaveProfile.Tab,
          /*
           * AlphaTab paints the notation with dark ink for print. Repainting it
           * light-on-dark is the only way to get the score onto the app's own
           * surface — CSS cannot reach these glyphs, they are drawn into SVG
           * with explicit fills.
           */
          resources: {
            staffLineColor: "#413b34",
            barSeparatorColor: "#544c43",
            barNumberColor: "#8a8177",
            mainGlyphColor: "#f0eae1",
            secondaryGlyphColor: "#9a9187",
          },
        },
        player: {
          playerMode: alphaTab.PlayerMode.EnabledAutomatic,
          soundFont: `${ALPHATAB_BASE}/soundfont/sonivox.sf3`,
          scrollElement: viewport,
          scrollMode: alphaTab.ScrollMode.Continuous,
          // Clears the page margin the paper now sits inside, so the played bar
          // never hides under the top edge of the viewport.
          scrollOffsetY: -60,
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

        // Fires many times a second, so only re-render when the bar actually
        // turns over.
        const masterBars = api?.score?.masterBars;
        if (!masterBars?.length) return;
        const current = barNumberAt(masterBars, e.currentTick);
        setBar((was) =>
          was.current === current && was.total === masterBars.length
            ? was
            : { current, total: masterBars.length },
        );
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

  // Practising means one hand on the instrument, so every control has a key.
  // Never fires while the user is typing in a control or reading the shortcut
  // panel, and never steals the browser's own modifier combos.
  // Read out of `position` here: a dependency named `.current` is assumed to be
  // a ref by the exhaustive-deps rule, and refs are not valid dependencies.
  const { current: currentTime, end: endTime } = position;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (showShortcuts) return;

      const api = apiRef.current;
      const jump = event.shiftKey ? 20_000 : 5_000;

      switch (event.key) {
        case " ":
          event.preventDefault();
          api?.playPause();
          break;
        case "ArrowLeft":
          event.preventDefault();
          seek(Math.max(0, currentTime - jump));
          break;
        case "ArrowRight":
          event.preventDefault();
          seek(Math.min(endTime, currentTime + jump));
          break;
        case "-":
          event.preventDefault();
          changeSpeed(Math.max(0.25, Math.round((speed - 0.05) * 100) / 100));
          break;
        case "+":
        case "=":
          event.preventDefault();
          changeSpeed(Math.min(1.5, Math.round((speed + 0.05) * 100) / 100));
          break;
        case "0":
          event.preventDefault();
          changeSpeed(1);
          break;
        case "l":
        case "L":
          toggleLoop();
          break;
        case "m":
        case "M":
          toggleMetronome();
          break;
        case "c":
        case "C":
          toggleCountIn();
          break;
        case "x":
        case "X":
          setIsMixerOpen((open) => !open);
          break;
        case "Escape":
          clearSelection();
          break;
        case "?":
          event.preventDefault();
          setShowShortcuts(true);
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    showShortcuts,
    currentTime,
    endTime,
    speed,
    seek,
    changeSpeed,
    toggleLoop,
    toggleMetronome,
    toggleCountIn,
    clearSelection,
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {tracks.length > 1 && (
        <div
          role="group"
          aria-label="Faixa exibida na tablatura"
          className="flex gap-1.5 overflow-x-auto border-b border-line bg-panel px-3 py-2 sm:px-4"
        >
          {tracks.map((track) => {
            const active = activeTrack === track.index;
            const { instrument, player } = splitTrackName(
              track.name || `Faixa ${track.index + 1}`,
            );
            return (
              <button
                key={track.index}
                type="button"
                onClick={() => selectTrack(track.index)}
                aria-pressed={active}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg border px-3 py-1.5 text-left transition ${
                  active
                    ? "border-brass bg-brass/12 text-brass"
                    : "border-line bg-panel-2 text-soft hover:border-line-2 hover:text-bright"
                }`}
              >
                <span
                  aria-hidden
                  className={`h-6 w-0.5 rounded-full ${
                    active ? "bg-brass" : ROLE_MARKS[track.role]
                  }`}
                />
                <span className="leading-tight">
                  <span className="block text-xs font-medium">{instrument}</span>
                  {player && (
                    <span
                      className={`block text-[10px] ${active ? "opacity-70" : "text-dim"}`}
                    >
                      {player}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div ref={viewportRef} className="at-desk min-h-0 flex-1 overflow-auto">
        {error ? (
          <div
            role="alert"
            className="mx-auto mt-20 max-w-sm rounded-2xl border border-copper/40 bg-copper/[0.06] p-6 text-center"
          >
            <p className="font-display text-lg text-copper">
              Não foi possível carregar a tablatura
            </p>
            <p className="mt-2 font-mono text-xs leading-relaxed text-dim">{error}</p>
          </div>
        ) : (
          <>
            {isRendering && (
              <div className="p-20 text-center">
                {/* Four beats filling in, so the wait reads as musical time. */}
                <div className="mx-auto flex w-fit items-end gap-1.5" aria-hidden>
                  {[0, 1, 2, 3].map((beat) => (
                    <span
                      key={beat}
                      className="h-7 w-1 animate-pulse rounded-full bg-line-2"
                      style={{ animationDelay: `${beat * 160}ms` }}
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm text-dim">Montando a tablatura…</p>
              </div>
            )}
            {/*
             * Everything scrolls together inside the viewport AlphaTab drives,
             * so the title behaves like a cover page and scrolls away as the
             * score moves up.
             */}
            {/*
             * No max width: AlphaTab justifies each system to whatever it is
             * given, so capping the container is what makes the staff look
             * cramped on a wide screen. Only a small gutter is kept.
             */}
            <div className="w-full px-2 pb-16 sm:px-6">
              <div className={`py-8 text-center ${isRendering ? "hidden" : ""}`}>
                <h2 className="font-display text-3xl leading-tight text-bright sm:text-[2.4rem]">
                  {title}
                </h2>
                <p className="mt-1.5 font-display text-lg italic text-brass">{artist}</p>
                <div className="fretboard-rule mx-auto mt-5 max-w-xs" aria-hidden />
              </div>

              <div ref={surfaceRef} />
            </div>
          </>
        )}
      </div>

      {/* Screen-reader narration of the transport, which is otherwise silent. */}
      <p aria-live="polite" className="sr-only">
        {error
          ? "Erro ao carregar a tablatura."
          : isRendering
            ? "Carregando a tablatura."
            : isPlaying
              ? `Tocando, ${Math.round(speed * 100)} por cento da velocidade.`
              : "Pausado."}
        {hasSelection && selectionLabel
          ? ` Trecho marcado: ${selectionLabel}${isLooping ? ", em repetição" : ""}.`
          : ""}
      </p>

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
        bar={bar}
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
        onOpenShortcuts={() => setShowShortcuts(true)}
      />

      <KeyboardHints open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

type MasterBars = NonNullable<AlphaTabApi["score"]>["masterBars"];

/** 1-based number of the bar a midi tick falls in. */
function barNumberAt(masterBars: MasterBars, tick: number) {
  let result = masterBars[0];
  for (const bar of masterBars) {
    if (bar.start > tick) break;
    result = bar;
  }
  return result.index + 1;
}

/** Turns a tick range into a human "compassos 5–8" label. */
function describeRange(api: AlphaTabApi, startTick: number, endTick: number) {
  const masterBars = api.score?.masterBars;
  if (!masterBars?.length) return null;

  const first = barNumberAt(masterBars, startTick);
  const last = barNumberAt(masterBars, Math.max(startTick, endTick - 1));
  return first === last ? `compasso ${first}` : `compassos ${first}–${last}`;
}
