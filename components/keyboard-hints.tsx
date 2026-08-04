"use client";

import { useEffect, useRef } from "react";

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ["Espaço"], action: "Tocar / pausar" },
  { keys: ["←", "→"], action: "Voltar / avançar 5 segundos" },
  { keys: ["Shift", "←/→"], action: "Voltar / avançar 20 segundos" },
  { keys: ["-", "+"], action: "Diminuir / aumentar a velocidade" },
  { keys: ["0"], action: "Velocidade de volta para 100%" },
  { keys: ["L"], action: "Repetir o trecho marcado" },
  { keys: ["M"], action: "Metrônomo" },
  { keys: ["C"], action: "Contagem de entrada" },
  { keys: ["X"], action: "Abrir / fechar o mixer" },
  { keys: ["Esc"], action: "Limpar o trecho marcado" },
  { keys: ["?"], action: "Este painel" },
];

/**
 * Native <dialog> instead of a hand-rolled overlay: it brings the focus trap,
 * Esc-to-close, inert background and correct role for free.
 */
export default function KeyboardHints({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="atalhos-titulo"
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-2xl border border-line-2 bg-panel p-0 text-bright backdrop:bg-stage/80 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 id="atalhos-titulo" className="font-display text-lg">
          Atalhos de teclado
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="grid h-8 w-8 place-items-center rounded-full text-dim transition hover:bg-panel-2 hover:text-bright"
        >
          <svg
            width="15"
            height="15"
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

      <dl className="divide-y divide-line px-5">
        {SHORTCUTS.map((item) => (
          <div key={item.action} className="flex items-center gap-4 py-2.5">
            <dt className="flex shrink-0 gap-1">
              {item.keys.map((key) => (
                <kbd
                  key={key}
                  className="min-w-7 rounded border border-line-2 bg-panel-2 px-1.5 py-0.5 text-center font-mono text-[11px] text-soft"
                >
                  {key}
                </kbd>
              ))}
            </dt>
            <dd className="text-sm text-dim">{item.action}</dd>
          </div>
        ))}
      </dl>

      <p className="border-t border-line px-5 py-3 text-xs text-dim">
        Arraste sobre a tablatura para marcar um trecho, depois use{" "}
        <kbd className="rounded border border-line-2 px-1 font-mono text-[11px]">L</kbd>{" "}
        para repetir só ele.
      </p>
    </dialog>
  );
}
