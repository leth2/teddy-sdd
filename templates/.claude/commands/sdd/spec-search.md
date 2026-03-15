---
description: 키워드 검색. --all 플래그 시 모든 스펙의 요구사항 전체 검색, 기본은 lessons 검색.
allowed-tools: Bash, Read, Glob, Grep, LS
argument-hint: "[--all] <키워드>"
---

Arguments: `$ARGUMENTS`

`--all` 플래그가 있으면:
→ Read `.agents/skills/sdd-req-search/SKILL.md` and search all requirements.md files.
  Keyword: `$ARGUMENTS` (`--all` 플래그 제거 후 나머지)

`--all` 플래그가 없으면:
→ Read `.agents/skills/sdd-search/SKILL.md` and search lessons index.
  Keyword: `$ARGUMENTS`

예시:
- `/sdd:spec-search --all "인증"`   → 전체 스펙 요구사항 검색
- `/sdd:spec-search "jwt"`          → lessons에서 jwt 관련 교훈 검색
- `/sdd:spec-search --all "REQ-023"` → REQ ID 직접 검색
