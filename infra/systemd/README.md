# Systemd Timer: DB 자동 백업

## 설치 (프로덕션 서버)

```bash
# 유닛 파일 복사
sudo cp infra/systemd/mahjong-backup.service /etc/systemd/system/
sudo cp infra/systemd/mahjong-backup.timer /etc/systemd/system/

# 데몬 리로드 + 타이머 활성화
sudo systemctl daemon-reload
sudo systemctl enable --now mahjong-backup.timer
```

## 확인

```bash
# 타이머 상태
systemctl status mahjong-backup.timer

# 다음 실행 시간
systemctl list-timers mahjong-backup.timer

# 수동 실행 테스트
sudo systemctl start mahjong-backup.service
journalctl -u mahjong-backup.service --no-pager -n 20
```

## 설정

- **실행 시간**: 매일 04:00 (서버 로컬 시간)
- **백업 위치**: `~/mahjong-group-project/backups/`
- **보관 기간**: 7일 (변경: `backup_db.sh`의 `KEEP_DAYS`)
- **Persistent=true**: 서버 꺼져 있다가 켜지면 밀린 백업 즉시 실행

## 복원

```bash
# 백업 목록 확인
ls -lh backups/

# 복원 (확인 프롬프트 포함, 복원 전 자동 백업)
bash scripts/restore_db.sh backups/mahjong_20260303_040000.sql.gz

# 확인 없이 복원 (스크립트용)
SKIP_CONFIRM=1 bash scripts/restore_db.sh backups/mahjong_20260303_040000.sql.gz
```
