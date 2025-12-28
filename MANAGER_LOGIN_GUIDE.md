# 🚀 HMOA 매니저 로그인 시스템 - PowerShell 업데이트 가이드

## 📦 업데이트 내용

### ✨ 새로운 기능
- **매니저 로그인 시스템**: 이상무, 정호규, 김남군 계정 추가
- **실측 완료 체크**: 본인 담당 실측만 완료 가능
- **실측 달력 색상**: 완료된 건 옅은 회색 표시

### 🔐 계정 정보
| 사용자명 | 아이디 | 비밀번호 |
|---------|-------|---------|
| 관리자 | `admin` | `admin1234` |
| 이상무 | `lee` | `l1234` |
| 정호규 | `jung` | `j1234` |
| 김남군 | `kim` | `k1234` |

---

## 🖥️ PowerShell 자동 업데이트 방법

### 📋 사전 준비
- Windows PowerShell 또는 Windows Terminal
- 프로젝트 폴더: `C:\HMOA-CSS-PROJECT` (예시)

---

## 🔧 방법 1: 한 번에 자동 업데이트 (추천)

### PowerShell 스크립트 실행

PowerShell을 **관리자 권한**으로 실행한 후 아래 명령어를 한 줄씩 복사해서 붙여넣으세요:

```powershell
# 1. 프로젝트 폴더로 이동 (경로 수정 필요)
cd C:\HMOA-CSS-PROJECT

# 2. 현재 실행 중인 서버 종료 (Ctrl+C로도 가능)
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# 3. GitHub에서 최신 코드 다운로드
git fetch origin genspark_ai_developer
git checkout genspark_ai_developer
git pull origin genspark_ai_developer

# 4. 패키지 설치 (새로운 패키지: bcryptjs)
npm install

# 5. 사용자 마이그레이션 실행 (매니저 계정 생성)
node migrate_users.js

# 6. 서버 실행
npm run dev
```

---

## 🔧 방법 2: 단계별 수동 업데이트

### Step 1: 서버 중지
```powershell
# Ctrl+C를 누르거나 아래 명령어 실행
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
```

### Step 2: 최신 코드 가져오기
```powershell
cd C:\HMOA-CSS-PROJECT
git fetch origin genspark_ai_developer
git pull origin genspark_ai_developer
```

### Step 3: 패키지 설치
```powershell
npm install
```

**✅ 설치 확인:**
- `package.json`에 `bcryptjs` 패키지가 추가됩니다
- 설치 완료 메시지: `added X packages`

### Step 4: 사용자 마이그레이션
```powershell
node migrate_users.js
```

**✅ 성공 메시지:**
```
🔄 사용자 관리 시스템 마이그레이션 시작...
✅ users 테이블 생성 완료
✅ 이상무 (lee) - 계정 생성 완료
✅ 정호규 (jung) - 계정 생성 완료
✅ 김남군 (kim) - 계정 생성 완료

📋 현재 등록된 사용자 목록:
👑 관리자 (admin) - admin
👨‍💼 이상무 (lee) - manager
👨‍💼 정호규 (jung) - manager
👨‍💼 김남군 (kim) - manager

✨ 마이그레이션 완료!
```

### Step 5: 서버 재시작
```powershell
npm run dev
```

**✅ 서버 실행 확인:**
```
🚀 Server running on http://0.0.0.0:5000
📊 API: http://0.0.0.0:5000/api
💚 Health: http://0.0.0.0:5000/health
🌍 Mode: Development

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

### Step 6: 브라우저 테스트
1. **시크릿 모드** 열기: `Ctrl + Shift + N`
2. 접속: http://localhost:3000
3. 로그인 화면에서 **이상무** 계정 선택
4. 아이디: `lee`, 비밀번호: `l1234`
5. 로그인 성공! 🎉

---

## 🔧 방법 3: ZIP 파일로 수동 업데이트

### Step 1: 백업
```powershell
# 현재 프로젝트 백업
cd C:\
Compress-Archive -Path "C:\HMOA-CSS-PROJECT" -DestinationPath "C:\HMOA-CSS-PROJECT-백업-$(Get-Date -Format 'yyyy-MM-dd').zip"
```

### Step 2: ZIP 다운로드
- GitHub 다운로드: https://github.com/giguestar/HMOA-CSS-PROJECT/archive/refs/heads/genspark_ai_developer.zip
- 또는 첨부된 `HMOA-매니저로그인-시스템.zip` 사용

### Step 3: 압축 해제 및 덮어쓰기
```powershell
# ZIP 파일 압축 해제
Expand-Archive -Path "다운로드\HMOA-매니저로그인-시스템.zip" -DestinationPath "C:\HMOA-임시" -Force

# node_modules 제외하고 복사
Get-ChildItem "C:\HMOA-임시" -Exclude "node_modules" | Copy-Item -Destination "C:\HMOA-CSS-PROJECT" -Recurse -Force
```

### Step 4: 나머지 단계는 방법 2와 동일
```powershell
cd C:\HMOA-CSS-PROJECT
npm install
node migrate_users.js
npm run dev
```

---

## ❗ 문제 해결

### 1. "git: command not found" 오류
```powershell
# Git 설치 여부 확인
git --version

# Git이 없으면 다운로드: https://git-scm.com/download/win
```

### 2. "포트 3000이 이미 사용 중" 오류
```powershell
# 포트 3000 사용 중인 프로세스 종료
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# 또는 서버가 다른 포트로 자동 실행됩니다 (예: 3001, 3002)
```

### 3. "Cannot find module 'bcryptjs'" 오류
```powershell
# npm install 다시 실행
npm install

# 또는 bcryptjs만 설치
npm install bcryptjs
```

### 4. 서버 재시작이 필요한 경우
```powershell
# 모든 Node 프로세스 종료
taskkill /F /IM node.exe

# 서버 재시작
npm run dev
```

### 5. 캐시 문제로 로그인 화면이 안 보일 때
- **브라우저 캐시 삭제**: `Ctrl + Shift + Delete`
- **시크릿 모드**: `Ctrl + Shift + N`
- **강력 새로고침**: `Ctrl + F5`

---

## 🧪 업데이트 확인 체크리스트

- [ ] 서버가 정상적으로 실행됨
- [ ] 브라우저에서 http://localhost:3000 접속 가능
- [ ] 로그인 화면에 4개 계정 표시 (관리자, 이상무, 정호규, 김남군)
- [ ] 이상무 계정으로 로그인 (`lee` / `l1234`)
- [ ] 실측 관리 메뉴 접근 가능
- [ ] 실측 목록에 체크박스 표시됨
- [ ] 실측 달력에서 완료 건 옅은 회색으로 표시됨

---

## 📊 파일 구조 확인

업데이트 후 아래 파일들이 있어야 합니다:

```
C:\HMOA-CSS-PROJECT\
├── migrate_users.js          ⭐ 새 파일 (사용자 마이그레이션)
├── server/
│   ├── index.js              🔄 수정됨 (로그인 API 추가)
│   └── construction.db       📊 DB (자동 생성/업데이트)
├── src/
│   ├── components/
│   │   └── LoginModal.jsx    🔄 수정됨 (로그인 UI 개편)
│   ├── pages/
│   │   ├── MeasurementList.jsx       🔄 수정됨 (체크박스)
│   │   └── MeasurementSchedule.jsx   🔄 수정됨 (회색 표시)
│   └── App.jsx               🔄 수정됨 (사용자 상태)
├── package.json              🔄 수정됨 (bcryptjs 추가)
└── node_modules/
    └── bcryptjs/             ⭐ 새 패키지
```

---

## 🚀 업데이트 후 테스트

### 1. 로그인 테스트
```
✅ 이상무 (lee / l1234)로 로그인
✅ 정호규 (jung / j1234)로 로그인
✅ 김남군 (kim / k1234)로 로그인
```

### 2. 실측 완료 테스트
```
1) 이상무로 로그인
2) 📏 실측 관리 → 실측 목록
3) 이상무 담당 실측만 체크박스 활성화 확인
4) 체크박스 클릭 → 완료 처리
5) ✓ 이상무 표시 확인
```

### 3. 실측 달력 테스트
```
1) 📆 실측 달력 클릭
2) 완료된 건이 옅은 회색으로 표시되는지 확인
3) ✓완료 아이콘 확인
```

### 4. 권한 테스트
```
1) 정호규로 로그인
2) 이상무 담당 실측은 체크박스 비활성화 확인
3) 정호규 담당 실측만 완료 가능
```

---

## 💡 PowerShell 팁

### 빠른 명령어 모음
```powershell
# 프로젝트 폴더로 빠르게 이동
Set-Location C:\HMOA-CSS-PROJECT

# 별칭 설정 (한 번만 실행)
Set-Alias hmoa "Set-Location C:\HMOA-CSS-PROJECT"

# 이후 'hmoa' 명령으로 이동 가능
hmoa

# 서버 실행 단축 명령
function Start-HMOA { cd C:\HMOA-CSS-PROJECT; npm run dev }

# 사용: Start-HMOA
```

### PowerShell 프로필에 저장 (선택사항)
```powershell
# PowerShell 프로필 열기
notepad $PROFILE

# 아래 내용 추가
function Start-HMOA {
    Set-Location C:\HMOA-CSS-PROJECT
    npm run dev
}

function Update-HMOA {
    Set-Location C:\HMOA-CSS-PROJECT
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    git pull origin genspark_ai_developer
    npm install
    node migrate_users.js
    npm run dev
}

# 저장 후 재시작
# 이후 'Start-HMOA' 또는 'Update-HMOA' 명령으로 실행
```

---

## 📞 추가 도움말

### Git 명령어 참고
```powershell
# 현재 브랜치 확인
git branch

# 변경사항 확인
git status

# 로그 확인
git log --oneline -5

# 원격 저장소 정보
git remote -v
```

### npm 명령어 참고
```powershell
# 패키지 목록 확인
npm list --depth=0

# 캐시 정리
npm cache clean --force

# 개발 서버만 실행
npm run client

# API 서버만 실행
npm run server
```

---

## ✅ 완료!

PowerShell로 업데이트가 완료되었습니다! 🎉

**접속 URL**: http://localhost:3000

**계정 정보**:
- 이상무: `lee` / `l1234`
- 정호규: `jung` / `j1234`
- 김남군: `kim` / `k1234`

추가 질문이나 문제가 있으면 말씀해주세요! 💪
