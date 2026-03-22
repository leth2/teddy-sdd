/**
 * S_DONE — 완료 기준 명확성 (Done Criteria Clarity)
 * tasks.md 전용 Signal
 * score 높을수록 완료 기준이 명확함 (좋음)
 */

// 체크박스 패턴
const CHECKBOX_RE = /- \[ \] /g;

// 완료 기준 패턴 (체크박스 뒤에 설명이 있는지)
const DONE_CRITERIA_RE = /- \[ \] .{10,}/g;  // 10자 이상 설명

// 인라인 완료 기준 (— 이후 설명)
const INLINE_DONE_RE = /- \[ \] [^—\n]+—\s*\S/g;

// 의존성 선언 패턴
const DEPENDENCY_PATTERNS = [
  /\brequires?:\s*\d/gi,
  /\bdepends?\s*(on)?:\s*\d/gi,
  /requires?:\s*[가-힣\d]+\s*완료/g,
  /after:\s*\d/gi,
  /병렬\s*실행\s*가능/g,
  /\(P\)/g,    // (P) = 병렬
];

// 시간 추정 패턴
const TIME_ESTIMATE_RE = /~\d+(\.\d+)?h|예상[:\s]*~?\d+h/g;

// 태스크 섹션 패턴
const TASK_SECTION_RE = /^##\s+\d+\./gm;

export function analyze(text) {
  const findings = [];

  // 체크박스 총 수
  const checkboxes = text.match(CHECKBOX_RE) || [];
  const checkboxCount = checkboxes.length;

  if (checkboxCount === 0) {
    findings.push({
      type: 'no_checkboxes',
      message: '체크박스 형식 태스크 없음 — 구현 항목이 정의되지 않음',
      severity: 'fail',
    });
    return { score: 0, findings };
  }

  // 완료 기준 있는 체크박스 비율
  const withDone = (text.match(DONE_CRITERIA_RE) || []).length;
  const withInlineDone = (text.match(INLINE_DONE_RE) || []).length;
  const doneRatio = withInlineDone / checkboxCount;

  if (doneRatio < 0.3) {
    findings.push({
      type: 'low_done_ratio',
      message: `체크박스 ${checkboxCount}개 중 완료 기준(— 설명) ${withInlineDone}개 — 70% 이상 완료 기준 없음`,
      severity: 'warn',
    });
  }

  // 의존성 선언
  let depCount = 0;
  for (const p of DEPENDENCY_PATTERNS) {
    depCount += (text.match(p) || []).length;
  }

  // 태스크 섹션 수
  const taskSections = text.match(TASK_SECTION_RE) || [];
  const sectionCount = taskSections.length;

  if (sectionCount > 1 && depCount === 0) {
    findings.push({
      type: 'no_dependencies',
      message: `태스크 ${sectionCount}개인데 의존성 선언 없음 — requires:/병렬 실행 여부 명시 권고`,
      severity: 'warn',
    });
  }

  // 시간 추정
  const timeEstimates = text.match(TIME_ESTIMATE_RE) || [];
  const timeCount = timeEstimates.length;

  if (sectionCount > 0 && timeCount === 0) {
    findings.push({
      type: 'no_time_estimate',
      message: '시간 추정 없음 — ~Nh 형식으로 예상 시간 추가 권고',
      severity: 'info',
    });
  }

  // 점수 계산
  let score = 15;

  // 체크박스 존재: 이미 통과
  score += 10;

  // 완료 기준 비율: 최대 +40
  score += Math.round(doneRatio * 40);

  // withDone (일반 설명 있는 것도 카운트): 최대 +15
  score += Math.min(withDone * 2, 15);

  // 의존성: +10
  if (depCount > 0) score += 10;

  // 시간 추정: +10
  if (timeCount > 0) score += 10;

  score = Math.max(0, Math.min(100, score));

  return { score, findings };
}
