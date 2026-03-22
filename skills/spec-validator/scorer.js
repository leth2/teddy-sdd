/**
 * scorer.js — Slop Score 계산기
 *
 * Slop Score = 높을수록 나쁨 (슬롭에 가까움), 0~100
 *
 * 공식:
 *   slop = w1*(100-s1) + w2*s2_fixed + w3*(100-s3) + w4*s4
 *   - s1, s3: 높을수록 좋음 → (100-score)로 반전
 *   - s4: 높을수록 나쁨 → 그대로
 *   - s2: Phase 2 (LLM 기반) 예정 → 고정값 50
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { analyze as s1Analyze } from "./rules/s1-decision.js";
import { analyze as s3Analyze } from "./rules/s3-contract.js";
import { analyze as s4Analyze } from "./rules/s4-camouflage.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadConfig() {
  try {
    const raw = readFileSync(join(__dirname, "config.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      weights: {
        s1_decision_density: 0.30,
        s2_redundancy: 0.25,
        s3_implementability: 0.35,
        s4_code_camouflage: 0.10,
      },
      thresholds: { slop: 70, warn: 45 },
    };
  }
}

export function calculateSlopScore(text) {
  const config = loadConfig();
  const { weights, thresholds } = config;

  const s1Result = s1Analyze(text);
  const s3Result = s3Analyze(text);
  const s4Result = s4Analyze(text);

  // S2는 Phase 2 예정 — 중립값 50 고정
  const s2Score = 50;

  const slopScore = Math.round(
    weights.s1_decision_density * (100 - s1Result.score) +
    weights.s2_redundancy * s2Score +
    weights.s3_implementability * (100 - s3Result.score) +
    weights.s4_code_camouflage * s4Result.score
  );

  let verdict;
  if (slopScore >= thresholds.slop) {
    verdict = "SLOP";
  } else if (slopScore >= thresholds.warn) {
    verdict = "WARN";
  } else {
    verdict = "OK";
  }

  const allFindings = [
    ...s1Result.findings.map(f => ({ ...f, signal: "S1" })),
    ...s3Result.findings.map(f => ({ ...f, signal: "S3" })),
    ...s4Result.findings.map(f => ({ ...f, signal: "S4" })),
  ];

  return {
    score: slopScore,
    verdict,
    signals: {
      s1: { score: s1Result.score, label: "결정 밀도" },
      s2: { score: s2Score, label: "중복도 (Phase 2 예정)" },
      s3: { score: s3Result.score, label: "구현 가능성" },
      s4: { score: s4Result.score, label: "코드 위장도" },
    },
    findings: allFindings,
  };
}
