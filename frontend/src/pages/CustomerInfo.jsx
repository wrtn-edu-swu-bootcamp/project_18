import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStores } from '../utils/api';

const STYLES = ['모던', '캐주얼', '클래식', '스트릿', '빈티지', '미니멀'];
const CATEGORIES = ['OUTERWEAR', 'KNITWEAR', 'T-SHIRT', 'BLOUSE', 'DRESS&SKIRT', 'PANTS', 'ACC'];
const COLORS = ['BLACK', 'WHITE', 'GRAY', 'BROWN', 'BEIGE', 'BLUE', 'PINK'];

// 더미 이름 생성
const LAST_NAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
const FIRST_NAMES = ['민준', '서연', '하윤', '도윤', '지우', '서준', '지유', '예준', '수아', '지호'];

function generateRandomCustomer(offsetMinutes = 0) {
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const name = `${lastName}*${firstName.charAt(0)}`;
  
  const age = Math.floor(Math.random() * 40) + 20; // 20-59세
  const style = STYLES[Math.floor(Math.random() * STYLES.length)];
  const phone = `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 900) + 100}`;
  
  // 이메일 생성
  const emailDomains = ['gmail.com', 'naver.com', 'daum.net', 'kakao.com'];
  const selectedDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
  
  let emailPrefix;
  if (selectedDomain === 'gmail.com') {
    // Gmail: 영문 + 숫자 조합 (점이나 언더스코어 포함 가능)
    const randomLetters = Math.random().toString(36).substring(2, 8); // 랜덤 영문
    const randomNumbers = Math.floor(Math.random() * 9999) + 100;
    const separators = ['.', '_', ''];
    const separator = separators[Math.floor(Math.random() * separators.length)];
    emailPrefix = `${randomLetters}${separator}${randomNumbers}`;
  } else {
    // 네이버, 다음, 카카오: 한글 이름 기반
    emailPrefix = `${firstName.toLowerCase()}${Math.floor(Math.random() * 999) + 1}`;
  }
  
  const email = `${emailPrefix}@${selectedDomain}`;
  
  // 구매 이력 (1-3개)
  const purchaseCount = Math.floor(Math.random() * 3) + 1;
  const purchases = [];
  for (let i = 0; i < purchaseCount; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const quantity = Math.floor(Math.random() * 2) + 1;
    const price = (Math.floor(Math.random() * 10) + 3) * 10000; // 30,000 - 120,000원
    purchases.push({
      item: `${category}_${color}`,
      quantity,
      price
    });
  }
  
  const totalAmount = purchases.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  
  // 방문 시간 설정 (offsetMinutes만큼 과거)
  const visitedAt = new Date();
  visitedAt.setMinutes(visitedAt.getMinutes() - offsetMinutes);
  
  return {
    id: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    age,
    style,
    phone,
    email,
    purchases,
    totalAmount,
    visitedAt: visitedAt.toISOString(),
    notes: ''
  };
}

export default function CustomerInfo() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [filterStyle, setFilterStyle] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function initialize() {
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
        
        // 초기 더미 데이터 5명 생성 (다른 시간대에 방문한 것처럼)
        const initialCustomers = [
          generateRandomCustomer(120), // 2시간 전
          generateRandomCustomer(90),  // 1시간 30분 전
          generateRandomCustomer(60),  // 1시간 전
          generateRandomCustomer(30),  // 30분 전
          generateRandomCustomer(0)    // 지금
        ];
        setCustomers(initialCustomers);
      } catch (error) {
        console.error('매장 정보 로드 실패:', error);
        navigate('/');
      }
    }
    
    initialize();
  }, [navigate]);

  // 3분마다 자동으로 고객 추가
  useEffect(() => {
    const interval = setInterval(() => {
      const newCustomer = generateRandomCustomer();
      setCustomers(prev => [newCustomer, ...prev]);
      console.log('🆕 새로운 고객 정보 추가:', newCustomer.name);
    }, 3 * 60 * 1000); // 3분 = 180,000ms
    
    return () => clearInterval(interval);
  }, []);

  // 필터 적용
  useEffect(() => {
    let filtered = [...customers];
    
    // 스타일 필터
    if (filterStyle !== 'all') {
      filtered = filtered.filter(c => c.style === filterStyle);
    }
    
    // 연령 필터
    if (filterAge !== 'all') {
      filtered = filtered.filter(c => {
        if (filterAge === '20s') return c.age >= 20 && c.age < 30;
        if (filterAge === '30s') return c.age >= 30 && c.age < 40;
        if (filterAge === '40s') return c.age >= 40 && c.age < 50;
        if (filterAge === '50s') return c.age >= 50;
        return true;
      });
    }
    
    // 검색어 필터
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.includes(searchTerm) ||
        c.phone.includes(searchTerm) ||
        c.email.toLowerCase().includes(lowerSearch) ||
        c.purchases.some(p => p.item.toLowerCase().includes(lowerSearch))
      );
    }
    
    setFilteredCustomers(filtered);
  }, [customers, filterStyle, filterAge, searchTerm]);

  function handleViewDetail(customer) {
    setSelectedCustomer(customer);
    setShowDetail(true);
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  if (!currentStore) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ← 뒤로
          </button>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            👥 고객 정보
          </h1>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {currentStore.name}
        </div>
      </div>

      {/* 필터 영역 */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
              스타일 선호도
            </label>
            <select
              value={filterStyle}
              onChange={(e) => setFilterStyle(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              <option value="all">전체</option>
              {STYLES.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
              연령대
            </label>
            <select
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              <option value="all">전체</option>
              <option value="20s">20대</option>
              <option value="30s">30대</option>
              <option value="40s">40대</option>
              <option value="50s">50대 이상</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
              검색
            </label>
            <input
              type="text"
              placeholder="이름, 전화번호, 이메일, 상품명"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
            />
          </div>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          총 {filteredCustomers.length}명의 고객 정보 | 💡 스타일 선호도와 구매 이력을 기반으로 고객을 분석합니다
        </div>
      </div>

      {/* 고객 테이블 */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f3f4f6' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>고객명</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>연령</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>스타일</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>이메일</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>최근 구매</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>총 구매액</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>방문 시간</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>상세</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    고객 정보가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '500' }}>{customer.name}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center' }}>{customer.age}세</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.5rem', 
                        backgroundColor: '#dbeafe', 
                        color: '#1e40af', 
                        borderRadius: '0.25rem',
                        fontWeight: '600'
                      }}>
                        {customer.style}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#3b82f6' }}>{customer.email}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {customer.purchases[0]?.item} {customer.purchases.length > 1 && `외 ${customer.purchases.length - 1}개`}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600' }}>
                      {customer.totalAmount.toLocaleString()}원
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                      {formatTimestamp(customer.visitedAt)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleViewDetail(customer)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        📊 보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 고객 상세 정보 모달 */}
      {showDetail && selectedCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111827' }}>
              📊 고객 프로필 분석
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>고객명</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{selectedCustomer.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>연령</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{selectedCustomer.age}세</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>선호 스타일</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{selectedCustomer.style}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>전화번호</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', fontFamily: 'monospace' }}>{selectedCustomer.phone}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>📧 이메일</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{selectedCustomer.email}</p>
                </div>
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#111827' }}>📦 구매 이력</p>
                {selectedCustomer.purchases.map((purchase, index) => (
                  <div key={index} style={{ 
                    padding: '0.75rem', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>{purchase.item}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>수량: {purchase.quantity}개</p>
                    </div>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3b82f6' }}>
                      {(purchase.price * purchase.quantity).toLocaleString()}원
                    </p>
                  </div>
                ))}
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#eff6ff', 
                  borderRadius: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>총 구매액</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2563eb' }}>
                    {selectedCustomer.totalAmount.toLocaleString()}원
                  </p>
                </div>
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>🕒 최근 방문 시간</p>
                <p style={{ fontSize: '0.875rem', color: '#111827' }}>
                  {new Date(selectedCustomer.visitedAt).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDetail(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
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
