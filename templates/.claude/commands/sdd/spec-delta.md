---
description: 스펙 변경 → 영향 코드 위치 분석. @impl 태그로 스펙 문장과 코드를 1:1 매핑하여 스펙 수정 시 어느 코드를 바꿔야 하는지 즉시 파악.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, LS
argument-hint: <feature> [--staged]
---

Read `.sdd/skills/sdd-delta/SKILL.md` and follow its instructions.

Arguments: `$ARGUMENTS`

If no argument: show usage — `spec-delta <feature> [--staged]`
If `--staged`: analyze only staged changes (default: working tree full diff).
