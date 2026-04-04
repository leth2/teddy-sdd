#!/usr/bin/env node
/**
 * Spec Card Discovery — .sdd/spec-cards/ 스캔 → capabilities.json 생성
 * 
 * 에이전트가 "어떤 모듈이 이 작업을 처리할 수 있나?" 라우팅할 때 사용.
 * 
 * Usage: node skills/rtm/spec-card-discover.js [--cards-dir .sdd/spec-cards]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const cardsDir = process.argv[3] || '.sdd/spec-cards';
const outputPath = '.sdd/capabilities.json';

if (!existsSync(cardsDir)) {
  console.log(`ℹ️  spec-cards 디렉토리 없음: ${cardsDir}`);
  console.log('   mkdir -p .sdd/spec-cards 후 스펙 카드를 추가하세요.');
  process.exit(0);
}

const cards = [];
for (const file of readdirSync(cardsDir)) {
  if (!file.endsWith('.json')) continue;
  try {
    const card = JSON.parse(readFileSync(join(cardsDir, file), 'utf8'));
    cards.push(card);
    console.log(`✓ ${card.name}: ${card.responsibilities.length}개 책임`);
  } catch (e) {
    console.warn(`⚠️  파싱 실패: ${file}`);
  }
}

const capabilities = {
  generated: new Date().toISOString(),
  modules: cards.map(c => ({
    name: c.name,
    description: c.description,
    domain: c.domain,
    responsibilities: c.responsibilities,
    reqs: c.reqs || [],
    spec: c.spec,
    owner: c.owner,
  }))
};

writeFileSync(outputPath, JSON.stringify(capabilities, null, 2));
console.log(`\n✅ capabilities.json 저장: ${outputPath}`);
console.log(`   ${cards.length}개 모듈 등록됨`);

// 모듈 목록 출력
console.log('\n📋 등록된 모듈:');
for (const m of capabilities.modules) {
  console.log(`  [${m.domain || '?'}] ${m.name} — ${m.description}`);
  if (m.reqs.length > 0) {
    console.log(`    REQs: ${m.reqs.join(', ')}`);
  }
}
