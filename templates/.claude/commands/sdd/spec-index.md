---
description: requirements.md에 INDEX 섹션 자동 생성. 100줄 이상 대용량 스펙에서 섹션별 lazy loading을 가능하게 함.
allowed-tools: Bash, Read, Write, Edit, Grep, LS
argument-hint: "<feature>"
---

Read `.agents/skills/sdd-lazy-load/SKILL.md` for the INDEX structure format.

Feature: `$ARGUMENTS`

1. `.sdd/specs/$FEATURE/requirements.md` 읽기
2. 줄 수 확인 — 100줄 미만이면 "INDEX가 필요하지 않습니다 (N줄)" 안내
3. 섹션(`### N.`) 목록 + 줄 번호 + REQ 범위 분석
4. `## INDEX` 섹션 생성 후 `## 개요` 앞에 삽입 (Write/Edit 도구)
5. "✅ INDEX 추가됨 — /sdd:spec-impl에서 자동 lazy load 적용됩니다" 안내
