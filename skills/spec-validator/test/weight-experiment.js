/**
 * 문서 유형별 가중치 실험
 * 세 개 문서(requirements / design / tasks)에 대해
 * 세 가지 프로파일을 적용하고 변별력 비교
 */

import { readFileSync } from "fs";
import { analyze as s1Analyze } from "../rules/s1-decision.js";
import { analyze as s3Analyze } from "../rules/s3-contract.js";
import { analyze as s4Analyze } from "../rules/s4-camouflage.js";

// ── 프로파일 정의 ──────────────────────────────────────────
const PROFILES = {
  current: {
    label: "현재 (균등 기반)",
    weights: { s1: 0.30, s2: 0.25, s3: 0.35, s4: 0.10 },
  },
  requirements: {
    label: "requirements 프로파일",
    desc: "결정 밀도(S1) + 계약 완결성(S3) 중심. 수락 기준·에러케이스 필수.",
    weights: { s1: 0.40, s2: 0.10, s3: 0.45, s4: 0.05 },
  },
  design: {
    label: "design 프로파일",
    desc: "S1(결정) + S2(중복·Explanation 유무) 중심. 코드 위장(S4) 경계.",
    weights: { s1: 0.35, s2: 0.35, s3: 0.20, s4: 0.10 },
  },
  tasks: {
    label: "tasks 프로파일",
    desc: "S1(결정·완료기준) 최우선. S3은 낮게(태스크는 Pre/Post 없음).",
    weights: { s1: 0.55, s2: 0.10, s3: 0.10, s4: 0.25 },
  },
  skill: {
    label: "skill 프로파일",
    desc: "절차 완결성(S1) + 코드 예시 품질(S4). S3 최소.",
    weights: { s1: 0.45, s2: 0.25, s3: 0.05, s4: 0.25 },
  },
};

// ── 점수 계산 ──────────────────────────────────────────────
function score(text, weights) {
  const s1 = s1Analyze(text).score;
  const s3 = s3Analyze(text).score;
  const s4 = s4Analyze(text).score;
  const s2 = 50; // Phase 2 예정

  const slop = Math.round(
    weights.s1 * (100 - s1) +
    weights.s2 * s2 +
    weights.s3 * (100 - s3) +
    weights.s4 * s4
  );
  return { slop, s1, s2, s3, s4 };
}

function verdict(slop) {
  return slop >= 70 ? "🔴 SLOP" : slop >= 45 ? "🟡 WARN" : "🟢 OK";
}

// ── 문서 로드 ──────────────────────────────────────────────
const docs = {
  "requirements-template": readFileSync("/tmp/requirements-template.md", "utf-8"),
  "design-template":       readFileSync("/tmp/design-template.md", "utf-8"),
  "tasks-template":        readFileSync("/tmp/tasks-template.md", "utf-8"),
};

// ── 실험 실행 ──────────────────────────────────────────────
console.log("\n" + "═".repeat(72));
console.log(" 문서 유형별 가중치 실험");
console.log("═".repeat(72));

// Raw signal 먼저 출력
console.log("\n▶ Raw Signal 점수 (가중치 무관)\n");
console.log("  문서              │  S1  │  S3  │  S4");
console.log("  ─────────────────┼──────┼──────┼──────");
for (const [name, text] of Object.entries(docs)) {
  const s1 = s1Analyze(text).score;
  const s3 = s3Analyze(text).score;
  const s4 = s4Analyze(text).score;
  console.log(`  ${name.padEnd(17)}│ ${String(s1).padStart(4)} │ ${String(s3).padStart(4)} │ ${String(s4).padStart(4)}`);
}

// 프로파일별 Slop Score 비교
console.log("\n▶ 프로파일별 Slop Score (높을수록 나쁨)\n");

const profileKeys = Object.keys(PROFILES);
const header = "  문서              " + profileKeys.map(k => `│ ${k.substring(0,12).padEnd(12)}`).join("") + " │";
console.log(header);
console.log("  " + "─".repeat(header.length - 2));

for (const [docName, text] of Object.entries(docs)) {
  let row = `  ${docName.padEnd(17)}`;
  for (const [profileKey, profile] of Object.entries(PROFILES)) {
    const { slop } = score(text, profile.weights);
    row += `│ ${String(slop).padStart(5)} ${verdict(slop).split(" ")[0]} `;
  }
  row += "│";
  console.log(row);
}

// 프로파일 상세
console.log("\n▶ 프로파일 상세\n");
for (const [key, profile] of Object.entries(PROFILES)) {
  console.log(`  [${key}] ${profile.label}`);
  if (profile.desc) console.log(`    ${profile.desc}`);
  const w = profile.weights;
  console.log(`    가중치: S1=${w.s1} S2=${w.s2} S3=${w.s3} S4=${w.s4}`);
  console.log();
}

// 관찰: 각 문서에서 "자기 프로파일"이 유의미한 변별력을 주는가?
console.log("▶ 관찰: 문서별 최적 프로파일 vs 현재 프로파일 차이\n");
const docProfileMap = {
  "requirements-template": "requirements",
  "design-template": "design",
  "tasks-template": "tasks",
};
for (const [docName, text] of Object.entries(docs)) {
  const optimal = docProfileMap[docName];
  const curr = score(text, PROFILES.current.weights);
  const opt  = score(text, PROFILES[optimal].weights);
  const diff = opt.slop - curr.slop;
  const sign = diff > 0 ? "+" : "";
  console.log(`  ${docName}`);
  console.log(`    current  → Slop ${curr.slop} ${verdict(curr.slop)}`);
  console.log(`    ${optimal.padEnd(12)} → Slop ${opt.slop} ${verdict(opt.slop)}  (${sign}${diff})`);
  console.log();
}
