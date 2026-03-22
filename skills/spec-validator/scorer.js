/**
 * scorer.js — Slop Score 계산기 (Phase 1.5)
 *
 * 프로파일별 Signal 분기:
 *   requirements → S1 + S_AC
 *   design       → S1 + S3 + S4
 *   tasks        → S1 + S_DONE
 *   default      → S1 + S4
 *
 * Slop Score: 높을수록 나쁨 (0~100)
 *   - 좋은 신호(s1, s_ac, s_done, s3): (100 - score) 로 반전
 *   - 나쁜 신호(s4): 그대로
 */

import { readFileSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { analyze as s1Analyze } from "./rules/s1-decision.js";
import { analyze as s3Analyze } from "./rules/s3-contract.js";
import { analyze as s4Analyze } from "./rules/s4-camouflage.js";
import { analyze as sAcAnalyze } from "./rules/s-ac.js";
import { analyze as sDoneAnalyze } from "./rules/s-done.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadConfig() {
  try {
    const raw = readFileSync(join(__dirname, "config.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      profiles: {
        default: { signals: ["s1", "s4"], weights: { s1: 0.60, s4: 0.40 } }
      },
      thresholds: { slop: 70, warn: 45 },
    };
  }
}

export function detectProfile(filePath) {
  const name = basename(filePath || "").toLowerCase();
  if (name.includes("requirements") || name.includes("req")) return "requirements";
  if (name.includes("design")) return "design";
  if (name.includes("tasks") || name.includes("task")) return "tasks";
  return "default";
}

function runSignal(name, text) {
  switch (name) {
    case "s1": return { name: "S1", label: "결정 밀도", inverted: true, ...s1Analyze(text) };
    case "s3": return { name: "S3", label: "계약 완결성", inverted: true, ...s3Analyze(text) };
    case "s4": return { name: "S4", label: "코드 위장도", inverted: false, ...s4Analyze(text) };
    case "s_ac": return { name: "S_AC", label: "AC 완결성", inverted: true, ...sAcAnalyze(text) };
    case "s_done": return { name: "S_DONE", label: "완료 기준", inverted: true, ...sDoneAnalyze(text) };
    default: return null;
  }
}

export function calculateSlopScore(text, filePath = "") {
  const config = loadConfig();
  const profileName = detectProfile(filePath);
  const profile = config.profiles[profileName] || config.profiles.default;
  const { thresholds } = config;

  const signalResults = {};
  let slopScore = 0;

  for (const sigName of profile.signals) {
    const result = runSignal(sigName, text);
    if (!result) continue;
    signalResults[sigName] = result;

    const weight = profile.weights[sigName] || 0;
    const contribution = result.inverted
      ? weight * (100 - result.score)
      : weight * result.score;
    slopScore += contribution;
  }

  slopScore = Math.round(slopScore);

  let verdict;
  if (slopScore >= thresholds.slop) {
    verdict = "SLOP";
  } else if (slopScore >= thresholds.warn) {
    verdict = "WARN";
  } else {
    verdict = "OK";
  }

  const allFindings = Object.values(signalResults).flatMap(r =>
    (r.findings || []).map(f => ({ ...f, signal: r.name }))
  );

  return {
    score: slopScore,
    verdict,
    profile: profileName,
    signals: signalResults,
    findings: allFindings,
  };
}
