import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStores } from '../utils/api';

const API_BASE = 'http://localhost:3001/api';

const STATUS_LABELS = {
  'requested': '요청됨',
  'approved': '승인됨',
  'in_transit': '배송중',
  'completed': '완료'
};

const STATUS_COLORS = {
  'requested': { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
  'approved': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  'in_transit': { bg: '#fed7aa', text: '#9a3412', border: '#f97316' },
  'completed': { bg: '#d1fae5', text: '#065f46', border: '#10b981' }
};

export default function Incoming() {
  const [requests, setRequests] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [myEmail, setMyEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function initializeStore() {
      console.log('📥 [Incoming] 페이지 초기화 시작');
      
      const storedId = localStorage.getItem('currentStore');
      const storedEmail = localStorage.getItem('adminEmail') || '';
      setMyEmail(storedEmail);
      console.log('📥 [Incoming] localStorage.currentStore:', storedId);
      console.log('📥 [Incoming] localStorage.adminEmail:', storedEmail);
      
      if (!storedId) {
        console.log('❌ [Incoming] currentStore가 없어서 로그인 페이지로 이동');
        alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
        navigate('/');
        return;
      }
      
      try {
        const stores = await getStores();
        console.log('📥 [Incoming] 백엔드에서 가져온 매장 목록:', stores.map(s => s.id));
        
        const store = stores.find(s => s.id === storedId);
        
        if (!store) {
          console.log('❌ [Incoming] 매장을 찾을 수 없음:', storedId);
          alert(`매장 "${storedId}"을 찾을 수 없습니다. 다시 로그인해주세요.`);
          navigate('/');
          return;
        }
        
        console.log('✅ [Incoming] 매장 찾음:', store);
        setCurrentStore(store);
        loadRequests(store.id);
      } catch (error) {
        console.error('❌ [Incoming] 매장 정보 로드 실패:', error);
        alert('매장 정보를 불러오는데 실패했습니다.');
        navigate('/');
      }
    }
    
    initializeStore();
  }, [navigate]);

  async function loadRequests(storeId) {
    try {
      const response = await fetch(`${API_BASE}/requests/incoming/${storeId}`);
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('입고 요청 불러오기 실패:', error);
    }
  }

  async function handleComplete(requestId) {
    try {
      const response = await fetch(`${API_BASE}/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      
      if (response.ok) {
        await loadRequests(currentStore.id);
      }
    } catch (error) {
      console.error('요청 완료 처리 실패:', error);
    }
  }

  const filteredRequests = statusFilter === 'all'
    ? requests
    : requests.filter(r => r.status === statusFilter);

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'date-asc') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return 0;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/home')}
              style={{ marginRight: '1rem', color: '#6b7280', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer' }}
            >
              ← 뒤로
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>📨 입고 대기</h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{currentStore?.name} - 다른 매장에 요청한 재고</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* 필터 및 정렬 */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: statusFilter === 'all' ? '#3b82f6' : '#f3f4f6',
                  color: statusFilter === 'all' ? 'white' : '#374151',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                전체 ({requests.length})
              </button>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    backgroundColor: statusFilter === status ? STATUS_COLORS[status].bg : '#f3f4f6',
                    color: statusFilter === status ? STATUS_COLORS[status].text : '#374151',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {label} ({requests.filter(r => r.status === status).length})
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              <option value="date-desc">최신순</option>
              <option value="date-asc">오래된순</option>
            </select>
          </div>
        </div>

        {/* 요청 목록 테이블 */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f3f4f6' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>제품명</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>수량</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>요청 매장</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>요청일</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>요청자</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>특이사항</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>상태</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>주문서</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>완료</th>
                </tr>
              </thead>
              <tbody>
                {sortedRequests.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                      {statusFilter === 'all' ? '입고 요청 내역이 없습니다.' : `${STATUS_LABELS[statusFilter]} 상태의 요청이 없습니다.`}
                    </td>
                  </tr>
                ) : (
                  sortedRequests.map((request) => (
                    <tr key={request.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: '500' }}>
                        {request.item}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: 'bold' }}>
                        {request.quantity}개
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {request.fromStoreName}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center', color: '#6b7280' }}>
                        {new Date(request.createdAt).toLocaleString('ko-KR', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {request.requesterName}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        {request.needsInspection ? (
                          <span style={{ 
                            backgroundColor: '#fef3c7', 
                            color: '#92400e', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '0.25rem',
                            fontWeight: '500'
                          }}>
                            🧼 검수 필요
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          backgroundColor: STATUS_COLORS[request.status].bg,
                          color: STATUS_COLORS[request.status].text,
                          border: `1px solid ${STATUS_COLORS[request.status].border}`
                        }}>
                          {STATUS_LABELS[request.status]}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowOrderModal(true);
                          }}
                          style={{
                            backgroundColor: '#6366f1',
                            color: 'white',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          📄 보기
                        </button>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {request.status === 'in_transit' ? (
                          <button
                            onClick={() => {
                              if (window.confirm('이 요청을 완료 처리하시겠습니까?')) {
                                handleComplete(request.id);
                              }
                            }}
                            style={{
                              backgroundColor: '#10b981',
                              color: 'white',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '0.375rem',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            완료
                          </button>
                        ) : request.status === 'completed' ? (
                          <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>✓</span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 주문서 모달 */}
      {showOrderModal && selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem' }}>
              📄 재고 요청 주문서
            </h3>

            {/* 발신자 정보 */}
            <div style={{ marginBottom: '1.5rem', backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #3b82f6' }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.5rem' }}>보내는 사람</p>
              <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {selectedRequest.fromStoreName} - {selectedRequest.adminName || '관리자'}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, marginTop: '0.25rem' }}>
                📧 {selectedRequest.adminEmail || '이메일 미등록'}
              </p>
            </div>

            {/* 수신자 정보 */}
            <div style={{ marginBottom: '1.5rem', backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #10b981' }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, marginBottom: '0.5rem' }}>받는 사람</p>
              <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {currentStore?.name}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, marginTop: '0.25rem' }}>
                📧 {myEmail || '이메일 미등록'}
              </p>
            </div>

            {/* 주문 내용 */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.5rem 0', color: '#6b7280', width: '30%' }}>📦 제품명</td>
                    <td style={{ padding: '0.5rem 0', fontWeight: '600' }}>{selectedRequest.item}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.5rem 0', color: '#6b7280' }}>📏 사이즈</td>
                    <td style={{ padding: '0.5rem 0', fontWeight: '600' }}>{selectedRequest.size || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.5rem 0', color: '#6b7280' }}>🔢 수량</td>
                    <td style={{ padding: '0.5rem 0', fontWeight: '600', color: '#3b82f6' }}>{selectedRequest.quantity}개</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.5rem 0', color: '#6b7280' }}>📅 요청일</td>
                    <td style={{ padding: '0.5rem 0' }}>
                      {new Date(selectedRequest.createdAt || selectedRequest.requestDate).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 메시지 */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', border: '1px dashed #f59e0b' }}>
              <p style={{ fontSize: '0.875rem', color: '#78350f', margin: 0, lineHeight: '1.6' }}>
                안녕하세요,<br/>
                재고 요청 부탁드립니다.<br/>
                확인 후 출고 처리 부탁드리겠습니다.<br/>
                감사합니다.
              </p>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowOrderModal(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
