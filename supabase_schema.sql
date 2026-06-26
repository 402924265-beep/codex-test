-- 三张表工作台后台共享表
-- 在 Supabase SQL Editor 里执行一次即可

create table if not exists public.dw_account_analyses (
  month integer not null,
  code text not null,
  analysis_text text,
  author text,
  updated_at timestamptz default now(),
  primary key (month, code)
);

create table if not exists public.dw_factor_projects (
  id text primary key,
  sort_order integer not null default 0,
  payload jsonb not null,
  updated_at timestamptz default now()
);

alter table public.dw_account_analyses enable row level security;
alter table public.dw_factor_projects enable row level security;

-- 公开共享：所有打开网页的人都能读取/写入项目与原因
-- 如后续需要权限控制，再改成登录后写入。
drop policy if exists "public read account analyses" on public.dw_account_analyses;
drop policy if exists "public insert account analyses" on public.dw_account_analyses;
drop policy if exists "public update account analyses" on public.dw_account_analyses;
drop policy if exists "public read factor projects" on public.dw_factor_projects;
drop policy if exists "public insert factor projects" on public.dw_factor_projects;
drop policy if exists "public update factor projects" on public.dw_factor_projects;
drop policy if exists "public delete factor projects" on public.dw_factor_projects;

create policy "public read account analyses"
  on public.dw_account_analyses for select
  using (true);

create policy "public insert account analyses"
  on public.dw_account_analyses for insert
  with check (true);

create policy "public update account analyses"
  on public.dw_account_analyses for update
  using (true)
  with check (true);

create policy "public read factor projects"
  on public.dw_factor_projects for select
  using (true);

create policy "public insert factor projects"
  on public.dw_factor_projects for insert
  with check (true);

create policy "public update factor projects"
  on public.dw_factor_projects for update
  using (true)
  with check (true);

create policy "public delete factor projects"
  on public.dw_factor_projects for delete
  using (true);
