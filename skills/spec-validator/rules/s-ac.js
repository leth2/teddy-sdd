/**
 * S_AC — 수락 기준 완결성 (Acceptance Criteria Completeness)
 * requirements.md 전용 Signal
 * score 높을수록 AC가 잘 정의됨 (좋음)
 */

// REQ ID 패턴
const REQ_ID_RE = /`?REQ-\d{3,}`?/g;

// AC(수락 기준) 패턴
const AC_PATTERNS = [
  /\bAC\d*[:.)]/g,            // AC1: AC2. AC:
  /수락\s*기준/g,
  /acceptance\s*criteria/gi,
  /\b(검증|확인)\s*기준/g,
];

// EARS 형식 패턴 (Event-driven / Unwanted / State / Optional / Complex)
const EARS_PATTERNS = [
  /\bWhen\b.{5,}/gi,
  /\bIf\b.{5,}/gi,
  /The\s+system\s+(shall|must|will)\b/gi,
  /시스템은\s+(MUST|SHALL|반드시)/g,
];

// 요구사항 항목 패턴 (REQ 또는 번호 기반)
const REQ_ITEM_RE = /^(\*\*\d+\.\d+\*\*|REQ-\d+|\d+\.\d+\.)/gm;

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

  // EARS 형식
  let earsCount = 0;
  for (const p of EARS_PATTERNS) {
    earsCount += (text.match(p) || []).length;
  }

  if (earsCount === 0) {
    findings.push({
      type: 'no_ears_format',
      message: 'EARS 형식 패턴 없음 — When/If/The system shall 등 조건 기반 요구사항 권고',
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

  // REQ ID: +20 (있으면)
  if (reqIdCount > 0) score += 20;
  score += Math.min(reqIdCount * 3, 15); // 많을수록 추가

  // AC: +30 (있으면) + 개수 보너스
  if (acCount > 0) score += 30;
  score += Math.min(acCount * 4, 20);

  // EARS: +15
  if (earsCount > 0) score += 15;

  score = Math.max(0, Math.min(100, score));

  return { score, findings };
}
