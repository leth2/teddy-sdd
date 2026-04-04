# /sdd:prototype

requirements.md의 요구사항을 읽어 HTML UI 프로토타입을 자동 생성하는 커맨드.

## 전제 조건

- Slop Score ≥ 70 (spec-validator 통과)
- `requirements.md` 존재

## 실행 흐름

```
1. requirements.md 읽기
2. EARS WHEN/THEN 패턴에서 화면 흐름 추출
3. LLM(Gemini/Claude)으로 HTML 프로토타입 생성
4. .sdd/prototypes/{날짜}-{feature}.html 저장
5. 브라우저로 열기 (open 명령)
```

## 사용법

```bash
# Claude Code에서 실행
/sdd:prototype

# 또는 직접
node skills/prototype/prototype-gen.js \
  --spec .sdd/specs/auth/requirements.md \
  --output .sdd/prototypes/
```

## 출력 예시

```html
<!-- .sdd/prototypes/2026-04-04-auth.html -->
<!DOCTYPE html>
<html>
<head><title>auth — 프로토타입</title></head>
<body>
  <!-- REQ-001: 로그인 화면 -->
  <form id="login">
    <input type="email" placeholder="이메일" />
    <input type="password" placeholder="비밀번호" />
    <button>로그인</button>
    <p class="error" hidden>자격증명이 올바르지 않습니다.</p>
  </form>
  ...
</body>
</html>
```

## API 선택

| 옵션 | 비고 |
|------|------|
| Claude (cc-proxy) | 현재 인프라 재사용 가능, HTML 품질 우수 |
| Gemini API | 별도 키 필요 |
| Google Stitch | API 미공개, 보류 |

**현재 구현: Claude (cc-proxy)** — 별도 키 없이 기존 인프라 활용.

## prototype-gen.js 실행 예시

```
📐 프로토타입 생성 시작
  스펙: .sdd/specs/auth/requirements.md
  화면 흐름 감지: 3개
    - 로그인 화면 (REQ-001, REQ-002)
    - 비밀번호 재설정 화면 (REQ-005)
    - 토큰 만료 처리 (REQ-002)

✅ 프로토타입 저장: .sdd/prototypes/2026-04-04-auth.html
   브라우저로 열기: open .sdd/prototypes/2026-04-04-auth.html
```
