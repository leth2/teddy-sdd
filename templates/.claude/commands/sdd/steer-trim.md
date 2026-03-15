---
description: 긴 스티어링 파일을 분리 (≤100줄 유지)
allowed-tools: Read, Write, Edit, Glob
argument-hint: [steering-file-name]
---

Scan `.agents/skills/project-steering/references/` for files exceeding 100 lines. For the target file (`$ARGUMENTS` or all over-limit files): keep a ≤100-line summary in the references file, move detailed content to `.agents/skills/project-steering/references/<topic>-detail.md`, and add a reference link `> 상세: references/<topic>-detail.md`. Then update `project-steering/SKILL.md` if new optional references were added.
