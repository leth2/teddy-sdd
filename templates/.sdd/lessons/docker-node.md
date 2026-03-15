
## [D05] cline ~/.cline 볼륨 마운트 — 절대경로 + 쓰기 허용 필수

**증상:** `Authentication required` (-32000) 또는 cline 프로세스 즉시 종료

**원인:**
1. `~/.cline` → docker compose에서 `~` 확장 안 됨 (빈 경로 또는 오류)
2. `:ro` (읽기 전용) → cline이 내부 상태 파일 쓰기 실패

**체크:**
- `CLINE_DIR` 환경변수에 절대경로 설정 여부
- `:ro` 플래그 유무

**수정:**
```yaml
# 틀림
- ~/.cline:/root/.cline:ro
# 맞음
- /home/USERNAME/.cline:/root/.cline   # 절대경로, :ro 없음
```
