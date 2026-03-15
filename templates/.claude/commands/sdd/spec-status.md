---
description: 스펙 진행 상황 확인
allowed-tools: Read, Glob, Bash
argument-hint: [feature-name]
---

Scan `.sdd/specs/` and `.sdd/archive/`. For each spec, read `spec.json` and `tasks.md` to show phase and task completion. Display timestamps converted to local timezone. Feature filter: `$ARGUMENTS` (optional).
