/**
 * 테스트 샘플 — 슬롭 vs 좋은 스펙 비교
 */

import { calculateSlopScore } from "../scorer.js";

const VERDICT_EMOJI = { OK: "🟢", WARN: "🟡", SLOP: "🔴" };

// ───────────────────────────────────────────────
// 슬롭 예시: 모호한 표현, TBD, 에러케이스 없음
// ───────────────────────────────────────────────
const SLOP_SPEC = `
# 로그인 기능

사용자가 로그인을 요청하면 시스템은 적절히 처리해야 한다.
토큰은 필요에 따라 만료될 수 있다.
비밀번호는 상황에 맞게 검증한다.

## 처리 방법

1. 사용자 정보를 받는다
2. 검증한다
3. 결과를 반환한다

TBD: 실패 케이스 처리 방법
TODO: 토큰 만료 시간 결정

\`\`\`python
def login(user, password):
    result = db.query(user)
    return result
\`\`\`
`;

// ───────────────────────────────────────────────
// 좋은 스펙 예시: MUST/SHALL 명확, Pre/Post 명시, 에러케이스 있음
// ───────────────────────────────────────────────
const GOOD_SPEC = `
# 로그인 기능 — 스펙

## Precondition (전제 조건)
- 요청자는 이메일 형식의 username을 제공해야 한다
- password는 최소 8자, 최대 64자 string이어야 한다
- 요청은 HTTPS 환경에서만 수신한다

## 동작 정의

시스템은 username과 password를 받아 인증을 처리한다.

- 시스템은 MUST 비밀번호를 bcrypt(cost=12)로 비교한다
- 시스템은 MUST 로그인 시도를 최대 5회로 제한한다
- 시스템은 SHALL 성공 시 JWT 토큰(만료: 7일)을 반환한다
- 시스템은 MUST 5회 초과 시 계정을 30분 잠금한다

## Postcondition (사후 조건)

성공 시: HTTP 200 + { token: string, expiresAt: ISO8601 } 반환
실패 시: HTTP 401 + { error: "INVALID_CREDENTIALS" } 반환
잠금 시: HTTP 429 + { error: "ACCOUNT_LOCKED", retryAfter: integer } 반환

## 에러 케이스

- 잘못된 비밀번호: 401 반환, 시도 횟수 +1
- 존재하지 않는 username: 401 반환 (username 존재 여부 노출 금지)
- 계정 잠금 상태: 429 반환
- DB 연결 실패: 503 반환

## Invariant (불변식)

항상: 비밀번호 원문은 어떤 로그에도 기록되지 않는다
항상: 잠금 해제는 30분 경과 후 자동으로만 이루어진다
`;

function run(label, spec) {
  const result = calculateSlopScore(spec);
  const emoji = VERDICT_EMOJI[result.verdict];
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📋 ${label}`);
  console.log("=".repeat(60));
  console.log(`종합 Slop Score: ${result.score} → ${emoji} ${result.verdict}`);
  console.log(`  S1 결정 밀도:   ${result.signals.s1.score}/100`);
  console.log(`  S2 중복도:      ${result.signals.s2.score}/100 (Phase 2 예정)`);
  console.log(`  S3 구현가능성:  ${result.signals.s3.score}/100`);
  console.log(`  S4 코드위장:    ${result.signals.s4.score}/100`);
  if (result.findings.length > 0) {
    console.log("\n발견된 문제:");
    result.findings.forEach(f => {
      const icon = f.severity === "fail" ? "❌" : f.severity === "warn" ? "⚠️ " : "ℹ️ ";
      console.log(`  ${icon} [${f.signal}] ${f.message}`);
    });
  }
}

run("슬롭 예시 (나쁜 스펙)", SLOP_SPEC);
run("좋은 스펙 예시", GOOD_SPEC);
console.log("\n");
