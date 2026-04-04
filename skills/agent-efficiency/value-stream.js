#!/usr/bin/env node
/**
 * value-stream.js — 스펙→배포 가치 흐름 추적 (#8)
 * 
 * 각 스펙의 단계별 소요 시간을 기록하고
 * 실제 병목(wait time)을 식별한다.
 * 
 * Usage:
 *   node skills/agent-efficiency/value-stream.js start --spec auth/requirements.md --phase spec
 *   node skills/agent-efficiency/value-stream.js complete --spec auth/requirements.md --phase spec
 *   node skills/agent-efficiency/value-stream.js report
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const VS_DIR   = '.sdd/value-stream';
const REPORT   = '.sdd/value-stream-report.json';

const PHASES = ['spec', 'validate', 'implement', 'review', 'deploy'];

function ensureDir(d) { if (!existsSync(d)) mkdirSync(d, { recursive: true }); }
function slug(s) { return s.replace(/[^a-z0-9]/gi, '-').toLowerCase(); }

function getState(specSlug) {
  const path = join(VS_DIR, `${specSlug}.json`);
  if (!existsSync(path)) return { spec: specSlug, phases: {}, wip: true };
  return JSON.parse(readFileSync(path, 'utf8'));
}

function saveState(state) {
  ensureDir(VS_DIR);
  writeFileSync(join(VS_DIR, `${state.spec}.json`), JSON.stringify(state, null, 2));
}

function start(args) {
  const spec  = getArg(args, '--spec');
  const phase = getArg(args, '--phase');
  if (!spec || !phase) { console.error('--spec, --phase 필요'); process.exit(1); }

  const state = getState(slug(spec));
  state.spec = spec;
  state.phases[phase] = state.phases[phase] || {};
  state.phases[phase].startedAt = new Date().toISOString();
  saveState(state);
  console.log(`▶  [${phase}] 시작: ${spec}`);
}

function complete(args) {
  const spec  = getArg(args, '--spec');
  const phase = getArg(args, '--phase');
  if (!spec || !phase) { console.error('--spec, --phase 필요'); process.exit(1); }

  const state = getState(slug(spec));
  const p = state.phases[phase];
  if (!p || !p.startedAt) {
    console.error(`⚠️  ${phase} 시작 기록 없음. start 먼저 실행`);
    process.exit(1);
  }
  const started = new Date(p.startedAt);
  const ended   = new Date();
  p.completedAt  = ended.toISOString();
  p.durationMin  = +((ended - started) / 60000).toFixed(1);

  // 이전 단계 완료 후 이 단계 시작까지의 대기 시간
  const prevPhase = PHASES[PHASES.indexOf(phase) - 1];
  if (prevPhase && state.phases[prevPhase]?.completedAt) {
    const prevEnd  = new Date(state.phases[prevPhase].completedAt);
    p.waitMin = +((started - prevEnd) / 60000).toFixed(1);
  }

  saveState(state);
  console.log(`✅ [${phase}] 완료: ${spec} (${p.durationMin}분)`);
  if (p.waitMin != null) console.log(`   대기: ${p.waitMin}분`);
}

function report() {
  if (!existsSync(VS_DIR)) { console.log('ℹ️  기록 없음'); return; }

  const states = readdirSync(VS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(join(VS_DIR, f), 'utf8')));

  if (states.length === 0) { console.log('ℹ️  기록 없음'); return; }

  console.log('\n🔄 Value Stream 리포트');
  console.log('='.repeat(50));

  // 단계별 평균 소요/대기 시간
  const phaseStats = {};
  for (const phase of PHASES) {
    const entries = states.flatMap(s => s.phases[phase] ? [s.phases[phase]] : []);
    if (entries.length === 0) continue;
    phaseStats[phase] = {
      count: entries.length,
      avgDuration: avg(entries.map(e => e.durationMin || 0)),
      avgWait:     avg(entries.map(e => e.waitMin    || 0)),
    };
  }

  console.log('\n단계별 평균 (분):');
  console.log('  단계         작업시간   대기시간   비율(대기/전체)');
  for (const [phase, s] of Object.entries(phaseStats)) {
    const total = s.avgDuration + s.avgWait;
    const waitRatio = total > 0 ? Math.round(s.avgWait / total * 100) : 0;
    const flag = waitRatio > 50 ? ' ⚠️ 병목' : '';
    console.log(`  ${phase.padEnd(12)} ${String(s.avgDuration+'분').padEnd(10)} ${String(s.avgWait+'분').padEnd(10)} ${waitRatio}%${flag}`);
  }

  // 스펙별 전체 사이클 타임
  console.log('\n스펙별 사이클 타임:');
  for (const state of states) {
    const completedPhases = Object.values(state.phases).filter(p => p.completedAt);
    if (completedPhases.length === 0) { console.log(`  ${state.spec}: 진행 중`); continue; }
    const totalWork = completedPhases.reduce((s, p) => s + (p.durationMin || 0), 0);
    const totalWait = completedPhases.reduce((s, p) => s + (p.waitMin || 0), 0);
    console.log(`  ${state.spec}`);
    console.log(`    작업: ${totalWork}분 | 대기: ${totalWait}분 | 효율: ${Math.round(totalWork/(totalWork+totalWait)*100)}%`);
  }

  // 병목 감지
  const bottlenecks = Object.entries(phaseStats)
    .filter(([, s]) => {
      const total = s.avgDuration + s.avgWait;
      return total > 0 && s.avgWait / total > 0.5;
    })
    .map(([phase]) => phase);

  if (bottlenecks.length > 0) {
    console.log(`\n⚠️  병목 단계: ${bottlenecks.join(', ')}`);
    console.log('   대기시간이 전체의 50% 초과 — 해당 단계 앞 핸드오프 검토');
  }

  // 저장
  writeFileSync(REPORT, JSON.stringify({ generated: new Date().toISOString(), phaseStats, specs: states }, null, 2));
  console.log(`\n✅ 리포트 저장: ${REPORT}`);
}

function getArg(args, flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

function avg(arr) {
  return arr.length ? +(arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(1) : 0;
}

const cmd = process.argv[2];
const rest = process.argv.slice(3);
if      (cmd === 'start')    start(rest);
else if (cmd === 'complete') complete(rest);
else if (cmd === 'report')   report();
else {
  console.log('Usage: value-stream.js <start|complete|report> [--spec <path>] [--phase <spec|validate|implement|review|deploy>]');
}
