#!/usr/bin/env node
/**
 * prototype-gen.js — requirements.md → HTML UI 프로토타입 생성
 * 
 * EARS WHEN/THEN 패턴 → 화면 흐름 추출 → Claude로 HTML 생성
 * 
 * Usage:
 *   node skills/prototype/prototype-gen.js \
 *     --spec .sdd/specs/auth/requirements.md \
 *     --output .sdd/prototypes/
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { execSync } from 'child_process';

const CC_PROXY = process.env.CC_PROXY_URL || 'http://localhost:8787';

function getArg(args, flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

// ── 화면 흐름 추출 ────────────────────────────────────────────
function extractScreenFlows(content) {
  const flows = [];
  const lines = content.split('\n');
  
  // WHEN ... THEN 패턴 파싱
  let currentReqId = null;
  let currentWhen = null;
  let currentThen = null;
  
  for (const line of lines) {
    const reqMatch = line.match(/`(REQ-\d+)`/);
    if (reqMatch) currentReqId = reqMatch[1];
    
    const whenMatch = line.match(/When\s+(.+?)(?:,\s*시스템|$)/i);
    const thenMatch = line.match(/(?:THEN|시스템은?[은는]?\s+MUST?)\s+(.+)/i);
    
    if (whenMatch) currentWhen = whenMatch[1].trim();
    if (thenMatch && currentWhen) {
      currentThen = thenMatch[1].trim();
      // UI 관련 패턴만 (입력, 로그인, 화면, 폼, 버튼 등)
      const isUI = /입력|로그인|화면|폼|버튼|클릭|선택|제출|표시|보여|목록|생성|수정|삭제/i.test(currentWhen + ' ' + currentThen);
      if (isUI && currentReqId) {
        flows.push({ reqId: currentReqId, when: currentWhen, then: currentThen });
      }
      currentWhen = null;
      currentThen = null;
    }
  }
  
  // AC(Acceptance Criteria) 추출
  const acPattern = /- AC\d+:\s*(.+)/g;
  const acs = [];
  let m;
  while ((m = acPattern.exec(content)) !== null) {
    acs.push(m[1].trim());
  }
  
  return { flows, acs };
}

// ── Claude로 HTML 생성 ────────────────────────────────────────
async function generateHTML(specContent, flows, featureName) {
  const flowDesc = flows.map(f => `- [${f.reqId}] ${f.when} → ${f.then}`).join('\n');
  
  const prompt = `다음 요구사항 스펙에서 HTML UI 프로토타입을 생성해주세요.

기능명: ${featureName}

화면 흐름:
${flowDesc || '(화면 흐름 자동 감지 실패 — 전체 스펙 기반으로 생성)'}

전체 스펙:
${specContent.slice(0, 3000)}

요구사항:
1. 단일 HTML 파일로 생성 (CSS 인라인, 외부 의존성 없음)
2. 각 화면/상태를 탭 또는 섹션으로 구분
3. REQ ID를 주석으로 표시 (<!-- REQ-001 -->)
4. 실제 동작하는 인터랙션 포함 (JavaScript로 폼 제출, 에러 표시 등)
5. 깔끔하고 현대적인 디자인 (Tailwind 없이 순수 CSS)
6. 한국어 레이블 사용

HTML만 출력하세요. 설명 없이.`;

  try {
    const response = await fetch(`${CC_PROXY}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'dummy', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    return data.content?.[0]?.text || null;
  } catch (e) {
    console.error('LLM 호출 실패:', e.message);
    return null;
  }
}

// ── 메인 ──────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const specPath  = getArg(args, '--spec');
  const outputDir = getArg(args, '--output') || '.sdd/prototypes';

  if (!specPath || !existsSync(specPath)) {
    console.error(`❌ 스펙 파일 없음: ${specPath}`);
    process.exit(1);
  }

  const content     = readFileSync(specPath, 'utf8');
  const featureName = basename(dirname(specPath));
  const { flows, acs } = extractScreenFlows(content);

  console.log(`📐 프로토타입 생성 시작`);
  console.log(`  스펙: ${specPath}`);
  console.log(`  화면 흐름 감지: ${flows.length}개`);
  for (const f of flows) {
    console.log(`    - [${f.reqId}] ${f.when.slice(0, 50)}...`);
  }

  if (flows.length === 0) {
    console.log('  ℹ️  EARS 패턴 감지 실패 — 전체 스펙 기반 생성');
  }

  console.log('\n  LLM으로 HTML 생성 중...');
  const html = await generateHTML(content, flows, featureName);

  if (!html) {
    console.error('❌ HTML 생성 실패');
    process.exit(1);
  }

  // 저장
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const outPath = join(outputDir, `${date}-${featureName}.html`);
  writeFileSync(outPath, html);

  console.log(`\n✅ 프로토타입 저장: ${outPath}`);
  console.log(`   브라우저로 열기: open "${outPath}"`);

  // macOS라면 자동으로 열기
  try {
    execSync(`open "${outPath}" 2>/dev/null || xdg-open "${outPath}" 2>/dev/null || true`);
  } catch {}
}

main().catch(console.error);
