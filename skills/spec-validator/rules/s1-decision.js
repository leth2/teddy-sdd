/**
 * S1 — 결정 밀도 (Decision Density)
 * RFC 2119 기반: MUST/SHALL 강도 vs SHOULD/MAY 위임 비율 측정
 * score 높을수록 결정 밀도 높음 (좋음)
 */

const STRONG_KEYWORDS = /\b(MUST|SHALL|WILL|REQUIRED|MANDATORY)\b/g;
const WEAK_KEYWORDS = /\b(should|may|might|could|optional|recommended)\b/gi;
const AMBIGUOUS_PATTERNS = [
  /적절히/g, /필요에\s*따라/g, /상황에\s*맞게/g, /경우에\s*따라/g,
  /\bsomehow\b/gi, /\bappropriately\b/gi, /\bas\s+needed\b/gi,
  /\bif\s+necessary\b/gi, /\bwhere\s+applicable\b/gi,
];
const ERROR_CASE_PATTERNS = [
  /에러/g, /예외/g, /실패/g, /오류/g,
  /\berror\b/gi, /\bexception\b/gi, /\bfail(ure|ed)?\b/gi, /\bedge\s+case\b/gi,
  /\binvalid\b/gi, /\bhandle\b/gi,
];
const TBD_PATTERNS = /\b(TBD|TODO|미정|추후|나중에|FIXME|XXX)\b/gi;
const DECISION_PATTERNS = [
  /\d+\s*(ms|초|sec|분|min|byte|MB|GB|개|회)/gi,  // 수치 명시
  /:\s*(int|string|boolean|array|object|number)\b/gi,  // 타입 명시
  /\b(integer|string|boolean|array|object)\b/gi,
  /\b(최소|최대|이상|이하|미만|초과)\s*\d+/g,  // 범위 명시
  /\b(min|max|minimum|maximum)\s*[:=]\s*\d+/gi,
];

export function analyze(text) {
  const findings = [];

  // 강한 키워드 카운트
  const strongMatches = text.match(STRONG_KEYWORDS) || [];
  const strongCount = strongMatches.length;

  // 약한 키워드 카운트 (소문자 SHOULD/MAY — RFC 2119 기준 미정의)
  const weakMatches = text.match(WEAK_KEYWORDS) || [];
  const weakCount = weakMatches.length;

  // 모호한 위임 표현
  let ambiguousCount = 0;
  for (const pattern of AMBIGUOUS_PATTERNS) {
    const m = text.match(pattern) || [];
    ambiguousCount += m.length;
    if (m.length > 0) {
      findings.push({
        type: 'ambiguous_delegation',
        message: `결정 위임 표현 발견: "${m[0]}"`,
        severity: 'warn',
      });
    }
  }

  // 에러/엣지케이스 명시
  let errorCaseCount = 0;
  for (const pattern of ERROR_CASE_PATTERNS) {
    errorCaseCount += (text.match(pattern) || []).length;
  }

  // TBD/TODO
  const tbdMatches = text.match(TBD_PATTERNS) || [];
  const tbdCount = tbdMatches.length;
  if (tbdCount > 0) {
    findings.push({
      type: 'tbd_present',
      message: `미완성 항목 ${tbdCount}개 발견 (TBD/TODO/미정)`,
      severity: 'warn',
    });
  }

  // 결정 패턴 (수치, 타입, 범위)
  let decisionPatternCount = 0;
  for (const pattern of DECISION_PATTERNS) {
    decisionPatternCount += (text.match(pattern) || []).length;
  }

  // RFC 2119: 소문자 should/may는 정의되지 않은 용어 — 경고
  if (weakCount > 0 && strongCount === 0) {
    findings.push({
      type: 'no_strong_requirements',
      message: `MUST/SHALL 없이 should/may ${weakCount}개만 사용 — 모든 요구사항이 선택적`,
      severity: 'fail',
    });
  } else if (weakCount > strongCount * 2) {
    findings.push({
      type: 'weak_keyword_dominant',
      message: `MUST ${strongCount}개 vs should/may ${weakCount}개 — 결정이 구현자에게 위임됨`,
      severity: 'warn',
    });
  }

  if (errorCaseCount === 0) {
    findings.push({
      type: 'no_error_cases',
      message: '에러/예외 케이스 명시 없음',
      severity: 'warn',
    });
  }

  // 점수 계산
  // 기본 50점에서 시작
  let score = 50;

  // 강한 요구사항: +5점씩 (최대 +30)
  score += Math.min(strongCount * 5, 30);

  // 결정 패턴 (수치/타입/범위): +3점씩 (최대 +20)
  score += Math.min(decisionPatternCount * 3, 20);

  // 에러 케이스: +10점
  score += Math.min(errorCaseCount * 2, 10);

  // 약한 키워드: -3점씩
  score -= Math.min(weakCount * 3, 30);

  // 모호한 위임: -5점씩
  score -= Math.min(ambiguousCount * 5, 25);

  // TBD: -8점씩
  score -= Math.min(tbdCount * 8, 24);

  score = Math.max(0, Math.min(100, score));

  return { score, findings };
}
