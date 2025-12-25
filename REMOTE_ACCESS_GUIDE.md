# 🌐 원격 접속 가이드

회사, 집, 어디서나 접속 가능하도록 만드는 방법

---

## 📋 목차

1. [ngrok 방식 (가장 쉬움! 추천)](#1-ngrok-방식-추천)
2. [Cloudflare Tunnel (더 안정적)](#2-cloudflare-tunnel)
3. [권한 관리](#3-권한-관리)

---

## 1. ngrok 방식 (추천! ⭐)

**장점:**
- ✅ 5분 만에 설치 완료
- ✅ 완전 무료
- ✅ 설정 간단
- ✅ 즉시 사용 가능

**단점:**
- URL이 매번 바뀜 (무료 플랜)
- 컴퓨터가 켜져 있어야 함

---

### Step 1: ngrok 다운로드

1. https://ngrok.com 접속
2. **Sign up** 클릭 (GitHub 계정으로 가능)
3. 로그인 후 **Download** 클릭
4. Windows 버전 다운로드

---

### Step 2: ngrok 설치

1. 다운로드한 `ngrok.zip` 압축 풀기
2. 원하는 폴더에 저장 (예: `C:\ngrok\`)
3. ngrok 대시보드에서 **Authtoken** 복사
4. PowerShell 열고:

```powershell
cd C:\ngrok
.\ngrok config add-authtoken YOUR_AUTH_TOKEN
```

---

### Step 3: 서버 실행 + ngrok 실행

**터미널 1 (서버):**
```powershell
cd "C:\Users\Work\Desktop\HMOA CSS\HMOA-CSS-PROJECT-main"
npm run dev
```

**터미널 2 (ngrok):**
```powershell
cd C:\ngrok
.\ngrok http 3000
```

---

### Step 4: URL 확인 및 공유

ngrok 실행 후 나타나는 URL:
```
Forwarding    https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

**이 URL을 팀원들에게 공유하세요!** ✅

---

### Step 5: 매번 시작하는 방법

1. PowerShell 1: `npm run dev`
2. PowerShell 2: `.\ngrok http 3000`
3. 새 URL을 팀원들에게 공유

---

## 2. Cloudflare Tunnel

**장점:**
- ✅ 고정 도메인 사용 가능
- ✅ 무료
- ✅ 더 안정적

**단점:**
- 초기 설정 복잡

---

### Step 1: Cloudflare 계정

1. https://dash.cloudflare.com/sign-up
2. 무료 계정 생성

---

### Step 2: Cloudflared 설치

```powershell
# 관리자 권한 PowerShell
winget install --id Cloudflare.cloudflared
```

또는 직접 다운로드:
https://github.com/cloudflare/cloudflared/releases/latest

---

### Step 3: 로그인

```powershell
cloudflared tunnel login
```

브라우저에서 권한 허용

---

### Step 4: 터널 생성

```powershell
cloudflared tunnel create hmoa-css
```

---

### Step 5: 설정 파일

`C:\Users\Work\.cloudflared\config.yml` 생성:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: C:\Users\Work\.cloudflared\YOUR_TUNNEL_ID.json

ingress:
  - hostname: hmoa-css.cfargotunnel.com
    service: http://localhost:3000
  - service: http_status:404
```

---

### Step 6: DNS 설정

```powershell
cloudflared tunnel route dns hmoa-css hmoa-css.cfargotunnel.com
```

---

### Step 7: 실행

**터미널 1:**
```powershell
npm run dev
```

**터미널 2:**
```powershell
cloudflared tunnel run hmoa-css
```

---

## 3. 권한 관리

### 관리자 모드

- **비밀번호:** `admin1234` (변경 가능)
- **기능:**
  - ✅ 시공내역 등록/수정/삭제
  - ✅ 정산 관리
  - ✅ 모든 기능 접근

### 조회 모드 (팀원용)

- **비밀번호 없음** (조회모드로 입장 클릭)
- **기능:**
  - ✅ 대시보드 조회
  - ✅ 월간 스케줄 조회
  - ❌ 수정/삭제 불가

---

## 4. 비밀번호 변경

`src/components/LoginModal.jsx` 파일 열기:

```javascript
// 이 부분 수정
if (password === 'admin1234') {  // ← 원하는 비밀번호로 변경
  onLogin('admin');
}
```

---

## 5. 자주 묻는 질문

### Q: ngrok URL이 매번 바뀌는데요?

A: 무료 플랜의 제한입니다. 고정 URL이 필요하면:
- ngrok Pro 구독 ($10/월)
- 또는 Cloudflare Tunnel 사용

---

### Q: 컴퓨터를 끄면 접속이 안 돼요

A: 서버가 여러분 컴퓨터에서 실행되므로 컴퓨터가 켜져 있어야 합니다.
- 24시간 접속이 필요하면 클라우드 서버 배포 필요

---

### Q: 모바일에서도 접속 가능한가요?

A: 네! ngrok/Cloudflare URL을 스마트폰 브라우저에서 열면 됩니다.

---

## 6. 추천 워크플로우

### 집/회사 컴퓨터에서:

1. 출근 시 또는 작업 시작 시:
   ```powershell
   cd "프로젝트폴더"
   npm run dev
   ```

2. 다른 PowerShell 창:
   ```powershell
   cd C:\ngrok
   .\ngrok http 3000
   ```

3. ngrok URL을 팀 메신저에 공유

4. 퇴근 시:
   - 두 PowerShell 창에서 `Ctrl + C`
   - PowerShell 닫기

---

## 7. 보안 팁

- ✅ 관리자 비밀번호는 정기적으로 변경
- ✅ ngrok URL은 팀원들에게만 공유
- ✅ 중요 데이터는 정기적으로 백업
  ```powershell
  Copy-Item "server\construction.db" "backup-$(Get-Date -Format 'yyyy-MM-dd').db"
  ```

---

## 8. 문제 해결

### ngrok: "tunnel session failed"
```powershell
# Authtoken 재설정
.\ngrok config add-authtoken YOUR_TOKEN
```

### Cloudflared: "tunnel not found"
```powershell
# 터널 목록 확인
cloudflared tunnel list
```

### 접속 안 됨
- PowerShell에서 서버 실행 중인지 확인
- 방화벽 설정 확인
- URL 정확히 입력했는지 확인

---

## 9. 비용 비교

| 방식 | 비용 | 안정성 | 설정 난이도 |
|------|------|--------|-------------|
| ngrok (무료) | 무료 | ⭐⭐⭐ | ⭐ (쉬움) |
| ngrok Pro | $10/월 | ⭐⭐⭐⭐ | ⭐ (쉬움) |
| Cloudflare Tunnel | 무료 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ (보통) |
| 클라우드 배포 | $5~20/월 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ (복잡) |

---

**추천:** 먼저 ngrok으로 시작하고, 안정성이 필요하면 Cloudflare Tunnel로 전환!
