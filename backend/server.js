import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// 데이터 파일 경로
const STORES_FILE = path.join(__dirname, 'data', 'stores.json');
const REQUESTS_FILE = path.join(__dirname, 'data', 'requests.json');
const REPAIRS_FILE = path.join(__dirname, 'data', 'repairs.json');

// 데이터 읽기 헬퍼 함수 (파일이 없으면 기본값으로 생성)
async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // 파일이 없으면 기본 구조로 생성
    if (error.code === 'ENOENT') {
      console.log(`📁 파일이 없어서 생성합니다: ${filePath}`);
      const defaultData = filePath.includes('stores') 
        ? { stores: [] } 
        : filePath.includes('requests') 
          ? { requests: [] } 
          : { repairs: [] };
      await writeJSON(filePath, defaultData);
      return defaultData;
    }
    throw error;
  }
}

// 데이터 쓰기 헬퍼 함수
async function writeJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// 이메일 설정 (Gmail 사용)
let transporter = null;

// nodemailer 설정
async function setupEmailService() {
  try {
    const nodemailer = await import('nodemailer');
    
    console.log('📧 이메일 서비스 설정 중...');
    console.log(`   📨 발송 계정: ${process.env.EMAIL_USER}`);
    
    transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // 연결 테스트
    await transporter.verify();
    console.log('✅ 이메일 서비스 연결 성공!');
  } catch (error) {
    console.error('❌ 이메일 서비스 설정 실패:', error.message);
    transporter = null;
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
      id: req.body.id || `item-${Date.now()}`,
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
    
    // 업데이트 가능한 필드들
    if (req.body.name !== undefined) item.name = req.body.name;
    if (req.body.stockQuantity !== undefined) item.stockQuantity = req.body.stockQuantity;
    if (req.body.displayQuantity !== undefined) item.displayQuantity = req.body.displayQuantity;
    if (req.body.quantity !== undefined) item.quantity = req.body.quantity;
    
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

// 재고 요청 이메일 발송 (InventoryRequest 페이지용)
app.post('/api/send-request-email', async (req, res) => {
  try {
    const { to, subject, content, fromStore, toStore, item, quantity, includeDisplay, specialNote, adminName, adminEmail } = req.body;
    
    console.log('📧 재고 요청 이메일 발송 API 호출');
    console.log('   발신: ' + fromStore);
    console.log('   수신: ' + toStore);
    console.log('   제품: ' + item);
    
    // 요청 저장
    const requestsData = await readJSON(REQUESTS_FILE);
    const storesData = await readJSON(STORES_FILE);
    
    const fromStoreObj = storesData.stores.find(s => s.id === fromStore);
    const toStoreObj = storesData.stores.find(s => s.id === toStore);
    
    if (!fromStoreObj || !toStoreObj) {
      return res.status(404).json({ error: '매장을 찾을 수 없습니다.' });
    }
    
    const newRequest = {
      id: `req-${Date.now()}`,
      fromStoreId: fromStoreObj.id,
      fromStoreName: fromStoreObj.name,
      toStoreId: toStoreObj.id,
      toStoreName: toStoreObj.name,
      toStoreEmail: toStoreObj.email,
      item: item,
      quantity: quantity,
      includeDisplay: includeDisplay,
      specialNote: specialNote,
      requesterName: adminName,
      adminName: adminName,
      adminEmail: adminEmail || '',
      status: 'requested',
      createdAt: new Date().toISOString()
    };
    
    requestsData.requests.push(newRequest);
    await writeJSON(REQUESTS_FILE, requestsData);
    
    // 실제 이메일 발송
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 이메일 발송 시도');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📨 수신: ${to}`);
    console.log(`📋 제목: ${subject}`);
    
    const emailResult = await sendEmail(to, subject, content.replace(/\n/g, '<br>'));
    
    if (emailResult.success) {
      console.log('✅ 이메일 발송 성공!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
      res.json({ success: true, message: '재고 요청 이메일이 발송되었습니다.', requestId: newRequest.id });
    } else {
      console.log('⚠️ 이메일 발송 실패 (요청은 저장됨):', emailResult.error);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
      res.json({ success: true, message: '재고 요청이 저장되었습니다. (이메일 발송 실패)', requestId: newRequest.id, emailError: emailResult.error });
    }
  } catch (error) {
    console.error('재고 요청 처리 중 오류:', error);
    res.status(500).json({ error: error.message });
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
      requesterName: req.body.requesterName || '사용자',
      adminName: req.body.adminName || 'admin1',
      status: req.body.status || 'requested',
      needsInspection: req.body.needsInspection || false,
      note: req.body.note || '',
      createdAt: new Date().toISOString(),
      emailSent: false
    };
    
    // 이메일 발송
    const emailSubject = `[재고 요청] ${toStore.name}에서 재고를 요청했습니다`;
    const emailContent = `
      <h2>재고 요청</h2>
      <p><strong>요청 매장:</strong> ${toStore.name}</p>
      <p><strong>상품명:</strong> ${item}</p>
      <p><strong>수량:</strong> ${quantity}개</p>
      ${newRequest.needsInspection ? '<p><strong>⚠️ 특이사항:</strong> 진열 상품 포함 - 검수 필요</p>' : ''}
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

// 특정 매장의 입고 대기 (내가 다른 매장에 요청한 것)
app.get('/api/requests/incoming/:storeId', async (req, res) => {
  try {
    const data = await readJSON(REQUESTS_FILE);
    // fromStoreId가 나인 경우 = 내가 다른 매장에 요청한 재고 (입고 예정)
    const incoming = data.requests.filter(r => r.fromStoreId === req.params.storeId);
    res.json(incoming);
  } catch (error) {
    res.status(500).json({ error: '입고 대기 재고를 불러오는데 실패했습니다.' });
  }
});

// 특정 매장의 출고 대기 (다른 매장이 나에게 요청한 것)
app.get('/api/requests/outgoing/:storeId', async (req, res) => {
  try {
    const data = await readJSON(REQUESTS_FILE);
    // toStoreId가 나인 경우 = 다른 매장이 나에게 요청한 재고 (출고해줘야 함)
    const outgoing = data.requests.filter(r => r.toStoreId === req.params.storeId);
    res.json(outgoing);
  } catch (error) {
    res.status(500).json({ error: '출고 대기 재고를 불러오는데 실패했습니다.' });
  }
});

// 재고 요청 상태 업데이트
app.patch('/api/requests/:id', async (req, res) => {
  try {
    const requestsData = await readJSON(REQUESTS_FILE);
    const request = requestsData.requests.find(r => r.id === req.params.id);
    
    if (!request) {
      return res.status(404).json({ error: '요청을 찾을 수 없습니다.' });
    }
    
    const oldStatus = request.status;
    request.status = req.body.status;
    request.updatedAt = new Date().toISOString();
    
    // 상태가 'in_transit'(배송중)로 변경되면 출고 매장(toStoreId = 재고 보유 매장)의 재고 차감
    if (req.body.status === 'in_transit' && oldStatus !== 'in_transit') {
      const storesData = await readJSON(STORES_FILE);
      const store = storesData.stores.find(s => s.id === request.toStoreId);
      
      if (store) {
        // 재고 아이템 찾기 (item 이름으로 검색)
        const inventoryItem = store.inventory.find(i => i.id === request.item || `${i.name}_${i.color}` === request.item);
        
        if (inventoryItem) {
          const quantityToDeduct = request.quantity;
          const totalAvailable = (inventoryItem.stockQuantity || 0) + (inventoryItem.displayQuantity || 0);
          
          if (totalAvailable >= quantityToDeduct) {
            // 진열 수량과 창고 수량에서 랜덤으로 차감
            const displayAvailable = inventoryItem.displayQuantity || 0;
            
            // 진열 수량에서 차감할 개수를 랜덤으로 결정 (0 ~ min(displayAvailable, quantityToDeduct))
            const maxFromDisplay = Math.min(displayAvailable, quantityToDeduct);
            const fromDisplay = Math.floor(Math.random() * (maxFromDisplay + 1));
            const fromStock = quantityToDeduct - fromDisplay;
            
            inventoryItem.displayQuantity = Math.max(0, (inventoryItem.displayQuantity || 0) - fromDisplay);
            inventoryItem.stockQuantity = Math.max(0, (inventoryItem.stockQuantity || 0) - fromStock);
            
            await writeJSON(STORES_FILE, storesData);
            
            console.log(`✅ 재고 차감 완료 (배송중): ${request.item} (진열 -${fromDisplay}, 창고 -${fromStock})`);
          } else {
            console.warn(`⚠️ 재고 부족: ${request.item} (필요: ${quantityToDeduct}, 보유: ${totalAvailable})`);
          }
        } else {
          console.warn(`⚠️ 재고 아이템을 찾을 수 없습니다: ${request.item}`);
        }
      }
    }
    
    // 상태가 'completed'(완료)로 변경되면 입고 매장(fromStoreId = 요청한 매장)의 재고 추가
    if (req.body.status === 'completed' && oldStatus !== 'completed') {
      const storesData = await readJSON(STORES_FILE);
      const toStore = storesData.stores.find(s => s.id === request.fromStoreId);
      
      if (toStore) {
        // 재고 아이템 찾기 (item 이름으로 검색)
        let inventoryItem = toStore.inventory.find(i => i.id === request.item || `${i.name}_${i.color}` === request.item);
        
        if (inventoryItem) {
          // 기존 재고가 있으면 창고 수량에 추가
          inventoryItem.stockQuantity = (inventoryItem.stockQuantity || 0) + request.quantity;
          console.log(`✅ 재고 추가 완료 (입고): ${request.item} 창고 +${request.quantity}개 → ${toStore.name}`);
        } else {
          // 재고가 없으면 새로 생성 (출고 매장에서 정보 가져오기)
          const fromStore = storesData.stores.find(s => s.id === request.toStoreId);
          if (fromStore) {
            const fromItem = fromStore.inventory.find(i => i.id === request.item || `${i.name}_${i.color}` === request.item);
            if (fromItem) {
              // 출고 매장의 재고 정보를 복사해서 새로 추가
              const newItem = {
                id: fromItem.id,
                category: fromItem.category,
                name: fromItem.name,
                color: fromItem.color,
                size: fromItem.size,
                stockQuantity: request.quantity,
                displayQuantity: 0
              };
              toStore.inventory.push(newItem);
              console.log(`✅ 신규 재고 생성 (입고): ${request.item} 창고 ${request.quantity}개`);
            }
          }
        }
        
        await writeJSON(STORES_FILE, storesData);
      }
    }
    
    await writeJSON(REQUESTS_FILE, requestsData);
    
    res.json(request);
  } catch (error) {
    console.error('요청 업데이트 실패:', error);
    res.status(500).json({ error: '요청 업데이트에 실패했습니다.' });
  }
});

// ============ Repairs API (수선 관리) ============

// 모든 수선 내역 조회
app.get('/api/repairs', async (req, res) => {
  try {
    const data = await readJSON(REPAIRS_FILE);
    res.json(data.repairs);
  } catch (error) {
    res.status(500).json({ error: '수선 내역을 불러오는데 실패했습니다.' });
  }
});

// 특정 매장의 수선 내역 조회
app.get('/api/repairs/store/:storeId', async (req, res) => {
  try {
    const data = await readJSON(REPAIRS_FILE);
    const repairs = data.repairs.filter(r => r.storeId === req.params.storeId);
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ error: '수선 내역을 불러오는데 실패했습니다.' });
  }
});

// 수선 내역 추가
app.post('/api/repairs', async (req, res) => {
  try {
    const data = await readJSON(REPAIRS_FILE);
    
    const newRepair = {
      id: `repair-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    data.repairs.push(newRepair);
    await writeJSON(REPAIRS_FILE, data);
    
    res.json(newRepair);
  } catch (error) {
    res.status(500).json({ error: '수선 내역 추가에 실패했습니다.' });
  }
});

// 수선 내역 업데이트
app.patch('/api/repairs/:id', async (req, res) => {
  try {
    const data = await readJSON(REPAIRS_FILE);
    const repair = data.repairs.find(r => r.id === req.params.id);
    
    if (!repair) {
      return res.status(404).json({ error: '수선 내역을 찾을 수 없습니다.' });
    }
    
    Object.assign(repair, req.body);
    repair.updatedAt = new Date().toISOString();
    
    await writeJSON(REPAIRS_FILE, data);
    
    res.json(repair);
  } catch (error) {
    res.status(500).json({ error: '수선 내역 업데이트에 실패했습니다.' });
  }
});

// 수선 내역 삭제
app.delete('/api/repairs/:id', async (req, res) => {
  try {
    const data = await readJSON(REPAIRS_FILE);
    const index = data.repairs.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: '수선 내역을 찾을 수 없습니다.' });
    }
    
    data.repairs.splice(index, 1);
    await writeJSON(REPAIRS_FILE, data);
    
    res.json({ message: '삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: '수선 내역 삭제에 실패했습니다.' });
  }
});

// 헬스 체크 (여러 경로 지원)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'S2S Backend is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'S2S Backend is running' });
});

// 루트 경로
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'S2S Backend is running',
    endpoints: {
      health: '/api/health or /health',
      stores: '/api/stores',
      requests: '/api/requests'
    }
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 S2S Backend server running on http://localhost:${PORT}`);
  await setupEmailService();
  console.log(`✨ Server is ready!`);
});
