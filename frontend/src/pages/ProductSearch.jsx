import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// API 함수들
async function fetchStores() {
  const response = await fetch(`${API_BASE_URL}/stores`);
  if (!response.ok) throw new Error('매장 정보를 불러오는데 실패했습니다');
  return response.json();
}

async function sendRequestEmail(recipientEmail, subject, content, fromStore, toStore, item, quantity, includeDisplay, specialNote, adminName) {
  const response = await fetch(`${API_BASE_URL}/send-request-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: recipientEmail,
      subject,
      content,
      fromStore,
      toStore,
      item,
      quantity,
      includeDisplay,
      specialNote,
      adminName
    })
  });
  return response.json();
}

function ProductSearch() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [myStore, setMyStore] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [includeDisplay, setIncludeDisplay] = useState(false);
  const [specialNote, setSpecialNote] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedColor, setSelectedColor] = useState('전체');
  const [selectedSize, setSelectedSize] = useState('전체');

  const categories = ['전체', 'OUTERWEAR', 'KNITWEAR', 'T-SHIRT', 'BLOUSE', 'DRESS&SKIRT', 'PANTS', 'ACC'];

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const myStoreId = localStorage.getItem('currentStore');
      if (!myStoreId) {
        alert('로그인이 필요합니다.');
        navigate('/');
        return;
      }

      const storesData = await fetchStores();
      setStores(storesData);

      const myStoreData = storesData.find(s => s.id === myStoreId);
      if (!myStoreData) {
        alert('매장 정보를 찾을 수 없습니다.');
        navigate('/');
        return;
      }
      setMyStore(myStoreData);
    } catch (error) {
      console.error('초기 데이터 로딩 오류:', error);
      alert('데이터 로딩에 실패했습니다.');
    }
  }

  function handleSearch() {
    if (!stores || stores.length === 0) {
      console.log('매장 데이터가 없습니다.');
      return;
    }

    console.log('🔍 검색 시작...');
    console.log('필터:', { selectedCategory, selectedColor, selectedSize });
    console.log('매장 수:', stores.length);

    const results = [];

    stores.forEach(store => {
      console.log(`\n📦 매장: ${store.name} (${store.id})`);
      console.log('재고 수:', store.inventory?.length || 0);

      if (!store.inventory || store.inventory.length === 0) {
        console.log('  ⚠️ 이 매장은 재고가 없습니다.');
        return;
      }

      store.inventory.forEach(item => {
        // 필터 적용
        const categoryMatch = selectedCategory === '전체' || item.category === selectedCategory;
        
        // 컬러 필터: color 필드에서 직접 가져오기
        const itemColor = item.color || '기타';
        const colorMatch = selectedColor === '전체' || itemColor === selectedColor;
        
        const sizeMatch = selectedSize === '전체' || item.size === selectedSize;

        if (categoryMatch && colorMatch && sizeMatch) {
          const warehouseQty = parseInt(item.stockQuantity) || 0;
          const displayQty = parseInt(item.displayQuantity) || 0;
          const totalQty = warehouseQty + displayQty;

          console.log(`  ✅ 매칭: ${item.name}_${item.color} / 창고:${warehouseQty} / 진열:${displayQty} / 합계:${totalQty}`);

          results.push({
            ...item,
            storeName: store.name,
            storeId: store.id,
            storeEmail: store.email,
            warehouseQuantity: warehouseQty,
            displayQuantity: displayQty,
            totalQuantity: totalQty,
            isMyStore: store.id === myStore?.id,
            displayName: `${item.name}_${item.color}` // 표시용 이름
          });
        }
      });
    });

    console.log(`\n🔍 검색 완료: ${results.length}개 제품 발견`);

    // 정렬: 내 매장 먼저, 그 다음 총 재고량 많은 순
    results.sort((a, b) => {
      if (a.isMyStore && !b.isMyStore) return -1;
      if (!a.isMyStore && b.isMyStore) return 1;
      return b.totalQuantity - a.totalQuantity;
    });

    setSearchResults(results);
  }

  function handleRequestClick(product) {
    setSelectedProduct(product);
    setRequestQuantity(1);
    setIncludeDisplay(false);
    setSpecialNote('');
    setRecipientEmail(product.storeEmail || '');
    setShowModal(true);
  }

  async function handleSendEmail() {
    if (!selectedProduct || !myStore) return;

    if (!recipientEmail) {
      alert('수신자 이메일을 입력해주세요.');
      return;
    }

    const adminEmail = localStorage.getItem('adminEmail') || 'nivuss@gmail.com';
    const adminName = localStorage.getItem('adminName') || 'admin4';

    const maxQuantity = includeDisplay 
      ? selectedProduct.totalQuantity 
      : selectedProduct.warehouseQuantity;

    if (requestQuantity > maxQuantity) {
      alert(`요청 수량이 재고를 초과합니다. (최대: ${maxQuantity}개)`);
      return;
    }

    const productDisplayName = selectedProduct.displayName || `${selectedProduct.name}_${selectedProduct.color}`;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <h2 style="color: #1f2937;">📦 재고 요청</h2>
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>요청 매장:</strong> ${myStore.name}</p>
          <p><strong>요청자:</strong> ${adminName}</p>
          <p><strong>제품명:</strong> ${productDisplayName}</p>
          <p><strong>사이즈:</strong> ${selectedProduct.size}</p>
          <p><strong>요청 수량:</strong> ${requestQuantity}개</p>
          <p><strong>진열 상품 포함:</strong> ${includeDisplay ? '예 (검수 필요)' : '아니오'}</p>
          ${specialNote ? `<p><strong>특이사항:</strong> ${specialNote}</p>` : ''}
        </div>
        <p style="color: #6b7280; font-size: 0.875rem;">
          이 요청을 확인하시고 출고 처리를 부탁드립니다.<br/>
          감사합니다.
        </p>
        <p style="color: #3b82f6; font-weight: 600;">
          ${myStore.name} ${adminName} 드림
        </p>
      </div>
    `;

    try {
      const response = await sendRequestEmail(
        recipientEmail,
        `[${myStore.name}] 재고 요청: ${productDisplayName} ${requestQuantity}개 📦`,
        emailContent,
        myStore.id,
        selectedProduct.storeId,
        productDisplayName,
        requestQuantity,
        includeDisplay,
        specialNote,
        adminName
      );

      if (response.success) {
        alert(`✅ ${selectedProduct.storeName}에 재고 요청 이메일이 발송되었습니다!`);
        setShowModal(false);
        // 페이지 새로고침하여 입고대기/출고대기 업데이트
        window.location.reload();
      } else {
        alert(`❌ 이메일 발송에 실패했습니다. ${response.error || ''}`);
      }
    } catch (error) {
      console.error('이메일 발송 중 오류:', error);
      alert('❌ 이메일 발송 중 오류가 발생했습니다.');
    }
  }

  // 사용 가능한 컬러 옵션 추출
  const availableColors = ['전체'];
  stores.forEach(store => {
    if (store.inventory) {
      store.inventory.forEach(item => {
        if (item.color && !availableColors.includes(item.color)) {
          availableColors.push(item.color);
        }
      });
    }
  });

  // 사용 가능한 사이즈 옵션 추출
  const availableSizes = ['전체'];
  stores.forEach(store => {
    if (store.inventory) {
      store.inventory.forEach(item => {
        if (item.size && !availableSizes.includes(item.size)) {
          availableSizes.push(item.size);
        }
      });
    }
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: 'white', padding: '1rem 2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <button
          onClick={() => navigate('/home')}
          style={{
            marginRight: '1rem',
            color: '#6b7280',
            background: 'none',
            border: 'none',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          ← 뒤로
        </button>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
          🔍 제품 조회
        </span>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* 현재 매장 정보 */}
        {myStore && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
            border: '2px solid #3b82f6',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>
              🏪 현재 로그인 매장
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              {myStore.name}
            </p>
          </div>
        )}

        {/* 필터 영역 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            🔍 검색 필터
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            {/* 카테고리 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                카테고리
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* 컬러 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                컬러
              </label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                {availableColors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            {/* 사이즈 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                사이즈
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                {availableSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            🔍 조회하기
          </button>
        </div>

        {/* 검색 결과 */}
        {searchResults.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              🔍 조회하기 버튼을 눌러 재고를 검색하세요
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              📦 검색 결과 ({searchResults.length}개)
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>매장</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>제품명</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>사이즈</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>창고 수량</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>진열 수량</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>합계</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>요청</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((product, index) => (
                  <tr
                    key={`${product.storeId}-${product.id}-${index}`}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: product.isMyStore ? '#eff6ff' : 'white'
                    }}
                  >
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: product.isMyStore ? '600' : '400' }}>
                      {product.storeName}
                      {product.isMyStore && <span style={{ color: '#3b82f6', marginLeft: '0.5rem' }}>★</span>}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '500' }}>{product.displayName || product.name}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center' }}>{product.size}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: '600', color: '#dc2626' }}>
                      {product.warehouseQuantity}개
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: '600', color: '#3b82f6' }}>
                      {product.displayQuantity}개
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>
                      {product.totalQuantity}개
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {product.isMyStore ? (
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>내 매장</span>
                      ) : (
                        <button
                          onClick={() => handleRequestClick(product)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: '0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                        >
                          📧 요청
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 이메일 발송 모달 */}
      {showModal && selectedProduct && (
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
            maxWidth: '500px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              📧 재고 요청 메일 보내기
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                요청 매장
              </label>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                {selectedProduct.storeName}
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                📧 수신자 이메일
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                💡 재고 요청 메일이 이 주소로 발송됩니다
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                제품명
              </label>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                {selectedProduct.displayName || `${selectedProduct.name}_${selectedProduct.color}`}
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                사이즈
              </label>
              <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                {selectedProduct.size}
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                요청 수량
              </label>
              <input
                type="number"
                min="1"
                max={includeDisplay ? selectedProduct.totalQuantity : selectedProduct.warehouseQuantity}
                value={requestQuantity}
                onChange={(e) => setRequestQuantity(parseInt(e.target.value) || 1)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                (최대 {includeDisplay ? selectedProduct.totalQuantity : selectedProduct.warehouseQuantity}개까지 요청 가능)
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeDisplay}
                  onChange={(e) => setIncludeDisplay(e.target.checked)}
                  style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }}
                />
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                  진열 상품 포함
                </span>
              </label>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                └ 진열 상품은 검수가 필요합니다
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                특이사항 (선택)
              </label>
              <textarea
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="추가 요청사항이 있으면 입력하세요"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              >
                취소
              </button>
              <button
                onClick={handleSendEmail}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
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

export default ProductSearch;
