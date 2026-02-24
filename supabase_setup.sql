-- ═══════════════════════════════════════════════
-- Cole todo este conteúdo no SQL Editor do Supabase
-- supabase.com → seu projeto → SQL Editor → New query
-- ═══════════════════════════════════════════════

-- 1. Tabela de pedidos das alunas
create table pedidos (
  id    uuid         default gen_random_uuid() primary key,
  nome  text         not null,
  pecas jsonb        not null,
  hora  timestamptz  default now()
);

-- 2. Tabela de configurações (fotos dos produtos)
create table configuracoes (
  chave  text  primary key,
  valor  jsonb not null
);

-- 3. Habilitar Row Level Security (RLS)
alter table pedidos       enable row level security;
alter table configuracoes enable row level security;

-- 4. Políticas de acesso público para pedidos
create policy "Leitura pública de pedidos"
  on pedidos for select using (true);

create policy "Inserção pública de pedidos"
  on pedidos for insert with check (true);

-- Deleção feita apenas via Netlify Function (deletar-pedido) com service_role key

-- 5. Políticas de acesso público para configurações
create policy "Leitura pública de configurações"
  on configuracoes for select using (true);

create policy "Inserção de configurações"
  on configuracoes for insert with check (true);

create policy "Atualização de configurações"
  on configuracoes for update using (true);
