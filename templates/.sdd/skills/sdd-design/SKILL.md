---
name: sdd-design
description: 기술 설계 문서 생성. design.md 작성. 아키텍처, 인터페이스 계약, Mermaid 다이어그램. 스티어링 기술 결정 준수. spec-design 커맨드에서 사용.
allowed-tools: Bash Read Write Edit Glob Grep LS WebSearch WebFetch
---

# 설계 생성

## 단계

1. `.sdd/specs/$FEATURE/spec.json`, `requirements.md` 읽기
2. `-y` 있으면 requirements 자동 승인
3. `.sdd/steering/` 전체 읽기 — **tech SKILL.md의 기술 결정이 설계의 기준**
4. 필요시 WebSearch로 외부 의존성 조사 (API 스펙, 라이브러리 버전, 라이선스)
5. design.md 생성 (아키텍처 → 컴포넌트 → 인터페이스 → 데이터 모델 → 다이어그램)
6. **스티어링 정렬 검증**:
   - 기술 스택이 `tech` 스티어링과 일치하는가?
   - 폴더/모듈 구조가 `structure` 스티어링과 일치하는가?
   - 충돌 시: **스티어링이 우선** — 설계를 스티어링에 맞게 조정, 로그에 기록
7. `spec.json` 업데이트

## 설계 순서

1. **시스템 경계 먼저**: 외부 요소와 내부 요소 구분
2. **주요 컴포넌트**: 각 컴포넌트의 역할과 책임 (단일 책임 원칙)
3. **인터페이스 계약**: 컴포넌트 간 입출력 정의
4. **데이터 모델**: 주요 엔티티와 관계
5. **다이어그램**: 복잡한 흐름 시각화 (Mermaid)

## 제약

- **아키텍처와 인터페이스만** — 구현 코드 없음
- **코드 스니펫 없음** — 인터페이스 계약(타입/서명)만 허용
- **Mermaid 다이어그램** 으로 복잡한 흐름 표현 필수
- **스티어링의 기술 결정을 임의로 변경하지 않음**
- 순환 의존성 금지 — 의존성 방향 명시

## 외부 스펙 처리

설계 중 외부 API/프로토콜/라이브러리 참조 발견 시:
1. WebSearch로 공식 문서/스펙 검색
2. 핵심 내용 (메시지 형식, 핸드셰이크 순서, 제약 등) 추출
3. `.sdd/specs/$FEATURE/references/[name].md` 에 저장
4. design.md에 `> 참조: references/[name].md` 링크 추가

**중요한 것은 반드시 저장:** 외부 스펙을 모르면 구현이 틀린다.

## 생성 후 자동 검증

`.sdd/skills/sdd-validate/SKILL.md` 읽고 Design 검증 실행.
외부 스펙 참조 발견 시 위 프로세스 적용.
검증 통과 후에만 `approvals.design.generated: true` 설정.

## Mermaid 다이어그램 선택

| 다이어그램 | 사용 시기 |
|------------|-----------|
| `flowchart` | 시스템 흐름, 의사결정 |
| `sequenceDiagram` | 컴포넌트 간 상호작용 |
| `erDiagram` | 데이터 관계 |
| `graph` | 의존성 구조 |

## 기술 결정 기록 형식

각 주요 기술 선택:
- 선택한 것과 이유
- 검토했으나 제외한 대안
- 트레이드오프

## 아키텍처 패턴 및 인터페이스 형식 상세

→ `references/patterns.md` 참조
