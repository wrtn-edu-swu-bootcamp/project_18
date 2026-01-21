# S2S 재고 관리 챗봇 - 설치 및 실행 가이드

## 📋 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Gmail 계정 (이메일 발송용)

## 🚀 설치 방법

### 1. 저장소 클론
```bash
git clone https://github.com/wrtn-edu-swu-bootcamp/project_18.git
cd project_18
```

### 2. 백엔드 설정

```bash
cd backend
npm install
```

#### 이메일 설정 (중요!)

1. `.env.example`을 `.env`로 복사
```bash
cp .env.example .env
```

2. Gmail 앱 비밀번호 생성
   - https://myaccount.google.com/apppasswords 접속
   - 2단계 인증 활성화 필요
   - "앱 비밀번호" 생성
   - 생성된 16자리 비밀번호 복사

3. `.env` 파일 수정
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=generated-app-password
```

### 3. 프론트엔드 설정

```bash
cd ../frontend
npm install
```

## ▶️ 실행 방법

### 터미널 1: 백엔드 실행

```bash
cd backend
npm start
```

백엔드 서버가 `http://localhost:3001`에서 실행됩니다.

### 터미널 2: 프론트엔드 실행

```bash
cd frontend
npm run dev
```

프론트엔드가 `http://localhost:5173`에서 실행됩니다.

브라우저에서 `http://localhost:5173`을 열어 앱을 사용하세요!

## 🎯 사용 방법

### 1. 매장 선택
- 홈 화면에서 현재 매장 선택 (강남점, 신촌점, 홍대점)

### 2. 재고 요청 (챗봇)
- "재고 요청 (챗봇)" 메뉴 클릭
- 예: "청바지 32인치 5개 필요해" 입력
- 재고 보유 매장 확인 후 선택
- 자동으로 이메일 발송 및 재고 상태 업데이트

### 3. 재고 관리
- **현재 재고**: 보유 재고 확인 및 관리
- **대기 중 재고**: 내가 요청한 재고 확인
- **준비 중 재고**: 다른 매장의 요청 승인/거절

### 4. 거래 내역
- 모든 재고 이동 히스토리 확인

## 🧪 테스트 시나리오

### 시나리오 1: 재고 요청 및 승인

1. **강남점**으로 로그인
2. 챗봇에서 "청바지 32인치 5개" 요청
3. 신촌점 선택
4. **신촌점**으로 매장 변경
5. "준비 중 재고"에서 요청 확인
6. "승인" 버튼 클릭
7. **강남점**으로 다시 변경
8. "대기 중 재고"에서 승인 상태 확인

## 🐛 문제 해결

### 백엔드 연결 오류
- 백엔드 서버가 실행 중인지 확인 (`http://localhost:3001`)
- 포트 3001이 이미 사용 중이면 `backend/server.js`에서 PORT 변경

### 이메일 발송 실패
- `.env` 파일의 이메일 설정 확인
- Gmail 앱 비밀번호가 정확한지 확인
- Gmail 2단계 인증이 활성화되어 있는지 확인

### CORS 오류
- 백엔드가 실행 중인지 확인
- 브라우저 콘솔에서 에러 메시지 확인

## 📝 개발 모드

### 백엔드 자동 재시작 (Node 18+)
```bash
cd backend
npm run dev
```

### 프론트엔드 HMR (Hot Module Replacement)
Vite는 기본적으로 HMR을 지원합니다.

## 🏗️ 프로젝트 구조

```
project/
├── backend/
│   ├── server.js          # Express 서버
│   ├── data/
│   │   ├── stores.json    # 매장 및 재고 데이터
│   │   └── requests.json  # 재고 요청 데이터
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── utils/         # API 및 헬퍼 함수
│   │   ├── App.jsx        # 라우팅
│   │   └── main.jsx       # 엔트리 포인트
│   └── package.json
└── docs/                  # 기획 문서
```

## 📞 지원

문제가 발생하면 이슈를 등록해주세요.
