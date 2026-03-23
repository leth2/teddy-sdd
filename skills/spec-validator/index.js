#!/usr/bin/env node
/**
 * spec-validator CLI — Phase 2.0
 * Usage: node skills/spec-validator/index.js <파일경로> [--no-llm]
 */

import { readFileSync, existsSync } from "fs";
import { calculateSlopScore, detectProfile } from "./scorer.js";

const VERDICT_EMOJI = { OK: "🟢", WARN: "🟡", SLOP: "🔴" };
const SEVERITY_EMOJI = { fail: "❌", warn: "⚠️ ", info: "ℹ️ " };

function formatOutput(result, label) {
  const { score, verdict, profile, signals, findings } = result;
  const emoji = VERDICT_EMOJI[verdict];

  const lines = [
    `📊 Spec Validator — ${label}`,
    `   프로파일: ${profile}`,
    "",
    "Signal 분석:",
  ];

  for (const [, sig] of Object.entries(signals)) {
    const bar = sig.score >= 60 ? "🟢" : sig.score >= 40 ? "🟡" : "🔴";
    const invertNote = sig.inverted ? "" : " ↑나쁨";
    const srcNote = sig.source && sig.source !== 'rule' ? ` [${sig.source}]` : "";
    lines.push(`  ${sig.name.padEnd(8)} ${sig.label.padEnd(12)} ${String(sig.score).padStart(3)}/100  ${bar}${invertNote}${srcNote}`);
  }

  lines.push("");
  lines.push(`종합 Slop Score: ${score} → ${emoji} ${verdict}`);

  const importantFindings = findings.filter(f => f.severity !== 'info' || findings.length <= 3);
  if (importantFindings.length > 0) {
    lines.push("", "발견된 문제:");
    for (const f of importantFindings) {
      const sev = SEVERITY_EMOJI[f.severity] || "•";
      lines.push(`  ${sev} [${f.signal}] ${f.message}`);
    }
  } else {
    lines.push("", "✅ 문제 없음");
  }

  if (verdict === "SLOP") {
    lines.push("");
    lines.push("━".repeat(50));
    lines.push("❌ AGENT KILL — spec-validator");
    lines.push("");
    lines.push(`feature: ${label}`);
    lines.push(`Slop Score: ${score} 🔴 SLOP`);
    lines.push("");
    lines.push("차단 이유:");
    for (const f of findings.filter(f => f.severity === "fail" || f.severity === "warn")) {
      lines.push(`  [${f.signal}] ${f.message}`);
    }
    lines.push("");
    lines.push("개선 후 재검증하세요. 에이전트 구현은 Score < 70 이후 가능합니다.");
    lines.push("━".repeat(50));
  } else if (verdict === "WARN") {
    lines.push("", "⚠️  권고: 위 항목 보완 후 재검증");
  } else {
    lines.push("", "✅ 게이트 통과: 에이전트 실행 가능");
  }

  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const withLLM = args.includes("--with-llm");
  const profileArg = args.find(a => a.startsWith("--profile=") || a.startsWith("--profile "));
  const profileOverride = profileArg ? profileArg.split(/[= ]/)[1] : (args.includes("--profile") ? args[args.indexOf("--profile") + 1] : null);

  const filePath = args.find(a => !a.startsWith("--") && a !== profileOverride);

  if (!filePath) {
    console.error("Usage: node index.js <파일경로> [--no-llm]");
    process.exit(1);
  }

  let text, label;
  if (existsSync(filePath)) {
    text = readFileSync(filePath, "utf-8");
    label = filePath;
  } else {
    text = filePath;
    label = "inline text";
  }

  const result = await calculateSlopScore(text, filePath, { withLLM, profileOverride });
  console.log(formatOutput(result, label));

  if (result.verdict === "SLOP") process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
