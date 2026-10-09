# Como contribuir

1. Faça um fork e crie uma branch: `git checkout -b feat/minha-ideia`.
2. Instale e rode as verificações: `npm install`, `npm run format` e `npm run check`.
3. Para testes de navegador: `npx playwright install chromium` e `npm run test:e2e`.
4. Faça commits pequenos no padrão `feat:`, `fix:`, `docs:`, `style:` ou `refactor:`.
5. Abra um Pull Request preenchendo o modelo.

## Conteúdo
Edite só `js/data.js`. Cada tópico precisa de todos os campos e de no mínimo 5 projetos por nível. O teste `tests/data.test.js` valida isso.

## Regras do código
- HTML semântico e acessível. Todo componente interativo precisa funcionar só com teclado.
- Texto vindo de dados sempre passa pelo template `html` (escape automático). Nunca use `innerHTML` direto.
- Mudou o formato do `localStorage`? Aumente `SCHEMA_VERSION` e escreva a migração em `js/migrations.js`.
- Decisões de arquitetura ficam registradas em `docs/adr/`.
