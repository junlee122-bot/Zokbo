-- ===========================================================================
-- Zokbo — Row Level Security (RLS) 정책
-- 0001_schema.sql 실행 후 이 파일을 실행하세요.
-- 접근 제어는 모두 여기(DB 단)에서 강제됩니다.
-- ===========================================================================

alter table public.profiles    enable row level security;
alter table public.invites     enable row level security;
alter table public.files       enable row level security;
alter table public.file_shares enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
--   - 로그인 멤버는 모든 프로필을 볼 수 있음(공유 대상 선택 UI 에 필요).
--   - 본인은 자기 이름 수정 가능, 역할 변경/타인 관리는 관리자만.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- invites : 관리자만 보고/만들고/지울 수 있음.
--   (가입 검증은 SECURITY DEFINER 트리거가 처리하므로 별도 공개 정책 불필요)
-- ---------------------------------------------------------------------------
drop policy if exists invites_admin_all on public.invites;
create policy invites_admin_all on public.invites
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- files
--   SELECT : 본인 OR 관리자 OR visibility='all' OR (specific & 공유 대상)
--   INSERT : 본인 소유로만, 그리고 업로드 권한(admin/uploader) 보유 시
--   UPDATE : 본인 OR 관리자
--   DELETE : 본인 OR 관리자
-- ---------------------------------------------------------------------------
drop policy if exists files_select on public.files;
create policy files_select on public.files
  for select to authenticated
  using (
    owner_id = auth.uid()
    or public.is_admin()
    or visibility = 'all'
    or (
      visibility = 'specific'
      and exists (
        select 1 from public.file_shares s
        where s.file_id = files.id and s.shared_with = auth.uid()
      )
    )
  );

drop policy if exists files_insert on public.files;
create policy files_insert on public.files
  for insert to authenticated
  with check (owner_id = auth.uid() and public.can_upload());

drop policy if exists files_update on public.files;
create policy files_update on public.files
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists files_delete on public.files;
create policy files_delete on public.files
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- file_shares
--   SELECT : 파일 소유자 OR 관리자 OR 본인이 공유 대상
--   INSERT/DELETE : 파일 소유자 OR 관리자
-- ---------------------------------------------------------------------------
drop policy if exists file_shares_select on public.file_shares;
create policy file_shares_select on public.file_shares
  for select to authenticated
  using (
    shared_with = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.files f
      where f.id = file_shares.file_id and f.owner_id = auth.uid()
    )
  );

drop policy if exists file_shares_modify on public.file_shares;
create policy file_shares_modify on public.file_shares
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.files f
      where f.id = file_shares.file_id and f.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.files f
      where f.id = file_shares.file_id and f.owner_id = auth.uid()
    )
  );

-- ===========================================================================
-- Storage : 비공개 버킷 'exam-files' 의 객체 접근 정책
--   경로 규칙: {owner_id}/{file_id}/{원본파일명}
--   READ  : 본인 폴더 OR (files RLS 가 허용하는 = 볼 수 있는) 파일
--   WRITE : 본인 폴더에만 업로드
-- 'exam-files' 버킷은 0003_storage.sql 또는 대시보드에서 먼저 생성하세요.
-- ===========================================================================
drop policy if exists exam_files_read on storage.objects;
create policy exam_files_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'exam-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        -- files 에 RLS 가 걸려있으므로, '볼 수 있는' 파일만 매칭됨
        select 1 from public.files f where f.storage_path = name
      )
    )
  );

drop policy if exists exam_files_insert on storage.objects;
create policy exam_files_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'exam-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists exam_files_delete on storage.objects;
create policy exam_files_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'exam-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
