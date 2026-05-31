-- ===========================================================================
-- Zokbo — 스키마 정의 (테이블 / 인덱스 / 트리거)
-- Supabase SQL Editor 에 이 파일 전체를 붙여넣어 실행하세요.
-- RLS 정책은 0002_rls.sql 에 분리되어 있습니다.
-- ===========================================================================

-- 역할(role) 종류
--   admin    : 사람 초대·삭제, 전체 파일 관리
--   uploader : 업로드 및 본인 파일 관리
--   viewer   : 공유된 자료 열람·다운로드만
do $$ begin
  create type public.user_role as enum ('admin', 'uploader', 'viewer');
exception when duplicate_object then null; end $$;

-- 파일 공개 범위
--   private  : 본인(+관리자)만
--   all      : 전체 멤버
--   specific : file_shares 에 지정된 멤버만
do $$ begin
  create type public.file_visibility as enum ('private', 'all', 'specific');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles : auth.users 와 1:1. 역할/표시이름 보관.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  role       public.user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- invites : 관리자가 등록한 초대 이메일. 가입은 여기에 있는 이메일만 가능.
-- ---------------------------------------------------------------------------
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  role        public.user_role not null default 'viewer',
  invited_by  uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

-- 이메일은 항상 소문자로 보관 (대소문자 무관 매칭)
create or replace function public.lowercase_invite_email()
returns trigger language plpgsql as $$
begin
  new.email := lower(trim(new.email));
  return new;
end $$;

drop trigger if exists trg_lowercase_invite_email on public.invites;
create trigger trg_lowercase_invite_email
  before insert or update on public.invites
  for each row execute function public.lowercase_invite_email();

-- ---------------------------------------------------------------------------
-- files : 파일 메타정보. 실제 바이트는 Storage(exam-files 버킷)에 저장.
-- ---------------------------------------------------------------------------
create table if not exists public.files (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  subject      text,                    -- 과목
  grade        text,                    -- 학년
  year         int,                     -- 연도
  semester     text,                    -- 학기
  exam_type    text,                    -- 시험종류 (중간/기말 등)
  description  text,
  tags         text[] not null default '{}',
  storage_path text not null unique,    -- exam-files 버킷 내 경로: {owner_id}/{file_id}/{name}
  file_name    text not null,           -- 원본 파일명
  mime_type    text,
  size_bytes   bigint,
  visibility   public.file_visibility not null default 'private',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists files_owner_idx      on public.files (owner_id);
create index if not exists files_visibility_idx on public.files (visibility);
create index if not exists files_subject_idx    on public.files (subject);
create index if not exists files_tags_idx       on public.files using gin (tags);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_files_updated_at on public.files;
create trigger trg_files_updated_at
  before update on public.files
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- file_shares : visibility='specific' 일 때 공유 대상 멤버 목록.
-- ---------------------------------------------------------------------------
create table if not exists public.file_shares (
  id          uuid primary key default gen_random_uuid(),
  file_id     uuid not null references public.files(id) on delete cascade,
  shared_with uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (file_id, shared_with)
);

create index if not exists file_shares_file_idx on public.file_shares (file_id);
create index if not exists file_shares_user_idx on public.file_shares (shared_with);

-- ---------------------------------------------------------------------------
-- 가입 트리거 : auth.users 에 새 사용자가 생기면 invites 를 검사.
--   - 초대가 없으면 예외 발생 → 가입 차단 (초대 기반 가입 강제)
--   - 초대가 있으면 그 역할로 profile 생성 + 초대 accepted 처리
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  inv public.invites;
begin
  select * into inv
  from public.invites
  where email = lower(trim(new.email))
  limit 1;

  if inv.id is null then
    raise exception 'No invitation found for %. Sign-up is invite-only.', new.email
      using errcode = 'check_violation';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    inv.role
  );

  update public.invites set accepted_at = now() where id = inv.id;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 권한 헬퍼 함수 (RLS 에서 사용). security definer 로 profiles 재귀 회피.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.can_upload()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'uploader')
  );
$$;
