# SDD Tool — 스펙 기반 개발 도구

Claude Code용 스펙 기반 개발 워크플로우. 자율 운영과 미니멀리즘에 최적화.

> 스펙 주도 개발 방법론에서 영감을 받아 제작했습니다. 이 분야를 개척해 주신 분들께 감사드립니다.

## 주요 특징

1. **CLAUDE.md ≤ 50줄** — 부트스트랩 파일은 지도만 제공. 지능은 스킬 파일에.
2. **Steering = "무엇"만** — 코드 예시 없음. 사실, 결정, 패턴만 기록.
3. **Reset + 살릴 것 분석** — 큰 변경 전 아카이브. 무엇을 살리고 버릴지 AI가 조언.
4. **최소 인간 개입** — overnight 자동화. 로그로 진행 상황 추적.
5. **스킬 기반 lazy loading** — 명령어는 얇게, 로직은 `.sdd/skills/`에. 필요할 때만 읽음.
6. **순서 식별 폴더링** — `TIMESTAMP-feature` 형식. UTC Unix 타임스탬프로 타임존 무관, 충돌 없음.

---

## 빠른 시작

```bash
# 프로젝트에 설치
./install.sh /path/to/your/project

# claude 실행 후:
/sdd:steering          # 프로젝트 메모리 초기화
/sdd:spec-plan <설명>  # 스펙 자동 생성
/sdd:spec-impl <feature>  # 구현
```

---

## Overnight 자동화 사용법

자고 일어나면 구현이 완료되어 있도록:

```
/sdd:spec-auto <만들 것 설명>
```

이 커맨드 하나로:
1. 스펙 이름 자동 생성
2. requirements.md 자동 생성 및 승인
3. design.md 자동 생성 및 승인
4. tasks.md 자동 생성 및 승인
5. 각 태스크 TDD 구현
6. 진행 상황 `.sdd/logs/YYYY-MM-DD.md`에 기록

아침에 일어나서 브리핑 요청:
```
/sdd:briefing
```

한 눈에 파악:
- ✅ 밤사이 완료된 작업
- ⚠️ 중단된 곳과 이유
- 🔜 지금 당장 해야 할 다음 액션

브리핑은 `.sdd/briefings/TIMESTAMP-briefing.md`에 자동 저장되어 나중에 찾아보기 좋음.

---

## Steering Trim 사용법

스티어링 파일이 100줄이 넘으면:

```
/sdd:steering-trim
```

- 100줄 넘는 파일 자동 감지
- 핵심 요약만 스티어링에 유지 (≤50줄)
- 상세 내용은 `.sdd/skills/<topic>-detail.md`로 이동
- 스티어링에 참조 링크 추가

---

## Reset 사용 시나리오

### 언제 사용하는가
- 요구사항이 크게 바뀌었을 때
- 아키텍처 전면 재설계 시
- 잘못된 방향으로 간 스펙을 초기화할 때

### 사용법
```
/sdd:spec-reset 001-my-feature
```

리셋 전에 AI가 자동으로 분석:
- ✅ **살릴 것**: 완료된 태스크, 여전히 유효한 요구사항, 재사용 가능한 설계
- ❌ **버릴 것**: 미완료 태스크, 방향이 바뀐 요구사항, 잘못된 아키텍처 결정

분석 결과 확인 후 아카이브 진행. 원본 삭제 없음 — 복원 가능.

스티어링도 함께 초기화:
```
/sdd:spec-reset 001-my-feature --steering
```

분석 없이 즉시 아카이브 (긴급 시):
```
/sdd:spec-reset 001-my-feature --skip-analysis
```

---

## 디렉토리 구조 (설치 후)

```
프로젝트/
├── CLAUDE.md                     # ≤50줄 부트스트랩
├── .claude/commands/sdd/         # 커맨드 (얇은 지시)
└── .sdd/
    ├── specs/1741834500-feature/    # TIMESTAMP-feature (UTC Unix epoch)
    ├── steering/                 # 프로젝트 메모리
    ├── skills/                   # 재사용 로직 (lazy-load)
    ├── logs/                     # 자동화 실행 로그
    ├── briefings/                # 브리핑 기록 (TIMESTAMP-briefing.md)
    ├── archive/                  # 아카이브된 스펙
    └── settings/                 # 템플릿, 규칙
```

---

## 커맨드 레퍼런스

| 커맨드 | 설명 |
|--------|------|
| `/sdd:spec-plan <설명>` | 풀 플랜 자동 생성 (req+design+tasks) |
| `/sdd:spec-auto <설명>` | 완전 자동 구현 (overnight용) |
| `/sdd:spec-init <설명>` | 스펙 구조만 초기화 |
| `/sdd:spec-requirements <feature>` | 요구사항 생성 |
| `/sdd:spec-design <feature>` | 설계 문서 생성 |
| `/sdd:spec-tasks <feature>` | 태스크 목록 생성 |
| `/sdd:spec-impl <feature> [task]` | TDD 구현 |
| `/sdd:spec-status [feature]` | 진행 상황 확인 |
| `/sdd:briefing [--since N]` | 작업 브리핑 (overnight 후 현황 파악) |
| `/sdd:spec-reset [feature]` | 아카이브 및 초기화 |
| `/sdd:steering` | 스티어링 생성/업데이트 |
| `/sdd:steering-trim [file]` | 긴 스티어링 분리 |
