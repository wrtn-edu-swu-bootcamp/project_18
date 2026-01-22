import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStores } from '../utils/api';

const API_BASE = 'http://localhost:3001/api';

export default function InventoryRequest() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [myStore, setMyStore] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedStoreForRequest, setSelectedStoreForRequest] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [includeDisplay, setIncludeDisplay] = useState(false);
  const [specialNote, setSpecialNote] = useState('');

  const categories = ['OUTERWEAR', 'KNITWEAR', 'T-SHIRT', 'BLOUSE', 'DRESS&SKIRT', 'PANTS', 'ACC'];
  const colors = ['BLACK', 'WHITE', 'BLUE', 'BROWN', 'PINK', 'BEIGE', 'GRAY', 'GREEN'];
  const allSizes = ['XS', 'S', 'M', 'L', 'XL', '26', '27', '28', '29', 'FREE'];
  const sizesByCategory = {
    'OUTERWEAR': ['XS', 'S', 'M', 'L', 'XL'],
    'KNITWEAR': ['XS', 'S', 'M', 'L', 'XL'],
    'T-SHIRT': ['XS', 'S', 'M', 'L', 'XL'],
    'BLOUSE': ['XS', 'S', 'M', 'L', 'XL'],
    'DRESS&SKIRT': ['XS', 'S', 'M', 'L', 'XL'],
    'PANTS': ['26', '27', '28', '29'],
    'ACC': ['FREE']
  };

  useEffect(() => {
    async function init() {
      const myStoreId = localStorage.getItem('myStore');
      const email = localStorage.getItem('adminEmail') || '';
      const name = localStorage.getItem('adminName') || '';
      
      if (!myStoreId) {
        alert('로그인이 필요합니다.');
        navigate('/');
        return;
      }

      const storesData = await getStores();
      setStores(storesData);
      
      const myStoreData = storesData.find(s => s.id === myStoreId);
      if (!myStoreData) {
        alert('매장 정보를 찾을 수 없습니다.');
        navigate('/');
        return;
      }

      setMyStore(myStoreData);
      setAdminEmail(email);
      setAdminName(name);
    }
    init();
  }, [navigate]);

  function handleSearch() {
    if (!selectedCategory && !selectedColor && !selectedSize) {
      alert('최소 한 가지 이상 선택해주세요.');
      return;
    }

    console.log('🔍 검색 조건:', { selectedCategory, selectedColor, selectedSize });

    const results = [];
    
    stores.forEach(store => {
      const matchingItems = store.inventory.filter(item => {
        // 카테고리 필터
        if (selectedCategory && item.category !== selectedCategory) {
          return false;
        }
        // 색상 필터
        if (selectedColor && item.color !== selectedColor) {
          return false;
        }
        // 사이즈 필터
        if (selectedSize && item.size !== selectedSize) {
          return false;
        }
        return true;
      });

      matchingItems.forEach(item => {
        results.push({
          storeId: store.id,
          storeName: store.name,
          storeEmail: store.email,
          isMyStore: store.id === myStore?.id,
          ...item
        });
      });
    });

    console.log('📦 검색 결과:', results);
    setSearchResults(results);
    setShowResults(true);
  }

  function handleOpenRequestModal(storeResult) {
    setSelectedStoreForRequest(storeResult);
    setRecipientEmail(storeResult.storeEmail);
    setQuantity(1);
    setIncludeDisplay(false);
    setSpecialNote('');
    setShowRequestModal(true);
  }

  async function handleSendRequest() {
    if (!quantity || quantity < 1) {
      alert('수량을 입력해주세요.');
      return;
    }

    if (!recipientEmail) {
      alert('수신자 이메일을 입력해주세요.');
      return;
    }

    const maxQuantity = selectedStoreForRequest.stockQuantity + (includeDisplay ? selectedStoreForRequest.displayQuantity : 0);
    if (quantity > maxQuantity) {
      alert(`요청 수량이 재고보다 많습니다. (최대 ${maxQuantity}개)`);
      return;
    }

    const productName = `${selectedStoreForRequest.category}_${selectedStoreForRequest.color}`;

    try {
      const response = await fetch(`${API_BASE}/send-request-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: `[재고 요청] ${myStore.name} → ${selectedStoreForRequest.storeName}`,
          content: `
안녕하세요, ${selectedStoreForRequest.storeName} 담당자님

${myStore.name}에서 재고 요청 드립니다.

[요청 내역]
- 제품: ${productName}
- 사이즈: ${selectedStoreForRequest.size}
- 수량: ${quantity}개
- 진열 상품 포함: ${includeDisplay ? '예' : '아니오'}
${specialNote ? `- 특이사항: ${specialNote}` : ''}

확인 후 처리 부탁드립니다.
감사합니다.

발신: ${myStore.name} (${adminName})
          `,
          fromStore: myStore.id,
          toStore: selectedStoreForRequest.storeId,
          item: productName,
          quantity: parseInt(quantity),
          includeDisplay: includeDisplay,
          specialNote: specialNote,
          adminName: adminName,
          adminEmail: adminEmail
        })
      });

      if (response.ok) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 재고 요청 이메일 발송 (시뮬레이션)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📨 수신: ${recipientEmail}`);
        console.log(`📋 제목: [재고 요청] ${myStore.name} → ${selectedStoreForRequest.storeName}`);
        console.log(`📦 제품: ${productName} (${selectedStoreForRequest.size})`);
        console.log(`🔢 수량: ${quantity}개`);
        console.log('✅ 발송 성공! (시뮬레이션)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');

        alert(`✅ ${selectedStoreForRequest.storeName}에 재고 요청이 발송되었습니다!\n\n입고 처리 페이지에서 확인하실 수 있습니다.`);
        setShowRequestModal(false);
        setSelectedStoreForRequest(null);
      } else {
        const error = await response.json();
        alert(`❌ 이메일 발송에 실패했습니다.\n${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('재고 요청 중 오류:', error);
      alert('❌ 재고 요청 중 오류가 발생했습니다.');
    }
  }

  if (!myStore) {
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
            📧 재고 요청
          </h1>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {myStore.name} ({adminName})
        </div>
      </div>

      {/* 검색 영역 */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111827' }}>
          🔍 재고 검색
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
          원하는 제품의 조건을 선택하고 조회하세요. 전체 매장의 재고를 확인할 수 있습니다.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* 카테고리 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
              카테고리
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSize(''); // 카테고리 변경 시 사이즈 초기화
              }}
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem', cursor: 'pointer' }}
            >
              <option value="">전체</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 색상 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
              색상
            </label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem', cursor: 'pointer' }}
            >
              <option value="">전체</option>
              {colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          {/* 사이즈 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
              사이즈
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '2px solid #e5e7eb', 
                borderRadius: '0.5rem', 
                fontSize: '1rem', 
                cursor: 'pointer',
                backgroundColor: 'white',
                color: '#111827'
              }}
            >
              <option value="">전체</option>
              {(selectedCategory ? sizesByCategory[selectedCategory] : allSizes)?.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSearch}
          style={{
            width: '100%',
            padding: '1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: '0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          🔍 조회하기
        </button>
      </div>

      {/* 검색 결과 */}
      {showResults && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111827' }}>
            📦 검색 결과
          </h2>

          {searchResults.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              조건에 맞는 재고가 없습니다.
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                총 {searchResults.length}개의 재고를 찾았습니다.
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f3f4f6' }}>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>매장</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>제품</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>색상</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>사이즈</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>창고 수량</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>진열 수량</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>합계</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((result, index) => {
                      const totalQuantity = result.stockQuantity + result.displayQuantity;
                      return (
                        <tr key={index} style={{ borderTop: '1px solid #e5e7eb', backgroundColor: result.isMyStore ? '#eff6ff' : 'white' }}>
                          <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: result.isMyStore ? '600' : '400' }}>
                            {result.storeName}
                            {result.isMyStore && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', backgroundColor: '#3b82f6', color: 'white', padding: '0.125rem 0.5rem', borderRadius: '0.25rem' }}>
                                내 매장
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{result.category}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>{result.color}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>{result.size}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600' }}>{result.stockQuantity}개</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>{result.displayQuantity}개</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#3b82f6' }}>{totalQuantity}개</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            {!result.isMyStore ? (
                              <button
                                onClick={() => handleOpenRequestModal(result)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                📧 요청
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* 요청 모달 */}
      {showRequestModal && selectedStoreForRequest && (
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
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111827' }}>
              📧 재고 요청
            </h2>

            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>요청 매장</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                {selectedStoreForRequest.storeName}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>제품 정보</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                {selectedStoreForRequest.category}_{selectedStoreForRequest.color} ({selectedStoreForRequest.size})
              </p>
              <p style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.5rem' }}>
                재고: 창고 {selectedStoreForRequest.stockQuantity}개, 진열 {selectedStoreForRequest.displayQuantity}개
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                📧 수신자 이메일
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                💡 재고 요청 메일이 이 주소로 발송됩니다
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                요청 수량 (최대 {selectedStoreForRequest.stockQuantity + (includeDisplay ? selectedStoreForRequest.displayQuantity : 0)}개까지 요청 가능)
              </label>
              <input
                type="number"
                min="1"
                max={selectedStoreForRequest.stockQuantity + (includeDisplay ? selectedStoreForRequest.displayQuantity : 0)}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeDisplay}
                  onChange={(e) => setIncludeDisplay(e.target.checked)}
                  style={{ marginRight: '0.5rem', width: '1rem', height: '1rem', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>진열 상품 포함</span>
              </label>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                └ 진열 상품은 검수가 필요합니다
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                특이사항 (선택)
              </label>
              <textarea
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="특별히 전달할 내용이 있으면 입력하세요"
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedStoreForRequest(null);
                }}
                style={{
                  flex: 1,
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
                취소
              </button>
              <button
                onClick={handleSendRequest}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                📧 메일 발송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
