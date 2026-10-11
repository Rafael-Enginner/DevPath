# DevPath — Biblioteca de conhecimento e IA

Esta implementação adiciona uma primeira versão da biblioteca de PDFs e geração de materiais, mantendo o frontend estático no GitHub Pages. Os serviços externos não são ativados até que o projeto Supabase seja configurado.

## Componentes

- Frontend: HTML/CSS/JavaScript existente + `js/library.js` e `js/library-ui.js`.
- Banco e arquivos: Supabase PostgreSQL + Storage privado `book-pdfs`.
- Backend: Supabase Edge Functions `process-book`, `generate-content` e `publish-content`.
- IA: Gemini API chamada somente pela função de backend.
- PDFs: limite inicial de 20 MB por arquivo; o parser tenta extrair texto digital. PDFs digitalizados que precisem de OCR são sinalizados, mas OCR ainda não está implementado.

## Configuração inicial

1. Crie um projeto em <https://supabase.com/>.
2. No SQL Editor, execute `supabase/migrations/0001_knowledge_library.sql`.
3. No painel de autenticação do Supabase, crie o usuário que administrará os livros. Desative inscrições públicas se não quiser que visitantes criem contas; estudantes podem acessar os materiais publicados anonimamente.
4. Promova a conta administrativa pelo SQL Editor, substituindo o e-mail:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'SEU-EMAIL@example.com');
   ```

5. Instale a CLI do Supabase e vincule o diretório do projeto:

   ```bash
   supabase login
   supabase link --project-ref SEU_PROJECT_REF
   supabase secrets set GEMINI_API_KEY=SUA_CHAVE_GEMINI
   supabase secrets set ALLOWED_ORIGIN=https://rafael-enginner.github.io
   supabase functions deploy process-book
   supabase functions deploy generate-content
   supabase functions deploy publish-content
   ```

   O projeto Supabase define `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` para as Edge Functions. Não coloque a service-role key ou a chave Gemini no frontend, no GitHub ou neste documento.

6. Edite `js/config.js` e preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os valores públicos do projeto Supabase. A chave `anon`/publishable é destinada ao frontend e depende das políticas RLS; nunca use `service_role` aqui.
7. Faça commit e publique no GitHub Pages. Teste login, upload de um PDF digital, extração, geração de flashcards, revisão/publicação e leitura em janela anônima.

## Segurança e custos

- RLS deve permanecer habilitado; livros e PDFs são privados, e somente materiais com status `published` podem ser lidos anonimamente.
- O papel `admin` é atribuído manualmente. Novos usuários recebem `student`.
- Configure limites de uso e monitore o consumo da Gemini API e do Supabase. O plano gratuito está sujeito a limites e alterações do provedor.
- A função de geração usa um conjunto limitado de trechos e grava resultados como `draft`. O administrador precisa revisar e publicar.
- Não carregue livros sem autorização/licença adequada. Evite publicar trechos longos de obras protegidas; materiais derivados devem ser originais e referenciar páginas/fontes.
- Esta versão ainda não implementa OCR, fila de jobs, limites por usuário, recuperação de senha personalizada nem sincronização do progresso pessoal. Planeje esses recursos antes de abrir o upload para muitos usuários.

## Desenvolvimento local

O frontend pode ser servido com `npm install` e `npm start`. Os testes de lógica usam `npm test`; execute também `npm run lint`. Para testar funções Edge localmente, instale a Supabase CLI e use `supabase start` e `supabase functions serve` com segredos de desenvolvimento.
