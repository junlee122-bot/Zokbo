# Zokbo — 초대 기반 비공개 시험지 자료 보관소

족보닷컴처럼 시험지·학습자료를 모아두되, **초대받은 멤버만** 쓰는 비공개 웹앱입니다.
Next.js(App Router) + Supabase(Auth · Postgres · Storage)로 구현했고, 접근 제어는
모두 **Supabase Row Level Security(RLS)** 로 DB 단에서 강제합니다.

---

## 1. 기능 요약

- **업로드**: 로그인 멤버가 PDF·이미지·한글/워드 등을 드래그&드롭으로 비공개 스토리지에 저장
- **분류/태그**: 과목·학년·연도·학기·시험종류·태그 메타정보
- **검색·필터**: 과목·키워드·태그·메타로 빠른 검색
- **미리보기**: PDF는 iframe, 이미지는 인라인으로 사이트에서 바로 보기
- **다운로드**: 권한 검증 후 발급되는 signed URL 로 원본 내려받기
- **접근 제어**: 초대 기반 가입 + 3역할(관리자/업로더/열람자)
- **소유·공유**: 기본 비공개, 업로더가 `전체 멤버` 또는 `특정 멤버`로 공유 전환
- **목록 구분**: `내 파일` / `나에게 공유된 파일` 분리 표시

---

## 2. 데이터 구조

| 테이블 | 핵심 컬럼 | 설명 |
|---|---|---|
| `profiles` | `id`(=auth.users.id), `email`, `full_name`, `role` | 사용자 + 역할 |
| `invites` | `email`(unique), `role`, `accepted_at` | 관리자가 등록한 초대 이메일 |
| `files` | `owner_id`, `title`, `subject`, `grade`, `year`, `semester`, `exam_type`, `tags[]`, `storage_path`, `visibility` | 파일 메타정보 |
| `file_shares` | `file_id`, `shared_with` | `visibility='specific'` 의 공유 대상 |

- `role` enum: `admin` / `uploader` / `viewer`
- `visibility` enum: `private` / `all` / `specific`
- 실제 파일 바이트는 비공개 Storage 버킷 `exam-files` 에 `{owner_id}/{file_id}/{파일명}` 경로로 저장

### 권한·역할 (RLS 요약)

- **가입**: `auth.users` insert 트리거가 `invites` 를 검사 → 초대 없으면 예외 발생(공개 가입 차단). 초대의 `role` 로 프로필 생성.
- **files SELECT**: `owner` OR `admin` OR `visibility='all'` OR `(specific & file_shares 에 포함)`
- **files INSERT**: 본인 소유 + 업로드 권한(admin/uploader)
- **files UPDATE/DELETE**: `owner` OR `admin`
- **Storage**: 비공개 버킷. 읽기는 "본인 폴더 OR files RLS 가 허용하는 파일"만, 쓰기는 본인 폴더만. 다운로드/미리보기는 서버가 권한 확인 후 signed URL 발급 → URL 직접 유출 방지.

> 새 멤버를 추가해도 역할/정책이 그대로 적용되도록, 권한은 전부 RLS 정책과
> `is_admin()` / `can_upload()` 헬퍼 함수에 기반합니다.

---

## 3. 화면 구성

| 경로 | 화면 |
|---|---|
| `/login`, `/signup` | 로그인 / (초대 이메일) 가입 |
| `/dashboard` | 내 파일 목록 + 검색·필터 |
| `/dashboard/shared` | 나에게 공유된 파일 목록 |
| `/dashboard/upload` | 드래그&드롭 업로드 + 메타 입력 |
| `/dashboard/files/[id]` | 상세 · 미리보기 · 다운로드 · 공유설정 · 수정/삭제 |
| `/dashboard/admin` | 초대 등록·삭제, 멤버 역할 변경·삭제 (관리자 전용) |

---

## 4. 설치 & Supabase 연결

### 4-1. Supabase 프로젝트 생성
1. <https://supabase.com> 에서 무료 프로젝트 생성 (Free tier 충분)
2. **Project Settings → API** 에서 다음을 복사:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (서버 전용, 절대 노출 금지)

### 4-2. DB 스키마 / RLS 적용
Supabase 대시보드의 **SQL Editor** 에서 아래 순서로 실행:
1. `supabase/migrations/0001_schema.sql`  (테이블 · 트리거 · 헬퍼함수)
2. `supabase/migrations/0002_rls.sql`     (RLS 정책 · Storage 정책)
3. `supabase/migrations/0003_storage_and_seed.sql`
   - 비공개 버킷 `exam-files` 생성
   - **최초 관리자 부트스트랩**: 파일 안의 `admin@example.com` 을 본인 이메일로 바꾼 뒤 실행

> Supabase CLI 를 쓴다면 `supabase db push` 로도 적용할 수 있습니다.

### 4-3. (선택) 이메일 가입 설정
- 빠른 시작을 원하면 **Authentication → Providers → Email → "Confirm email" 끄기**
  → `/signup` 에서 즉시 로그인됩니다.
- 켜두면 확인 메일의 링크(`/auth/callback`)를 눌러야 가입이 완료됩니다.

### 4-4. 로컬 실행
```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev                  # http://localhost:3000
```

### 4-5. 첫 사용 흐름
1. `0003` 에서 본인 이메일을 admin 초대로 넣었으니, `/signup` 에서 그 이메일로 가입 → 관리자
2. `/dashboard/admin` 에서 다른 사람을 이메일로 초대 (업로더/열람자)
3. 초대받은 사람이 같은 이메일로 `/signup` 가입 → 해당 역할로 입장

---

## 5. 환경변수

| 변수 | 용도 | 노출 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 공개 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 인증 키 | 공개 |
| `SUPABASE_SERVICE_ROLE_KEY` | 초대 메일 발송·멤버 삭제 등 admin API | **서버 전용** |
| `NEXT_PUBLIC_SITE_URL` | 초대/콜백 리다이렉트 기준 URL | 공개 |

`SUPABASE_SERVICE_ROLE_KEY` 가 없어도 핵심 기능(가입·업로드·공유·다운로드)은 동작합니다.
초대 메일 자동발송과 멤버 완전삭제만 이 키를 필요로 합니다.

---

## 6. 기술 스택

- **Next.js 14 (App Router)** — 서버 컴포넌트 · 서버 액션 · 라우트 핸들러
- **@supabase/ssr** — 쿠키 기반 세션(미들웨어에서 갱신)
- **Supabase Postgres + RLS** — 메타정보 + 접근 제어
- **Supabase Storage (private)** — 파일 저장, signed URL 발급
- **Tailwind CSS** — UI

---

## 7. 보안 메모

- 비공개 파일은 **DB 행 자체가 RLS 로 가려지므로** 검색·목록·미리보기·다운로드 어디에도 노출되지 않습니다.
- Storage 는 비공개 버킷이라 경로를 알아도 직접 접근 불가. 다운로드는 매번 만료형 signed URL.
- 공유 범위 변경은 소유자/관리자만 가능(RLS `with check`).
- 가입은 트리거로 강제되는 초대제라, 프런트엔드를 우회해 직접 API 를 때려도 초대 없는 이메일은 가입 불가.
