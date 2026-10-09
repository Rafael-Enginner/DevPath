# ADR 0003: template com escape automático

**Status:** aceita

**Contexto:** o HTML é gerado por texto e os dados podem vir de um JSON importado.

**Decisão:** toda interpolação passa pela tag `html`, que escapa os valores. Só o resultado de outra chamada a `html` é tratado como seguro. Reforçado por uma Content Security Policy.

**Consequências:** previne XSS por padrão. Há teste automatizado. Quem usar `innerHTML` direto quebra a regra.
