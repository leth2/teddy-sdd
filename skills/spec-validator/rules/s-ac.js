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
 *
 * Phase 2.2: REQ당 Unwanted 커버리지 (#19 1단계)
 *   에러 케이스 "개수" → "REQ당 존재 여부"로 전환
 *   Unwanted 없는 REQ를 명시적으로 경고
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

// 에러 케이스 패턴 (Unwanted 템플릿 + AC 에러 단언) — 섹션 내 매칭용
const ERROR_CASE_RE = [
  // 구조화 EARS Unwanted: IF...THEN 멀티라인
  /\bIF\b[^\n]*\n\s+THEN\b[^\n]+/im,
  // IF...THEN 단일라인 + SHALL
  /\bIF\b[^\n]+\bTHEN\b[^\n]+\bSHALL\b/i,
  // AC 에러 단언: "→ HTTP 4xx" 또는 "→ exit 1" 또는 "ERROR:" 포함
  /AC\d*[:.]\s*[^\n]*(?:→|:)\s*[^\n]*(?:4\d\d|exit\s*1|ERROR|에러|not found|invalid|required|too long|too many|forbidden|already)/i,
  // 문장형 에러 조건
  /(?:없으면|없는\s*경우|초과|잘못된|실패\s*시|오류)[^\n]*(?:반환|exit|출력|에러)/,
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

// 요구사항 항목 패턴 (REQ 또는 번호 기반) — 전체 개수용
const REQ_ITEM_RE = /^(\*\*\d+\.\d+\*\*|##\s+REQ-\d+|REQ-\d+|\d+\.\d+\.)/gm;

// REQ 유형 판별 패턴 (#19 2단계)
// 주의: 한글 키워드에는 \b 워드 바운더리 사용 불가 (ASCII 전용)
//       한글 패턴은 독립 regex로 분리

// 상호작용형: WHEN/IF/WHILE 트리거 존재 → Unwanted 경고 대상
const INTERACTION_RE = [
  /\bWHEN\b.{5,}/i,
  /\bWHILE\b.{5,}(?:SHALL|MUST)\b/i,
  /시스템은\s+(?:MUST|SHALL)/,
  /\bWhen\b[^\n]+(?:요청하면|시도하면|하면)/,
];

// 제약형: Ubiquitous "The system SHALL" 또는 순수 구현 제약
// 한글 키워드(\b 없이) + ASCII 키워드(\b 있음)
const CONSTRAINT_RE = [
  /^The\s+\w[\w\s]+\bSHALL\b/m,          // "The [시스템] SHALL ..."
  /(?:비밀번호|패스워드).{0,30}(?:MUST|SHALL|반드시|해야)/,  // 비밀번호 + 의무 키워드
  /(?:저장|암호화|해싱|bcrypt|salt).{0,50}(?:MUST|SHALL|반드시)/,  // 저장/암호화 제약
  /(?:로그|audit|logging).{0,50}(?:MUST|SHALL|반드시)/,            // 로깅 제약
];

/**
 * REQ 섹션의 EARS 유형 판별
 * @returns {'interaction' | 'constraint' | 'unknown'}
 */
function classifyReqType(sectionText) {
  // 제약형 패턴이 있고 상호작용형 패턴이 없으면 → constraint
  const hasConstraint = CONSTRAINT_RE.some(p => p.test(sectionText));
  const hasInteraction = INTERACTION_RE.some(p => p.test(sectionText));

  if (hasInteraction) return 'interaction';
  if (hasConstraint) return 'constraint';
  return 'unknown'; // 판단 불가 → 경고 대상으로 포함
}

/**
 * REQ-NNN 기준으로 섹션 분리
 * @returns {Array<{req_id: string, content: string}>}
 */
function parseReqSections(text) {
  const markers = [...text.matchAll(/`?REQ-(\d{3,})`?/g)];
  if (markers.length === 0) return [];

  const sections = [];
  const seen = new Set();

  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    const reqId = `REQ-${m[1]}`;
    if (seen.has(reqId)) continue;
    seen.add(reqId);

    const start = m.index;
    // 다음 새 REQ 시작점까지
    let nextStart = text.length;
    for (let j = i + 1; j < markers.length; j++) {
      const nextId = `REQ-${markers[j][1]}`;
      if (!seen.has(nextId)) {
        nextStart = markers[j].index;
        break;
      }
    }
    sections.push({ req_id: reqId, content: text.slice(start, nextStart) });
  }

  return sections;
}

/**
 * 섹션에 Unwanted(에러 케이스) 패턴이 있는가
 */
function sectionHasUnwanted(sectionText) {
  return ERROR_CASE_RE.some(p => p.test(sectionText));
}

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

  // REQ당 Unwanted 커버리지 (#19 2단계: 제약형 REQ 면제)
  // 이슈 #14 실증: 에러 케이스 0개 → 통과율 50~72%로 급락
  const reqSections = parseReqSections(text);
  const totalReqs = reqSections.length;

  // 각 REQ를 유형 분류
  const classifiedReqs = reqSections.map(s => ({
    ...s,
    type: classifyReqType(s.content),
  }));

  // 제약형(constraint)은 Unwanted 경고 대상에서 제외
  const targetReqs = classifiedReqs.filter(s => s.type !== 'constraint');
  const constraintReqs = classifiedReqs.filter(s => s.type === 'constraint');

  const reqsWithUnwanted = targetReqs.filter(s => sectionHasUnwanted(s.content));
  const reqsMissingUnwanted = targetReqs
    .filter(s => !sectionHasUnwanted(s.content))
    .map(s => s.req_id);

  const targetCount = targetReqs.length;
  const unwantedCoverage = targetCount > 0 ? reqsWithUnwanted.length / targetCount : 1; // 대상 없으면 100%

  // 레거시 에러케이스 카운트 (점수 보조 신호 — 섹션 파싱 없이 전체 텍스트)
  const errorCaseCount = ERROR_CASE_RE.filter(p =>
    new RegExp(p.source, p.flags.replace('i', '') + 'gi').test(text)
  ).length; // 패턴 종류 수 (대략적 존재 여부)

  if (totalReqs > 0) {
    if (reqsMissingUnwanted.length === targetCount && targetCount > 0) {
      // 대상 REQ 전부 에러 케이스 없음
      findings.push({
        type: 'no_error_cases',
        message: `모든 REQ에 에러 케이스 없음 — Unwanted 템플릿(IF...THEN) 추가 권고. 통과율 50~72% 위험 (#14)`,
        severity: 'warn',
      });
    } else if (reqsMissingUnwanted.length > 0) {
      // 일부 REQ 누락 — 목록 명시 (제약형 제외됨)
      const exemptNote = constraintReqs.length > 0
        ? ` (${constraintReqs.map(s => s.req_id).join(', ')} 제약형 면제)`
        : '';
      findings.push({
        type: 'missing_unwanted_reqs',
        message: `Unwanted 케이스 없는 REQ: ${reqsMissingUnwanted.join(', ')} — 에러/예외 AC 추가 권고${exemptNote}`,
        severity: 'warn',
      });
    }
  } else if (acCount > 0 && errorCaseCount === 0) {
    // REQ-NNN 없는 스펙 — 전체 텍스트 기준 fallback
    findings.push({
      type: 'no_error_cases',
      message: 'AC에 에러/예외 케이스 없음 — Unwanted 템플릿(IF...THEN) 추가 권고 (#14)',
      severity: 'warn',
    });
  }

  // EARS 형식 카운트 (존재 여부 확인용 — 상세 분석은 S_EARS에서)
  let earsCount = 0;
  for (const p of EARS_PATTERNS) {
    earsCount += (text.match(p) || []).length;
  }

  if (earsCount === 0) {
    findings.push({
      type: 'no_ears_format',
      message: 'EARS 형식 패턴 없음 — WHEN/IF...THEN...SHALL 또는 When/If/The system shall 권고 (S_EARS 상세 분석)',
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

  // REQ당 Unwanted 커버리지 보너스/페널티 (#19 2단계: 제약형 면제 반영)
  // unwantedCoverage: 상호작용형/unknown REQ 중 Unwanted 있는 비율
  // 0%   → -15 (치명, 이슈 #14)
  // <50% → -5  (경고)
  // 50%+ → +5  (양호)
  // 80%+ → +10 (우수)
  if (targetCount > 0) {
    if (unwantedCoverage === 0) {
      score -= 15;
    } else if (unwantedCoverage < 0.5) {
      score -= 5;
    } else if (unwantedCoverage >= 0.8) {
      score += 10;
    } else {
      score += 5;
    }
  } else if (acCount > 0 && errorCaseCount === 0) {
    // REQ-NNN 없는 스펙 fallback
    score -= 15;
  }

  // EARS 존재 보너스 (상세 분석은 S_EARS에서 담당)
  if (earsCount > 0) score += 10;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    findings,
    _debug: {
      reqIdCount, acCount, earsCount,
      totalReqs, targetReqs: targetCount,
      constraintReqs: constraintReqs.map(s => s.req_id),
      reqsWithUnwanted: reqsWithUnwanted.length,
      reqsMissingUnwanted,
      unwantedCoverage: Math.round(unwantedCoverage * 100) + '%',
    },
  };
}
