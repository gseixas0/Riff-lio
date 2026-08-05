# Riffólio

Portfólio pessoal de músicas que estou aprendendo no violão e baixo, no estilo do Songsterr: lista de músicas com tablatura interativa e player de áudio sincronizado (cursor acompanhando a tab, controle de velocidade, loop de trechos).

Uso individual. Sem multiusuário, sem monetização, sem escala.

## Stack

| Camada | Escolha |
|---|---|
| Frontend | Next.js (App Router) + TypeScript |
| Renderização de tabs | [AlphaTab](https://alphatab.net) |
| Backend / Banco / Arquivos | Supabase (Postgres + Storage + Auth se necessário) |
| Deploy | Vercel (plano Hobby/gratuito) |
| Repositório | GitHub — deploy automático a cada push na `main` |

AlphaTab lê arquivos Guitar Pro (`.gp`, `.gp3`, `.gp4`, `.gp5`, `.gpx`) ou MusicXML e sincroniza o playback com a notação.

## Regras importantes

- **NÃO usar os add-ons nativos da Vercel** (Postgres, Blob, KV). Têm cobrança separada do plano gratuito. Dados e arquivos sempre no Supabase.
- Manter tudo dentro dos limites do free tier (Vercel Hobby + Supabase free).
- Projeto pessoal: priorizar simplicidade sobre features de escala. Sem multi-tenancy, sem billing, sem features enterprise.

## Estrutura de dados (Supabase)

Tabela `musicas`:

| Coluna | Descrição |
|---|---|
| `id` | chave primária |
| `titulo` | nome da música |
| `artista` | artista/banda |
| `arquivo_tab` | referência ao arquivo no Storage |
| `status` | `quero aprender` \| `aprendendo` \| `aprendida` — default `aprendendo` |
| `data_adicionada` | timestamp |

Storage: bucket dedicado para os arquivos de tab (`.gp5` / `.gpx` / `.musicxml`).

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Ficam em `.env.local` (nunca commitado) e nas Environment Variables do projeto na Vercel.

## Convenções

- Interface (textos visíveis ao usuário): **português**.
- Código, nomes de variáveis/funções, comentários: **inglês**.
- Componentes React em `/components`, páginas em `/app`.
- Nomes de arquivo em kebab-case (`tab-player.tsx`).
- As colunas da tabela `musicas` ficam em português (é o contrato com o banco) — só elas.

## Design

Direção: **palco noturno** — preto com fundo violeta, editorial em cima. Os tokens
vivem no `@theme` de `app/globals.css`; não usar cor solta no componente.

- Neutros com **fundo violeta**, nunca cinza puro (`stage`, `panel`, `line`,
  `dim`, `soft`, `bright`). Chrome e acento partilham a matiz, então a tela lê
  como uma fonte de luz só.
- Acento `neon` (violeta, + `neon-deep`), secundário `ice` (azul, segunda voz:
  baixo, seleção), `mint` (aprendida) e `alert` (só erro — quente de propósito,
  quebra a paleta pra ser lido).
- **Violeta só no acionável**: botão, foco, compasso tocando. Sem degradê
  decorativo, sem card de vidro — é o que separa isso de UI genérica de IA.
- Tipografia: `font-display` (Fraunces) em títulos, `font-sans` (Geist) na
  interface, `font-mono` (Geist Mono) em número, tempo e atalho.
- Motivo assinatura: **corda / traste**. `.fretboard-rule` como régua de seção e
  a barra de posição desenhada como corda que preenche em violeta.
- A partitura do AlphaTab tem cor própria em `display.resources`
  (`tab-player.tsx`) — CSS não alcança aquele SVG. Mexeu na paleta, mexe lá.

Acessibilidade é requisito, não enfeite: foco visível global via `:focus-visible`,
`prefers-reduced-motion` respeitado — com uma exceção só, `.at-cursor-beat`: o
deslize do cursor é uma `transition` inline da AlphaTab e é a informação de onde
a música está; matando ela, a seta teleporta de batida em batida. Por isso o
seletor é `*:not(.at-cursor-beat)`, e não um override depois (o `!important`
ganharia do estilo inline da lib). Ainda: `aria-pressed` em todo toggle,
`aria-valuetext` em todo slider (senão o leitor de tela fala "83000"), região
`aria-live` narrando o transporte, e todo controle do player tem atalho de tecla
(painel `?`).

## Estrutura

```
app/                    páginas (App Router)
  page.tsx              lista de músicas
  musicas/[id]/page.tsx player com a tab
components/             componentes React
lib/supabase.ts         client + URL pública dos arquivos do Storage
lib/songs.ts            leitura da tabela musicas
lib/types.ts            tipo Song e os status
supabase/schema.sql     tabela, políticas e bucket — rodar no SQL Editor
scripts/                cópia dos assets do AlphaTab
```

## Gotcha do AlphaTab

O AlphaTab sobe web workers e um audio worklet a partir de URLs que ele deriva do
próprio `import.meta.url`, por uma indireção que nenhum bundler consegue reescrever.
Se a biblioteca for importada pelo bundler, essas URLs apontam para um chunk do
Turbopack, o worker dá 404 de forma assíncrona e **nada acontece** — sem erro no
console, sem renderização.

Por isso:

- `scripts/copy-alphatab-assets.mjs` copia `node_modules/@coderline/alphatab/dist`
  para `public/alphatab` (roda no `postinstall`, inclusive na Vercel).
- `components/tab-player.tsx` carrega a lib com `import(/* turbopackIgnore: true */ ...)`
  a partir de `/alphatab/alphaTab.mjs`, e não pelo bundler.
- `public/alphatab` é gerado — está no `.gitignore`, não commitar.

## Outras armadilhas já resolvidas

**Acento em arquivo Guitar Pro — depende da versão.** `.gp3/.gp4/.gp5` gravam
texto em Latin-1; lidos como UTF-8 (padrão do AlphaTab), todo acento vira `�`, o
que atinge quase toda música brasileira. Mas `.gp` (Guitar Pro 7/8), `.gpx` e
MusicXML são XML em UTF-8 — e o AlphaTab passa o mesmo `importer.encoding` para
todos os importadores, então fixar `windows-1252` estraga os formatos novos ao
contrário (`Nós` → `NÃ³s`). `importerEncoding()` em `tab-player.tsx` escolhe pela
extensão.

**Nome de arquivo no Storage.** Chaves de objeto do Supabase Storage só aceitam
ASCII. Subir `o-papa-é-pop.gp4` falha com `File name is invalid`. O nome bonito
mora em `musicas.titulo`; o arquivo pode ter nome simples.

**Bucket público não precisa de política de leitura.** Uma policy de `select` em
`storage.objects` só acrescenta a capacidade de *listar* o bucket inteiro, que o
app não usa. Por isso o `schema.sql` não cria nenhuma.

## Fluxo de desenvolvimento

1. Trabalhar localmente com o Claude Code.
2. Commit + push para o GitHub.
3. Vercel faz o deploy automático — preview em PRs, produção na `main`.
