#!/usr/bin/env node
// Zokbo Files 데이터베이스를 Notion에 자동 생성합니다.
//
// 사전 준비:
//   1) https://www.notion.so/my-integrations 에서 "내부 통합(integration)" 생성 → 토큰 복사
//   2) Notion에서 DB를 만들 "부모 페이지"를 하나 만들고, 우상단 ⋯ → 연결(Connections)
//      에서 위 통합을 추가(공유)
//   3) 그 페이지 URL 끝의 32자리 ID 를 복사
//
// 실행:
//   NOTION_TOKEN=ntn_xxx NOTION_PARENT_PAGE_ID=xxxx npm run setup-notion
//   (또는 .env.local 에 두 값을 넣고 npm run setup-notion)
//
// 출력된 NOTION_FILES_DB_ID 를 .env.local 에 넣으면 끝.

import { readFileSync } from "node:fs";

const NOTION_VERSION = "2026-03-11";

// .env.local 간단 파서 (이미 process.env에 있으면 그대로 사용)
function loadEnvLocal() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* 없으면 무시 */
  }
}

loadEnvLocal();

const token = process.env.NOTION_TOKEN;
const parent = process.env.NOTION_PARENT_PAGE_ID;

if (!token || !parent) {
  console.error("❌ NOTION_TOKEN 과 NOTION_PARENT_PAGE_ID 가 필요합니다.");
  console.error("   .env.local 에 넣거나 환경변수로 전달하세요.");
  process.exit(1);
}

const sel = (names) => ({ select: { options: names.map((name) => ({ name })) } });

// Notion API 2025-09-03+ : 스키마(properties)는 initial_data_source 아래에 둡니다.
const properties = {
  "제목": { title: {} },
  "과목": { rich_text: {} },
  "학년": { rich_text: {} },
  "연도": { number: {} },
  "학기": sel(["1학기", "2학기", "여름", "겨울"]),
  "시험종류": sel(["중간고사", "기말고사", "수행평가", "모의고사", "기타"]),
  "태그": { multi_select: { options: [] } },
  "공개범위": sel(["private", "all", "specific"]),
  "소유자": { rich_text: {} },
  "설명": { rich_text: {} },
  "파일": { files: {} },
};

const body = {
  parent: { type: "page_id", page_id: parent },
  title: [{ type: "text", text: { content: "Zokbo Files" } }],
  initial_data_source: { properties },
};

const res = await fetch("https://api.notion.com/v1/databases", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const json = await res.json();
if (!res.ok) {
  console.error("❌ 생성 실패:", json.message || JSON.stringify(json));
  process.exit(1);
}

console.log("✅ 데이터베이스 생성 완료!");
console.log("");
console.log("아래 줄을 .env.local 에 추가하세요:");
console.log("");
console.log(`NOTION_FILES_DB_ID=${json.id}`);
console.log("");
console.log(`(Notion에서 열기: ${json.url})`);
