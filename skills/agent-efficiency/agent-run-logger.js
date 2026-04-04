#!/usr/bin/env node
/**
 * agent-run-logger.js — 에이전트 실행 효율 추적
 * 
 * 에이전트 실행 시 호출해서 실행 결과를 .sdd/runs/ 에 기록.
 * Slop Score와 연동하여 스펙 품질 ↔ 구현 성공률 상관관계 학습.
 * 
 * Usage (에이전트 실행 전후 래핑):
 *   node skills/agent-efficiency/agent-run-logger.js log \
 *     --spec .sdd/specs/auth/requirements.md \
 *     --slop-score 82 \
 *     --success true \
 *     --tokens 12400 \
 *     --duration 45 \
 *     --retries 0 \
 *     --req REQ-001 REQ-002
 * 
 *   node skills/agent-efficiency/agent-run-logger.js report
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const RUNS_DIR = '.sdd/runs';
const REPORT_PATH = '.sdd/efficiency-report.json';

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// ── LOG 커맨드 ─────────────────────────────────────────────────
function log(args) {
  const spec     = getArg(args, '--spec');
  const slopScore = parseInt(getArg(args, '--slop-score') || '0');
  const success   = getArg(args, '--success') === 'true';
  const tokens    = parseInt(getArg(args, '--tokens') || '0');
  const duration  = parseInt(getArg(args, '--duration') || '0');
  const retries   = parseInt(getArg(args, '--retries') || '0');
  const reqIdx    = args.indexOf('--req');
  const reqs      = reqIdx >= 0 ? args.slice(reqIdx + 1).filter(a => a.startsWith('REQ-')) : [];
  const phase     = getArg(args, '--phase') || 'implement';

  const entry = {
    id: Date.now().toString(36),
    timestamp: new Date().toISOString(),
    spec,
    slopScore,
    phase,
    success,
    tokens,
    duration,
    retries,
    reqs,
    costUsd: estimateCost(tokens),
  };

  ensureDir(RUNS_DIR);
  const filePath = join(RUNS_DIR, `${entry.id}.json`);
  writeFileSync(filePath, JSON.stringify(entry, null, 2));

  console.log(`✅ 실행 기록 저장: ${filePath}`);
  console.log(`   spec: ${spec} | slop: ${slopScore} | success: ${success} | tokens: ${tokens} | retries: ${retries}`);
  return entry;
}

// ── REPORT 커맨드 ─────────────────────────────────────────────
function report() {
  if (!existsSync(RUNS_DIR)) {
    console.log('ℹ️  실행 기록 없음. agent-run-logger.js log 으로 기록 먼저.');
    return;
  }

  const runs = readdirSync(RUNS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(join(RUNS_DIR, f), 'utf8')));

  if (runs.length === 0) {
    console.log('ℹ️  실행 기록 없음.');
    return;
  }

  // Slop Score 구간별 성공률
  const buckets = {
    '90+': [], '70-89': [], '45-69': [], '0-44': []
  };
  for (const r of runs) {
    const s = r.slopScore;
    if (s >= 90) buckets['90+'].push(r);
    else if (s >= 70) buckets['70-89'].push(r);
    else if (s >= 45) buckets['45-69'].push(r);
    else buckets['0-44'].push(r);
  }

  console.log('\n📊 에이전트 효율 리포트');
  console.log('='.repeat(50));
  console.log(`총 실행: ${runs.length}회`);
  console.log(`전체 성공률: ${pct(runs.filter(r => r.success).length, runs.length)}%`);
  console.log(`총 토큰: ${runs.reduce((s, r) => s + r.tokens, 0).toLocaleString()}`);
  console.log(`총 비용: $${runs.reduce((s, r) => s + r.costUsd, 0).toFixed(3)}`);

  console.log('\n📈 Slop Score 구간별 성공률:');
  for (const [range, group] of Object.entries(buckets)) {
    if (group.length === 0) continue;
    const successRate = pct(group.filter(r => r.success).length, group.length);
    const avgRetries = (group.reduce((s, r) => s + r.retries, 0) / group.length).toFixed(1);
    const avgTokens = Math.round(group.reduce((s, r) => s + r.tokens, 0) / group.length);
    console.log(`  [${range.padEnd(6)}] 성공률: ${String(successRate+'%').padEnd(5)} | 평균 재시도: ${avgRetries}회 | 평균 토큰: ${avgTokens.toLocaleString()}`);
  }

  // 스펙별 통계
  const bySpec = {};
  for (const r of runs) {
    if (!r.spec) continue;
    if (!bySpec[r.spec]) bySpec[r.spec] = [];
    bySpec[r.spec].push(r);
  }

  if (Object.keys(bySpec).length > 0) {
    console.log('\n📋 스펙별 성공률:');
    for (const [spec, group] of Object.entries(bySpec)) {
      const successRate = pct(group.filter(r => r.success).length, group.length);
      const avgSlop = Math.round(group.reduce((s, r) => s + r.slopScore, 0) / group.length);
      const avgRetries = (group.reduce((s, r) => s + r.retries, 0) / group.length).toFixed(1);
      const flag = successRate < 60 ? ' ⚠️' : successRate >= 90 ? ' ✅' : '';
      console.log(`  ${spec}`);
      console.log(`    성공률: ${successRate}% | 평균 Slop: ${avgSlop} | 평균 재시도: ${avgRetries}회${flag}`);
    }
  }

  // 상관관계 분석
  const correlation = computeCorrelation(
    runs.map(r => r.slopScore),
    runs.map(r => r.success ? 1 : 0)
  );

  console.log(`\n🔗 Slop Score ↔ 성공률 상관계수: ${correlation.toFixed(3)}`);
  if (correlation > 0.5) console.log('   → 강한 양의 상관관계: 스펙 품질이 구현 성공률에 영향');
  else if (correlation > 0.2) console.log('   → 약한 양의 상관관계');
  else console.log('   → 아직 데이터 부족 (n=' + runs.length + ')');

  // 저성공률 스펙 피드백
  const lowSuccess = Object.entries(bySpec)
    .filter(([, g]) => pct(g.filter(r => r.success).length, g.length) < 60 && g.length >= 2);

  if (lowSuccess.length > 0) {
    console.log('\n⚠️  개선 필요한 스펙:');
    for (const [spec, group] of lowSuccess) {
      const successRate = pct(group.filter(r => r.success).length, group.length);
      const avgSlop = Math.round(group.reduce((s, r) => s + r.slopScore, 0) / group.length);
      console.log(`  ${spec}`);
      console.log(`    성공률 ${successRate}%, 평균 Slop ${avgSlop}`);
      if (avgSlop < 70) console.log('    → Slop Score가 임계값 미만. spec-validator 재실행 권장');
      else console.log('    → Slop Score는 OK. 엣지 케이스/타입 명세 보강 권장');
    }
  }

  // JSON 저장
  const reportData = {
    generated: new Date().toISOString(),
    totalRuns: runs.length,
    overallSuccessRate: pct(runs.filter(r => r.success).length, runs.length),
    correlation,
    buckets: Object.fromEntries(
      Object.entries(buckets).map(([k, g]) => [k, {
        count: g.length,
        successRate: pct(g.filter(r => r.success).length, g.length),
        avgRetries: g.length ? +(g.reduce((s, r) => s + r.retries, 0) / g.length).toFixed(2) : 0,
      }])
    ),
    bySpec: Object.fromEntries(
      Object.entries(bySpec).map(([spec, g]) => [spec, {
        count: g.length,
        successRate: pct(g.filter(r => r.success).length, g.length),
        avgSlopScore: Math.round(g.reduce((s, r) => s + r.slopScore, 0) / g.length),
        avgRetries: +(g.reduce((s, r) => s + r.retries, 0) / g.length).toFixed(2),
        totalTokens: g.reduce((s, r) => s + r.tokens, 0),
      }])
    ),
  };

  writeFileSync(REPORT_PATH, JSON.stringify(reportData, null, 2));
  console.log(`\n✅ 리포트 저장: ${REPORT_PATH}`);
}

// ── 유틸 ──────────────────────────────────────────────────────
function getArg(args, flag) {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] : null;
}

function pct(n, total) {
  return total === 0 ? 0 : Math.round(n / total * 100);
}

function estimateCost(tokens) {
  // claude-sonnet-4-5 기준 (입력 $3/M, 출력 $15/M 평균 ~$6/M)
  return +(tokens * 6 / 1_000_000).toFixed(5);
}

function computeCorrelation(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const meanX = xs.reduce((s, x) => s + x, 0) / n;
  const meanY = ys.reduce((s, y) => s + y, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0);
  const denX = Math.sqrt(xs.reduce((s, x) => s + (x - meanX) ** 2, 0));
  const denY = Math.sqrt(ys.reduce((s, y) => s + (y - meanY) ** 2, 0));
  return denX * denY === 0 ? 0 : num / (denX * denY);
}

// ── 메인 ──────────────────────────────────────────────────────
const cmd = process.argv[2];
const rest = process.argv.slice(3);

if (cmd === 'log') {
  log(rest);
} else if (cmd === 'report') {
  report();
} else {
  console.log('Usage: agent-run-logger.js <log|report> [options]');
  console.log('  log    --spec <path> --slop-score <n> --success <bool> --tokens <n> --duration <s> --retries <n>');
  console.log('  report');
}
