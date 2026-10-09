# ADR 0001: HTML, CSS e JavaScript puros

**Status:** aceita

**Contexto:** o projeto é estático, tem pouca interação e serve de portfólio e de material de estudo.

**Decisão:** não usar framework nem bundler. O código usa módulos ES e roda direto no GitHub Pages.

**Consequências:** zero dependências em produção e código fácil de estudar. Em troca, a renderização é manual e não há roteamento nem reatividade prontos. Se a interface crescer muito, reavaliar.
