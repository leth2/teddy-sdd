---
description: 완전 자동 구현 (overnight용) — plan부터 impl까지
allowed-tools: Bash, Read, Write, Edit, MultiEdit, Glob, Grep, LS, WebSearch, WebFetch
argument-hint: <feature-name-or-description>
---

Read `.agents/skills/sdd-autonomous/SKILL.md` for the autonomous protocol, then `.agents/skills/sdd-impl/SKILL.md` for TDD rules.

If `.sdd/specs/$1/` exists with tasks.md, go straight to implementation. Otherwise run full spec-plan first. Execute all incomplete tasks via Red-Green-Refactor. Log everything to `.sdd/logs/YYYY-MM-DD.md`.
