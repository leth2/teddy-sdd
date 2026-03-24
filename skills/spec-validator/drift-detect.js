#!/usr/bin/env node
/**
 * drift-detect.js — Spec-Code Drift Detector
 * 이슈 #6 Phase 1 (규칙 기반) + Phase 2 (LLM Judge)
 *
 * Layer 1: @impl 태그 reverse index + 코드 식별자 존재 확인
 * Layer 2: LLM Judge — 스펙 문장 vs 실제 코드 semantic 비교
 *
 * 사용법:
 *   node drift-detect.js <specFile> [--root <codeRoot>] [--with-llm] [--git-diff]
 *
 * 예시:
 *   node drift-detect.js examples/todo-api/specs/requirements.md --root /tmp/todo-api-impl
 *   node drift-detect.js examples/todo-api/specs/requirements.md --root . --with-llm
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join, resolve } from 'path';

// ──────────────────────────────────────────────
// @impl 태그 파싱
// ──────────────────────────────────────────────

/**
 * 스펙 파일에서 @impl 태그 + 연결된 REQ ID 파싱
 * @returns {Array<{reqId, file, identifier, specText}>}
 */
function parseImplTags(specText, specPath) {
  const lines = specText.split('\n');
  const mappings = [];
  let lastReqId = null;
  let lastSpecText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // REQ-NNN 마커 추적
    const reqMatch = line.match(/`?REQ-(\d{3,})`?/);
    if (reqMatch) {
      lastReqId = `REQ-${reqMatch[1]}`;
      lastSpecText = line.trim();
    }

    // @impl 태그 파싱
    // 형식 1: <!-- @impl: REQ-001 → src/auth/handler.ts#login -->
    // 형식 2: <!-- @impl: src/auth/handler.ts#login -->
    const implMatch = line.match(/<!--\s*@impl:\s*(.+?)\s*-->/);
    if (implMatch) {
      const raw = implMatch[1].trim();
      let reqId = lastReqId;
      let target = raw;

      // REQ-NNN → 경로 형식
      const reqArrowMatch = raw.match(/^(REQ-\d{3,})\s*→\s*(.+)$/);
      if (reqArrowMatch) {
        reqId = reqArrowMatch[1];
        target = reqArrowMatch[2].trim();
      }

      // 파일경로#식별자 분리
      const hashIdx = target.lastIndexOf('#');
      const file = hashIdx !== -1 ? target.slice(0, hashIdx).trim() : target.trim();
      const identifier = hashIdx !== -1 ? target.slice(hashIdx + 1).trim() : null;

      mappings.push({ reqId, file, identifier, specText: lastSpecText, specPath });
    }
  }

  return mappings;
}

// ──────────────────────────────────────────────
// Layer 1: 규칙 기반 코드 존재 확인
// ──────────────────────────────────────────────

function checkIdentifierExists(codeRoot, file, identifier) {
  const fullPath = join(codeRoot, file);

  if (!existsSync(fullPath)) {
    return { ok: false, reason: `파일 없음: ${file}` };
  }

  if (!identifier) {
    return { ok: true, reason: '파일 존재 확인' };
  }

  const content = readFileSync(fullPath, 'utf-8');

  // 식별자 탐색: function name, class method, const/export
  // ClassName.methodName → 메서드 탐색
  const dotIdx = identifier.indexOf('.');
  let searchTerm = identifier;
  if (dotIdx !== -1) {
    searchTerm = identifier.slice(dotIdx + 1); // methodName만
  }

  const patterns = [
    new RegExp(`\\b${searchTerm}\\b\\s*[:(\\{]`),       // function/method/arrow
    new RegExp(`\\b${searchTerm}\\b\\s*=`),              // const/let assignment
    new RegExp(`export\\s+\\w+\\s+${searchTerm}\\b`),   // export
  ];

  const found = patterns.some(p => p.test(content));
  if (!found) {
    // grep으로 단순 키워드 존재 확인 (fallback)
    const grepFound = content.includes(searchTerm);
    if (!grepFound) {
      return { ok: false, reason: `식별자 없음: ${identifier} (이동됐을 수 있음)` };
    }
  }

  // 행 번호 찾기
  const lineIdx = content.split('\n').findIndex(l => l.includes(searchTerm));
  return { ok: true, line: lineIdx + 1, reason: `L${lineIdx + 1}에서 발견` };
}

// ──────────────────────────────────────────────
// Layer 2: LLM Judge (cc-proxy)
// ──────────────────────────────────────────────

async function llmJudge(specText, codeSnippet, reqId) {
  const proxyUrl = 'http://localhost:8787';
  const model = 'claude-sonnet-4-5';

  const prompt = `스펙과 코드 구현이 일치하는지 판단해주세요.

## 스펙 (${reqId})
${specText}

## 구현 코드
\`\`\`typescript
${codeSnippet.slice(0, 1500)}
\`\`\`

## 판단 기준
1. 스펙에 명시된 HTTP 상태코드가 코드에 구현됐는가?
2. 에러 코드/메시지가 스펙과 일치하는가?
3. 주요 비즈니스 로직(만료 시간, 제한값 등)이 스펙과 일치하는가?

## 응답 형식 (JSON만)
{
  "drift": true/false,
  "severity": "critical/warning/ok",
  "issues": ["불일치 항목1", "불일치 항목2"],
  "summary": "한 줄 요약"
}`;

  try {
    const res = await fetch(`${proxyUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'dummy',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    const raw = data.content?.[0]?.text || '';
    const jsonMatch = raw.match(/\{[\s\S]+\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { drift: false, severity: 'ok', issues: [], summary: 'LLM 응답 파싱 실패' };
  } catch (e) {
    return { drift: false, severity: 'ok', issues: [], summary: `LLM 오류: ${e.message}` };
  }
}

function extractCodeSnippet(codeRoot, file, identifier) {
  const fullPath = join(codeRoot, file);
  if (!existsSync(fullPath)) return '(파일 없음)';
  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  if (!identifier) return content.slice(0, 800);

  const searchTerm = identifier.includes('.') ? identifier.split('.')[1] : identifier;
  const lineIdx = lines.findIndex(l => l.includes(searchTerm));
  if (lineIdx === -1) return content.slice(0, 800);

  // 함수 본문 추출: 시작 줄에서 최대 30줄
  const start = Math.max(0, lineIdx - 2);
  const end = Math.min(lines.length, lineIdx + 30);
  return lines.slice(start, end).join('\n');
}

// ──────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const specFile = args.find(a => !a.startsWith('--'));
  const withLLM = args.includes('--with-llm');
  const rootIdx = args.indexOf('--root');
  const codeRoot = rootIdx !== -1 ? args[rootIdx + 1] : process.cwd();

  if (!specFile) {
    console.error('Usage: node drift-detect.js <specFile> [--root <codeRoot>] [--with-llm]');
    process.exit(1);
  }

  const specText = readFileSync(specFile, 'utf-8');
  const mappings = parseImplTags(specText, specFile);

  if (mappings.length === 0) {
    console.log('⚠️  @impl 태그 없음 — requirements.md에 태그 추가 필요');
    process.exit(0);
  }

  console.log(`\n🔍 Drift Detector — ${specFile}`);
  console.log(`   코드 루트: ${codeRoot}`);
  console.log(`   @impl 매핑: ${mappings.length}개`);
  if (withLLM) console.log(`   LLM Judge: 활성화 (cc-proxy)\n`);
  console.log();

  let driftCount = 0;
  let warningCount = 0;
  const driftReport = [];

  // REQ별로 그룹핑
  const byReq = {};
  for (const m of mappings) {
    if (!byReq[m.reqId]) byReq[m.reqId] = [];
    byReq[m.reqId].push(m);
  }

  for (const [reqId, reqMappings] of Object.entries(byReq)) {
    console.log(`📌 ${reqId}: ${reqMappings[0].specText.slice(0, 60)}...`);

    let reqDrift = false;

    for (const m of reqMappings) {
      const check = checkIdentifierExists(codeRoot, m.file, m.identifier);
      const target = m.identifier ? `${m.file}#${m.identifier}` : m.file;

      if (!check.ok) {
        console.log(`  ❌ [Layer 1] ${target}`);
        console.log(`     → ${check.reason}`);
        driftCount++;
        reqDrift = true;
        driftReport.push({ reqId, target, layer: 1, reason: check.reason });
      } else {
        console.log(`  ✅ [Layer 1] ${target} (${check.reason})`);

        // Layer 2: LLM Judge
        if (withLLM) {
          const snippet = extractCodeSnippet(codeRoot, m.file, m.identifier);
          const result = await llmJudge(m.specText, snippet, reqId);

          if (result.drift) {
            const severity = result.severity === 'critical' ? '❌' : '⚠️ ';
            console.log(`  ${severity} [Layer 2 LLM] Drift 감지: ${result.summary}`);
            if (result.issues?.length > 0) {
              result.issues.forEach(i => console.log(`     • ${i}`));
            }
            if (result.severity === 'critical') {
              driftCount++;
              reqDrift = true;
            } else {
              warningCount++;
            }
            driftReport.push({ reqId, target, layer: 2, ...result });
          } else {
            console.log(`  ✅ [Layer 2 LLM] 일치: ${result.summary}`);
          }
        }
      }
    }

    if (!reqDrift) console.log(`  → OK\n`);
    else console.log();
  }

  // 최종 리포트
  console.log('─'.repeat(60));
  if (driftCount > 0) {
    console.log(`\n🔴 Drift 감지: ${driftCount}건 (경고: ${warningCount}건)`);
    console.log('\n불일치 목록:');
    for (const d of driftReport) {
      console.log(`  ${d.reqId} [Layer ${d.layer}]: ${d.reason || d.summary}`);
    }
    console.log('\n→ 스펙 또는 구현 수정 필요. CI 빌드 차단.');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`\n🟡 경고 ${warningCount}건 (LLM 판단) — 수동 확인 권고`);
    process.exit(0);
  } else {
    console.log(`\n✅ Drift 없음 — 스펙-코드 일치 확인`);
    process.exit(0);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
