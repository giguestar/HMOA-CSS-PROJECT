# ⚡ 빠른 업데이트 가이드 (5분 완성)

> **급하신 분을 위한 최소 단계 가이드**

---

## 🎯 요약 (4단계만 하면 끝!)

```
1. 다운로드 → 2. 덮어쓰기 → 3. npm install → 4. npm run dev
```

---

## 📥 1단계: 다운로드 (1분)

### 다운로드 링크 클릭:
👉 **https://github.com/giguestar/HMOA-CSS-PROJECT/archive/refs/heads/main.zip**

- 다운로드 폴더에서 압축 풀기 (`HMOA-CSS-PROJECT-main.zip` 우클릭 → 압축 풀기)

---

## 📁 2단계: 덮어쓰기 (2분)

### ⚠️ 먼저 백업!
```
C:\Users\Work\Desktop\HMOA CSS\HMOA-CSS-PROJECT-main\server\construction.db
```
위 파일을 바탕화면에 복사해두세요!

### 덮어쓰기
1. 다운로드한 폴더의 **모든 파일** 선택 (`Ctrl + A`)
2. 복사 (`Ctrl + C`)
3. 기존 폴더로 이동:
   ```
   C:\Users\Work\Desktop\HMOA CSS\HMOA-CSS-PROJECT-main
   ```
4. 붙여넣기 (`Ctrl + V`) → **"모두 바꾸기"** 클릭
5. 백업한 `construction.db` 파일을 `server` 폴더에 다시 복사

---

## 💻 3단계: 라이브러리 설치 (1분)

### PowerShell 열기
1. 프로젝트 폴더 열기
2. 주소창 클릭 → `powershell` 입력 → Enter

### 명령어 실행
```powershell
npm install
```

2~3분 기다리기 ⏳

---

## 🚀 4단계: 서버 실행 (30초)

### PowerShell에서 실행
```powershell
npm run dev
```

### 브라우저 접속
```
http://localhost:3000
```

---

## ✅ 완료!

스케줄 달력에서 새로운 UI를 확인하세요! 🎉

- 업체 색상 아이콘 (LX, 케스, 청암...)
- 주소 분리 표기
- 팀/장비 색상 구분

---

## 🆘 문제 발생시

### 에러가 나오면?
1. PowerShell 종료 (`Ctrl + C` → `Y` → Enter)
2. 다시 `npm run dev` 실행

### 데이터가 사라졌으면?
1. 백업한 `construction.db`를 `server` 폴더에 복사
2. 다시 `npm run dev` 실행

### 자세한 설명이 필요하면?
📖 **EASY_UPDATE_GUIDE.md** 파일을 읽어보세요!

---

**Made with ❤️ by GenSpark AI Developer**
