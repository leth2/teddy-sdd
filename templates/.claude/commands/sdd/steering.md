---
description: 프로젝트 스티어링 생성/업데이트 (.agents/skills/project-steering/)
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, LS
argument-hint: [--intent "<새 방향>"] [--add <topic>]
---

Read `.agents/skills/sdd-steering-rules/SKILL.md` and follow its instructions.

Mode is auto-detected:
- **Bootstrap:New**: `project-steering/` 없음 + 소스 코드 없음 + `--intent` 없음 → 사용자에게 "뭘 만들 건가요?" 질문 후 생성
- **Bootstrap:Existing**: `project-steering/` 없음 + 코드 있음 → 코드 분석 후 자동 생성
- **Bootstrap:Intent**: `project-steering/` 없음 + `--intent` 있음 → intent 기반 즉시 생성
- **Sync**: 스킬 있음, `--intent` 없음 → 드리프트 감지
- **Rewrite**: 스킬 있음 + `--intent "<새 방향>"` → 새 방향으로 재작성
- **Add**: `--add <topic>` → 옵셔널 스티어링 추가

Arguments: `$ARGUMENTS`
