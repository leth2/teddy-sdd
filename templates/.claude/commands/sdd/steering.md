---
description: 프로젝트 스티어링 생성/업데이트 (.agents/skills/project-steering/)
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, LS
argument-hint: [--intent "<새 방향>"] [--add <topic>]
---

Read `.agents/skills/sdd-steering-rules/SKILL.md` and follow its instructions.

Mode is auto-detected:
- **Bootstrap**: `.agents/skills/project-steering/` 없음 → 코드베이스 분석 후 생성
- **Sync**: 스킬 있음, `--intent` 없음 → 드리프트 감지
- **Rewrite**: `--intent "<새 방향>"` → 새 방향으로 재작성
- **Add**: `--add <topic>` → 옵셔널 스티어링 추가 (references/<topic>.md 생성 + SKILL.md 목록 업데이트)

Arguments: `$ARGUMENTS`
