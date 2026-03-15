---
name: sdd-research
description: 스펙 작성 전 리서치. 외부 프로토콜/API/선행사례를 조사해 "모르는 걸 모르는" 상태를 해소. 삼각형 크기(스펙 범위)를 결정하기 위한 사전 단계. spec-research 커맨드에서 사용.
allowed-tools: Bash Read Write Edit Glob Grep LS WebSearch WebFetch
---

# 스펙 리서치

## 목적

리서치는 스펙 작성 전에 삼각형 크기를 결정한다.
리서치가 얕으면 삼각형이 작아지고 나중에 다시 열어야 한다.
리서치가 깊으면 처음부터 올바른 범위로 만들 수 있다.

**핵심 원칙: "무엇을 모르는지" 먼저 파악한다.**

## 리서치 프로세스

### Step 1: 무지 목록 작성 (Unknown Unknowns)

스펙 작성 전, 다음 질문에 답하며 모르는 것을 나열:
- 이 기능이 의존하는 외부 프로토콜/API가 있는가?
- 그 프로토콜의 정확한 메서드명/형식을 아는가?
- 유사한 오픈소스 구현이 있는가?
- 알려진 함정(gotcha)이나 엣지케이스가 있는가?
- 선행 팀/프로젝트의 경험에서 배울 게 있는가?

### Step 2: 우선순위 분류

각 모르는 것을 분류:
- **Critical** — 모르면 구현 자체가 불가능 (예: ACP 핸드셰이크 순서)
- **Important** — 모르면 나중에 다시 열어야 함 (예: 에러 코드 목록)
- **Nice-to-know** — 알면 좋지만 없어도 됨

Critical → 반드시 리서치
Important → 가능하면 리서치
Nice-to-know → 스킵 가능

### Step 3: 조사 실행

Critical/Important 항목별:
1. WebSearch로 공식 문서/스펙 찾기
2. GitHub에서 실제 구현 예제 찾기
3. 핵심 내용 추출:
   - 정확한 메서드명/API 형식
   - 연결 순서/핸드셰이크
   - 에러 케이스
   - 알려진 함정

### Step 4: references/ 저장

`.sdd/specs/$FEATURE/references/` 에 저장:
- `[protocol-name].md` — 프로토콜 스펙 요약
- `[api-name].md` — API 레퍼런스
- `prior-art.md` — 선행 구현 사례

### Step 5: 컨포먼스 테스트 추출

references/에 저장된 외부 스펙에서 테스트 가능한 케이스를 추출한다.
`.sdd/specs/$FEATURE/conformance-tests.yaml`에 저장:

```yaml
# conformance-tests.yaml
# 출처: references/[스펙명].md
# 자동 추출 — spec-research 단계

tests:
  - name: "[테스트 이름]"
    description: "[무엇을 검증하는가]"
    scenario: "[어떤 상황에서]"
    expected: "[무엇이 일어나야 하는가]"
    source: "references/[파일명].md"
```

**추출 기준:**
- 프로토콜 순서/핸드셰이크 → 순서 테스트
- 정확한 메서드명/필드명 → 이름 컨포먼스 테스트
- 필수/선택 필드 → 형식 테스트
- 에러 케이스 → 에러 처리 테스트

**예시 (ACP 프로토콜):**
```yaml
tests:
  - name: "ACP 핸드셰이크 순서"
    description: "initialize → session/new 순서 준수"
    scenario: "initialize 없이 session/new 전송"
    expected: "에러 또는 무응답"
    source: "references/acp-protocol.md"

  - name: "session/prompt 메서드명"
    description: "프롬프트 전송 시 정확한 메서드명 사용"
    scenario: "사용자 메시지 전송"
    expected: "method: session/prompt (message, prompt 등 아님)"
    source: "references/acp-protocol.md"
```

### Step 6: 스펙 범위 결정

리서치 결과를 바탕으로:
- 이 스펙이 다뤄야 할 최소 범위 (Critical 커버)
- 이 스펙이 다뤄야 할 권장 범위 (Important 커버)
- 다음 스펙으로 미룰 것 (Nice-to-know)

이 결정을 `research-summary.md`에 기록:
```markdown
# 리서치 요약 — [FEATURE]

## 발견된 것
- [항목]: [핵심 내용]

## 스펙 범위 결정
- 포함: [이유]
- 제외 (다음 스펙): [이유]

## 저장된 references
- references/[파일명]: [설명]

## 컨포먼스 테스트
- conformance-tests.yaml: [추출된 테스트 수] 케이스
```

## 리서치 완료 기준

- [ ] 모르는 것 목록 작성됨
- [ ] Critical 항목 전부 조사됨
- [ ] references/ 저장됨
- [ ] conformance-tests.yaml 생성됨
- [ ] research-summary.md 작성됨
- [ ] 스펙 범위 결정됨

완료 후 `spec-requirements` 진행.
