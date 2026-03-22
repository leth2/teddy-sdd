/**
 * llm-judge.js — cc-proxy 기반 LLM Judge
 * Phase 2: S2(중복도) + S_WHY(설계 근거) 평가
 *
 * cc-proxy: http://localhost:8787 (CLAUDE_CODE_TOKEN 사용)
 * Anthropic API 호환 엔드포인트
 */

const CC_PROXY_URL = process.env.CC_PROXY_URL || 'http://localhost:8787';
const MODEL = process.env.CC_PROXY_MODEL || 'claude-sonnet-4-5';

async function callLLM(prompt, maxTokens = 512) {
  const res = await fetch(`${CC_PROXY_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'dummy',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`cc-proxy error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

/**
 * S2 — 중복도 평가
 * 스펙 내 반복·중복 표현 비율 평가 (높을수록 나쁨)
 */
export async function evaluateRedundancy(text) {
  const prompt = `You are a spec quality evaluator. Analyze the following specification text for redundancy and repetition.

SPEC TEXT:
---
${text.slice(0, 3000)}
---

Evaluate:
1. Are there repeated phrases or concepts that say the same thing multiple ways?
2. Are there sections that overlap significantly?
3. Is information duplicated unnecessarily?

Respond in JSON only:
{
  "score": <0-100, where 0=no redundancy, 100=highly redundant>,
  "examples": [<up to 3 short examples of redundant phrases/sections>],
  "summary": "<one sentence>"
}`;

  try {
    const raw = await callLLM(prompt, 300);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const result = JSON.parse(jsonMatch[0]);
    return {
      score: Math.max(0, Math.min(100, result.score ?? 50)),
      examples: result.examples || [],
      summary: result.summary || '',
      source: 'llm',
    };
  } catch (e) {
    return { score: 50, examples: [], summary: `LLM 평가 실패: ${e.message}`, source: 'fallback' };
  }
}

/**
 * S_WHY — 설계 근거 밀도 평가
 * design.md 전용: "왜 이 결정인가" 설명 존재 여부 (높을수록 좋음)
 */
export async function evaluateDesignRationale(text) {
  const prompt = `You are a spec quality evaluator. Analyze the following design document for decision rationale.

DESIGN DOC:
---
${text.slice(0, 3000)}
---

For each significant design decision (technology choice, architecture choice, data model choice):
- Does the document explain WHY this choice was made?
- Is there a trade-off analysis?
- Are alternatives mentioned and rejected with reasons?

Respond in JSON only:
{
  "score": <0-100, where 100=all decisions have clear rationale>,
  "missing_rationale": [<up to 3 decisions missing explanation>],
  "good_examples": [<up to 2 well-explained decisions>],
  "summary": "<one sentence>"
}`;

  try {
    const raw = await callLLM(prompt, 400);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const result = JSON.parse(jsonMatch[0]);
    return {
      score: Math.max(0, Math.min(100, result.score ?? 50)),
      missingRationale: result.missing_rationale || [],
      goodExamples: result.good_examples || [],
      summary: result.summary || '',
      source: 'llm',
    };
  } catch (e) {
    return { score: 50, missingRationale: [], goodExamples: [], summary: `LLM 평가 실패: ${e.message}`, source: 'fallback' };
  }
}

/**
 * ping — cc-proxy 연결 확인
 */
export async function ping() {
  try {
    const text = await callLLM('Reply with just "ok"', 5);
    return text.toLowerCase().includes('ok');
  } catch {
    return false;
  }
}
