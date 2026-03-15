---
description: 풀 플랜 자동 생성 (req+design+tasks, 인간 개입 최소화)
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, LS, WebSearch, WebFetch
argument-hint: <description-or-feature-name> [--interactive]
---

Read `.sdd/skills/sdd-requirements/SKILL.md`, `.sdd/skills/sdd-design/SKILL.md`, and `.sdd/skills/sdd-tasks/SKILL.md` in sequence.

Run spec-init logic, then generate requirements → design → tasks. Without `--interactive`, auto-approve each step. Log progress to `.sdd/logs/YYYY-MM-DD.md`.
