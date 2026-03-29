# 🏠 다른 PC에서 해모아 시공관리 시스템 실행하기

## 📋 **목차**
1. [GitHub에서 코드 받기](#1-github에서-코드-받기)
2. [프로그램 설치](#2-프로그램-설치)
3. [프로젝트 실행](#3-프로젝트-실행)
4. [데이터베이스 백업/복구](#4-데이터베이스-백업복구)
5. [문제 해결](#5-문제-해결)

---

## 1. GitHub에서 코드 받기

### 방법 1: Git Clone (추천)
```bash
# Git이 설치되어 있는 경우
git clone https://github.com/giguestar/HMOA-CSS-PROJECT.git
cd HMOA-CSS-PROJECT
git checkout genspark_ai_developer
```

### 방법 2: ZIP 다운로드
1. GitHub 페이지 방문: https://github.com/giguestar/HMOA-CSS-PROJECT
2. 우측 상단 **Code** 버튼 클릭
3. **Download ZIP** 클릭
4. 압축 해제

---

## 2. 프로그램 설치

### ✅ **필수 프로그램**:

#### 1) Node.js (v18 이상)
- **다운로드**: https://nodejs.org/ko
- **설치 확인**:
  ```bash
  node --version
  npm --version
  ```

#### 2) Git (선택사항)
- **다운로드**: https://git-scm.com/downloads

---

## 3. 프로젝트 실행

### 📦 **패키지 설치**
```bash
# 프로젝트 폴더로 이동
cd HMOA-CSS-PROJECT

# 의존성 패키지 설치
npm install
```

### 🚀 **개발 서버 실행**
```bash
npm run dev
```

### 🌐 **브라우저에서 열기**
```
http://localhost:3000
```

### 👤 **로그인 계정**
- **관리자**: `admin` / `admin1234`
- **매니저**: `lee` / `l1234`, `jung` / `j1234`, `kim` / `k1234`

---

## 4. 데이터베이스 백업/복구

### 📦 **백업 방법**

#### 방법 1: 대시보드에서 백업 (추천)
1. **로그인** → **대시보드** 페이지
2. 우측 상단 **📦 백업** 버튼 클릭
3. `construction_backup_YYYY-MM-DD.db` 파일 다운로드

#### 방법 2: 수동 백업
```bash
# server/construction.db 파일을 복사
cp server/construction.db backups/construction_backup_$(date +%Y%m%d).db
```

---

### 🔄 **복구 방법**

#### 방법 1: 대시보드에서 복구 (추천)
1. **로그인** → **대시보드** 페이지
2. 우측 상단 **🔄 복구** 버튼 클릭
3. 백업 파일(`.db`) 선택
4. 확인 후 페이지 자동 새로고침

#### 방법 2: 수동 복구
```bash
# 기존 DB 백업 (안전을 위해)
cp server/construction.db server/construction_before_restore.db

# 백업 파일로 교체
cp backups/construction_backup_YYYYMMDD.db server/construction.db

# 서버 재시작
npm run dev
```

---

## 5. 문제 해결

### ❌ **포트 충돌 오류**
```bash
# 포트 5000이 이미 사용중인 경우
# server/index.js 파일 수정:
const PORT = process.env.PORT || 5001; // 다른 포트로 변경
```

### ❌ **npm install 실패**
```bash
# npm 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### ❌ **데이터베이스 오류**
```bash
# DB 파일 삭제 후 자동 재생성
rm server/construction.db
npm run dev
```

### ❌ **로그인 모달이 안 보임**
- **브라우저 캐시 삭제**: Ctrl + Shift + Delete
- **시크릿 모드**: Ctrl + Shift + N (Chrome)

---

## 6. 네트워크로 다른 PC에서 접속

### 📱 **같은 네트워크에서 접속 (스마트폰/태블릿)**

#### 1) 내 IP 주소 확인
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

예시: `192.168.0.100`

#### 2) 서버 실행 시 외부 접속 허용
```bash
npm run dev
```
서버는 기본적으로 `0.0.0.0`에서 실행되므로 같은 네트워크에서 접속 가능합니다.

#### 3) 다른 기기에서 접속
```
http://192.168.0.100:3000
```

---

## 7. 클라우드 배포 (어디서나 접속)

### 🌐 **Cloudflare Pages 배포**

#### 1) 빌드
```bash
npm run build
```

#### 2) Cloudflare Pages 연동
1. Cloudflare Pages 접속: https://pages.cloudflare.com/
2. GitHub 저장소 연결
3. 빌드 설정:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 배포 완료!

---

## 8. 자주 묻는 질문 (FAQ)

### Q1: 집 PC와 회사 PC에서 데이터를 동기화하려면?
**A**: 
1. 집 PC에서 **📦 백업** 클릭 → `.db` 파일 다운로드
2. USB/이메일/클라우드로 회사 PC에 전송
3. 회사 PC에서 **🔄 복구** 클릭 → 백업 파일 선택

### Q2: GitHub에서 최신 코드를 받으려면?
```bash
git pull origin genspark_ai_developer
npm install
npm run dev
```

### Q3: 데이터베이스는 어디에 저장되나요?
```
server/construction.db
```

### Q4: 백업 파일은 자동으로 생성되나요?
- 복구 시 기존 DB는 자동으로 백업됩니다
- 정기 백업은 수동으로 해야 합니다

---

## 📞 **지원**

문제가 발생하면:
1. **에러 메시지 캡처**
2. **브라우저 콘솔 확인** (F12)
3. **GitHub Issues** 등록

---

## 📝 **버전 정보**
- **Node.js**: v18+
- **React**: v18
- **Vite**: v5
- **SQLite3**: Better-SQLite3
- **Express**: v4

---

**작성일**: 2026-01-02  
**작성자**: Genspark AI Developer  
**버전**: v3.0.0
