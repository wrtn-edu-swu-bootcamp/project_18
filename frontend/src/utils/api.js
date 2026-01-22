const API_BASE_URL = 'http://localhost:3001/api';

// 매장 목록 조회
export async function getStores() {
  const response = await fetch(`${API_BASE_URL}/stores`);
  if (!response.ok) throw new Error('Failed to fetch stores');
  return response.json();
}

// 특정 매장 조회
export async function getStore(storeId) {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch store');
  return response.json();
}

// 매장의 재고 조회
export async function getStoreInventory(storeId) {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}/inventory`);
  if (!response.ok) throw new Error('Failed to fetch inventory');
  return response.json();
}

// 재고 추가
export async function addInventoryItem(storeId, item) {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!response.ok) throw new Error('Failed to add inventory item');
  return response.json();
}

// 재고 수량 업데이트
export async function updateInventoryQuantity(storeId, itemId, quantity) {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}/inventory/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  });
  if (!response.ok) throw new Error('Failed to update inventory');
  return response.json();
}

// 재고 아이템 업데이트 (이름, 보유 수량, 진열 수량 등)
export async function updateInventoryItem(storeId, itemId, updates) {
  const response = await fetch(`${API_BASE_URL}/stores/${storeId}/inventory/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Failed to update inventory item');
  return response.json();
}

// 재고 검색
export async function searchInventory(keyword) {
  const response = await fetch(`${API_BASE_URL}/inventory/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword })
  });
  if (!response.ok) throw new Error('Failed to search inventory');
  return response.json();
}

// 재고 요청 생성
export async function createRequest(requestData) {
  const response = await fetch(`${API_BASE_URL}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  if (!response.ok) throw new Error('Failed to create request');
  return response.json();
}

// 모든 재고 요청 조회
export async function getRequests() {
  const response = await fetch(`${API_BASE_URL}/requests`);
  if (!response.ok) throw new Error('Failed to fetch requests');
  return response.json();
}

// 대기 중 재고 조회 (오는 재고)
export async function getIncomingRequests(storeId) {
  const response = await fetch(`${API_BASE_URL}/requests/incoming/${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch incoming requests');
  return response.json();
}

// 준비 중 재고 조회 (가는 재고)
export async function getOutgoingRequests(storeId) {
  const response = await fetch(`${API_BASE_URL}/requests/outgoing/${storeId}`);
  if (!response.ok) throw new Error('Failed to fetch outgoing requests');
  return response.json();
}

// 재고 요청 상태 업데이트
export async function updateRequestStatus(requestId, status) {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to update request status');
  return response.json();
}
