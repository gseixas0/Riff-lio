export default function SetupNotice() {
  return (
    <div className="rounded-xl border border-glow/30 bg-glow/5 p-6 text-sm leading-relaxed text-ink-300">
      <p className="mb-3 font-medium text-glow">Supabase ainda não está configurado</p>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>
          Crie um projeto em{" "}
          <a
            href="https://supabase.com/dashboard"
            className="text-ink-100 underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            supabase.com
          </a>
          .
        </li>
        <li>
          Rode o conteúdo de <code className="font-mono text-ink-100">supabase/schema.sql</code>{" "}
          no SQL Editor — isso cria a tabela <code className="font-mono text-ink-100">musicas</code>{" "}
          e o bucket <code className="font-mono text-ink-100">tabs</code>.
        </li>
        <li>
          Copie <code className="font-mono text-ink-100">.env.example</code> para{" "}
          <code className="font-mono text-ink-100">.env.local</code> e preencha as duas variáveis.
        </li>
        <li>Reinicie o servidor de desenvolvimento.</li>
      </ol>
    </div>
  );
}
