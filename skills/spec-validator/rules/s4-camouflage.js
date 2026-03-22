/**
 * S4 — 코드 위장도 (Code Camouflage)
 * 스펙 안에 설명 없이 코드 덤프가 있으면 위장 위험
 * score 높을수록 코드 위장 의심 (나쁨)
 */

// 코드 블록 추출: ```lang ... ```
const CODE_BLOCK_RE = /```(\w*)\n([\s\S]*?)```/g;

// 주석 패턴
const COMMENT_RE = /^\s*(#|\/\/|\/\*|\*|<!--)/m;

// "왜" 설명 키워드
const WHY_PATTERNS = [
  /\b(because|reason|why|이유|왜냐하면|설명|note|참고|explanation)\b/gi,
  /\/\/\s*\S/g,  // 인라인 주석
  /#\s*\S/g,
];

// Reference 레이블 패턴 (코드 블록 앞에 레이블 있으면 안전)
const LABEL_PATTERNS = [
  /\b(example|예시|reference|레퍼런스|sample|인터페이스|interface|schema|스키마)\b/gi,
];

export function analyze(text) {
  const findings = [];
  const codeBlocks = [];

  let match;
  while ((match = CODE_BLOCK_RE.exec(text)) !== null) {
    codeBlocks.push({
      lang: match[1] || 'unknown',
      body: match[2],
      fullMatch: match[0],
      index: match.index,
    });
  }

  if (codeBlocks.length === 0) {
    return { score: 0, findings: [] };
  }

  let totalScore = 0;

  for (const block of codeBlocks) {
    let blockScore = 0;
    const lines = block.body.split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;

    // 주석 비율 계산
    const commentLines = lines.filter(l => COMMENT_RE.test(l)).length;
    const commentRatio = commentLines / lines.length;

    // 블록 앞 컨텍스트 (100자) — 레이블 확인
    const preceding = text.slice(Math.max(0, block.index - 200), block.index);
    const hasLabel = LABEL_PATTERNS.some(p => p.test(preceding));

    // "왜" 설명 확인 (블록 앞 200자 + 블록 내 주석)
    let hasWhyExplanation = false;
    for (const p of WHY_PATTERNS) {
      if (p.test(preceding) || p.test(block.body)) {
        hasWhyExplanation = true;
        break;
      }
    }

    // 실제 코드 언어인지 (json/yaml은 스키마 가능성 → 위험도 낮음)
    const isSchemaLang = /^(json|yaml|yml|toml|xml)$/i.test(block.lang);
    const isCodeLang = /^(js|javascript|ts|typescript|python|py|go|rust|java|kotlin|swift|c|cpp|bash|sh)$/i.test(block.lang);

    if (isSchemaLang) {
      blockScore += 10; // 스키마는 위험도 낮음
    } else if (isCodeLang) {
      blockScore += 40; // 코드 언어는 위험도 기본

      if (commentRatio < 0.1) {
        blockScore += 25;
        findings.push({
          type: 'low_comment_ratio',
          message: `코드 블록(${block.lang}) 주석 비율 ${Math.round(commentRatio * 100)}% — "왜" 설명 없이 구현 덤프 의심`,
          severity: 'warn',
        });
      }

      if (!hasLabel) {
        blockScore += 15;
        findings.push({
          type: 'no_reference_label',
          message: `코드 블록 앞에 Reference/Example 레이블 없음 — 스펙 역할 불명확`,
          severity: 'warn',
        });
      }

      if (!hasWhyExplanation) {
        blockScore += 20;
        findings.push({
          type: 'no_why_explanation',
          message: `코드 블록에 이유/설명 없음 — "because", "이유", 주석 추가 권고`,
          severity: 'warn',
        });
      }
    } else {
      // 언어 불명 코드 블록
      blockScore += 20;
    }

    totalScore += blockScore;
  }

  // 여러 블록이 있어도 100 상한
  const score = Math.min(100, Math.round(totalScore / codeBlocks.length));

  return { score, findings };
}
