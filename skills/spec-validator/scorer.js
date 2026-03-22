/**
 * scorer.js — Slop Score 계산기 (Phase 2.0)
 *
 * 프로파일별 Signal 분기:
 *   requirements → S1 + S_AC + S2(LLM)
 *   design       → S1 + S3 + S4 + S_WHY(LLM)
 *   tasks        → S1 + S_DONE
 *   default      → S1 + S4
 *
 * LLM Judge: cc-proxy(localhost:8787) 통해 S2/S_WHY 평가
 * fallback_on_error: true → LLM 실패 시 고정값(50) 사용
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
      profiles: { default: { signals: ["s1", "s4"], weights: { s1: 0.60, s4: 0.40 } } },
      thresholds: { slop: 70, warn: 45 },
      llm_judge: { enabled: false },
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

async function runLLMSignal(name, text, config) {
  const llmCfg = config.llm_judge || {};
  if (!llmCfg.enabled) {
    return { score: 50, findings: [{ type: 'llm_disabled', message: 'LLM Judge 비활성화 — 고정값 사용', severity: 'info' }], source: 'disabled' };
  }

  try {
    const { evaluateRedundancy, evaluateDesignRationale } = await import("./llm-judge.js");

    if (name === "s2") {
      const result = await evaluateRedundancy(text);
      const findings = [];
      if (result.score > 30) {
        findings.push({
          type: 'high_redundancy',
          message: `중복도 높음 (${result.score}/100): ${result.summary}`,
          severity: result.score > 60 ? 'fail' : 'warn',
        });
      }
      if (result.examples?.length > 0) {
        for (const ex of result.examples) {
          findings.push({ type: 'redundant_example', message: ex, severity: 'info' });
        }
      }
      return { score: result.score, findings, source: result.source };
    }

    if (name === "s_why") {
      const result = await evaluateDesignRationale(text);
      const findings = [];
      if (result.missingRationale?.length > 0) {
        for (const m of result.missingRationale) {
          findings.push({ type: 'missing_rationale', message: m, severity: 'warn' });
        }
      }
      return { score: result.score, findings, source: result.source };
    }
  } catch (e) {
    const fallback = llmCfg.fallback_on_error !== false;
    return {
      score: 50,
      findings: [{ type: 'llm_error', message: `LLM Judge 실패 (${e.message}) — 고정값 사용`, severity: 'info' }],
      source: 'fallback',
    };
  }

  return { score: 50, findings: [], source: 'unknown' };
}

function runRuleSignal(name, text) {
  switch (name) {
    case "s1": return { name: "S1", label: "결정 밀도", inverted: true, ...s1Analyze(text) };
    case "s3": return { name: "S3", label: "계약 완결성", inverted: true, ...s3Analyze(text) };
    case "s4": return { name: "S4", label: "코드 위장도", inverted: false, ...s4Analyze(text) };
    case "s_ac": return { name: "S_AC", label: "AC 완결성", inverted: true, ...sAcAnalyze(text) };
    case "s_done": return { name: "S_DONE", label: "완료 기준", inverted: true, ...sDoneAnalyze(text) };
    default: return null;
  }
}

const LLM_SIGNALS = new Set(["s2", "s_why"]);
const LLM_SIGNAL_META = {
  s2:    { name: "S2",    label: "중복도",    inverted: true },
  s_why: { name: "S_WHY", label: "설계 근거", inverted: true },
};

export async function calculateSlopScore(text, filePath = "") {
  const config = loadConfig();
  const profileName = detectProfile(filePath);
  const profile = config.profiles[profileName] || config.profiles.default;
  const { thresholds } = config;

  const signalResults = {};
  let slopScore = 0;

  for (const sigName of profile.signals) {
    let result;

    if (LLM_SIGNALS.has(sigName)) {
      const llmResult = await runLLMSignal(sigName, text, config);
      const meta = LLM_SIGNAL_META[sigName];
      result = { ...meta, ...llmResult };
    } else {
      result = runRuleSignal(sigName, text);
      if (!result) continue;
    }

    signalResults[sigName] = result;
    const weight = profile.weights[sigName] || 0;
    const contribution = result.inverted
      ? weight * (100 - result.score)
      : weight * result.score;
    slopScore += contribution;
  }

  slopScore = Math.round(slopScore);

  let verdict;
  if (slopScore >= thresholds.slop) verdict = "SLOP";
  else if (slopScore >= thresholds.warn) verdict = "WARN";
  else verdict = "OK";

  const allFindings = Object.values(signalResults).flatMap(r =>
    (r.findings || []).map(f => ({ ...f, signal: r.name }))
  );

  return { score: slopScore, verdict, profile: profileName, signals: signalResults, findings: allFindings };
}
