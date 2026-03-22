# spec-validator SKILL.md

---
name: spec-validator
description: "SDD 스펙 품질 검증 도구. 스펙 섹션의 Slop Score를 계산하여 에이전트 실행 전 품질 게이트로 사용. RFC 2119 언어 정밀도, Design by Contract 구조, Divio 문서 타입 기준으로 결정 밀도/구현 가능성/중복도/코드 위장도를 측정. 임계값 이하 스펙은 에이전트 실행 차단."
---

## 언제 사용하는가

- 스펙 작성 완료 후 에이전트 구현 전 (`/sdd:spec-impl` 실행 전)
- PR 리뷰 전 스펙 품질 체크
- 스펙 수정 후 regression 확인

## 명령어

```
/sdd:validate <feature>           # 특정 feature 스펙 검증
/sdd:validate --file <path>       # 파일 직접 지정
/sdd:validate --section <id>      # 특정 섹션만 검증
```

## 출력 형식

```
📊 Spec Validator — auth/login

Signal 분석:
  S1 결정 밀도:     68/100  🟡  (MUST/SHALL 3개, SHOULD 8개 — SHOULD 비율 높음)
  S2 중복도:        25/100  🟢  (산문-스키마 보완 관계 확인)
  S3 구현 가능성:   45/100  🟡  (Precondition 없음, 에러 케이스 1개 미명시)
  S4 코드 위장:     15/100  🟢

종합 Slop Score: 43 → 🟡 WARN

발견된 문제:
  ⚠️  [S1] SHOULD 8회 사용 — MUST로 강화 필요: "토큰은 SHOULD 7일 만료" → "MUST 7일 만료"
  ⚠️  [S3] Precondition 미명시 — "로그인 요청 전 이메일 형식 검증" 추가 필요
  ⚠️  [S3] 에러 케이스 누락 — "잘못된 비밀번호" 케이스 처리 명시 필요

권고: 위 3개 항목 보완 후 재검증
```

## 판단 기준 (이론적 근거)

### S1 결정 밀도
- **RFC 2119** 기준: MUST/SHALL > SHOULD > MAY 순으로 결정의 강도 측정
- 결정 패턴: 타입 명시, 제약 조건, 선택 이유, 엣지 케이스
- 슬롭 패턴: "적절히", "필요에 따라", SHOULD 남용

### S2 중복도
- **Divio Documentation System** 기준: Reference(구현 정보) + Explanation(이유) = 보완
- 같은 정보를 다른 형식으로 반복 = 중복 = 슬롭
- 판별: "이것을 제거하면 정보 손실이 있는가?"

### S3 구현 가능성
- **Design by Contract** 기준: Precondition + Postcondition + Invariant
- **Gherkin** 테스트: Given/When/Then 변환 가능 여부
- 셋 중 하나라도 "모르겠다"면 구현 불가 = 슬롭

### S4 코드 위장도
- **ADR** 기준: 코드 블록에 "왜"가 없으면 구현 덤프
- Reference 레이블 없이 실제 코드 포함 = 슬롭 위험

## 점수 체계

| Score | 판정 | 동작 |
|-------|------|------|
| 0~44  | 🟢 OK   | 에이전트 실행 허용 |
| 45~69 | 🟡 WARN | 작성자 리뷰 권고, 실행 가능 |
| 70+   | 🔴 SLOP | 에이전트 실행 차단 |

## 가중치 (Phase 1 — 인과 사슬 기반)

```json
{
  "weights": {
    "s1_decision_density": 0.30,
    "s2_redundancy": 0.25,
    "s3_implementability": 0.35,
    "s4_code_camouflage": 0.10
  },
  "thresholds": {
    "slop": 70,
    "warn": 45
  },
  "note": "Phase 2에서 실증 데이터로 교체 예정. 가중치는 외부 config로 관리."
}
```

## 구현 단계

### Phase 1 (규칙 기반)
- S1: RFC 2119 키워드 빈도 분석, 결정 패턴 정규식
- S3: Pre/Post/Invariant 존재 여부 체크, TBD 카운팅
- S4: 코드 블록 언어 특화도, 레이블 존재 여부

### Phase 2 (LLM Judge)
- S2: 텍스트 임베딩 기반 중복도 측정
- S1/S3 심층 분석: "이 문장이 결정을 담는가" LLM 판단

### Phase 3 (피드백 루프)
- 에이전트 실행 결과 로깅
- 스펙 점수 ↔ 구현 성공률 상관관계 학습
- 가중치 자동 캘리브레이션

## 파일 구조

```
teddy-sdd/
  skills/
    spec-validator/
      SKILL.md          ← 이 파일
      scorer.js         ← Slop Score 계산
      rules/
        s1-decision.js  ← 결정 밀도 규칙
        s3-contract.js  ← 구현 가능성 규칙
        s4-camouflage.js ← 코드 위장 규칙
      llm-judge.js      ← Phase 2 LLM 판단
      config.json       ← 가중치 설정 (교체 가능)
```

## 참고

- [teddy-team-sync #4](https://github.com/leth2/teddy-team-sync/issues/4) — Spec Quality Gate 설계 이슈
- RFC 2119: https://datatracker.ietf.org/doc/html/rfc2119
- Design by Contract: https://www.eiffel.com/values/design-by-contract/introduction/
- Divio Documentation System: https://docs.divio.com/documentation-system/
