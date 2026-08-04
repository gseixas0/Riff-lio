# Riffólio

Portfólio pessoal de músicas que estou aprendendo no violão e no baixo, com tablatura interativa e player sincronizado — cursor acompanhando a tab, controle de velocidade e loop de trechos.

## Rodando localmente

```bash
npm install          # também copia os assets do AlphaTab para public/alphatab
cp .env.example .env.local
npm run dev
```

Preencha `.env.local` com as credenciais do Supabase (Dashboard → Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com/dashboard).
2. Cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor e execute — cria a tabela `musicas`, as políticas de leitura e o bucket `tabs`.
3. Suba os arquivos de tab (`.gp5`, `.gpx`, `.gp`, `.musicxml`) no bucket `tabs`.
4. Insira uma linha em `musicas` com `arquivo_tab` = caminho do arquivo dentro do bucket.

## Como usar o player

- **Espaço** — tocar / pausar
- **Arrastar sobre a tab** — marca um trecho; ative *Repetir* para fazer loop dele
- **Velocidade** — 25% a 150%
- **Metrônomo** e **contagem de entrada** — botões na barra inferior
- **Mixer** — volume, mute e solo por instrumento. Silencie o violão para tocar
  você mesmo por cima, ou use *só esta* no baixo para estudá-lo isolado. As faixas
  são rotuladas automaticamente (violão/guitarra, baixo, bateria) pelo instrumento
  MIDI do arquivo.

O som vem do sintetizador MIDI embutido. Arquivos Guitar Pro 8 que trazem um
*backing track* de áudio real embutido tocam esse áudio automaticamente — nesse
caso o mixer por instrumento não se aplica, porque a gravação é uma mixagem única.

## Deploy

Push na `main` → deploy automático na Vercel. PRs ganham URL de preview. As duas variáveis de ambiente precisam estar cadastradas no projeto da Vercel.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · [AlphaTab](https://alphatab.net) · Supabase (Postgres + Storage) · Vercel

## Licença

[MIT](LICENSE). Vale para o código — os arquivos de tablatura não são meus e não estão no repositório.
