---
name: sdd-impl
description: TDD 구현. tasks.md의 태스크를 Red-Green-Refactor 사이클로 구현. 스티어링 가드레일 준수. spec-impl 커맨드에서 사용.
allowed-tools: Bash Read Write Edit MultiEdit Grep Glob LS WebFetch WebSearch
---

# TDD 구현

## ⛔ 사전 검증 게이트 (AGENT KILL)

**spec-impl 실행 전 반드시 수행. 이 단계를 건너뛰면 안 된다.**

```
node .agents/skills/spec-validator/index.js .sdd/specs/$FEATURE/requirements.md
node .agents/skills/spec-validator/index.js .sdd/specs/$FEATURE/tasks.md
```

판정에 따른 행동:

| 판정 | Slop Score | 행동 |
|------|-----------|------|
| OK | < 45 | 구현 진행 |
| WARN | 45~69 | 경고 출력, 계속 여부 사용자에게 확인 |
| SLOP | >= 70 | 즉시 중단. 에이전트 구현 지시 금지. |

SLOP 판정 시 출력:
```
AGENT KILL -- spec-validator
Slop Score: {score} SLOP

차단 이유: {findings}

개선 후 /sdd:spec-validate {feature}로 재검증하세요.
에이전트 구현은 Score < 70 이후 진행 가능합니다.
```

spec-validator가 설치되지 않은 경우 이 단계 건너뛰고 경고만 출력.

---

## 준비 단계

1. `.sdd/specs/$FEATURE/` 전체 읽기 (spec.json, requirements.md, design.md, tasks.md)
   - requirements.md가 **100줄 이상**이면 전체 로드 대신 lazy load 적용
2. **`.sdd/lessons/` 읽기**
3. `.agents/skills/project-steering/SKILL.md` 읽기
4. 실행할 태스크 결정

## Red-Green-Refactor 사이클

### Red -- 실패하는 테스트 먼저
1. 태스크의 수락 기준(AC) 읽기
2. AC를 테스트 코드로 번역
3. 테스트 실행 -> 반드시 실패 확인

### Green -- 최소한의 통과 코드
1. 테스트를 통과시키는 최소한의 코드만 작성
2. 테스트 실행 -> 통과 확인

### Refactor -- 정리
1. 중복 제거, 네이밍 개선, 구조 정리
2. 모든 테스트 통과 유지

## 체크포인트

- `tasks.md` 해당 항목 [ ] -> [x] 업데이트
- `.sdd/logs/YYYY-MM-DD.md` 완료 기록

## 구현 중 스펙 빈틈 발견 시

발견 즉시 구현 멈추고 스펙 먼저 업데이트. 코드가 스펙보다 먼저 변경되어서는 안 된다.

최대 3회 반복. 초과 시 중단 후 사람에게 리포트.

## @impl 태그 자동 생성

각 태스크 [x] 완료 후 requirements.md에 태그 추가. 개발자 확인 후 저장.

## 완료 기준

- 테스트 통과 확인
- design.md 인터페이스 계약과 구현 일치
- 기존 테스트 회귀 없음
- tasks.md 업데이트
- 로그 기록

## 생성 후 자동 검증

구현 완료 후 `.agents/skills/sdd-validate/SKILL.md` 읽고 Implementation 검증 실행.