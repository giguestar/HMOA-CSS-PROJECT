# 🚀 HMOA-CSS-PROJECT 시스템 업데이트 가이드
**업데이트 날짜**: 2025년 12월 27일  
**버전**: genspark_ai_developer 브랜치 (최신)

---

## 📦 이번 업데이트 내용

### ✨ 신규 기능
1. **비거주 아이콘 개선** (최신!)
   - 파란 동그라미 이모지(🔵) → 커스텀 PNG 이미지로 변경
   - 파란 테두리에 "비" 글자가 있는 전문적인 디자인
   - 달력 본문과 범례 모두 적용

2. **스케줄 달력 완전 개선**
   - 업체별 색상 아이콘 시스템
   - 주소 3단계 분리 표기 (시/구 / 아파트명 / 동/호)
   - 팀/철거/장비 색상 구분 강화
   - 평일/주말 차등 표시

3. **3블럭 관리 시스템**
   - 휴가자 관리 (녹색)
   - 일당인원 관리 (보라색)
   - 쉬는팀 관리 (파란색)
   - 날짜 옆에 배치되어 한눈에 확인 가능

### 📁 새로 추가된 파일
- `src/assets/non-resident-icon.png` - 비거주 아이콘 이미지

---

## 🔧 업데이트 방법 (단계별)

### **Step 1: 서버 중지** ⏸️

**Windows 사용자:**
```
Ctrl + C
```

**macOS/Linux 사용자:**
```
Ctrl + C
```

> 💡 **팁**: 현재 실행 중인 `npm run dev` 서버를 중지합니다.

---

### **Step 2: 파일 다운로드** 📥

**다운로드 링크:**
```
https://github.com/giguestar/HMOA-CSS-PROJECT/archive/refs/heads/genspark_ai_developer.zip
```

**또는 첨부된 ZIP 파일 사용:**
- `HMOA-CSS-PROJECT-genspark_ai_developer.zip` (109 KB)

---

### **Step 3: 덮어쓰기** 📝

1. **다운로드 → 압축 해제**
   - ZIP 파일을 다운로드 폴더에서 압축 해제
   
2. **모든 파일 복사**
   - 압축 해제된 폴더 안의 **모든 파일**을 선택
   - 기존 프로젝트 폴더에 **덮어쓰기**
   
3. **기존 폴더에 덮어쓰기 확인**
   - "파일을 덮어쓰시겠습니까?" → **예, 모두 덮어쓰기**

> ⚠️ **중요**: `node_modules` 폴더는 복사하지 마세요! (없어야 정상)

---

### **Step 4: DB 마이그레이션** 🗄️

**터미널/명령 프롬프트에서 실행:**

```bash
node migrate_db.js
```

**예상 출력:**
```
✅ DB 마이그레이션 완료!
- calendar_notes 테이블 생성 완료
- construction_records 테이블 업데이트 완료
```

> 💡 **이 단계는 필수입니다!** 새로운 기능을 위한 데이터베이스 구조가 추가됩니다.

---

### **Step 5: 서버 재시작** 🔄

**터미널/명령 프롬프트에서 실행:**

```bash
npm run dev
```

**예상 출력:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

---

### **Step 6: 브라우저 테스트** ✅

1. **새 탭 열기**
   ```
   Ctrl + Shift + N (시크릿 모드)
   ```

2. **주소 입력**
   ```
   http://localhost:3000
   ```

3. **확인 사항**
   - ✅ 스케줄 화면 정상 로딩
   - ✅ 비거주 아이콘이 이미지로 표시
   - ✅ 날짜 옆에 3블럭 (휴가자/일당/쉬는팀) 표시
   - ✅ 업체별 색상 아이콘 정상 작동

---

## 🎯 업데이트 체크리스트

- [ ] Step 1: 서버 중지 완료
- [ ] Step 2: 파일 다운로드 완료
- [ ] Step 3: 기존 폴더에 덮어쓰기 완료
- [ ] Step 4: DB 마이그레이션 실행 완료
- [ ] Step 5: 서버 재시작 완료
- [ ] Step 6: 브라우저 테스트 통과

---

## 🆘 문제 해결

### 문제 1: "Cannot find module" 에러
**해결방법:**
```bash
npm install
```
→ 의존성 패키지를 다시 설치합니다.

### 문제 2: 포트 3000 이미 사용 중
**해결방법:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID번호] /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### 문제 3: 비거주 아이콘이 보이지 않음
**해결방법:**
1. 브라우저 캐시 삭제 (Ctrl + Shift + Delete)
2. 시크릿 모드로 다시 접속
3. `src/assets/non-resident-icon.png` 파일 존재 확인

### 문제 4: 데이터베이스 에러
**해결방법:**
```bash
# DB 파일 백업
cp database.sqlite database.backup.sqlite

# 마이그레이션 재실행
node migrate_db.js
```

---

## 📞 추가 지원

문제가 계속되면 다음 정보를 알려주세요:
1. 어느 단계에서 문제가 발생했나요?
2. 에러 메시지 전체 내용
3. 사용 중인 운영체제 (Windows/macOS/Linux)

---

## 🎉 업데이트 완료!

모든 단계를 완료하셨다면 축하드립니다! 🎊

**새로운 기능을 마음껏 사용하세요:**
- 🔵 비거주 아이콘으로 상태 확인
- 📅 3블럭 시스템으로 팀 관리
- 🎨 개선된 스케줄 달력 UI

---

**작업자**: GenSpark AI Developer  
**GitHub PR**: https://github.com/giguestar/HMOA-CSS-PROJECT/pull/1  
**문의**: 언제든지 물어보세요! 💬
