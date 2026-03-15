---
name: sdd-requirements
description: 스펙 요구사항 생성. feature의 requirements.md 작성. EARS 형식, WHAT만(HOW 없음), 스티어링과 정렬 검증 포함. spec-requirements 커맨드에서 사용.
allowed-tools: Bash Read Write Edit Glob Grep LS WebSearch WebFetch
---

# 요구사항 생성

## 단계

1. `.sdd/specs/$FEATURE/spec.json`, `requirements.md` 읽기 (기존 내용 파악)
2. `.agents/skills/project-steering/SKILL.md` 읽기 → 기본 references (product/tech/structure) 로드
   - 스티어링 없으면 경고: "스티어링 없이 생성 → 방향 없을 수 있음. `/sdd:steering` 권장"
3. EARS 형식으로 requirements.md 생성 (아래 규칙 적용)
4. **스티어링 정렬 검증**:
   - 생성된 요구사항이 `product` 스티어링(목적, 타겟)과 일치하는가?
   - 충돌 항목: `⚠️ 스티어링 충돌: [내용]` 표시 후 사용자 판단 요청
5. `spec.json` 업데이트: `phase: "requirements-generated"`, `approvals.requirements.generated: true`

## 생성 규칙

- **WHAT만**: 무엇을 해야 하는가. HOW(어떻게)는 설계 문서에서 다룸
- **테스트 가능**: 명확한 통과/실패 기준
- **구체적**: "빠르게", "쉽게", "적절히" 사용 금지
- **단일 관심사**: 요구사항 1개 = 동작 1개
- **코드 예시 없음**: 절대 포함하지 않음
- **기술 스택 참조 최소화**: 설계 문서에서 다룸

## 번호 체계

- 최상위: `1`, `2`, `3`
- 하위: `1.1`, `1.2`, `2.1`
- 3단계 이상 금지

## 그룹화

논리적 영역별로 그룹화:
- 사용자 기능 (핵심 사용 케이스)
- 시스템 동작 (비기능 요구사항)
- 외부 인터페이스 (API, 통합)
- 제약 조건 (보안, 성능, 규정)

## 수락 기준 형식

```
**1.1** [EARS 요구사항]
- AC1: [구체적 테스트 조건]
- AC2: [엣지 케이스]
```

## 생성 프로세스

1. 먼저 전체 요구사항 생성 — 질문 먼저 하지 않음
2. 누락된 영역 자체 판단으로 채움
3. 모호한 부분은 최선의 해석으로 진행, 가정사항 명시
4. 각 요구사항에 수락 기준 최소 1개

## 생성 후 자동 검증

요구사항 생성 완료 후 즉시 실행:
1. `.agents/skills/sdd-validate/SKILL.md` 읽기
2. Requirements 검증 체크리스트 실행
3. 실패 항목 수정 후 spec.json 업데이트

검증 통과 후에만 `approvals.requirements.generated: true` 설정.

## 수락 테스트 추출

requirements.md 생성 완료 후, 각 AC(수락 기준)에서 테스트 케이스를 추출한다.
`.sdd/specs/$FEATURE/acceptance-tests.yaml`에 저장:

```yaml
# acceptance-tests.yaml
# 출처: requirements.md AC
# 자동 추출 — spec-requirements 단계

tests:
  - id: "AC-[요구사항ID]-[AC번호]"
    requirement: "[요구사항 설명]"
    acceptance_criteria: "[AC 내용]"
    scenario: "[테스트 시나리오]"
    expected: "[기대 결과]"
```

**AC → 테스트 변환 규칙:**
- "X초 이내" → 성능 테스트 케이스
- "에러 시 Y를 반환" → 에러 처리 테스트
- "사용자가 A를 하면 B가 된다" → 동작 테스트
- 모호한 표현("빠르게", "쉽게") → 검증 불가 표시, 요구사항 재작성 요청

## @impl 태그 (선택사항 — 구현 후 추가)

요구사항 작성 시 @impl 태그는 **작성하지 않아도 됨**.
구현 전 단계에서는 코드 구조가 미확정이므로 태그 작성이 불가능하거나 의미 없음.

**@impl 태그가 추가되는 시점:**
1. `spec-impl` 실행 후 자동 생성 (개발자 확인 요청)
2. 또는 구현 완료 후 개발자가 수동 추가

**형식 참고 (나중에 추가할 때):**
```markdown
UserAuthService는 JWT 토큰을 발급한다.
<!-- @impl: src/auth/UserAuthService.ts#UserAuthService.issueToken -->
```

`spec-delta` 커맨드는 이 태그를 기반으로 스펙 변경 시 영향 코드를 추적함.

## EARS 형식 상세

→ `references/ears-format.md` 참조

## 출력 템플릿

→ `references/requirements-template.md` 참조
