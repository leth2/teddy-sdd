---
name: sdd-capture
description: 버그/테스트 실패 패턴을 .sdd/lessons/에 기록. spec-capture 커맨드에서 사용.
allowed-tools: Read Write Edit Bash
---

# Lesson 기록

## 목적

테스트에서 발견된 버그/패턴을 `.sdd/lessons/`에 기록하여 다음 구현에서 반복하지 않도록 한다.

## 카테고리 결정

인자에서 `--category <cat>` 확인. 없으면 제목/내용으로 추론:

| 키워드 | 카테고리 |
|--------|----------|
| docker, npm, Dockerfile, package-lock | docker-node |
| acp, spawn, session, bridge, stdio, socket | acp-protocol |
| tsc, typescript, import, module, build | typescript-build |
| test, timeout, fetch, WebSocket, SSE | testing |
| 기타 | general |

## 실행 순서

1. `.sdd/lessons/` 디렉토리 확인 (없으면 생성)
2. 카테고리 파일 경로: `.sdd/lessons/<category>.md`
3. 파일이 없으면 헤더로 초기화:
   ```markdown
   # Lessons: <Category 이름>
   
   AI가 반복하는 실수 패턴 모음.
   ```
4. 기존 lessons에서 ID 마지막 번호 확인 → 다음 ID 결정
5. 사용자에게 순서대로 질문 (없으면 인자에서 추출):
   - **증상**: 어떤 에러/실패?
   - **원인**: 왜 발생했는가?
   - **체크**: 사전 확인 방법?
   - **수정**: 어떻게 고쳤는가?
   - **키워드**: 검색용 키워드 3~5개
6. lesson 파일 끝에 append (절대 덮어쓰기 금지):
7. **INDEX.md 업데이트** (`.sdd/lessons/INDEX.md`):
   - 새 행 추가: `| ID | 카테고리 | 제목 | 키워드 | 1 |`
   - 동일 패턴 재발이면 기존 행 횟수 +1 (횟수 2+ 시 ⚠️ 기록)
   - INDEX.md 없으면 헤더 포함하여 새로 생성

```markdown
## [ID] {제목}

**증상:** {symptom}

**원인:** {cause}

**체크:** {check}

**수정:** {fix}

---
```

## ID 규칙

- docker-node → D01, D02 ...
- acp-protocol → A01, A02 ...
- typescript-build → B01, B02 ...
- testing → T01, T02 ...
- general → G01, G02 ...

## 제약

- append only — 기존 내용 절대 수정/삭제 금지
- 확인된 사실만 기록 — 추측 금지
- 코드 예시는 실제 동작하는 코드만
