/**
 * spec-tc.js — EARS → 테스트 케이스 자동 생성
 * 이슈 #19 3단계 / 이슈 #5 "Spec = TC 파이프라인"
 *
 * EARS 유형 → 테스트 패턴:
 *   WHEN/THEN (Event-driven) → 정상 케이스 test
 *   IF/THEN   (Unwanted)     → 에러 케이스 test
 *   WHILE/THEN(State-driven) → 상태 기반 test
 *   WHERE/THEN(Optional)     → 선택 기능 test
 *   Ubiquitous SHALL         → 기본 동작 test
 *   AC: → HTTP/exit/err      → 검증 단언 추출
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';

// EARS 패턴 파서 — 멀티라인 우선
// THEN 절이 에러 응답인지 판별: ERROR / exit / stderr / 4xx / 5xx
const THEN_ERROR_RE = /\b(ERROR|error|stderr|exit\s*1|exit\s*2|4\d\d|5\d\d)\b/i;

const EARS_PARSERS = [
  {
    type: 'if_branch',          // 분류는 extract 후 결정
    label: '조건 케이스',
    // IF [조건]\n  THEN [시스템] SHALL [결과]
    re: /\bIF\b([^\n]+)\n\s+THEN\b([^\n]+)/gim,
    extract: (m) => {
      const condition = m[1].trim();
      const result = m[2].trim();
      // THEN 절에 에러 응답 키워드 있으면 Unwanted, 없으면 조건부 정상
      const type = THEN_ERROR_RE.test(result) ? 'unwanted' : 'event_driven';
      const label = type === 'unwanted' ? '에러 케이스' : '정상 케이스 (조건부)';
      return { condition, result, type, label };
    },
  },
  {
    type: 'event_driven',
    label: '정상 케이스',
    // WHEN [트리거]\n  THEN [시스템] SHALL [결과]
    re: /\bWHEN\b([^\n]+)\n\s+THEN\b([^\n]+)/gim,
    extract: (m) => ({ trigger: m[1].trim(), result: m[2].trim() }),
  },
  {
    type: 'state_driven',
    label: '상태 케이스',
    // WHILE [상태]\n  THEN [시스템] SHALL [결과]
    re: /\bWHILE\b([^\n]+)\n\s+THEN\b([^\n]+)/gim,
    extract: (m) => ({ state: m[1].trim(), result: m[2].trim() }),
  },
  {
    type: 'optional',
    label: '선택 케이스',
    // WHERE [조건]\n  THEN [시스템] SHALL [결과]
    re: /\bWHERE\b([^\n]+)\n\s+THEN\b([^\n]+)/gim,
    extract: (m) => ({ feature: m[1].trim(), result: m[2].trim() }),
  },
];

// AC 라인 파서 — 단일라인 형식 (todo-api 스타일)
// AC1: [설명] → HTTP 4xx / exit N / [코드]
const AC_LINE_RE = /^[-*]?\s*AC\d*[:.]\s*([^\n]+)/gim;
const AC_ERROR_RE = /→\s*[^\n]*(?:4\d\d|5\d\d|exit\s*\d+|ERROR|error|에러|not found|invalid|required|too long|too many|forbidden|already)/i;
const AC_SUCCESS_RE = /→\s*[^\n]*(?:200|201|204|HTTP 2\d\d|성공|반환|저장)/i;

function parseEARS(sectionText) {
  const results = [];

  for (const parser of EARS_PARSERS) {
    parser.re.lastIndex = 0;
    let m;
    while ((m = parser.re.exec(sectionText)) !== null) {
      const extracted = parser.extract(m);
      // if_branch는 extract가 type/label을 결정
      const type = extracted.type ?? parser.type;
      const label = extracted.label ?? parser.label;
      results.push({ type, label, ...extracted, raw: m[0] });
    }
  }

  return results;
}

function parseACLines(sectionText) {
  const results = [];
  AC_LINE_RE.lastIndex = 0;
  let m;
  while ((m = AC_LINE_RE.exec(sectionText)) !== null) {
    const line = m[1].trim();
    const isError = AC_ERROR_RE.test(line);
    const isSuccess = AC_SUCCESS_RE.test(line);
    results.push({
      type: isError ? 'unwanted' : isSuccess ? 'event_driven' : 'unknown',
      label: isError ? '에러 케이스' : isSuccess ? '정상 케이스' : '검증 케이스',
      description: line,
    });
  }
  return results;
}

/**
 * REQ-NNN 섹션 분리 (s-ac.js와 동일 로직)
 */
function parseReqSections(text) {
  const markers = [...text.matchAll(/`?REQ-(\d{3,})`?/g)];
  if (markers.length === 0) return [{ req_id: 'REQ-000', content: text }];

  const sections = [];
  const seen = new Set();

  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    const reqId = `REQ-${m[1]}`;
    if (seen.has(reqId)) continue;
    seen.add(reqId);

    const start = m.index;
    let nextStart = text.length;
    for (let j = i + 1; j < markers.length; j++) {
      if (!seen.has(`REQ-${markers[j][1]}`)) {
        nextStart = markers[j].index;
        break;
      }
    }
    sections.push({ req_id: reqId, content: text.slice(start, nextStart) });
  }

  return sections;
}

/**
 * EARS 패턴에서 테스트 설명 문자열 생성
 */
function toTestDesc(ac) {
  switch (ac.type) {
    case 'unwanted':
      // IF [조건] → THEN [결과] 또는 description
      if (ac.condition && ac.result) {
        return `${ac.condition.replace(/^the\s+/i, '')} → ${extractExpected(ac.result)}`;
      }
      return ac.description || ac.raw?.slice(0, 60);

    case 'event_driven':
      if (ac.trigger && ac.result) {
        return `${ac.trigger.replace(/^a\s+/i, '')} → ${extractExpected(ac.result)}`;
      }
      // IF → 정상 케이스 전환 (조건부 기능): condition 필드 사용
      if (ac.condition && ac.result) {
        return `[조건] ${ac.condition.replace(/^`?the\s*/i, '')} → ${extractExpected(ac.result)}`;
      }
      return ac.description || (ac.raw || '').replace(/\n\s*/g, ' ').slice(0, 60);

    case 'state_driven':
      return `[${ac.state}] 상태에서 ${extractExpected(ac.result)}`;

    case 'optional':
      return `[선택] ${ac.feature} → ${extractExpected(ac.result)}`;

    default:
      return ac.description || '(검증 케이스)';
  }
}

function extractExpected(resultStr) {
  // HTTP 상태코드 / exit code / ERROR 코드 추출
  const httpMatch = resultStr.match(/HTTP\s+(\d{3})|(\d{3})\s*$/);
  const exitMatch = resultStr.match(/exit\s*(\d+)/i);
  const errorMatch = resultStr.match(/`([A-Z_]+)`/);
  const shallMatch = resultStr.match(/SHALL\s+(.{0,40})/i);

  if (httpMatch) return `HTTP ${httpMatch[1] || httpMatch[2]}`;
  if (exitMatch) return `exit ${exitMatch[1]}`;
  if (errorMatch) return errorMatch[1];
  if (shallMatch) return shallMatch[1].trim();
  return resultStr.slice(0, 50).trim();
}

/**
 * Gap 2: AC 설명에서 실제 단언(assertion) 추출
 * "잘못된 비밀번호 → HTTP 401" → expect(res.status).toBe(401)
 * "ERROR: title required" → expect(stderr).toContain("ERROR: title required")
 * exit 1 → expect(exitCode).toBe(1)
 */
function extractAssertions(ac) {
  const text = [ac.result, ac.condition, ac.description].filter(Boolean).join(' ');
  const assertions = [];

  // HTTP 상태코드: → HTTP 201 / HTTP 401 등
  const httpMatch = text.match(/→\s*HTTP\s+(\d{3})|HTTP\s+(\d{3})/i);
  if (httpMatch) {
    const code = httpMatch[1] || httpMatch[2];
    assertions.push(`expect(res.status).toBe(${code});`);
  }

  // exit code: exit 1 / exit 0
  const exitMatch = text.match(/exit\s+(\d+)/i);
  if (exitMatch) {
    assertions.push(`expect(exitCode).toBe(${exitMatch[1]});`);
  }

  // 에러 코드 문자열: `ERROR_CODE` 형식
  const errCodeMatch = text.match(/`([A-Z][A-Z0-9_]{2,})`/g);
  if (errCodeMatch) {
    for (const m of errCodeMatch) {
      const code = m.replace(/`/g, '');
      if (code !== 'ERROR') { // 단독 ERROR는 제외
        assertions.push(`expect(body.error).toBe("${code}");`);
      }
    }
  }

  // stderr 출력: 'ERROR: ...' to stderr
  const stderrMatch = text.match(/`(ERROR:[^`]+)`\s*to\s*stderr/i)
    || text.match(/print\s*`(ERROR:[^`]+)`/i);
  if (stderrMatch) {
    assertions.push(`expect(stderr).toContain("${stderrMatch[1]}");`);
  }

  // stdout 출력: print `...` to stdout
  const stdoutMatch = text.match(/print\s*`([^`]+)`\s*to\s*stdout/i);
  if (stdoutMatch) {
    assertions.push(`expect(stdout).toContain("${stdoutMatch[1].slice(0, 40)}");`);
  }

  return assertions;
}

/**
 * TypeScript/Vitest 테스트 골격 생성
 */
function generateTestSkeleton(reqId, acs) {
  if (acs.length === 0) return null;

  const errorAcs = acs.filter(a => a.type === 'unwanted');
  const normalAcs = acs.filter(a => a.type !== 'unwanted' && a.type !== 'unknown');
  const unknownAcs = acs.filter(a => a.type === 'unknown');

  const lines = [];
  lines.push(`describe("${reqId}", () => {`);

  const renderAc = (ac, todoLabel) => {
    const desc = toTestDesc(ac);
    const assertions = extractAssertions(ac);
    const hasAssertions = assertions.length > 0;

    lines.push(`  test("${desc}", async () => {`);
    lines.push(`    // @spec ${reqId}`);
    lines.push(`    // TODO: ${todoLabel}`);

    if (ac.trigger) {
      lines.push(`    // WHEN: ${ac.trigger}`);
      if (ac.result) lines.push(`    // THEN: ${ac.result}`);
    } else if (ac.condition) {
      lines.push(`    // IF: ${ac.condition}`);
      if (ac.result) lines.push(`    // THEN: ${ac.result}`);
    } else {
      lines.push(`    // 케이스: ${ac.description || ''}`);
    }

    if (hasAssertions) {
      lines.push(``);
      for (const a of assertions) {
        lines.push(`    ${a}`);
      }
    } else {
      lines.push(`    expect(true).toBe(true); // placeholder`);
    }

    lines.push(`  });`);
    lines.push(``);
  };

  for (const ac of normalAcs)  renderAc(ac, '정상 케이스 구현');
  for (const ac of errorAcs)   renderAc(ac, '에러 케이스 구현');
  for (const ac of unknownAcs) renderAc(ac, '검증 케이스 구현');

  lines.push(`});`);
  return lines.join('\n');
}

const FILE_HEADER = (specPath) => [
  `// 자동 생성 — spec-tc`,
  `// 소스: ${specPath}`,
  `// 이슈 #5 Spec = TC 파이프라인`,
  `// @spec-source ${specPath}`,
  `import { describe, test, expect } from "vitest";`,
  ``,
].join('\n');

/**
 * 메인 진입점
 * @param {string} specPath - requirements.md 파일 경로
 * @param {Object} options
 *   output: 'print' | 'file'
 *   outDir: 파일 출력 디렉토리 (--out 플래그)
 */
export function generateTC(specPath, { output = 'print', outDir = null } = {}) {
  const text = readFileSync(specPath, 'utf-8');
  const sections = parseReqSections(text);

  const results = [];

  for (const section of sections) {
    const earsAcs = parseEARS(section.content);
    const acLineAcs = parseACLines(section.content);
    const acs = earsAcs.length > 0 ? earsAcs : acLineAcs;

    const errorCount = acs.filter(a => a.type === 'unwanted').length;
    const normalCount = acs.filter(a => a.type !== 'unwanted' && a.type !== 'unknown').length;
    const skeleton = generateTestSkeleton(section.req_id, acs);

    results.push({ req_id: section.req_id, total: acs.length, normalCount, errorCount, skeleton });
  }

  const summary = [];
  const allCode = [FILE_HEADER(specPath)];

  // 파일 출력용 분리 코드 (REQ별)
  const perReqFiles = {};

  for (const r of results) {
    if (r.skeleton && r.total > 0) {
      const icon = r.errorCount > 0 ? '✅' : '🟡';
      summary.push(`  ${icon} ${r.req_id}: 정상 ${r.normalCount}개, 에러 ${r.errorCount}개`);
      allCode.push(r.skeleton, '');
      perReqFiles[r.req_id] = FILE_HEADER(specPath) + r.skeleton + '\n';
    } else {
      summary.push(`  ⚠️  ${r.req_id}: 테스트 케이스 0개 — EARS 패턴 없음, Unwanted 추가 권고`);
    }
  }

  const code = allCode.join('\n');

  // 헤더 출력
  console.log(`\n📋 spec-tc: ${specPath}`);
  console.log(summary.join('\n'));

  if (output === 'file' && outDir) {
    // Gap 1: 파일 출력
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    // 통합 파일
    const allFile = join(outDir, 'spec.test.ts');
    writeFileSync(allFile, code, 'utf-8');
    console.log(`\n📁 출력:`);
    console.log(`  ${allFile} (전체 통합)`);

    // REQ별 파일
    for (const [reqId, content] of Object.entries(perReqFiles)) {
      const fname = join(outDir, `${reqId.toLowerCase()}.test.ts`);
      writeFileSync(fname, content, 'utf-8');
      console.log(`  ${fname}`);
    }
    console.log(`\n총 ${Object.keys(perReqFiles).length}개 REQ 파일 생성됨.`);
  } else {
    console.log(`\n${'─'.repeat(60)}\n`);
    console.log(code);
  }

  return { summary, code, results };
}
