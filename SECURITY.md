# Política de segurança

## Como reportar uma vulnerabilidade
Não abra uma Issue pública. Use **Security → Report a vulnerability** (Segurança → Reportar uma vulnerabilidade) neste repositório. Descreva o que encontrou, como reproduzir e o impacto.

Respondo em até 7 dias.

## Escopo
O DevPath é um site estático. Todos os dados (perfil, progresso, avaliações) ficam no navegador do próprio usuário e nada é enviado a servidores.

## Medidas adotadas
- Escape automático de todo texto inserido no HTML.
- Content Security Policy restrita ao próprio site.
- Importação de JSON validada e limitada a 1 MB.
- Dependabot, Secret scanning e CodeQL ativos.
- CI com permissões mínimas.
