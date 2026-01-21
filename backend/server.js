import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// 데이터 파일 경로
const STORES_FILE = path.join(__dirname, 'data', 'stores.json');
const REQUESTS_FILE = path.join(__dirname, 'data', 'requests.json');

// 데이터 읽기 헬퍼 함수
async function readJSON(filePath) {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

// 데이터 쓰기 헬퍼 함수
async function writeJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// 이메일 설정 (Gmail 사용)
// 사용하려면 Gmail 앱 비밀번호가 필요합니다
let transporter = null;

// nodemailer 동적 import
async function setupEmailService() {
  try {
    const nodemailer = await import('nodemailer');
    transporter = nodemailer.default.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
    console.log('📧 Email service configured');
  } catch (error) {
    console.log('⚠️  Email service not available (nodemailer not installed)');
  }
}

// 이메일 발송 함수
async function sendEmail(to, subject, content) {
  if (!transporter) {
    console.log(`📧 이메일 발송 (시뮬레이션): ${to}`);
    console.log(`   제목: ${subject}`);
    return { success: false, error: 'Email service not configured' };
  }
  
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: to,
      subject: subject,
      html: content
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ 이메일 발송 성공: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// ============ API Routes ============

// 모든 매장 조회
app.get('/api/stores', async (req, res) => {
  try {
    const data = await readJSON(STORES_FILE);
    res.json(data.stores);
  } catch (error) {
    res.status(500).json({ error: '매장 데이터를 불러오는데 실패했습니다.' });
  }
});

// 특정 매장 조회
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
    res.status(500).json({ error: '매장 데이터를 불러오는데 실패했습니다.' });
  }
});

// 매장의 재고 조회
app.get('/api/stores/:id/inventory', async (req, res) => {
  try {
    const data = await readJSON(STORES_FILE);
    const store = data.stores.find(s => s.id === req.params.id);
    if (store) {
      res.json(store.inventory);
    } else {
      res.status(404).json({ error: '매장을 찾을 수 없습니다.' });
    }
  } catch (error) {
    res.status(500).json({ error: '재고 데이터를 불러오는데 실패했습니다.' });
  }
});

// 재고 추가
app.post('/api/stores/:id/inventory', async (req, res) => {
  try {
    const data = await readJSON(STORES_FILE);
    const store = data.stores.find(s => s.id === req.params.id);
    
    if (!store) {
      return res.status(404).json({ error: '매장을 찾을 수 없습니다.' });
    }
    
    const newItem = {
      id: `item-${Date.now()}`,
      ...req.body
    };
    
    store.inventory.push(newItem);
    await writeJSON(STORES_FILE, data);
    
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: '재고 추가에 실패했습니다.' });
  }
});

// 재고 수량 업데이트
app.patch('/api/stores/:storeId/inventory/:itemId', async (req, res) => {
  try {
    const data = await readJSON(STORES_FILE);
    const store = data.stores.find(s => s.id === req.params.storeId);
    
    if (!store) {
      return res.status(404).json({ error: '매장을 찾을 수 없습니다.' });
    }
    
    const item = store.inventory.find(i => i.id === req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: '재고를 찾을 수 없습니다.' });
    }
    
    item.quantity = req.body.quantity;
    await writeJSON(STORES_FILE, data);
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: '재고 업데이트에 실패했습니다.' });
  }
});

// 재고 검색 (챗봇용)
app.post('/api/inventory/search', async (req, res) => {
  try {
    const { keyword } = req.body;
    const data = await readJSON(STORES_FILE);
    
    const results = [];
    
    data.stores.forEach(store => {
      store.inventory.forEach(item => {
        const searchText = `${item.name} ${item.size}`.toLowerCase();
        if (searchText.includes(keyword.toLowerCase())) {
          results.push({
            storeId: store.id,
            storeName: store.name,
            storeEmail: store.email,
            item: item
          });
        }
      });
    });
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: '재고 검색에 실패했습니다.' });
  }
});

// 재고 요청 생성
app.post('/api/requests', async (req, res) => {
  try {
    const { fromStoreId, toStoreId, item, quantity } = req.body;
    
    const storesData = await readJSON(STORES_FILE);
    const requestsData = await readJSON(REQUESTS_FILE);
    
    const fromStore = storesData.stores.find(s => s.id === fromStoreId);
    const toStore = storesData.stores.find(s => s.id === toStoreId);
    
    if (!fromStore || !toStore) {
      return res.status(404).json({ error: '매장을 찾을 수 없습니다.' });
    }
    
    const newRequest = {
      id: `req-${Date.now()}`,
      fromStoreId: fromStore.id,
      fromStoreName: fromStore.name,
      toStoreId: toStore.id,
      toStoreName: toStore.name,
      item: item,
      quantity: quantity,
      status: 'requested',
      createdAt: new Date().toISOString(),
      emailSent: false
    };
    
    // 이메일 발송
    const emailSubject = `[재고 요청] ${fromStore.name}에서 재고를 요청했습니다`;
    const emailContent = `
      <h2>재고 요청</h2>
      <p><strong>요청 매장:</strong> ${fromStore.name}</p>
      <p><strong>상품명:</strong> ${item}</p>
      <p><strong>수량:</strong> ${quantity}개</p>
      <p><strong>요청 날짜:</strong> ${new Date().toLocaleString('ko-KR')}</p>
      <br>
      <p>앱에서 요청을 승인하거나 거절할 수 있습니다.</p>
    `;
    
    const emailResult = await sendEmail(toStore.email, emailSubject, emailContent);
    newRequest.emailSent = emailResult.success;
    
    requestsData.requests.push(newRequest);
    await writeJSON(REQUESTS_FILE, requestsData);
    
    res.json({
      request: newRequest,
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('재고 요청 생성 실패:', error);
    res.status(500).json({ error: '재고 요청 생성에 실패했습니다.' });
  }
});

// 모든 재고 요청 조회
app.get('/api/requests', async (req, res) => {
  try {
    const data = await readJSON(REQUESTS_FILE);
    res.json(data.requests);
  } catch (error) {
    res.status(500).json({ error: '요청 데이터를 불러오는데 실패했습니다.' });
  }
});

// 특정 매장의 대기 중 재고 (오는 재고)
app.get('/api/requests/incoming/:storeId', async (req, res) => {
  try {
    const data = await readJSON(REQUESTS_FILE);
    const incoming = data.requests.filter(r => r.fromStoreId === req.params.storeId);
    res.json(incoming);
  } catch (error) {
    res.status(500).json({ error: '대기 중 재고를 불러오는데 실패했습니다.' });
  }
});

// 특정 매장의 준비 중 재고 (가는 재고)
app.get('/api/requests/outgoing/:storeId', async (req, res) => {
  try {
    const data = await readJSON(REQUESTS_FILE);
    const outgoing = data.requests.filter(r => r.toStoreId === req.params.storeId);
    res.json(outgoing);
  } catch (error) {
    res.status(500).json({ error: '준비 중 재고를 불러오는데 실패했습니다.' });
  }
});

// 재고 요청 상태 업데이트
app.patch('/api/requests/:id', async (req, res) => {
  try {
    const data = await readJSON(REQUESTS_FILE);
    const request = data.requests.find(r => r.id === req.params.id);
    
    if (!request) {
      return res.status(404).json({ error: '요청을 찾을 수 없습니다.' });
    }
    
    request.status = req.body.status;
    request.updatedAt = new Date().toISOString();
    
    await writeJSON(REQUESTS_FILE, data);
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: '요청 업데이트에 실패했습니다.' });
  }
});

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'S2S Backend is running' });
});

app.listen(PORT, async () => {
  console.log(`🚀 S2S Backend server running on http://localhost:${PORT}`);
  await setupEmailService();
  console.log(`✨ Server is ready!`);
});
