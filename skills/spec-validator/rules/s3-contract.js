/**
 * S3 — 계약 완결성 (Contract Completeness)
 * Design by Contract 기반: Precondition / Postcondition / Invariant 존재 여부
 * score 높을수록 계약 완결성 높음 (좋음)
 */

const PRECONDITION_PATTERNS = [
  /\b(given|when|if|requires?|precondition|전제|조건)\b/gi,
  /~인\s*경우/g, /~전에/g, /호출\s*전/g, /실행\s*전/g,
  /\b(assumes?|assuming)\b/gi,
];

const POSTCONDITION_PATTERNS = [
  /\b(then|ensures?|returns?|outputs?|postcondition|결과|반환|응답)\b/gi,
  /이면\s*(성공|완료)/g, /실행\s*후/g, /완료\s*시/g,
  /\b(guarantees?|will\s+return|should\s+return)\b/gi,
];

const INVARIANT_PATTERNS = [
  /\b(always|invariant|불변|항상|반드시\s+유지)\b/gi,
  /\b(must\s+remain|must\s+always|never\s+changes?)\b/gi,
  /항상\s*(참|유지|보장)/g,
];

const ERROR_CASE_PATTERNS = [
  /에러/g, /예외/g, /실패/g, /오류/g,
  /\berror\b/gi, /\bexception\b/gi, /\bfail(ure|ed)?\b/gi,
  /\binvalid\b/gi, /\bnot\s+found\b/gi, /404|401|403|500/g,
];

const TBD_PATTERNS = /\b(TBD|TODO|미정|추후|나중에|FIXME|XXX)\b/gi;

export function analyze(text) {
  const findings = [];

  // Pre/Post/Invariant 존재 여부
  let preCount = 0;
  for (const p of PRECONDITION_PATTERNS) preCount += (text.match(p) || []).length;

  let postCount = 0;
  for (const p of POSTCONDITION_PATTERNS) postCount += (text.match(p) || []).length;

  let invCount = 0;
  for (const p of INVARIANT_PATTERNS) invCount += (text.match(p) || []).length;

  const hasPreCondition = preCount > 0;
  const hasPostCondition = postCount > 0;
  const hasInvariant = invCount > 0;

  if (!hasPreCondition) {
    findings.push({
      type: 'missing_precondition',
      message: 'Precondition 미명시 — "이 기능이 실행되기 위한 조건" 없음 (Given/전제/조건 추가 필요)',
      severity: 'warn',
    });
  }

  if (!hasPostCondition) {
    findings.push({
      type: 'missing_postcondition',
      message: 'Postcondition 미명시 — "실행 후 보장되는 상태" 없음 (Then/결과/반환 추가 필요)',
      severity: 'warn',
    });
  }

  if (!hasInvariant) {
    findings.push({
      type: 'missing_invariant',
      message: 'Invariant 미명시 — "항상 유지되어야 하는 조건" 없음 (선택적)',
      severity: 'info',
    });
  }

  // 에러 케이스
  let errorCount = 0;
  for (const p of ERROR_CASE_PATTERNS) errorCount += (text.match(p) || []).length;
  if (errorCount === 0) {
    findings.push({
      type: 'no_error_cases',
      message: '에러/실패 케이스 처리 명시 없음 — 정상 경로만 설명됨',
      severity: 'warn',
    });
  }

  // TBD/TODO
  const tbdMatches = text.match(TBD_PATTERNS) || [];
  const tbdCount = tbdMatches.length;
  if (tbdCount > 0) {
    findings.push({
      type: 'tbd_present',
      message: `미완성 항목 ${tbdCount}개 — 구현 가능성 저하`,
      severity: 'warn',
    });
  }

  // 점수 계산
  let score = 20; // 기본점수

  // Pre: +25, Post: +30 (가장 중요), Invariant: +10
  if (hasPreCondition) score += 25;
  if (hasPostCondition) score += 30;
  if (hasInvariant) score += 10;

  // 에러 케이스: +15 (최대)
  score += Math.min(errorCount * 3, 15);

  // TBD 감점: -10씩
  score -= Math.min(tbdCount * 10, 30);

  score = Math.max(0, Math.min(100, score));

  return { score, findings };
}
