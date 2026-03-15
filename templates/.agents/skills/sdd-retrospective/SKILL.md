---
name: sdd-retrospective
description: 스펙 단위 애자일 회고. Keep/Problem/Try 분석, 코드 품질 지표, 교훈 자동 저장. retrospective 커맨드에서 사용.
allowed-tools: Bash Read Write Edit Grep Glob LS
---

# 스펙 회고 (Retrospective)

## 회고 시점

- Feature 구현 완료 후 (`spec-impl` 완료, tasks.md 전부 `[x]`)
- Sprint 종료 시 (여러 Feature 묶음)
- 문제 발생 직후 (긴급 회고)

## 실행 흐름

### Step 1: 데이터 수집

```bash
SPEC_DIR=".sdd/specs/$FEATURE"
```

수집 항목:
1. `tasks.md` — 완료/미완료 태스크 비율
2. `requirements.md` — 요구사항 수, REQ ID 범위, @impl 태그 수
3. `.sdd/logs/YYYY-MM-DD.md` — 실행 로그 (오류 패턴, 재시도 횟수)
4. 테스트 결과 (있으면): `package.json` 확인 후 테스트 실행 또는 최근 결과 확인

### Step 2: 품질 지표 계산

```
태스크 완료율 = 완료된 [x] / 전체 태스크
@impl 커버리지 = @impl 태그 있는 요구사항 / 전체 요구사항
테스트 통과율 = 최근 실행 기준 (없으면 "측정 안 됨")
```

### Step 3: 회고 질문 생성 + 사용자 답변 수집

다음 질문을 순서대로 제시하며 답변 수집:

**Keep (잘된 것)**
```
이번 Feature에서 잘 작동한 것은 무엇인가요?
(예: 스펙 → 코드 흐름이 자연스러웠음, 테스트가 먼저 실패했다가 통과함)
```

**Problem (개선이 필요한 것)**
```
어려웠거나 막혔던 부분은 무엇인가요?
(예: 요구사항 불명확, @impl 태그 누락, 스펙 밖 코드 변경)
```

**Try (다음에 시도할 것)**
```
다음번에 다르게 해보고 싶은 것은?
(예: spec-decompose 먼저 사용, @impl 완성 후 spec-delta 먼저 실행)
```

사용자가 짧게 답하거나 "없음"이라 해도 OK — 강제하지 않음.

### Step 4: 회고 문서 생성

`.sdd/specs/$FEATURE/retrospective.md` 생성:

```markdown
# 회고: [Feature 이름]
날짜: YYYY-MM-DD

## 품질 지표
- 태스크 완료율: N/N (100%)
- @impl 커버리지: N/N개 요구사항 (N%)
- 테스트 통과율: N/N (측정 안 됨)

## Keep (잘된 것)
[사용자 답변]

## Problem (개선이 필요한 것)
[사용자 답변]

## Try (다음에 시도할 것)
[사용자 답변]

## AI 관찰
[로그/스펙에서 LLM이 발견한 패턴 — 오류 재발, 스펙 이탈, 긍정적 패턴]
```

### Step 5: 교훈 자동 저장

Problem + Try에서 반복 가능한 교훈을 추출해 `.sdd/lessons/` 저장:

1. `lessons/INDEX.md` 읽기
2. 새 교훈이 기존과 중복인지 확인
3. 신규 교훈이면 `lessons/L-NNN.md` 생성 + INDEX 업데이트:

```markdown
# L-NNN: [교훈 제목]
날짜: YYYY-MM-DD
출처: retrospective / [Feature]
심각도: info | warning | critical

## 상황
[어떤 상황에서 발생했나]

## 결과
[어떤 결과가 나왔나]

## 교훈
[다음에 어떻게 할 것인가]
```

**중복 교훈**: 기존 교훈에 "재발 횟수" 카운트 +1만 업데이트.

### Step 6: 완료 요약 출력

```
✅ 회고 완료: [Feature]

📊 품질 지표
  태스크: 8/8 완료
  @impl 커버리지: 5/8 (62.5%)
  테스트: 27/27 통과

📝 회고 저장
  → .sdd/specs/[feature]/retrospective.md

💡 교훈 저장
  → L-007: 요구사항 확정 전 UI 코딩 금지 (신규)
  → L-003: @impl 태그 누락 시 spec-delta 정밀도 저하 (재발 +1)

다음 Feature 시작하려면:
  → /sdd:spec-decompose 또는 /sdd:spec-requirements
```

## 스프린트 회고 (여러 Feature 묶음)

`/sdd:retrospective` 인자 없이 실행하면 → 최근 완료된 Feature 전체 대상:

```
완료된 스펙 목록 → 각 retrospective.md 요약 →
스프린트 수준 Keep/Problem/Try → 스프린트 회고 문서 생성
```
