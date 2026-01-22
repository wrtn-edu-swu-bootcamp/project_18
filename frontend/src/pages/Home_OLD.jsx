import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStores } from '../utils/api';

const API_BASE = 'http://localhost:3001/api';

export default function Home() {
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [myStore, setMyStore] = useState(null);
  const [adminName, setAdminName] = useState('');
  const [todayStats, setTodayStats] = useState({ outgoing: 0, repairs: 0, pending: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ 
    topRequests: [], 
    emptyDisplay: [], 
    avgProcessingTime: 0 
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (stores.length > 0) {
      // localStorage에서 myStore 이름 가져오기 (Login에서 설정)
      const storedMyStoreName = localStorage.getItem('myStore');
      const storedAdminName = localStorage.getItem('adminName');
      console.log('🏠 Home - localStorage myStore:', storedMyStoreName);
      console.log('🏠 Home - localStorage adminName:', storedAdminName);
      
      setAdminName(storedAdminName || 'admin1');
      
      let myStoreObj;
      
      if (storedMyStoreName) {
        myStoreObj = stores.find(s => s.name === storedMyStoreName) || stores[0];
      } else {
        myStoreObj = stores.find(s => s.id === 'store-nowon') || stores[0];
      }
      
      setMyStore(myStoreObj);
      console.log('🏠 Home - myStore 설정:', myStoreObj.name);
      
      loadTodayStats(myStoreObj.id);
      loadMonthlyStats(myStoreObj.id);
      
      // currentStore도 동일하게 설정
      const storedCurrentName = localStorage.getItem('currentStore');
      if (storedCurrentName) {
        const currentStoreObj = stores.find(s => s.name === storedCurrentName) || myStoreObj;
        setCurrentStore(currentStoreObj);
        // localStorage에 저장
        localStorage.setItem('currentStore', currentStoreObj.name);
        console.log('🏠 Home - currentStore 설정 (기존):', currentStoreObj.name);
      } else {
        setCurrentStore(myStoreObj);
        // localStorage에 저장
        localStorage.setItem('currentStore', myStoreObj.name);
        console.log('🏠 Home - currentStore 설정 (신규):', myStoreObj.name);
      }
      
      // localStorage 최종 확인
      console.log('🏠 Home - localStorage 저장 완료:', {
        myStore: localStorage.getItem('myStore'),
        currentStore: localStorage.getItem('currentStore'),
        adminName: localStorage.getItem('adminName')
      });
    }
  }, [stores]);

  async function loadStores() {
    try {
      const data = await getStores();
      setStores(data);
    } catch (error) {
      console.error('매장 불러오기 실패:', error);
    }
  }

  async function loadTodayStats(storeId) {
    try {
      const [outgoingRes, repairsRes, requestsRes] = await Promise.all([
        fetch(`${API_BASE}/requests/outgoing/${storeId}`),
        fetch(`${API_BASE}/repairs/store/${storeId}`),
        fetch(`${API_BASE}/requests/incoming/${storeId}`)
      ]);
      
      const outgoing = await outgoingRes.json();
      const repairs = await repairsRes.json();
      const requests = await requestsRes.json();
      
      const today = new Date().toISOString().split('T')[0];
      
      setTodayStats({
        outgoing: outgoing.filter(r => r.status === 'requested' || r.status === 'approved').length,
        repairs: repairs.filter(r => r.repairStatus === '수선 완료' && !r.delivered).length,
        pending: requests.filter(r => r.status !== 'completed').length
      });
    } catch (error) {
      console.error('오늘 통계 불러오기 실패:', error);
    }
  }

  async function loadMonthlyStats(storeId) {
    try {
      const [requestsRes, inventoryRes] = await Promise.all([
        fetch(`${API_BASE}/requests`),
        fetch(`${API_BASE}/stores/${storeId}/inventory`)
      ]);
      
      const requests = await requestsRes.json();
      const inventory = await inventoryRes.json();
      
      // 1. 품목별 요청 TOP 5
      const itemCounts = {};
      requests.forEach(r => {
        if (r.toStoreId === storeId || r.fromStoreId === storeId) {
          itemCounts[r.item] = (itemCounts[r.item] || 0) + r.quantity;
        }
      });
      
      const topRequests = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([item, count]) => ({ item, count }));
      
      // 2. 진열 공백 품목 (진열 수량이 0인 품목)
      const emptyDisplay = inventory
        .filter(item => (item.displayQuantity || 0) === 0 && (item.stockQuantity || 0) > 0)
        .slice(0, 5)
        .map(item => ({ 
          item: item.id, 
          stockQuantity: item.stockQuantity 
        }));
      
      // 3. 요청 → 발송까지 평균 처리 시간 (완료된 요청만)
      const completedRequests = requests.filter(r => 
        r.status === 'completed' && 
        r.createdAt && 
        r.updatedAt &&
        (r.toStoreId === storeId || r.fromStoreId === storeId)
      );
      
      let avgProcessingTime = 0;
      if (completedRequests.length > 0) {
        const totalTime = completedRequests.reduce((sum, r) => {
          const start = new Date(r.createdAt);
          const end = new Date(r.updatedAt);
          const hours = (end - start) / (1000 * 60 * 60); // 시간 단위
          return sum + hours;
        }, 0);
        avgProcessingTime = Math.round(totalTime / completedRequests.length);
      }
      
      setMonthlyStats({
        topRequests,
        emptyDisplay,
        avgProcessingTime
      });
    } catch (error) {
      console.error('월간 통계 불러오기 실패:', error);
    }
  }

  function handleStoreChange(store) {
    setCurrentStore(store);
    localStorage.setItem('currentStore', store.name);
  }

  const isMyStore = currentStore?.id === myStore?.id;

  const commonMenus = [
    { name: '전체 재고', path: '/inventory', icon: '📦', color: '#10b981', description: '현재 매장 재고 현황' },
    { name: '입고 대기', path: '/incoming', icon: '📨', color: '#f59e0b', description: '다른 매장에 요청한 재고' },
    { name: '출고 대기', path: '/outgoing', icon: '📤', color: '#ef4444', description: '타 매장이 요청한 재고' },
  ];

  const localMenus = [
    { name: '재고봇', path: '/chat', icon: '🤖', color: '#3b82f6', description: 'GPT 기반 재고 요청' },
    { name: '거래 내역', path: '/history', icon: '📊', color: '#8b5cf6', description: '요청/응답 거래 기록' },
    { name: '수선 관리', path: '/repairs', icon: '🧵', color: '#ec4899', description: '수선 요청 및 처리 내역' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* 상단 헤더 - 컴팩트 */}
      <div style={{ backgroundColor: '#1e293b', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.5rem' }}>🏪</div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, marginBottom: '0.25rem' }}>
                {myStore?.name || '노원점'}
              </h1>
              <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: 0 }}>
                관리자: {adminName} | S2S 재고 관리
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('로그아웃 하시겠습니까?')) {
                localStorage.clear();
                navigate('/');
              }
            }}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: '0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          >
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1.5rem 1.5rem' }}>

        {/* 긴급 업무 - 최우선 */}
        {isMyStore && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>⚡</span>
                긴급 처리 필요
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                실시간 업데이트
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              
              {/* 오늘 출고 예정 */}
              <div
                onClick={() => navigate('/outgoing')}
                style={{ 
                  backgroundColor: 'white',
                  border: '2px solid #fbbf24',
                  borderRadius: '0.75rem', 
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(251, 191, 36, 0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.15)';
                }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: '#fef3c7', 
                  borderRadius: '0 0 0 100%',
                  opacity: 0.5
                }}></div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    width: '3rem', 
                    height: '3rem', 
                    borderRadius: '0.5rem', 
                    backgroundColor: '#fef3c7', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: '0.75rem',
                    border: '2px solid #fbbf24'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>📦</span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#92400e', fontWeight: '600' }}>출고 처리</p>
                </div>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#d97706', position: 'relative', zIndex: 1 }}>
                  {todayStats.outgoing}<span style={{ fontSize: '1.25rem', marginLeft: '0.25rem' }}>건</span>
                </p>
              </div>

              {/* 수선 완료 후 전달 필요 */}
              <div
                onClick={() => navigate('/repairs', { state: { initialTab: '수선 완료' } })}
                style={{ 
                  backgroundColor: 'white',
                  border: '2px solid #ec4899',
                  borderRadius: '0.75rem', 
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(236, 72, 153, 0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(236, 72, 153, 0.15)';
                }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: '#fce7f3', 
                  borderRadius: '0 0 0 100%',
                  opacity: 0.5
                }}></div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    width: '3rem', 
                    height: '3rem', 
                    borderRadius: '0.5rem', 
                    backgroundColor: '#fce7f3', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: '0.75rem',
                    border: '2px solid #ec4899'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>🧵</span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#831843', fontWeight: '600' }}>수선 완료 후 전달 필요</p>
                </div>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#db2777', position: 'relative', zIndex: 1 }}>
                  {todayStats.repairs}<span style={{ fontSize: '1.25rem', marginLeft: '0.25rem' }}>건</span>
                </p>
              </div>

              {/* 입고 처리 중 */}
              <div
                onClick={() => navigate('/incoming')}
                style={{ 
                  backgroundColor: 'white',
                  border: '2px solid #3b82f6',
                  borderRadius: '0.75rem', 
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)';
                }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: '#dbeafe', 
                  borderRadius: '0 0 0 100%',
                  opacity: 0.5
                }}></div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    width: '3rem', 
                    height: '3rem', 
                    borderRadius: '0.5rem', 
                    backgroundColor: '#dbeafe', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: '0.75rem',
                    border: '2px solid #3b82f6'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>📨</span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#1e3a8a', fontWeight: '600' }}>입고 처리 중</p>
                </div>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2563eb', position: 'relative', zIndex: 1 }}>
                  {todayStats.pending}<span style={{ fontSize: '1.25rem', marginLeft: '0.25rem' }}>건</span>
                </p>
              </div>

            </div>
          </div>
        )}

        {/* 로컬 메뉴 (내 매장일 때만) */}
        {isMyStore && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              🔐 로컬 메뉴 (내 매장 전용)
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem' 
            }}>
              {localMenus.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '0.5rem', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                    padding: '1.5rem', 
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    border: '2px solid #3b82f6'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ 
                      width: '3rem', 
                      height: '3rem', 
                      borderRadius: '50%', 
                      backgroundColor: item.color, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '1.5rem',
                      marginRight: '1rem'
                    }}>
                      {item.icon}
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                      {item.name}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 통계 대시보드 (내 매장일 때만) */}
        {isMyStore && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              📈 주요 통계
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              
              {/* 품목별 요청 TOP 5 */}
              <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🏆</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>품목별 요청 TOP 5</h3>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  {monthlyStats.topRequests.length > 0 ? (
                    monthlyStats.topRequests.map((item, index) => (
                      <div 
                        key={index}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.375rem',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                          {index + 1}. {item.item}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#3b82f6' }}>
                          {item.count}개
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>
                      요청 내역이 없습니다
                    </p>
                  )}
                </div>
              </div>

              {/* 진열 공백 품목 */}
              <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>진열 공백 품목</h3>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  {monthlyStats.emptyDisplay.length > 0 ? (
                    monthlyStats.emptyDisplay.map((item, index) => (
                      <div 
                        key={index}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          backgroundColor: '#fffbeb',
                          borderRadius: '0.375rem',
                          border: '1px solid #fbbf24'
                        }}
                      >
                        <span style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: '500' }}>
                          {item.item}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#78350f' }}>
                          창고: {item.stockQuantity}개
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#10b981', textAlign: 'center', padding: '1rem' }}>
                      ✓ 모든 품목이 진열되어 있습니다
                    </p>
                  )}
                </div>
              </div>

              {/* 평균 처리 시간 */}
              <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>⏱️</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>평균 처리 시간</h3>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>요청 → 발송 완료</p>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#10b981', lineHeight: '1' }}>
                    {monthlyStats.avgProcessingTime}
                  </p>
                  <p style={{ fontSize: '1rem', color: '#6b7280', marginTop: '0.5rem' }}>시간</p>
                </div>
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '0.75rem', 
                  backgroundColor: monthlyStats.avgProcessingTime <= 24 ? '#d1fae5' : '#fee2e2',
                  borderRadius: '0.375rem',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    color: monthlyStats.avgProcessingTime <= 24 ? '#065f46' : '#991b1b'
                  }}>
                    {monthlyStats.avgProcessingTime <= 24 ? '✓ 목표 달성 (24시간 이내)' : '⚠️ 처리 시간 개선 필요'}
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 안내 문구 */}
        <div style={{ 
          backgroundColor: '#eff6ff', 
          border: '1px solid #bfdbfe', 
          borderRadius: '0.5rem', 
          padding: '1.5rem' 
        }}>
          <p style={{ color: '#1e40af', fontSize: '0.875rem', lineHeight: '1.6' }}>
            안녕하세요, 매장 간 재고 이동 및 수선 관리를 위한 시스템에 접속하셨습니다.<br />
            상단에서 <strong>매장을 선택</strong>한 후, 필요한 기능을 이용해 업무를 시작하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
