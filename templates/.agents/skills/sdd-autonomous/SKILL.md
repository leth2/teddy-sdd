---
name: sdd-autonomous
description: 자율 운영 프로토콜. overnight 실행, 오류 복구, 결정 로깅, 체크포인트. spec-auto와 spec-plan의 자동 모드에서 사용.
allowed-tools: Bash Read Write Edit MultiEdit Glob Grep LS WebSearch WebFetch
---

# 자율 운영 프로토콜

## 목적

overnight 또는 무인 실행 시 AI의 의사결정 기준.
중단 후 재시작해도 완료된 부분부터 계속 가능하도록 체크포인트 유지.

## 결정 우선순위 (SDD 계층 준수)

1. **스티어링** (`.sdd/steering/`) — 방향과 원칙의 진실
2. **요구사항** (`requirements.md`) — 스티어링에서 파생된 스펙
3. **설계** (`design.md`) — 요구사항에서 파생된 스펙
4. **기존 코드베이스 패턴** — 참고만, 진실이 아님
   - 코드 패턴이 스티어링과 충돌 시: 스티어링을 따름
5. 위 모두 없으면: 가장 단순한 접근 선택, 로그에 기록

## 결정 기록 형식

```
[HH:MM] 🤔 결정: [모호한 상황] → [선택한 것] (이유: [간단한 이유])
```

## 체크포인트

각 단계 완료 시 즉시 저장:
- `spec.json` 업데이트
- `tasks.md` 체크박스 업데이트 (`[ ]` → `[x]`)
- 로그 엔트리 추가

## 로그 파일

위치: `.sdd/logs/YYYY-MM-DD.md` (날짜별 1파일)

형식:
```
[HH:MM] 🚀 시작: <feature> — <설명>
[HH:MM] ✅ requirements 생성 완료
[HH:MM] ✅ design 생성 완료
[HH:MM] ✅ tasks 생성 완료 (총 N개)
[HH:MM] 🔴 태스크 N.M 테스트 작성
[HH:MM] 🟢 태스크 N.M 구현 완료
[HH:MM] ✅ 태스크 N.M 완료
[HH:MM] 🏁 완료: N/M 태스크 성공
```

## 언제 계속, 언제 중단

→ `references/error-recovery.md` 참조

## 완료 요약 형식

```markdown
## 완료 요약
- 실행 시간: HH:MM ~ HH:MM (총 Xh Ym)
- 성공: N/M 태스크
- 실패: N개
- 결정사항: N개
- 다음 필요 작업:
  - [실패한 태스크 목록]
  - [수동 확인 필요 항목]
```
