# ADR 0002: dados só no navegador

**Status:** aceita

**Contexto:** hospedagem no GitHub Pages, sem servidor.

**Decisão:** perfil, progresso e avaliações ficam no `localStorage`, com versão e migração. O conteúdo vem de `data.js` ou de um JSON importado e validado.

**Consequências:** privacidade por padrão e custo zero. Não há sincronização entre aparelhos nem soma de avaliações de várias pessoas. Isso exigiria um backend.
