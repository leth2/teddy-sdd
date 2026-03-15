---
description: 긴 스티어링 파일을 스킬로 분리 (lazy-load 전환)
allowed-tools: Read, Write, Edit, Glob
argument-hint: [steering-file-name]
---

Scan `.sdd/steering/` for SKILL.md files exceeding 100 lines. For the target file (`$ARGUMENTS` or all over-limit files): keep a ≤50-line summary in the steering file, move detailed content to `.sdd/skills/<topic>-detail.md`, and add a reference link `> 상세: read .sdd/skills/<topic>-detail.md`.
