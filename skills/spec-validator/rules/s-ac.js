/**
 * S_AC — 수락 기준 완결성 (Acceptance Criteria Completeness)
 * requirements.md 전용 Signal
 * score 높을수록 AC가 잘 정의됨 (좋음)
 *
 * Phase 1.5.1: Kiro EARS 구조화 패턴 추가
 *   WHEN/IF/WHERE/WHILE → THEN ... SHALL (멀티라인 포맷 지원)
 */

// REQ ID 패턴
const REQ_ID_RE = /`?REQ-\d{3,}`?/g;

// AC(수락 기준) 패턴
const AC_PATTERNS = [
  /\bAC\d*[:.)]/g,                      // AC1: AC2. AC:
  /수락\s*기준/g,
  /acceptance\s*criteria/gi,
  /\b(검증|확인)\s*기준/g,
  /^[\s\d*.#-]*\bTHEN\b[^\n]+\bSHALL\b/gim,  // Kiro EARS THEN...SHALL 라인
];

// EARS 패턴 — 문장형(소문자) + Kiro 구조화형(대문자) 모두 지원
const EARS_PATTERNS = [
  // 일반 문장형 EARS (하위 호환)
  /\bWhen\b.{5,}/gi,
  /\bIf\b.{5,}/gi,
  /The\s+system\s+(shall|must|will)\b/gi,
  /시스템은\s+(MUST|SHALL|반드시)/g,

  // Kiro 구조화 EARS — 멀티라인: WHEN/IF 조건 + 들여쓰기 THEN SHALL
  /^[\s\d.]*\b(WHEN|IF|WHERE|WHILE)\b[^\n]+\n\s+THEN\b[^\n]+\bSHALL\b/gim,

  // Kiro 단독 조건 키워드 (THEN이 같은 줄에 있는 경우)
  /^[\s\d.]*\b(WHEN|IF|WHERE|WHILE)\b[^\n]+\bSHALL\b/gim,
];

// Kiro EARS 쌍 카운트 (WHEN/IF → THEN SHALL 완전한 쌍)
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

  // EARS 형식 카운트
  let earsCount = 0;
  for (const p of EARS_PATTERNS) {
    earsCount += (text.match(p) || []).length;
  }

  // Kiro EARS 완전한 쌍 카운트
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

  // EARS: 기본 존재 +10, Kiro 완전 쌍 추가 점수 (쌍당 +5, 최대 +25)
  if (earsCount > 0) score += 10;
  if (kiroPairs > 0) {
    score += Math.min(kiroPairs * 5, 25);
  }

  score = Math.max(0, Math.min(100, score));

  return { score, findings, _debug: { reqIdCount, acCount, earsCount, kiroPairs } };
}
