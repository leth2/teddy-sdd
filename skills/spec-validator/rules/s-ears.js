/**
 * S_EARS — 구조화 EARS 완결성 (EARS Template Completeness)
 * requirements.md 전용 Signal — Phase 2.1 (#13 옵션 B)
 * score 높을수록 EARS 5개 템플릿 커버리지 높음 (좋음)
 *
 * Mavin (2009) EARS 5개 템플릿:
 *   Ubiquitous   : The [시스템] SHALL [응답]
 *   Event-driven : WHEN [트리거] ... SHALL [응답]
 *   Unwanted     : IF [비정상] THEN ... SHALL [응답]
 *   State-driven : WHILE [상태] ... SHALL [응답]
 *   Optional     : WHERE [기능 포함 시] ... SHALL [응답]
 *
 * 이관: Phase 1.5.1 S_AC kiroPairs 점수 → S_EARS로 이관
 * 근거: 이슈 #14 — Unwanted 패턴 수 ↔ 통과율 강한 상관관계 확인
 */

// Ubiquitous: "The [시스템] SHALL" or "시스템은 MUST/SHALL"
const UBIQUITOUS = [
  /\bThe\s+\w[\w\s]*\bSHALL\b/g,
  /시스템은\s+(MUST|SHALL|반드시)/g,
  /\bSHALL\b/g,  // SHALL 단독 존재도 Ubiquitous 힌트
];

// Event-driven: WHEN ... SHALL (단일라인 or 멀티라인)
const EVENT_DRIVEN = [
  /\bWHEN\b[^\n]+\bSHALL\b/gi,
  /\bWHEN\b[^\n]*\n\s+THEN\b[^\n]+\bSHALL\b/gim,
  /\bWhen\b.{10,}(?:shall|must)\b/gi,
];

// Unwanted: IF ... THEN ... SHALL (가장 중요 — 에러 케이스)
const UNWANTED = [
  /\bIF\b[^\n]*\n\s+THEN\b[^\n]+/gim,           // 멀티라인
  /\bIF\b[^\n]+\bTHEN\b[^\n]+\bSHALL\b/gi,       // 단일라인
  /\bIf\b.{10,}(?:shall|must)\b/gi,              // 소문자 문장형
];

// State-driven: WHILE ... SHALL
const STATE_DRIVEN = [
  /\bWHILE\b[^\n]+\bSHALL\b/gi,
  /\bWHILE\b[^\n]*\n\s+THEN\b[^\n]+\bSHALL\b/gim,
  /\bWhile\b.{10,}(?:shall|must)\b/gi,
];

// Optional: WHERE ... SHALL
const OPTIONAL = [
  /\bWHERE\b[^\n]+\bSHALL\b/gi,
  /\bWHERE\b[^\n]*\n\s+THEN\b[^\n]+\bSHALL\b/gim,
];

// 구조화 EARS 완전한 쌍 (S_AC에서 이관)
const STRUCTURED_PAIR_RE = /^[\s\d.]*\b(WHEN|IF|WHERE|WHILE)\b[^\n]+\n\s+THEN\b[^\n]+\bSHALL\b/gim;

function countPatterns(text, patterns) {
  let total = 0;
  for (const p of patterns) {
    // lastIndex 초기화 (global 플래그)
    if (p.flags.includes('g')) p.lastIndex = 0;
    total += (text.match(p) || []).length;
  }
  return total;
}

export function analyze(text) {
  const findings = [];

  const ubiquitousCount  = countPatterns(text, UBIQUITOUS);
  const eventDrivenCount = countPatterns(text, EVENT_DRIVEN);
  const unwantedCount    = countPatterns(text, UNWANTED);
  const stateDrivenCount = countPatterns(text, STATE_DRIVEN);
  const optionalCount    = countPatterns(text, OPTIONAL);
  const structuredPairs  = (text.match(STRUCTURED_PAIR_RE) || []).length;

  // 템플릿 존재 여부 (boolean)
  const hasUbiquitous  = ubiquitousCount  > 0;
  const hasEventDriven = eventDrivenCount > 0;
  const hasUnwanted    = unwantedCount    > 0;
  const hasStateDriven = stateDrivenCount > 0;
  const hasOptional    = optionalCount    > 0;

  const templateCount = [hasUbiquitous, hasEventDriven, hasUnwanted, hasStateDriven, hasOptional]
    .filter(Boolean).length;

  // Unwanted(에러 케이스) 미존재는 중요 경고
  // 이슈 #14: Unwanted 0개 → 통과율 50~72%로 급락
  if (!hasUnwanted) {
    findings.push({
      type: 'no_unwanted',
      message: 'Unwanted 템플릿(IF...THEN) 없음 — 에러/예외 케이스 미명시. 통과율 하락 위험 (#14)',
      severity: 'warn',
    });
  }

  if (!hasEventDriven) {
    findings.push({
      type: 'no_event_driven',
      message: 'Event-driven 템플릿(WHEN...SHALL) 없음 — 트리거 조건 명시 권고',
      severity: 'info',
    });
  }

  if (templateCount === 0) {
    findings.push({
      type: 'no_ears',
      message: 'EARS 템플릿 없음 — Ubiquitous/Event-driven/Unwanted/State-driven/Optional 중 하나 이상 권고',
      severity: 'fail',
    });
  }

  // 점수 계산
  // 5개 템플릿 각 20점 = 100점 기본
  // Unwanted는 #14 데이터 기반으로 가중치 높임: 25점
  // Event-driven: 25점
  // Ubiquitous: 20점
  // State-driven: 15점
  // Optional: 15점
  // = 100점

  let score = 0;
  if (hasUbiquitous)  score += 20;
  if (hasEventDriven) score += 25;
  if (hasUnwanted)    score += 25;
  if (hasStateDriven) score += 15;
  if (hasOptional)    score += 15;

  // 구조화 쌍 밀도 보너스 (S_AC에서 이관): 쌍당 +3, 최대 +20
  // 구조화 쌍이 많을수록 기계 파싱 가능한 형식에 가깝다
  if (structuredPairs > 0) {
    score = Math.min(100, score + Math.min(structuredPairs * 3, 20));
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    findings,
    _debug: {
      ubiquitousCount, eventDrivenCount, unwantedCount,
      stateDrivenCount, optionalCount, structuredPairs,
      templateCount,
    },
  };
}
