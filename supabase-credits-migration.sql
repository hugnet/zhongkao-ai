-- ========================================
-- 中考提分AI私教 - 积分系统SQL迁移
-- 只需执行一次！
-- 操作步骤见文末说明
-- ========================================

-- 5. 积分表
create table if not exists public.credits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  balance integer not null default 5000,
  total_used integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_credits_user_id on public.credits(user_id);

-- 6. 积分交易记录
create table if not exists public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  type text not null check (type in ('grant', 'deduct', 'purchase', 'subscription')),
  description text not null default '',
  created_at timestamptz default now()
);

create index if not exists idx_credit_tx_user_id on public.credit_transactions(user_id);

-- 7. 用户设置表
create table if not exists public.user_settings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  custom_api_key text,
  custom_provider_id text,
  use_default_api boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 行级安全策略 (RLS)
alter table public.credits enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.user_settings enable row level security;

create policy user_credits_policy on public.credits
  for all using (auth.uid() = user_id);

create policy user_credit_tx_policy on public.credit_transactions
  for all using (auth.uid() = user_id);

create policy user_settings_policy on public.user_settings
  for all using (auth.uid() = user_id);

-- 新用户注册时自动赠送5000积分
create or replace function public.handle_new_user_credits()
returns trigger as 
begin
  insert into public.credits (user_id, balance)
  values (new.id, 5000);
  insert into public.credit_transactions (user_id, amount, type, description)
  values (new.id, 5000, 'grant', '新用户注册赠送');
  insert into public.user_settings (user_id, use_default_api)
  values (new.id, true);
  return new;
end;
 language plpgsql security definer;

drop trigger if exists on_auth_user_credits on auth.users;
create trigger on_auth_user_credits
  after insert on auth.users
  for each row execute function public.handle_new_user_credits();
