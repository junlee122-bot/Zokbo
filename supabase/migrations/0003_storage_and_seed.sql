-- ===========================================================================
-- Zokbo — Storage 버킷 생성 + 최초 관리자 부트스트랩(seed)
-- 0001, 0002 실행 후 마지막에 실행하세요.
-- ===========================================================================

-- 비공개 버킷 'exam-files' 생성 (public = false 가 핵심: URL 직접 노출 방지)
insert into storage.buckets (id, name, public)
values ('exam-files', 'exam-files', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 최초 관리자 부트스트랩
--   가입은 invites 기반이라 "첫 관리자" 가 닭-달걀 문제가 됩니다.
--   아래 이메일을 본인(관리자) 이메일로 바꾼 뒤 실행하세요.
--   그러면 그 이메일로 /signup 가입 시 자동으로 admin 역할이 부여됩니다.
-- ---------------------------------------------------------------------------
insert into public.invites (email, role)
values ('admin@example.com', 'admin')   -- ← 본인 이메일로 변경
on conflict (email) do update set role = excluded.role;
