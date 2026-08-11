# Cadastro Financeiro / Reservas

Estrutura pronta para subir no git com login via Supabase integrado ao painel.

## Estrutura

- `index.html`
- `reservas.html`
- `kuro-logo.png`
- `config/supabase-config.js`
- `config/supabase-config.example.js`
- `db/schema-auth.sql`

## Antes de subir

1. Rode `db/schema-auth.sql` no Supabase.
2. Se precisar trocar projeto/chave, edite `config/supabase-config.js`.
3. Crie o primeiro usuário no Supabase Auth.
4. Atribua roles diretamente no banco, se necessário.

## Observações

- `supabase-config.js` usa apenas a publishable key no cliente.
- O painel exige login para abrir.
- A UI esconde e bloqueia funções sem permissão.
- Para produção, confirme as policies da tabela `reservas` no seu projeto Supabase.
