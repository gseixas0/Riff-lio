export default function SetupNotice() {
  return (
    <div className="rounded-2xl border border-brass/30 bg-brass/[0.04] p-6 text-sm leading-relaxed text-soft">
      <p className="mb-3 font-display text-lg text-brass">
        Supabase ainda não está configurado
      </p>
      <ol className="list-decimal space-y-2 pl-5 marker:font-mono marker:text-dim">
        <li>
          Crie um projeto em{" "}
          <a
            href="https://supabase.com/dashboard"
            className="rounded text-bright underline underline-offset-2 transition hover:text-brass"
            target="_blank"
            rel="noreferrer"
          >
            supabase.com
          </a>
          .
        </li>
        <li>
          Rode o conteúdo de <Code>supabase/schema.sql</Code> no SQL Editor — isso
          cria a tabela <Code>musicas</Code> e o bucket <Code>tabs</Code>.
        </li>
        <li>
          Copie <Code>.env.example</Code> para <Code>.env.local</Code> e preencha
          as duas variáveis.
        </li>
        <li>Reinicie o servidor de desenvolvimento.</li>
      </ol>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[13px] text-bright">
      {children}
    </code>
  );
}
