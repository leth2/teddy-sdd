---
name: sdd-update
description: 자연어 요구사항 변경 요청 → 신규/수정/삭제 자동 분류 → requirements.md 업데이트 → spec-delta 또는 spec-impl로 자동 연결. spec-update 커맨드에서 사용.
allowed-tools: Bash Read Write Edit Grep Glob LS
---

# 요구사항 업데이트

사용자는 "이렇게 바꿔줘"만 말하면 된다. 신규인지 수정인지 직접 판단하지 않아도 됨.

## 준비

1. `.sdd/specs/$FEATURE/requirements.md` 전체 읽기
2. `$REQUEST` (사용자 요청) 파악

## 분류 기준

각 요청 항목에 대해:

| 판단 | 기준 | 후속 처리 |
|------|------|-----------|
| **수정** | 기존 문장과 같은 기능을 다르게 표현 | requirements.md 수정 → spec-delta |
| **신규** | 기존에 없는 완전히 새로운 기능 | requirements.md 추가 → spec-impl 안내 |
| **삭제 후보** | 기존 기능 제거 요청 | 경고만 출력 (자동 삭제 없음) |

**판단이 불확실할 때**: 수정/신규 중 어느 쪽인지 사용자에게 먼저 확인 후 진행.

## 수정 처리

1. requirements.md에서 해당 문장 찾기
2. 새 내용으로 수정 (Edit 도구로 저장)
3. `.agents/skills/sdd-delta/SKILL.md` 읽고 spec-delta 자동 실행

## 신규 처리

1. requirements.md 적절한 위치에 EARS 형식으로 추가 (Write/Edit 도구로 저장)
2. 추가된 내용 출력
3. 구현 안내:
   ```
   ✅ 신규 요구사항이 추가됐어요.
   → /sdd:spec-impl $FEATURE 로 구현을 진행하세요.
   ```

## 삭제 후보 처리

자동 삭제 절대 금지. 경고만 출력:
```
⚠️ 삭제 후보: "[요구사항 문장]"
→ @impl 태그가 있으면 연결된 코드도 검토 필요
→ 직접 삭제하려면 requirements.md를 수동으로 편집하세요.
```

## 출력 형식

```
📋 변경 분류 결과:
  [수정] REQ-001 "고유 ID" → "고유 UUID v4 ID"
         spec-delta 실행 중...
         → src/memo/MemoService.ts#MemoService.create (L17 ±5줄)

  [신규] REQ-005 (신규 부여) "태그 기능 — 메모에 태그를 붙일 수 있다."
         requirements.md에 추가됨
         → /sdd:spec-impl memo-crud 로 구현 진행 필요

  [삭제 후보] REQ-003 "하드 삭제"
         ⚠️ 자동 삭제 안 함. 수동 확인 필요.

✅ requirements.md 업데이트 완료
```
