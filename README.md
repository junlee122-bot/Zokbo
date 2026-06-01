# Zokbo — 개인 시험지 자료 보관소 (Next.js + Notion)

시험지·학습자료를 한 곳에 모아두는 개인용 웹앱입니다. 파일은 **Notion**에 저장되고,
메타정보(과목·학년·연도·학기·시험종류·태그)로 분류·검색합니다. 비밀번호 하나로
앱 전체를 잠그는 **개인용**이며, 나중에 멤버를 추가해 공유로 확장할 수 있도록 설계했습니다.

> 왜 Notion? 추가 호스팅/DB 비용 없이 이미 쓰는 Notion을 저장소로 활용합니다.
> 대신 **무료 워크스페이스는 파일당 5MB 제한**이 있고, Notion 자체엔 인증/세밀한
> 접근제어가 없어 앱이 비밀번호로 보호합니다.

---

## 기능

- **업로드**: PDF·이미지·한글/워드 등을 드래그&드롭 → Notion에 첨부 저장
- **분류/태그**: 제목·과목·학년·연도·학기·시험종류·태그
- **검색·필터**: 과목·키워드·태그·메타로 빠른 검색
- **미리보기**: PDF는 iframe, 이미지는 인라인
- **다운로드**: 서버가 Notion 임시 URL을 받아 attachment로 스트리밍(URL 직접 노출 방지)
- **보호**: 비밀번호 단일 로그인(서명된 세션 쿠키)

---

## 동작 구조

```
브라우저 ──(비밀번호 로그인)──▶ Next.js 서버 ──(NOTION_TOKEN)──▶ Notion API
                                   │
                       세션 쿠키(HMAC 서명) 검증            Files DB (메타 + 파일첨부)
```

- 업로드: `/api/files` → Notion `file_uploads` 생성 → 바이트 전송 → DB 페이지 생성·첨부
- 미리보기: `/api/files/[id]/url` → 신선한 임시 URL 반환
- 다운로드: `/api/files/[id]/download` → 서버가 받아 스트리밍
- `NOTION_TOKEN`은 **서버에서만** 사용 — 클라이언트로 절대 전달되지 않습니다.

### Notion Files DB 속성
`제목`(title) · `과목` · `학년` · `연도`(number) · `학기`(select) · `시험종류`(select) ·
`태그`(multi-select) · `공개범위`(select: private/all/specific) · `소유자` · `설명` · `파일`(files)

> 속성 이름은 `src/lib/constants.ts` 의 `PROPS` 에서 한곳으로 관리합니다.

---

## 설치 & 연결 (5단계)

### 1) Notion 통합 만들기
- <https://www.notion.so/my-integrations> → **New integration**(내부) 생성 → **토큰 복사** (`ntn_...`)

### 2) 부모 페이지 준비
- Notion에서 빈 페이지 하나 생성 (예: "Zokbo")
- 그 페이지 우상단 **⋯ → 연결(Connections)** 에서 1)의 통합을 추가
- 페이지 URL 끝의 32자리 문자열이 `NOTION_PARENT_PAGE_ID`

### 3) 환경변수
```bash
cp .env.example .env.local
```
`.env.local` 에 `NOTION_TOKEN`, `NOTION_PARENT_PAGE_ID`, `APP_PASSWORD`,
`SESSION_SECRET` 를 채웁니다. (`SESSION_SECRET` 는 아래로 생성)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4) 데이터베이스 자동 생성
```bash
npm install
npm run setup-notion
```
출력된 `NOTION_FILES_DB_ID=...` 한 줄을 `.env.local` 에 추가합니다.
(직접 DB를 만들었다면, 그 DB도 통합에 **연결**한 뒤 ID만 넣으면 됩니다.)

### 5) 실행
```bash
npm run dev   # http://localhost:3000
```
`APP_PASSWORD` 로 로그인 → 업로드 시작.

---

## 환경변수

| 변수 | 용도 | 노출 |
|---|---|---|
| `NOTION_TOKEN` | Notion API 호출 | **서버 전용** |
| `NOTION_FILES_DB_ID` | Files DB ID | 서버 전용 |
| `NOTION_PARENT_PAGE_ID` | setup 스크립트 전용 | 서버 전용 |
| `APP_PASSWORD` | 앱 로그인 비밀번호 | 서버 전용 |
| `SESSION_SECRET` | 세션 쿠키 서명 키 | 서버 전용 |
| `OWNER_NAME` | 파일 소유자 표기(선택) | 서버 전용 |

---

## 제약 & 메모

- **파일 크기**: 무료 Notion은 파일당 **5MB** 제한. 업로드 화면에서 초과 시 경고합니다.
  (단일 업로드 하드 상한은 20MB)
- **보안 모델**: Notion 통합 토큰은 연결된 DB 전체를 봅니다. 따라서 접근제어는
  *앱(비밀번호)* 이 담당합니다. 비밀번호를 아는 사람 = 전체 접근.
- **임시 URL**: Notion 파일 URL은 약 1시간 후 만료되므로, 미리보기/다운로드 때마다
  서버가 새 URL을 받아옵니다.

## 나중에 "공유"로 확장하려면
스키마에 이미 `소유자`/`공개범위` 가 있습니다. 멤버를 추가하려면:
1. 사용자별 인증으로 교체 (예: `Members` DB + 비밀번호 해시, 또는 NextAuth)
2. `queryFiles` 에 "내 것 + 나에게 공유된 것" 필터 적용
3. `공개범위`(all/specific)에 따라 노출 제어
앱 구조(서버가 Notion을 중개)는 그대로 두고 인증·필터만 얹으면 됩니다.

---

## 기술 스택
Next.js 14 (App Router, 서버 컴포넌트 · 서버 액션 · 라우트 핸들러) · Notion REST API
(추가 SDK 없이 `fetch`) · Web Crypto 서명 세션 · Tailwind CSS
