import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStores } from '../utils/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [managers, setManagers] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [filterManager, setFilterManager] = useState('all');
  const [sortOrder, setSortOrder] = useState('latest');
  const navigate = useNavigate();

  useEffect(() => {
    async function initializeLogs() {
      const storedId = localStorage.getItem('myStore');
      if (!storedId) {
        navigate('/');
        return;
      }
      
      try {
        const stores = await getStores();
        const store = stores.find(s => s.id === storedId);
        
        if (!store) {
          navigate('/');
          return;
        }
        
        setCurrentStore(store);
        loadLogs(store.id);
      } catch (error) {
        console.error('매장 정보 로드 실패:', error);
        navigate('/');
      }
    }
    
    initializeLogs();
  }, [navigate]);

  useEffect(() => {
    applyFilters();
  }, [logs, filterType, filterDate, filterManager, sortOrder]);

  async function loadLogs(storeId) {
    try {
      // 전체 매장 정보 가져오기
      const stores = await getStores();
      
      // 전체 수선 내역 가져오기
      let allRepairs = [];
      let allOutgoing = [];
      let allIncoming = [];
      
      for (const store of stores) {
        const repairsResponse = await fetch(`${API_BASE}/repairs/store/${store.id}`);
        const repairs = await repairsResponse.json();
        allRepairs = allRepairs.concat(repairs);
        
        const outgoingResponse = await fetch(`${API_BASE}/requests/outgoing/${store.id}`);
        const outgoing = await outgoingResponse.json();
        allOutgoing = allOutgoing.concat(outgoing);
        
        const incomingResponse = await fetch(`${API_BASE}/requests/incoming/${store.id}`);
        const incoming = await incomingResponse.json();
        allIncoming = allIncoming.concat(incoming);
      }
      
      const repairs = allRepairs;
      const outgoing = allOutgoing;
      const incoming = allIncoming;
      
      // 로그 생성
      const allLogs = [];
      
      // 수선 로그
      repairs.forEach(repair => {
        allLogs.push({
          id: `repair-${repair.id}`,
          type: 'repair',
          action: '수선 등록',
          description: `${repair.customerName} - ${repair.productId} (${repair.repairContent})`,
          manager: repair.adminName || 'admin1',
          adminName: repair.adminName || 'admin1',
          status: repair.repairStatus,
          timestamp: repair.createdAt,
          storeName: repair.storeName,
          details: repair
        });
        
        if (repair.repairStatus === '수선 중' && repair.sentAt) {
          allLogs.push({
            id: `repair-sent-${repair.id}`,
            type: 'repair',
            action: '수선 발송',
            description: `${repair.customerName} - ${repair.productId} 수선 발송`,
            manager: repair.adminName || 'admin1',
            adminName: repair.adminName || 'admin1',
            status: '수선 중',
            timestamp: repair.sentAt,
            storeName: repair.storeName,
            details: repair
          });
        }
        
        if (repair.repairStatus === '수선 완료' && repair.completedAt) {
          allLogs.push({
            id: `repair-completed-${repair.id}`,
            type: 'repair',
            action: '수선 완료',
            description: `${repair.customerName} - ${repair.productId} 수선 완료`,
            manager: repair.adminName || 'admin1',
            adminName: repair.adminName || 'admin1',
            status: '수선 완료',
            timestamp: repair.completedAt,
            storeName: repair.storeName,
            details: repair
          });
        }
      });
      
      // 출고 요청 로그 (다른 매장이 우리에게 요청)
      outgoing.forEach(request => {
        allLogs.push({
          id: `outgoing-${request.id}`,
          type: 'outgoing',
          action: '출고 요청 받음',
          description: `${request.toStoreName}에서 ${request.item} ${request.quantity}개 요청`,
          manager: request.adminName || 'admin1',
          adminName: request.adminName || 'admin1',
          status: request.status === 'requested' ? '요청됨' : request.status === 'approved' ? '승인됨' : request.status === 'in_transit' ? '배송중' : '완료',
          timestamp: request.requestedAt || request.createdAt,
          storeName: request.fromStoreName,
          details: request
        });
        
        if (request.status === 'in_transit' && request.shippedAt) {
          allLogs.push({
            id: `outgoing-shipped-${request.id}`,
            type: 'outgoing',
            action: '출고 처리',
            description: `${request.toStoreName}로 ${request.item} ${request.quantity}개 발송`,
            manager: request.adminName || 'admin1',
            adminName: request.adminName || 'admin1',
            status: '배송중',
            timestamp: request.shippedAt,
            storeName: request.fromStoreName,
            details: request
          });
        }
      });
      
      // 입고 요청 로그 (우리가 다른 매장에 요청)
      incoming.forEach(request => {
        allLogs.push({
          id: `incoming-${request.id}`,
          type: 'incoming',
          action: '재고 요청',
          description: `${request.fromStoreName}에 ${request.item} ${request.quantity}개 요청`,
          manager: request.adminName || 'admin1',
          adminName: request.adminName || 'admin1',
          status: request.status === 'requested' ? '요청됨' : request.status === 'approved' ? '승인됨' : request.status === 'in_transit' ? '배송중' : '완료',
          timestamp: request.requestedAt || request.createdAt,
          storeName: request.toStoreName,
          details: request
        });
        
        if (request.status === 'completed' && request.completedAt) {
          allLogs.push({
            id: `incoming-completed-${request.id}`,
            type: 'incoming',
            action: '입고 완료',
            description: `${request.fromStoreName}에서 ${request.item} ${request.quantity}개 입고`,
            manager: request.adminName || 'admin1',
            adminName: request.adminName || 'admin1',
            status: '완료',
            timestamp: request.completedAt,
            storeName: request.toStoreName,
            details: request
          });
        }
      });
      
      // 관리자 목록 고정 (admin1, admin2, admin3, admin4)
      setManagers(['admin1', 'admin2', 'admin3', 'admin4']);
      
      // 시간순 정렬 (최신순)
      allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setLogs(allLogs);
    } catch (error) {
      console.error('로그 불러오기 실패:', error);
    }
  }

  function applyFilters() {
    let filtered = [...logs];
    
    // 관리자 필터
    if (filterManager !== 'all') {
      filtered = filtered.filter(log => (log.adminName || log.manager) === filterManager);
    }
    
    // 타입 필터
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }
    
    // 날짜 필터
    if (filterDate !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        
        if (filterDate === 'today') {
          return logDate >= today;
        } else if (filterDate === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return logDate >= weekAgo;
        } else if (filterDate === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return logDate >= monthAgo;
        }
        return true;
      });
    }
    
    // 정렬 순서
    if (sortOrder === 'latest') {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    
    setFilteredLogs(filtered);
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getTypeIcon(type) {
    switch (type) {
      case 'repair': return '🧵';
      case 'incoming': return '📨';
      case 'outgoing': return '📤';
      default: return '📋';
    }
  }

  function getTypeColor(type) {
    switch (type) {
      case 'repair': return { bg: '#fdf2f8', border: '#ec4899', text: '#be185d' };
      case 'incoming': return { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' };
      case 'outgoing': return { bg: '#fff7ed', border: '#f97316', text: '#c2410c' };
      default: return { bg: '#f9fafb', border: '#6b7280', text: '#374151' };
    }
  }

  function getTypeName(type) {
    switch (type) {
      case 'repair': return '수선';
      case 'incoming': return '입고';
      case 'outgoing': return '출고';
      default: return '기타';
    }
  }

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
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>📋 관리자 기록</h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>전체 매장 활동</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              총 {filteredLogs.length}개 활동
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* 필터 */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                관리자
              </label>
              <select
                value={filterManager}
                onChange={(e) => setFilterManager(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">전체</option>
                {managers.map(manager => (
                  <option key={manager} value={manager}>{manager}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                정렬 순서
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                기간
              </label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">전체</option>
                <option value="today">오늘</option>
                <option value="week">최근 7일</option>
                <option value="month">최근 30일</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                활동 유형
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">전체</option>
                <option value="repair">수선 관리</option>
                <option value="incoming">재고 요청 (입고)</option>
                <option value="outgoing">재고 응답 (출고)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 로그 타임라인 */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>📭</p>
              <p>활동 기록이 없습니다.</p>
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              {filteredLogs.map((log, index) => {
                const colors = getTypeColor(log.type);
                return (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      paddingBottom: '1.5rem',
                      marginBottom: index < filteredLogs.length - 1 ? '1.5rem' : 0,
                      borderBottom: index < filteredLogs.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    {/* 아이콘 */}
                    <div style={{
                      flexShrink: 0,
                      width: '3rem',
                      height: '3rem',
                      backgroundColor: colors.bg,
                      border: `2px solid ${colors.border}`,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      {getTypeIcon(log.type)}
                    </div>

                    {/* 내용 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '0.25rem',
                              fontWeight: '600'
                            }}>
                              {getTypeName(log.type)}
                            </span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                              {log.action}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, marginBottom: '0.5rem' }}>
                            {log.description}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                            <span>🏪 {log.storeName}</span>
                            <span>•</span>
                            <span>👤 {log.adminName || log.manager}</span>
                            <span>•</span>
                            <span>📊 {log.status}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                            {formatTimestamp(log.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
