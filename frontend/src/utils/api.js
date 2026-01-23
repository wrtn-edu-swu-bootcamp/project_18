// 환경 변수 확인 및 기본값 설정
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const isProduction = import.meta.env.MODE === 'production' || window.location.hostname !== 'localhost';
  
  if (!envUrl && isProduction) {
    console.error('⚠️ VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다!');
    console.error('Vercel Settings → Environment Variables에서 VITE_API_BASE_URL을 설정해주세요.');
  }
  
  return envUrl || 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

// API 호출 헬퍼 함수
async function apiFetch(url, options = {}) {
  const fullUrl = `${API_BASE_URL}${url}`;
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      // CORS 에러나 네트워크 에러 체크
      if (response.status === 0 || response.type === 'opaque') {
        throw new Error('CORS 오류: 백엔드 서버가 응답하지 않거나 CORS 설정이 필요합니다.');
      }
      throw new Error(`API 오류 (${response.status}): ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    // 네트워크 에러 처리
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('Load failed') ||
        error.name === 'TypeError') {
      
      const isProduction = window.location.hostname !== 'localhost';
      const errorMessage = isProduction
        ? `백엔드 서버에 연결할 수 없습니다.\n\n현재 API URL: ${API_BASE_URL}\n\n해결 방법:\n1. Vercel Settings → Environment Variables에서 VITE_API_BASE_URL 확인\n2. 백엔드 서버가 배포되어 실행 중인지 확인\n3. 백엔드 CORS 설정이 프론트엔드 도메인을 허용하는지 확인`
        : `백엔드 서버에 연결할 수 없습니다.\n\n현재 API URL: ${API_BASE_URL}\n\n로컬 개발 시:\n1. 백엔드 서버가 http://localhost:3001에서 실행 중인지 확인\n2. npm run dev로 백엔드 서버 시작`;
      
      throw new Error(errorMessage);
    }
    throw error;
  }
}

// 매장 목록 조회
export async function getStores() {
  return apiFetch('/stores');
}

// 특정 매장 조회
export async function getStore(storeId) {
  return apiFetch(`/stores/${storeId}`);
}

// 매장의 재고 조회
export async function getStoreInventory(storeId) {
  return apiFetch(`/stores/${storeId}/inventory`);
}

// 재고 추가
export async function addInventoryItem(storeId, item) {
  return apiFetch(`/stores/${storeId}/inventory`, {
    method: 'POST',
    body: JSON.stringify(item)
  });
}

// 재고 수량 업데이트
export async function updateInventoryQuantity(storeId, itemId, quantity) {
  return apiFetch(`/stores/${storeId}/inventory/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity })
  });
}

// 재고 아이템 업데이트 (이름, 보유 수량, 진열 수량 등)
export async function updateInventoryItem(storeId, itemId, updates) {
  return apiFetch(`/stores/${storeId}/inventory/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

// 재고 검색
export async function searchInventory(keyword) {
  return apiFetch('/inventory/search', {
    method: 'POST',
    body: JSON.stringify({ keyword })
  });
}

// 재고 요청 생성
export async function createRequest(requestData) {
  return apiFetch('/requests', {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
}

// 모든 재고 요청 조회
export async function getRequests() {
  return apiFetch('/requests');
}

// 대기 중 재고 조회 (오는 재고)
export async function getIncomingRequests(storeId) {
  return apiFetch(`/requests/incoming/${storeId}`);
}

// 준비 중 재고 조회 (가는 재고)
export async function getOutgoingRequests(storeId) {
  return apiFetch(`/requests/outgoing/${storeId}`);
}

// 재고 요청 상태 업데이트
export async function updateRequestStatus(requestId, status) {
  return apiFetch(`/requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}
