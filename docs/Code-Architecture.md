# S2S 재고 관리 시스템 - Architecture

## 1. 시스템 개요

### 1.1 시스템 구성

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    React + Vite (Port 5173)                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │    Pages    │  │    Utils    │  │   Assets    │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP (REST API)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend Server                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                Express.js (Port 3001)                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │  API Routes │  │   Services  │  │  Data Files │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ SMTP
                                  ▼
                        ┌─────────────────┐
                        │   Gmail SMTP    │
                        │  (Email 발송)    │
                        └─────────────────┘
```

### 1.2 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| **Frontend** | React | 18.x |
| | React Router | 6.x |
| | Vite | 5.x |
| **Backend** | Node.js | 18+ |
| | Express.js | 4.x |
| | Nodemailer | 6.x |
| **데이터 저장** | JSON 파일 | - |
| **인증** | localStorage | - |

---

## 2. 디렉토리 구조

```
project/
├── backend/
│   ├── data/
│   │   ├── stores.json          # 매장 및 재고 데이터
│   │   ├── requests.json        # 재고 요청 데이터
│   │   └── repairs.json         # 수선 데이터
│   ├── server.js                # Express 서버 (API 라우트 포함)
│   ├── package.json
│   └── .gitignore
│
├── frontend/
│   ├── public/
│   │   ├── clear-all.html       # 스토리지 초기화 유틸리티
│   │   └── clear-storage.html
│   ├── src/
│   │   ├── pages/               # 페이지 컴포넌트
│   │   │   ├── Login.jsx        # 로그인 페이지
│   │   │   ├── Home.jsx         # 메인 대시보드
│   │   │   ├── CurrentInventory.jsx  # 재고 관리
│   │   │   ├── Repairs.jsx      # 수선 관리
│   │   │   ├── Incoming.jsx     # 입고 대기
│   │   │   ├── Outgoing.jsx     # 출고 대기
│   │   │   ├── InventoryRequest.jsx  # 재고 요청
│   │   │   ├── CustomerInfo.jsx # 고객 정보
│   │   │   ├── CustomerEmail.jsx # 고객 이메일
│   │   │   ├── History.jsx      # 거래 내역
│   │   │   ├── AdminLogs.jsx    # 관리자 기록
│   │   │   └── Chat.jsx         # 챗봇 (미사용)
│   │   ├── utils/
│   │   │   ├── api.js           # API 호출 함수
│   │   │   └── parser.js        # 데이터 파서
│   │   ├── assets/
│   │   ├── App.jsx              # 라우터 설정
│   │   ├── App.css
│   │   ├── index.css            # 글로벌 스타일
│   │   └── main.jsx             # 앱 진입점
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docs/
│   ├── Wireframe.md
│   ├── Design-Guide.md
│   └── Architecture.md
│
└── README.md
```

---

## 3. Frontend Architecture

### 3.1 컴포넌트 구조

```
App.jsx (Router)
├── Login.jsx          /
├── Home.jsx           /home
├── Chat.jsx           /chat
├── InventoryRequest.jsx    /inventory-request
├── CurrentInventory.jsx    /inventory
├── Incoming.jsx       /incoming
├── Outgoing.jsx       /outgoing
├── History.jsx        /history
├── Repairs.jsx        /repairs
├── AdminLogs.jsx      /admin-logs
├── CustomerInfo.jsx   /customer-info
└── CustomerEmail.jsx  /customer-email
```

### 3.2 상태 관리

#### 로컬 스토리지 (인증 정보)
```javascript
localStorage.setItem('myStore', store.id);      // 내 매장 ID
localStorage.setItem('currentStore', store.id); // 현재 선택된 매장
localStorage.setItem('adminName', adminName);   // 관리자 이름
localStorage.setItem('adminEmail', adminEmail); // 관리자 이메일
```

#### 컴포넌트 상태 (React useState)
```javascript
// Home.jsx 예시
const [stores, setStores] = useState([]);
const [currentStore, setCurrentStore] = useState(null);
const [myStore, setMyStore] = useState(null);
const [todayStats, setTodayStats] = useState({...});
const [monthlyStats, setMonthlyStats] = useState({...});
```

### 3.3 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                        컴포넌트 로드                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. localStorage에서 인증 정보 확인                               │
│     - myStore, currentStore, adminName                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. API 호출 (utils/api.js)                                      │
│     - getStores(), getStoreInventory(), etc.                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. 상태 업데이트 (useState)                                      │
│     - setInventory(data), setRequests(data), etc.                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. UI 렌더링                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 API 유틸리티 (utils/api.js)

```javascript
const API_BASE_URL = 'http://localhost:3001/api';

// 매장 관련
export async function getStores() { ... }
export async function getStore(storeId) { ... }
export async function getStoreInventory(storeId) { ... }

// 재고 관련
export async function addInventoryItem(storeId, item) { ... }
export async function updateInventoryItem(storeId, itemId, updates) { ... }
export async function searchInventory(keyword) { ... }

// 요청 관련
export async function createRequest(requestData) { ... }
export async function getRequests() { ... }
export async function getIncomingRequests(storeId) { ... }
export async function getOutgoingRequests(storeId) { ... }
export async function updateRequestStatus(requestId, status) { ... }
```

---

## 4. Backend Architecture

### 4.1 서버 구조 (server.js)

```javascript
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Data Files
const STORES_FILE = './data/stores.json';
const REQUESTS_FILE = './data/requests.json';
const REPAIRS_FILE = './data/repairs.json';

// Helper Functions
async function readJSON(filePath) { ... }
async function writeJSON(filePath, data) { ... }

// API Routes
// ... (아래 상세)

app.listen(PORT, () => { ... });
```

### 4.2 API 엔드포인트

#### 매장 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/stores` | 모든 매장 조회 |
| GET | `/api/stores/:id` | 특정 매장 조회 |
| GET | `/api/stores/:id/inventory` | 매장 재고 조회 |
| POST | `/api/stores/:id/inventory` | 재고 추가 |
| PATCH | `/api/stores/:storeId/inventory/:itemId` | 재고 수정 |

#### 요청 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/requests` | 재고 요청 생성 |
| GET | `/api/requests` | 모든 요청 조회 |
| GET | `/api/requests/incoming/:storeId` | 입고 대기 조회 |
| GET | `/api/requests/outgoing/:storeId` | 출고 대기 조회 |
| PATCH | `/api/requests/:id` | 요청 상태 업데이트 |

#### 수선 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/repairs` | 모든 수선 조회 |
| GET | `/api/repairs/store/:storeId` | 매장별 수선 조회 |
| POST | `/api/repairs` | 수선 등록 |
| PATCH | `/api/repairs/:id` | 수선 상태 업데이트 |
| DELETE | `/api/repairs/:id` | 수선 삭제 |

#### 기타 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/inventory/search` | 재고 검색 (챗봇용) |
| POST | `/api/send-request-email` | 이메일 발송 |
| GET | `/api/health` | 헬스 체크 |

### 4.3 데이터 모델

#### stores.json
```json
{
  "stores": [
    {
      "id": "store-nowon",
      "name": "노원점",
      "email": "nowon@example.com",
      "inventory": [
        {
          "id": "OUTERWEAR_BROWN",
          "category": "OUTERWEAR",
          "name": "OUTERWEAR",
          "color": "BROWN",
          "size": "M",
          "stockQuantity": 5,
          "displayQuantity": 2
        }
      ]
    }
  ]
}
```

#### requests.json
```json
{
  "requests": [
    {
      "id": "req-1234567890",
      "fromStoreId": "store-nowon",
      "fromStoreName": "노원점",
      "toStoreId": "store-gangnam",
      "toStoreName": "강남점",
      "item": "OUTERWEAR_BROWN",
      "quantity": 3,
      "status": "requested",
      "requesterName": "admin1",
      "adminEmail": "admin@example.com",
      "needsInspection": false,
      "createdAt": "2026-01-22T10:00:00.000Z",
      "updatedAt": null
    }
  ]
}
```

#### repairs.json
```json
{
  "repairs": [
    {
      "id": "repair-1234567890",
      "storeId": "store-nowon",
      "storeName": "노원점",
      "managerName": "admin1",
      "customerName": "이*민",
      "productId": "OUTERWEAR_BROWN",
      "repairContent": "소매 수선",
      "cost": 15000,
      "paymentStatus": "미불",
      "repairStatus": "수선 전",
      "delivered": false,
      "notificationSent": false,
      "estimatedMinutes": 30,
      "sentAt": null,
      "createdAt": "2026-01-22T10:00:00.000Z"
    }
  ]
}
```

### 4.4 비즈니스 로직

#### 재고 요청 흐름
```
requested → approved → in_transit → completed
    │           │           │
    │           │           └── 입고 매장 재고 추가
    │           │
    │           └── 출고 매장 재고 차감 (in_transit로 변경 시)
    │
    └── 이메일 발송
```

#### 수선 흐름
```
수선 전 → 수선 중 → 수선 완료
    │         │          │
    │         │          ├── 알림톡 발송
    │         │          └── 전달 완료 (결제 완료 시)
    │         │
    │         └── estimatedMinutes 후 자동 완료
    │
    └── sentAt 기록, estimatedMinutes 설정
```

---

## 5. 라우팅 구조

### 5.1 React Router 설정

```jsx
// App.jsx
<Router>
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/home" element={<Home />} />
    <Route path="/chat" element={<Chat />} />
    <Route path="/inventory-request" element={<InventoryRequest />} />
    <Route path="/inventory" element={<CurrentInventory />} />
    <Route path="/incoming" element={<Incoming />} />
    <Route path="/outgoing" element={<Outgoing />} />
    <Route path="/history" element={<History />} />
    <Route path="/repairs" element={<Repairs />} />
    <Route path="/admin-logs" element={<AdminLogs />} />
    <Route path="/customer-info" element={<CustomerInfo />} />
    <Route path="/customer-email" element={<CustomerEmail />} />
  </Routes>
</Router>
```

### 5.2 네비게이션

```javascript
// 프로그래매틱 네비게이션
const navigate = useNavigate();
navigate('/home');
navigate('/repairs', { state: { initialTab: '수선 완료' } });

// 링크 컴포넌트
<Link to="/inventory">재고 관리</Link>
```

---

## 6. 인증 & 권한

### 6.1 현재 구현 (간소화)

```
┌─────────────┐     로그인      ┌─────────────┐
│   Login     │ ───────────────▶│    Home     │
│   Page      │   localStorage  │    Page     │
└─────────────┘                 └─────────────┘
                                      │
                                      │ 페이지 접근 시
                                      │ localStorage 확인
                                      ▼
                               ┌─────────────┐
                               │ 인증 없으면  │
                               │ / 로 리다이렉트│
                               └─────────────┘
```

### 6.2 인증 확인 패턴

```javascript
useEffect(() => {
  const storedId = localStorage.getItem('currentStore');
  
  if (!storedId) {
    alert('로그인 정보가 없습니다.');
    navigate('/');
    return;
  }
  
  // 데이터 로드...
}, [navigate]);
```

---

## 7. 이메일 서비스

### 7.1 Nodemailer 설정

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS  // 앱 비밀번호
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

### 7.2 이메일 발송 함수

```javascript
async function sendEmail(to, subject, content) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    html: content
  };
  
  await transporter.sendMail(mailOptions);
}
```

---

## 8. 에러 처리

### 8.1 Frontend 에러 처리

```javascript
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Error:', error);
  alert('오류가 발생했습니다: ' + error.message);
}
```

### 8.2 Backend 에러 처리

```javascript
app.get('/api/stores/:id', async (req, res) => {
  try {
    const data = await readJSON(STORES_FILE);
    const store = data.stores.find(s => s.id === req.params.id);
    
    if (store) {
      res.json(store);
    } else {
      res.status(404).json({ error: '매장을 찾을 수 없습니다.' });
    }
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});
```

---

## 9. 성능 최적화

### 9.1 데이터 로딩

```javascript
// 병렬 API 호출
const [outgoingRes, repairsRes, requestsRes] = await Promise.all([
  fetch(`${API_BASE}/requests/outgoing/${storeId}`),
  fetch(`${API_BASE}/repairs/store/${storeId}`),
  fetch(`${API_BASE}/requests/incoming/${storeId}`)
]);
```

### 9.2 실시간 업데이트 (Polling)

```javascript
// 수선 페이지 - 5초마다 체크
useEffect(() => {
  const interval = setInterval(() => {
    checkAndCompleteRepairs();
  }, 5000);
  
  return () => clearInterval(interval);
}, [currentStore]);
```

---

## 10. 배포 가이드

### 10.1 개발 환경

```bash
# Backend 실행
cd backend
npm install
npm start  # http://localhost:3001

# Frontend 실행
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### 10.2 환경 변수

```bash
# backend/.env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 10.3 프로덕션 빌드

```bash
# Frontend 빌드
cd frontend
npm run build  # dist/ 폴더 생성

# Backend (PM2 사용 권장)
pm2 start server.js --name s2s-backend
```

---

## 11. 향후 개선 사항

### 11.1 기술적 개선
- [ ] JWT 기반 인증 시스템
- [ ] WebSocket 실시간 알림
- [ ] PostgreSQL/MongoDB 데이터베이스 전환
- [ ] API 캐싱 (Redis)
- [ ] 상태 관리 라이브러리 (Zustand/Redux)

### 11.2 기능 개선
- [ ] 대시보드 차트/그래프
- [ ] 다중 언어 지원 (i18n)
- [ ] PWA 지원
- [ ] 오프라인 모드
- [ ] 푸시 알림

### 11.3 보안 개선
- [ ] HTTPS 적용
- [ ] Rate Limiting
- [ ] Input Validation
- [ ] SQL Injection 방지 (DB 전환 시)
