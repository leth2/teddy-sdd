---
description: 프로젝트 로드맵 생성 또는 업데이트. 여러 스펙을 관통하는 큰 그림 관리.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, LS
argument-hint: [--init | --update] [--feature "아이디어"]
---

Read `.sdd/skills/sdd-roadmap/SKILL.md` and follow its instructions.

Arguments: `$ARGUMENTS`

If `--init`: create a new `.sdd/roadmap.md` using Init mode.
If `--update`: update existing roadmap using Update mode.
If `--feature "..."`: add the feature idea to the roadmap as a future milestone item.
If no argument: show current roadmap status and suggest next action.
