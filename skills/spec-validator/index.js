#!/usr/bin/env node
/**
 * spec-validator CLI 진입점
 * Usage: node skills/spec-validator/index.js <파일경로_또는_텍스트>
 */

import { readFileSync, existsSync } from "fs";
import { calculateSlopScore } from "./scorer.js";

const VERDICT_EMOJI = { OK: "🟢", WARN: "🟡", SLOP: "🔴" };
const SEVERITY_EMOJI = { fail: "❌", warn: "⚠️ ", info: "ℹ️ " };

function formatOutput(result, label = "spec") {
  const { score, verdict, signals, findings } = result;
  const emoji = VERDICT_EMOJI[verdict];

  const lines = [
    `📊 Spec Validator — ${label}`,
    "",
    "Signal 분석:",
    `  S1 결정 밀도:     ${signals.s1.score.toString().padStart(3)}/100  ${signals.s1.score >= 60 ? "🟢" : signals.s1.score >= 40 ? "🟡" : "🔴"}`,
    `  S2 중복도:        ${signals.s2.score.toString().padStart(3)}/100  🔵  (Phase 2 LLM 예정)`,
    `  S3 구현 가능성:   ${signals.s3.score.toString().padStart(3)}/100  ${signals.s3.score >= 60 ? "🟢" : signals.s3.score >= 40 ? "🟡" : "🔴"}`,
    `  S4 코드 위장:     ${signals.s4.score.toString().padStart(3)}/100  ${signals.s4.score <= 20 ? "🟢" : signals.s4.score <= 50 ? "🟡" : "🔴"}`,
    "",
    `종합 Slop Score: ${score} → ${emoji} ${verdict}`,
  ];

  if (findings.length > 0) {
    lines.push("", "발견된 문제:");
    for (const f of findings) {
      const sev = SEVERITY_EMOJI[f.severity] || "•";
      lines.push(`  ${sev} [${f.signal}] ${f.message}`);
    }
  } else {
    lines.push("", "✅ 문제 없음");
  }

  if (verdict === "SLOP") {
    lines.push("", "🚫 게이트 실패: 에이전트 실행 전 스펙 보완 필요");
  } else if (verdict === "WARN") {
    lines.push("", "⚠️  권고: 위 항목 보완 후 재검증");
  } else {
    lines.push("", "✅ 게이트 통과: 에이전트 실행 가능");
  }

  return lines.join("\n");
}

function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node index.js <파일경로_또는_텍스트>");
    process.exit(1);
  }

  let text, label;
  if (existsSync(arg)) {
    text = readFileSync(arg, "utf-8");
    label = arg;
  } else {
    text = arg;
    label = "inline text";
  }

  const result = calculateSlopScore(text);
  console.log(formatOutput(result, label));

  // SLOP이면 exit code 1 (CI 게이트용)
  if (result.verdict === "SLOP") process.exit(1);
}

main();
