---
description: 자연어 요구사항 변경 요청 → 신규/수정 자동 분류 → requirements.md 업데이트 → spec-delta / spec-impl 자동 연결
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, LS
argument-hint: <feature> "<변경 요청>"
---

Read `.agents/skills/sdd-update/SKILL.md` and follow its instructions.

Feature: `$FEATURE` (첫 번째 인자)
Request: `$REQUEST` (두 번째 인자, 자연어)

예시:
- `/sdd:spec-update memo-crud "삭제를 소프트 삭제로 변경, 태그 기능 추가"`
- `/sdd:spec-update auth "JWT 만료를 7일에서 30일로 변경"`

Arguments: `$ARGUMENTS`
