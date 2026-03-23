/**
 * S_AC — 수락 기준 완결성 (Acceptance Criteria Completeness)
 * requirements.md 전용 Signal
 * score 높을수록 AC가 잘 정의됨 (좋음)
 *
 * Phase 1.5.1: 구조화 EARS 패턴 추가
 *   WHEN/IF/WHERE/WHILE → THEN ... SHALL (멀티라인 포맷 지원)
 *
 * Phase 2.1: 에러 케이스 비율(errorCaseRatio) 추가
 *   이슈 #14 실증: 에러 케이스 0개 → 통과율 50~72%로 급락
 *   에러 케이스가 전체 AC 중 절반 이상이면 만점에 가깝게
 */

// REQ ID 패턴
const REQ_ID_RE = /`?REQ-\d{3,}`?/g;

// AC(수락 기준) 패턴
const AC_PATTERNS = [
  /\bAC\d*[:.)]/g,                      // AC1: AC2. AC:
  /수락\s*기준/g,
  /acceptance\s*criteria/gi,
  /\b(검증|확인)\s*기준/g,
  /^[\s\d*.#-]*\bTHEN\b[^\n]+\bSHALL\b/gim,  // 구조화 EARS THEN...SHALL 라인
];

// 에러 케이스 패턴 (Unwanted 템플릿 + AC 에러 단언)
const ERROR_CASE_PATTERNS = [
  // 구조화 EARS Unwanted: IF...THEN 멀티라인
  /\bIF\b[^\n]*\n\s+THEN\b[^\n]+/gim,
  // AC 에러 단언: "→ HTTP 4xx" 또는 "→ exit 1" 또는 "ERROR:" 포함
  /AC\d*[:.]\s*[^\n]*(?:→|:)\s*[^\n]*(?:4\d\d|exit\s*1|ERROR|에러|error code|not found|invalid|required|too long|too many|forbidden|already)/gi,
  // 문장형 에러 조건
  /(?:없으면|없는\s+경우|초과|잘못된|실패\s*시|오류)[^\n]*(?:반환|exit|출력|에러)/g,
];

// EARS 패턴 — 문장형(소문자) + 구조화형(대문자) 모두 지원
const EARS_PATTERNS = [
  // 일반 문장형 EARS (하위 호환)
  /\bWhen\b.{5,}/gi,
  /\bIf\b.{5,}/gi,
  /The\s+system\s+(shall|must|will)\b/gi,
  /시스템은\s+(MUST|SHALL|반드시)/g,

  // 구조화 EARS — 멀티라인: WHEN/IF 조건 + 들여쓰기 THEN SHALL
  /^[\s\d.]*\b(WHEN|IF|WHERE|WHILE)\b[^\n]+\n\s+THEN\b[^\n]+\bSHALL\b/gim,

  // 구조화 단독 조건 키워드 (THEN이 같은 줄에 있는 경우)
  /^[\s\d.]*\b(WHEN|IF|WHERE|WHILE)\b[^\n]+\bSHALL\b/gim,
];

// 구조화 EARS 쌍 카운트 (WHEN/IF → THEN SHALL 완전한 쌍)
const KIRO_PAIR_RE = /^[\s\d.]*\b(WHEN|IF|WHERE|WHILE)\b[^\n]+\n\s+THEN\b[^\n]+\bSHALL\b/gim;

// 요구사항 항목 패턴 (REQ 또는 번호 기반)
const REQ_ITEM_RE = /^(\*\*\d+\.\d+\*\*|##\s+REQ-\d+|REQ-\d+|\d+\.\d+\.)/gm;

export function analyze(text) {
  const findings = [];

  // REQ ID 존재 여부
  const reqIds = text.match(REQ_ID_RE) || [];
  const reqIdCount = reqIds.length;

  if (reqIdCount === 0) {
    findings.push({
      type: 'no_req_ids',
      message: 'REQ-NNN 형식의 요구사항 ID 없음 — 추적 가능성 없음',
      severity: 'warn',
    });
  }

  // AC 카운트
  let acCount = 0;
  for (const p of AC_PATTERNS) {
    acCount += (text.match(p) || []).length;
  }

  if (acCount === 0) {
    findings.push({
      type: 'no_ac',
      message: 'AC(수락 기준) 없음 — 구현자가 완료 기준을 알 수 없음',
      severity: 'fail',
    });
  }

  // 에러 케이스 카운트 (Unwanted 패턴)
  let errorCaseCount = 0;
  for (const p of ERROR_CASE_PATTERNS) {
    errorCaseCount += (text.match(p) || []).length;
  }

  // 에러 케이스 비율 계산
  // 이슈 #14 실증: 에러 케이스 0개 → 통과율 50~72%로 급락
  // acCount가 있을 때만 비율 의미 있음
  const errorCaseRatio = acCount > 0 ? errorCaseCount / acCount : 0;

  if (acCount > 0 && errorCaseCount === 0) {
    findings.push({
      type: 'no_error_cases',
      message: 'AC에 에러/예외 케이스 없음 — Unwanted 템플릿(IF...THEN) 추가 권고. 에러 케이스 0개 스펙은 통과율 50~72%로 급락 (이슈 #14)',
      severity: 'warn',
    });
  } else if (acCount > 0 && errorCaseRatio < 0.3) {
    findings.push({
      type: 'low_error_ratio',
      message: `에러 케이스 비율 ${Math.round(errorCaseRatio * 100)}% — 전체 AC 중 에러 케이스 30% 미만. Unwanted(IF...THEN) 추가 권고`,
      severity: 'warn',
    });
  }

  // EARS 형식 카운트
  let earsCount = 0;
  for (const p of EARS_PATTERNS) {
    earsCount += (text.match(p) || []).length;
  }

  // 구조화 EARS 완전한 쌍 카운트
  const kiroPairs = (text.match(KIRO_PAIR_RE) || []).length;

  if (earsCount === 0) {
    findings.push({
      type: 'no_ears_format',
      message: 'EARS 형식 패턴 없음 — WHEN/IF...THEN...SHALL 또는 When/If/The system shall 권고',
      severity: 'warn',
    });
  }

  // 요구사항 항목 수 대비 AC 비율
  const reqItems = text.match(REQ_ITEM_RE) || [];
  const reqItemCount = reqItems.length;

  if (reqItemCount > 0 && acCount < reqItemCount * 0.5) {
    findings.push({
      type: 'low_ac_ratio',
      message: `요구사항 ${reqItemCount}개 중 AC가 ${acCount}개 — 절반 이상 요구사항에 수락 기준 없음`,
      severity: 'warn',
    });
  }

  // 점수 계산
  let score = 10; // 기본

  // REQ ID: +20 (있으면) + 개수 보너스 최대 15
  if (reqIdCount > 0) score += 20;
  score += Math.min(reqIdCount * 3, 15);

  // AC: +30 (있으면) + 개수 보너스 최대 20
  if (acCount > 0) score += 30;
  score += Math.min(acCount * 3, 20);

  // 에러 케이스 비율 보너스/페널티
  // 0%  → -15 (이미 no_error_cases 경고 발생)
  // 30% → +0  (중립)
  // 50%+ → +10 (에러 케이스가 절반 이상이면 보너스)
  if (acCount > 0) {
    if (errorCaseCount === 0) {
      score -= 15;
    } else if (errorCaseRatio >= 0.5) {
      score += 10;
    } else if (errorCaseRatio >= 0.3) {
      score += 5;
    }
  }

  // EARS: 기본 존재 +10, 구조화 완전 쌍 추가 점수 (쌍당 +5, 최대 +25)
  if (earsCount > 0) score += 10;
  if (kiroPairs > 0) {
    score += Math.min(kiroPairs * 5, 25);
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    findings,
    _debug: { reqIdCount, acCount, errorCaseCount, errorCaseRatio: Math.round(errorCaseRatio * 100) + '%', earsCount, kiroPairs },
  };
}
