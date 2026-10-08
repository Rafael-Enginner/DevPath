# DevPath · Mapa de estudos de Engenharia de Software

Trilha interativa que transforma as disciplinas do curso em prática. Cada tópico traz **conceito, por que importa, passo a passo, ferramentas, projetos por nível (iniciante, intermediário, sênior) e flashcards**. O progresso fica salvo no navegador.

## Destaques
- Navegação em formato de linha de metrô: cada disciplina é uma estação.
- Conteúdo separado da lógica: para criar ou editar tópicos, altere só `js/data.js`.
- Busca instantânea, tema claro e escuro, progresso persistente.
- Acessibilidade: abas com teclado (setas), foco visível, link de pular conteúdo, respeito a `prefers-reduced-motion`.
- HTML, CSS e JavaScript puros, sem dependências nem build.

## Estrutura
```
devpath/
├── index.html      # estrutura semântica
├── css/styles.css  # tokens, layout e componentes
└── js/
    ├── data.js     # conteúdo (módulos e tópicos)
    └── app.js      # renderização, estado e eventos
```

## Rodar localmente
Abra `index.html` no navegador, ou use `npx serve .` / extensão Live Server.

## Publicar no GitHub
```bash
git init
git add .
git commit -m "feat: primeira versão do DevPath"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/devpath.git
git push -u origin main
```
Depois: **Settings → Pages → Deploy from a branch → main / root**.

## Padrão de commits sugerido
`feat:` novidade · `fix:` correção · `docs:` documentação · `style:` visual · `refactor:` reorganização

## Próximos passos
- [ ] Quiz de múltipla escolha por módulo
- [ ] Exportar progresso em JSON
- [ ] Testes com Playwright e workflow no GitHub Actions
- [ ] Migrar para TypeScript e Vite

## Licença
MIT. Ajuste o nome em `LICENSE`.
