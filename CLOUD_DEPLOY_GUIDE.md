# 🌐 클라우드 배포 가이드 (PowerShell 없이!)

**24시간 접속 가능, 컴퓨터 꺼도 OK!**

---

## 🎯 목표

- ✅ 컴퓨터 끄고도 접속 가능
- ✅ 집, 회사, 스마트폰 어디서나 접속
- ✅ PowerShell 없이도 작동
- ✅ 무료 배포

---

## 🌟 추천: Render.com (무료!)

**가장 쉽고 무료인 방법입니다!**

---

## 📋 준비물

1. ✅ GitHub 계정
2. ✅ Render 계정 (GitHub으로 가입)
3. ✅ 이 프로젝트 (이미 GitHub에 있음!)

---

## 🚀 Render 배포 (10분 완료!)

### **Step 1: Render 회원가입**

1. https://render.com 접속
2. **"Get Started for Free"** 클릭
3. **"GitHub"** 버튼으로 회원가입
4. GitHub 연동 허용

---

### **Step 2: 저장소 연결**

1. Render 대시보드 → **"New +"** 클릭
2. **"Web Service"** 선택
3. **"Connect a repository"** 클릭
4. **"HMOA-CSS-PROJECT"** 찾기
5. **"Connect"** 클릭

---

### **Step 3: 배포 설정**

#### **기본 설정:**

**Name:**
```
hmoa-css-system
```
(원하는 이름으로 변경 가능)

**Region:**
```
Singapore
```
(한국과 가장 가까움)

**Branch:**
```
main
```

**Root Directory:**
```
(비워두기)
```

**Runtime:**
```
Node
```

---

#### **Build & Deploy:**

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Instance Type:**
```
Free
```

---

#### **Environment Variables (환경 변수):**

**"Add Environment Variable"** 클릭:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |

---

### **Step 4: 배포 시작!**

**"Create Web Service"** 클릭!

---

### **Step 5: 배포 진행 확인**

**배포 로그 확인:**
```
==> Building...
==> Installing dependencies...
==> Building frontend...
==> Deploy successful! ✅
```

**소요 시간:** 5~10분

---

### **Step 6: URL 확인**

배포 완료 후 상단에 URL 표시:
```
https://hmoa-css-system.onrender.com
```

**이 URL을 모두에게 공유하세요!** 🎉

---

## 🎊 완료!

이제:
- ✅ 컴퓨터 꺼도 접속 가능!
- ✅ 어디서든 접속 가능!
- ✅ PowerShell 필요 없음!
- ✅ 24시간 작동!

---

## 📱 접속 방법

### **관리자:**
1. `https://hmoa-css-system.onrender.com` 접속
2. 비밀번호: `admin1234`
3. 모든 기능 사용

### **팀원:**
1. 같은 URL 접속
2. "조회 모드로 입장" 클릭
3. 스케줄 확인

---

## ⚠️ 무료 플랜 제한사항

### **슬립 모드:**
- 15분 동안 접속이 없으면 **슬립 모드**로 전환
- 다음 접속 시 **15~30초** 정도 깨어나는 시간 필요
- 이후 정상 속도로 작동

### **해결 방법:**
1. **무료 방법:** 자주 접속하기
2. **유료 방법:** Render Pro ($7/월) - 슬립 모드 없음

---

## 💾 데이터 관리

### **데이터 저장 위치:**

**Render 서버에 자동 저장됨!**
- 파일: `server/construction.db`
- Render 서버의 디스크에 저장

### **⚠️ 중요:**

무료 플랜에서는 배포할 때마다 데이터가 **초기화**됩니다!

**해결 방법:**
1. PostgreSQL 데이터베이스 사용 (추가 설정 필요)
2. 또는 로컬에서 백업 후 복원

---

## 🔄 업데이트 방법

### **자동 배포 (추천):**

GitHub에 코드를 푸시하면 **자동으로 재배포**됩니다!

```powershell
# 로컬에서 수정 후
git add .
git commit -m "업데이트 내용"
git push origin main
```

Render가 자동으로 감지하고 재배포!

---

### **수동 배포:**

Render 대시보드 → **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🆚 다른 클라우드 비교

| 서비스 | 무료 플랜 | 슬립 모드 | 데이터 유지 | 난이도 |
|--------|-----------|-----------|-------------|---------|
| **Render** | ✅ | ⚠️ 15분 후 | ❌ | ⭐ 쉬움 |
| **Railway** | $5 크레딧 | ❌ | ✅ | ⭐⭐ 보통 |
| **Fly.io** | ✅ | ❌ | ✅ | ⭐⭐⭐ 복잡 |
| **Heroku** | ❌ (유료) | ❌ | ✅ | ⭐ 쉬움 |

---

## 💡 데이터 영구 저장 (고급)

무료로 데이터를 영구 저장하려면:

### **옵션 1: Render PostgreSQL (무료)**

1. Render 대시보드 → **"New +"** → **"PostgreSQL"**
2. 무료 플랜 선택
3. 데이터베이스 생성
4. SQLite 대신 PostgreSQL 사용

**필요한 수정:**
- `sqlite3` → `pg` (PostgreSQL 라이브러리)
- 데이터베이스 코드 수정

---

### **옵션 2: Supabase (무료)**

1. https://supabase.com 가입
2. PostgreSQL 데이터베이스 무료 제공
3. 연결 정보 복사
4. Render 환경 변수에 추가

---

## 🔧 문제 해결

### **배포 실패:**

**Build Command 확인:**
```bash
npm install && npm run build
```

**Start Command 확인:**
```bash
npm start
```

**Logs 확인:**
Render 대시보드 → **"Logs"** 탭

---

### **슬립 모드에서 깨어나지 않음:**

1. Render 대시보드에서 **"Restart"** 클릭
2. 로그 확인

---

### **데이터가 사라짐:**

무료 플랜의 한계입니다. 해결 방법:
1. PostgreSQL 사용
2. 또는 로컬에서 정기 백업

---

## 🎯 추천 워크플로우

### **개발 환경 (로컬):**

집이나 회사에서 작업:
```powershell
npm run dev
```
- 빠른 개발
- 즉시 테스트

---

### **프로덕션 환경 (클라우드):**

Render에 배포:
```
https://hmoa-css-system.onrender.com
```
- 팀원과 공유
- 어디서든 접속
- 24시간 작동

---

## 📊 비용 비교

| 방식 | 비용 | 접속성 | 데이터 | 관리 |
|------|------|--------|--------|------|
| 로컬 (PowerShell) | 무료 | 집 PC만 | ✅ 안전 | 쉬움 |
| ngrok | 무료 | 어디서나 | ✅ 안전 | 중간 |
| Render 무료 | 무료 | 어디서나 | ⚠️ 제한 | 쉬움 |
| Render Pro | $7/월 | 어디서나 | ✅ 안전 | 쉬움 |

---

## 🎁 보너스 팁

### **커스텀 도메인:**

Render Pro에서 제공:
```
hmoa-css.com → https://hmoa-css-system.onrender.com
```

---

### **알림 설정:**

Render 대시보드 → **"Notifications"**
- 이메일 알림
- Slack 연동

---

## 🎊 지금 바로 시작!

1. ✅ https://render.com 가입
2. ✅ GitHub 저장소 연결
3. ✅ 배포 설정 (10분)
4. ✅ URL 확인 및 공유
5. ✅ 완료! 🎉

---

**궁금한 점이 있으면 언제든 물어보세요!** 😊
