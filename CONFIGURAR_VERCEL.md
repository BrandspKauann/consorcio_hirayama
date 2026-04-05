# Deploy no Vercel

## Formulários (Formspree)

Os envios vão para o Formspree. O endpoint e o ID do formulário estão em `src/config/formspree.ts` (`mjgppnok` → `https://formspree.io/f/mjgppnok`).

Não é necessária variável de ambiente no Vercel para o Formspree funcionar no front.

## Blog / conteúdo

O site não usa mais Supabase: a listagem de artigos retorna vazia até você conectar outra fonte (CMS, arquivos estáticos, etc.).

## Sitemap

A rota `api/sitemap.xml` lista apenas URLs estáticas (home, `/conteudo`, `/salaryfits`).
