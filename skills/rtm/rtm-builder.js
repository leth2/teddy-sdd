#!/usr/bin/env node
/**
 * RTM Builder — Requirements Traceability Matrix 자동 생성
 * 
 * specs/ 디렉토리를 재귀 스캔해서:
 * 1. 모든 REQ-xxx를 수집
 * 2. @impl 태그로 구현 파일 매핑
 * 3. requirements.json 생성 (SoT)
 * 4. 충돌(같은 domain에 active REQ 두 개) 경고
 * 
 * Usage: node rtm-builder.js [--specs-dir .sdd/specs] [--output .sdd/requirements.json]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';

const args = process.argv.slice(2);
const specsDir = args.find((a, i) => args[i-1] === '--specs-dir') || '.sdd/specs';
const outputPath = args.find((a, i) => args[i-1] === '--output') || '.sdd/requirements.json';
const rtmOutput = args.find((a, i) => args[i-1] === '--rtm') || null;

// ── 파일 수집 ────────────────────────────────────────────────────
function collectMarkdownFiles(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectMarkdownFiles(full));
    } else if (entry.endsWith('.md') && entry.includes('requirements')) {
      results.push(full);
    }
  }
  return results;
}

// ── REQ 파싱 ─────────────────────────────────────────────────────
function parseRequirements(filePath, baseDir) {
  const content = readFileSync(filePath, 'utf8');
  const relPath = relative(baseDir, filePath);
  const reqs = {};

  // REQ-xxx 매칭: `REQ-001` 또는 **REQ-001** 형식
  const reqPattern = /`(REQ-\d+)`|(?:^|\s)\*\*(REQ-\d+)\*\*/gm;
  const implPattern = /<!--\s*@impl:\s*(REQ-\d+)\s*→\s*([^\s>]+)\s*-->/g;
  const domainPattern = /\*\*domain:\*\*\s*([^\n]+)/;
  const statusPattern = /\*\*status:\*\*\s*(active|superseded|deprecated)/i;
  const supersededByPattern = /\*\*superseded_by:\*\*\s*(REQ-\d+)/;

  // 각 REQ 블록 파싱 (섹션 단위)
  const lines = content.split('\n');
  let currentReqId = null;
  let currentTitle = '';
  let currentDomain = null;
  let currentStatus = 'active';
  let currentSupersededBy = null;
  let blockLines = [];

  const flushBlock = () => {
    if (!currentReqId) return;
    const blockText = blockLines.join('\n');
    
    // domain 파싱
    const dm = blockText.match(domainPattern);
    const sm = blockText.match(statusPattern);
    const sbm = blockText.match(supersededByPattern);

    reqs[currentReqId] = {
      id: currentReqId,
      title: currentTitle.trim(),
      domain: dm ? dm[1].trim() : inferDomain(relPath, currentTitle),
      status: sm ? sm[1].toLowerCase() : 'active',
      superseded_by: sbm ? sbm[1] : null,
      source: relPath,
      impls: [],
    };

    currentReqId = null;
    currentTitle = '';
    blockLines = [];
  };

  for (const line of lines) {
    // 새 REQ 시작 감지
    const reqMatch = line.match(/`(REQ-\d+)`/) || line.match(/\*\*(REQ-\d+)\*\*/);
    if (reqMatch) {
      flushBlock();
      currentReqId = reqMatch[1] || reqMatch[2] || reqMatch[0].replace(/[`*]/g,'');
      // 제목: REQ ID 이후 텍스트
      currentTitle = line.replace(/`REQ-\d+`|\*\*REQ-\d+\*\*/, '').replace(/^[\s*#]+/, '').trim();
    }
    if (currentReqId) {
      blockLines.push(line);
    }
  }
  flushBlock();

  // @impl 태그 수집
  let implMatch;
  while ((implMatch = implPattern.exec(content)) !== null) {
    const [, reqId, implPath] = implMatch;
    if (reqs[reqId]) {
      if (!reqs[reqId].impls.includes(implPath)) {
        reqs[reqId].impls.push(implPath);
      }
    }
  }

  return reqs;
}

// 도메인 추론 (명시 없을 때)
function inferDomain(filePath, title) {
  // 파일 경로에서 feature 이름 추출
  const parts = filePath.split('/');
  const featureName = parts.length > 1 ? parts[parts.length - 2] : 'unknown';
  return featureName.toLowerCase().replace(/[^a-z0-9]/g, '.');
}

// ── 충돌 감지 ─────────────────────────────────────────────────────
function detectConflicts(allReqs) {
  const domainMap = {};
  const conflicts = [];

  for (const [reqId, req] of Object.entries(allReqs)) {
    if (req.status !== 'active') continue;
    const d = req.domain;
    if (!domainMap[d]) domainMap[d] = [];
    domainMap[d].push(reqId);
  }

  for (const [domain, reqIds] of Object.entries(domainMap)) {
    if (reqIds.length > 1) {
      conflicts.push({ domain, reqIds });
    }
  }

  return conflicts;
}

// ── RTM 마크다운 생성 ─────────────────────────────────────────────
function generateRTM(allReqs) {
  const lines = [
    '# Requirements Traceability Matrix',
    '',
    `> 자동 생성됨: ${new Date().toISOString()}`,
    '',
    '| REQ ID | 도메인 | 상태 | 소스 | 구현 |',
    '|--------|--------|------|------|------|',
  ];

  for (const [reqId, req] of Object.entries(allReqs).sort(([a],[b]) => a.localeCompare(b))) {
    const status = req.status === 'active' ? '✅ active' :
                   req.status === 'superseded' ? `↩️ superseded→${req.superseded_by||'?'}` :
                   '🗑️ deprecated';
    const impls = req.impls.length > 0 ? req.impls.join('<br>') : '-';
    lines.push(`| ${reqId} | ${req.domain} | ${status} | ${req.source} | ${impls} |`);
  }

  return lines.join('\n');
}

// ── 메인 ──────────────────────────────────────────────────────────
const files = collectMarkdownFiles(specsDir);

if (files.length === 0) {
  console.error(`❌ specs 파일 없음: ${specsDir}`);
  process.exit(1);
}

console.log(`📋 RTM Builder`);
console.log(`  specs 디렉토리: ${specsDir}`);
console.log(`  발견된 파일: ${files.length}개\n`);

let allReqs = {};
for (const file of files) {
  const reqs = parseRequirements(file, process.cwd());
  const count = Object.keys(reqs).length;
  console.log(`  ✓ ${relative(process.cwd(), file)}: ${count}개 REQ`);
  Object.assign(allReqs, reqs);
}

const totalActive = Object.values(allReqs).filter(r => r.status === 'active').length;
const totalImpled = Object.values(allReqs).filter(r => r.impls.length > 0).length;
console.log(`\n총 ${Object.keys(allReqs).length}개 REQ (active: ${totalActive}, 구현 매핑: ${totalImpled}개)`);

// 충돌 감지
const conflicts = detectConflicts(allReqs);
if (conflicts.length > 0) {
  console.log('\n⚠️  도메인 충돌 감지:');
  for (const c of conflicts) {
    console.log(`  domain: ${c.domain} → ${c.reqIds.join(', ')} 모두 active`);
  }
}

// requirements.json 저장
writeFileSync(outputPath, JSON.stringify(allReqs, null, 2));
console.log(`\n✅ requirements.json 저장: ${outputPath}`);

// RTM 마크다운 (옵션)
if (rtmOutput) {
  writeFileSync(rtmOutput, generateRTM(allReqs));
  console.log(`✅ RTM 마크다운 저장: ${rtmOutput}`);
}

// 요약 출력
console.log('\n📊 커버리지:');
const implCoverage = Math.round(totalImpled / totalActive * 100);
console.log(`  구현 매핑: ${totalImpled}/${totalActive} (${implCoverage}%)`);
