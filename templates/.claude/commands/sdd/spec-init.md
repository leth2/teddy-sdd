---
description: 새 스펙 초기화
allowed-tools: Read, Write, Bash, Glob, LS
argument-hint: <설명>
---

Read `.sdd/skills/sdd-workflow/SKILL.md` to understand the SDD workflow, then read `.sdd/settings/templates/specs/init.json` and `.sdd/settings/templates/specs/requirements.md`.

Create a new spec folder: generate a Unix timestamp (`date -u +%s`), derive a kebab-case feature name from `$ARGUMENTS`, make dir `.sdd/specs/TIMESTAMP-feature-name/`, and create `spec.json` and `requirements.md` from templates with placeholders replaced.
