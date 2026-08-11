# Supabase Auth Starter

Base implementável para autenticação e autorização com Supabase, pensada para um sistema com funções e permissões específicas por usuário.

## Entregáveis

- `schema.sql`
  Base de banco com:
  - perfis
  - roles
  - permissões
  - vínculos usuário x role
  - vínculos role x permissão
  - funções auxiliares para autorização
  - RLS em `public.profiles`
  - funções administrativas para listar usuários e atribuir/remover roles

- `login.html`
  Tela estática mínima para:
  - configurar URL/chave publishable do Supabase
  - login com email e senha
  - cadastro
  - logout
  - leitura de permissões do usuário logado
  - ações administrativas de gestão de roles

- `app.js`
  Lógica do cliente Supabase.

- `styles.css`
  Estilo básico da interface.

## Como usar

1. Crie um projeto Supabase.
2. Rode o conteúdo de `schema.sql` no SQL Editor do Supabase.
3. No painel do Supabase, crie ao menos um usuário.
4. Insira manualmente uma role inicial para esse usuário.

Exemplo:

```sql
insert into app_auth.user_roles (user_id, role_id, assigned_by)
select
  'UUID_DO_USUARIO'::uuid,
  r.id,
  'UUID_DO_USUARIO'::uuid
from app_auth.roles r
where r.key = 'admin';
```

5. Abra `login.html`.
6. Informe:
  - `Supabase URL`
  - `Publishable key`
7. Faça login.

## Roles seedadas

- `admin`
- `gerente`
- `recepcao`
- `financeiro`

## Permissões seedadas

- `reservas.read`
- `reservas.create`
- `reservas.update`
- `reservas.cancel`
- `reservas.checkin`
- `reservas.no_show`
- `pagamentos.read`
- `pagamentos.confirm`
- `usuarios.read`
- `usuarios.manage`

## Funções RPC expostas para o frontend

- `public.my_permissions()`
- `public.admin_list_users()`
- `public.admin_assign_role(target_user_id uuid, role_key text)`
- `public.admin_remove_role(target_user_id uuid, role_key text)`

## Estratégia de autorização usada aqui

Esta implementação evita depender de claims customizados no JWT para autorização principal. Em vez disso:

- a autenticação vem do `Supabase Auth`
- a autorização vem do banco
- a função `app_auth.authorize(permission_key text)` lê os vínculos `user_roles` e `role_permissions`
- as policies RLS e as funções administrativas usam essa checagem

Isso reduz o risco de inconsistência quando a role muda e o token ainda não foi renovado.

## Como integrar no app real

1. Mantenha `Supabase Auth` para login e sessão.
2. Leve `schema.sql` para migrations.
3. Adapte as permissions ao domínio real do projeto.
4. Para cada tabela de negócio, crie policies usando:

```sql
using ((select app_auth.authorize('alguma.permissao')))
```

Exemplo para uma tabela `public.reservas`:

```sql
alter table public.reservas enable row level security;

create policy "reservas_read"
on public.reservas
for select
to authenticated
using ((select app_auth.authorize('reservas.read')));

create policy "reservas_update"
on public.reservas
for update
to authenticated
using ((select app_auth.authorize('reservas.update')))
with check ((select app_auth.authorize('reservas.update')));
```

## Observações

- Não exponha `service_role` no frontend.
- Use apenas a publishable key no cliente.
- Se precisar de MFA, adicione na segunda fase.
- Se quiser SSR depois, essa base continua válida; muda só a criação do client no servidor.
