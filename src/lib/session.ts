// 단일 비밀번호 로그인용 경량 세션.
//   - 외부 의존성 없이 Web Crypto(HMAC-SHA256)로 서명된 토큰을 발급/검증.
//   - Edge 미들웨어와 Node 라우트 핸들러 양쪽에서 동작.
//   - "개인 프로젝트(나 혼자)" 보호가 목적. 나중에 멤버를 추가하면
//     이 부분을 사용자별 인증으로 교체하면 됩니다(스키마는 이미 멀티유저 대비).

export const SESSION_COOKIE = "zokbo_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 30; // 30일

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** 서명된 세션 토큰 발급. payload 는 만료시각만 담음. */
export async function createSessionToken(secret: string): Promise<string> {
  const payload = { exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC };
  const data = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${b64urlEncode(new Uint8Array(sig))}`;
}

/** 토큰 유효성 검증(서명 + 만료). */
export async function verifySessionToken(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token) return false;
  const [data, sig] = token.split(".");
  if (!data || !sig) return false;

  const key = await hmacKey(secret);
  const expected = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  if (!timingSafeEqual(sig, b64urlEncode(new Uint8Array(expected)))) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(data)));
    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SEC;
export { timingSafeEqual };
