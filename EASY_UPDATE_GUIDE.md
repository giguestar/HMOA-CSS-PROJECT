# 🔄 초간단 업데이트 가이드

> **처음 하시는 분도 5분이면 완료!**  
> 하나씩 천천히 따라하시면 됩니다 😊

---

## 📥 Step 1: 최신 버전 다운로드

### 1-1. GitHub에서 다운로드

1. **다운로드 링크 클릭**  
   👉 https://github.com/giguestar/HMOA-CSS-PROJECT/archive/refs/heads/main.zip

2. **다운로드 폴더 확인**  
   - 보통 `다운로드` 폴더에 `HMOA-CSS-PROJECT-main.zip` 파일이 생깁니다

3. **ZIP 파일 압축 해제**  
   - `HMOA-CSS-PROJECT-main.zip` 파일 **우클릭**
   - **"압축 풀기"** 또는 **"Extract All"** 선택
   - 압축을 풀면 `HMOA-CSS-PROJECT-main` 폴더가 생깁니다

---

## 📁 Step 2: 기존 폴더에 덮어쓰기

### 2-1. 데이터베이스 백업 (중요! ⚠️)

**기존 데이터를 잃지 않으려면 꼭 백업하세요!**

1. **기존 프로젝트 폴더로 이동**  
   ```
   C:\Users\Work\Desktop\HMOA CSS\HMOA-CSS-PROJECT-main
   ```

2. **`server` 폴더 안에 있는 `construction.db` 파일 찾기**

3. **`construction.db` 파일 복사**  
   - `construction.db` 파일 **우클릭** → **복사**
   - 바탕화면이나 다른 곳에 **붙여넣기**
   - 파일 이름을 `construction_backup_20251226.db`로 변경

### 2-2. 파일 덮어쓰기

1. **다운로드한 새 폴더 열기**  
   - `다운로드` 폴더의 `HMOA-CSS-PROJECT-main` 폴더 열기

2. **모든 파일 선택**  
   - `Ctrl + A` 키를 눌러서 모든 파일 선택

3. **파일 복사**  
   - `Ctrl + C` 키로 복사

4. **기존 프로젝트 폴더로 이동**  
   ```
   C:\Users\Work\Desktop\HMOA CSS\HMOA-CSS-PROJECT-main
   ```

5. **파일 붙여넣기**  
   - `Ctrl + V` 키로 붙여넣기
   - **"파일 바꾸기"** 또는 **"Replace"** 선택
   - 모든 파일 덮어쓰기

6. **데이터베이스 복원**  
   - 백업한 `construction_backup_20251226.db` 파일을
   - `server` 폴더에 복사
   - 이름을 `construction.db`로 변경 (기존 파일 덮어쓰기)

---

## 💻 Step 3: PowerShell 열기

### 3-1. PowerShell 실행

**방법 1: 폴더에서 직접 열기 (추천! ⭐)**

1. **프로젝트 폴더 열기**  
   ```
   C:\Users\Work\Desktop\HMOA CSS\HMOA-CSS-PROJECT-main
   ```

2. **주소창 클릭**  
   - 폴더 창 위쪽 주소창을 클릭

3. **`powershell` 입력**  
   - 주소창에 `powershell` 타이핑하고 **Enter**
   - PowerShell이 해당 폴더에서 바로 열립니다!

**방법 2: 시작 메뉴에서 열기**

1. **시작 메뉴 열기** (Windows 키)

2. **`PowerShell` 검색**  
   - "Windows PowerShell" 클릭

3. **프로젝트 폴더로 이동**  
   ```powershell
   cd "C:\Users\Work\Desktop\HMOA CSS\HMOA-CSS-PROJECT-main"
   ```
   - 위 명령어를 **복사해서 붙여넣기** (우클릭 → 붙여넣기)
   - **Enter** 키 누르기

### 3-2. 폴더 위치 확인

PowerShell에서 현재 위치가 맞는지 확인:

```powershell
pwd
```

**출력 결과:**
```
Path
----
C:\Users\Work\Desktop\HMOA CSS\HMOA-CSS-PROJECT-main
```

위처럼 나오면 정상입니다! ✅

---

## 📦 Step 4: 라이브러리 설치

### 4-1. npm install 실행

PowerShell에 아래 명령어 입력:

```powershell
npm install
```

**Enter** 키를 누르세요!

### 4-2. 설치 진행 확인

- 화면에 많은 텍스트가 지나갑니다 (정상입니다!)
- 2~3분 정도 기다리면 됩니다 ⏳

### 4-3. 설치 완료 확인

```
added 324 packages, and audited 325 packages in 2m
```

위와 같은 메시지가 나오면 설치 완료! ✅

---

## 🗄️ Step 5: 데이터베이스 마이그레이션 (선택사항)

> **주의**: 백업한 데이터베이스를 복원했다면 이 단계는 **건너뛰세요**!

새로운 데이터베이스 구조가 추가되었을 때만 실행:

```powershell
node migrate_db.js
```

**출력 결과:**
```
✅ Migration completed successfully!
```

---

## 🚀 Step 6: 서버 실행

### 6-1. 서버 시작

PowerShell에 아래 명령어 입력:

```powershell
npm run dev
```

**Enter** 키를 누르세요!

### 6-2. 서버 시작 확인

화면에 아래와 같은 메시지가 나오면 성공! 🎉

```
✅ Database initialized successfully!

🚀 Server running on http://0.0.0.0:5000
📊 API: http://0.0.0.0:5000/api
💚 Health: http://0.0.0.0:5000/health
🌍 Mode: Development

  VITE v5.4.21  ready in 218 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.0.21:3000/
```

---

## 🌐 Step 7: 브라우저 접속

### 7-1. 브라우저 열기

1. **크롬(Chrome) 또는 엣지(Edge) 브라우저** 열기

2. **주소창에 입력:**  
   ```
   http://localhost:3000
   ```

3. **Enter** 키 누르기

### 7-2. 접속 확인

- 샷시시공 관리 시스템 화면이 나오면 성공! ✅
- 로그인 화면이 나올 수 있습니다 (정상입니다)

---

## 🎯 Step 8: 업데이트 확인

### 8-1. 스케줄 달력 확인

1. **좌측 메뉴에서 "월간 스케줄" 클릭**

2. **새로운 UI 확인:**
   - ✅ 업체 색상 아이콘 (LX, 케스, 청암 등)
   - ✅ 주소 3단계 분리 (앞2단어 / 아파트명 / 동호수)
   - ✅ 비거주 (비) 파랑 표시
   - ✅ 팀/장비 색상 구분 (녹색/빨강/파랑/보라)

3. **테스트:**
   - "시공내역 등록" 메뉴에서 새 시공 내역 추가
   - "월간 스케줄"로 돌아가서 자동 생성 확인

---

## ❌ 서버 종료 방법

작업을 마치고 서버를 끄고 싶을 때:

1. **PowerShell 창 활성화**

2. **`Ctrl + C` 키를 누르기**

3. **"일괄 작업을 끝내시겠습니까?" 나오면 `Y` 입력 후 Enter**

---

## 🆘 문제 해결 (Troubleshooting)

### ❗ "npm을 찾을 수 없습니다" 에러

**해결 방법:**
1. Node.js가 설치되어 있는지 확인
2. 설치 안 되어 있으면: https://nodejs.org/ko 에서 다운로드
3. LTS 버전 (왼쪽 버튼) 설치
4. 설치 후 PowerShell 재시작

### ❗ "포트 3000이 이미 사용 중" 에러

**해결 방법:**
1. 이미 서버가 실행 중일 수 있습니다
2. 기존 PowerShell 창을 찾아서 `Ctrl + C`로 종료
3. 다시 `npm run dev` 실행

### ❗ 화면이 안 나와요

**해결 방법 1: 브라우저 캐시 삭제**
1. `Ctrl + Shift + Delete` 키 누르기
2. "캐시된 이미지 및 파일" 체크
3. "데이터 삭제" 클릭
4. 브라우저 새로고침 (`F5`)

**해결 방법 2: 시크릿 모드로 접속**
1. `Ctrl + Shift + N` (크롬) 또는 `Ctrl + Shift + P` (엣지)
2. 주소창에 `http://localhost:3000` 입력

### ❗ 데이터가 사라졌어요

**해결 방법:**
1. PowerShell에서 `Ctrl + C`로 서버 종료
2. 백업한 `construction_backup_20251226.db` 파일을
3. `server` 폴더에 복사
4. 이름을 `construction.db`로 변경
5. 다시 `npm run dev` 실행

---

## 📞 추가 도움이 필요하신가요?

- **GitHub Issues**: https://github.com/giguestar/HMOA-CSS-PROJECT/issues
- **문제가 생기면**: 에러 메시지를 스크린샷으로 남겨주세요!

---

## ✅ 업데이트 체크리스트

마지막으로 확인하세요:

- [ ] 데이터베이스 백업 완료
- [ ] 최신 파일 다운로드 및 덮어쓰기 완료
- [ ] `npm install` 실행 완료
- [ ] `npm run dev` 서버 실행 성공
- [ ] 브라우저 `http://localhost:3000` 접속 성공
- [ ] 스케줄 달력 새 UI 확인 완료

---

**🎉 축하합니다! 업데이트가 완료되었습니다!**

이제 새로운 스케줄 달력 기능을 마음껏 사용하세요! 😊

---

**Made with ❤️ by GenSpark AI Developer**
