import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStores, getStoreInventory, addInventoryItem, updateInventoryItem } from '../utils/api';

const CATEGORIES = ['OUTERWEAR', 'KNITWEAR', 'T-SHIRT', 'BLOUSE', 'DRESS&SKIRT', 'PANTS', 'ACC'];

const SIZE_BY_CATEGORY = {
  'OUTERWEAR': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'KNITWEAR': ['XS', 'S', 'M', 'L', 'XL'],
  'T-SHIRT': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'BLOUSE': ['XS', 'S', 'M', 'L', 'XL'],
  'DRESS&SKIRT': ['XS', 'S', 'M', 'L', 'XL'],
  'PANTS': ['26', '27', '28', '29'],
  'ACC': ['FREE']
};

export default function CurrentInventory() {
  const [inventory, setInventory] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [myStore, setMyStore] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newItem, setNewItem] = useState({ 
    category: 'OUTERWEAR',
    name: '',
    color: '', 
    size: '', 
    stockQuantity: 0,
    displayQuantity: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function initializeStore() {
      console.log('📦 CurrentInventory 초기화 시작');
      
      const storedMyName = localStorage.getItem('myStore');
      const storedCurrentName = localStorage.getItem('currentStore');
      
      console.log('📦 localStorage 내용:', { 
        myStore: storedMyName, 
        currentStore: storedCurrentName,
        전체내용: { ...localStorage }
      });
      
      if (!storedMyName) {
        console.log('❌ myStore가 localStorage에 없습니다!');
        alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
        navigate('/');
        return;
      }
      
      try {
        const stores = await getStores();
        console.log('📦 백엔드에서 가져온 매장:', stores);
        
        const myStoreData = stores.find(s => s.name === storedMyName);
        
        if (!myStoreData) {
          console.log('❌ myStore를 찾을 수 없습니다:', storedMyName);
          console.log('❌ 사용 가능한 매장:', stores.map(s => s.name));
          alert(`매장 "${storedMyName}"을 찾을 수 없습니다. 다시 로그인해주세요.`);
          navigate('/');
          return;
        }
        
        console.log('✅ myStore 찾음:', myStoreData);
        setMyStore(myStoreData);
        
        // Home에서 선택한 매장이 있으면 그 매장을, 없으면 내 매장을 표시
        if (storedCurrentName) {
          const currentStoreData = stores.find(s => s.name === storedCurrentName) || myStoreData;
          console.log('✅ currentStore 설정:', currentStoreData);
          setCurrentStore(currentStoreData);
          await loadInventory(currentStoreData.id);
        } else {
          console.log('✅ currentStore를 myStore로 설정');
          setCurrentStore(myStoreData);
          await loadInventory(myStoreData.id);
        }
        
        console.log('✅ CurrentInventory 초기화 완료!');
      } catch (error) {
        console.error('❌ 오류 발생:', error);
        alert('매장 정보를 불러오는데 실패했습니다: ' + error.message);
        // 오류가 나도 일단 로그인 페이지로 가지 말고 기다려봅시다
        // navigate('/');
      }
    }
    
    initializeStore();
  }, [navigate]);

  async function loadInventory(storeId) {
    try {
      const data = await getStoreInventory(storeId);
      setInventory(data);
    } catch (error) {
      console.error('재고 불러오기 실패:', error);
    }
  }

  async function handleAddItem() {
    if (!newItem.color || !newItem.size || newItem.stockQuantity <= 0) {
      alert('카테고리, 컬러, 사이즈, 보유 수량을 입력해주세요');
      return;
    }

    setIsLoading(true);
    try {
      const colorUpper = newItem.color.toUpperCase();
      const itemToAdd = {
        id: `${newItem.category}_${colorUpper}`,
        category: newItem.category,
        name: newItem.category,
        color: colorUpper,
        size: newItem.size,
        stockQuantity: newItem.stockQuantity,
        displayQuantity: newItem.displayQuantity || 0
      };
      
      await addInventoryItem(currentStore.id, itemToAdd);
      await loadInventory(currentStore.id);
      setNewItem({ 
        category: 'OUTERWEAR',
        name: '',
        color: '', 
        size: '', 
        stockQuantity: 0,
        displayQuantity: 0
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('재고 추가 실패:', error);
      alert('재고 추가에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }

  function handleEditClick(item) {
    const totalStock = (item.stockQuantity || 0) + (item.displayQuantity || 0);
    setEditingItem({
      ...item,
      name: item.name || item.category,
      stockQuantity: item.stockQuantity || 0,
      displayQuantity: item.displayQuantity || 0,
      originalTotal: totalStock
    });
    setShowEditForm(true);
  }

  async function handleUpdateItem() {
    if (!editingItem) return;

    setIsLoading(true);
    try {
      const updates = {
        name: editingItem.name,
        stockQuantity: editingItem.stockQuantity,
        displayQuantity: editingItem.displayQuantity
      };
      
      await updateInventoryItem(currentStore.id, editingItem.id, updates);
      await loadInventory(currentStore.id);
      setShowEditForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('재고 업데이트 실패:', error);
      alert('재고 업데이트에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredInventory = categoryFilter === 'all' 
    ? inventory 
    : inventory.filter(item => item.category === categoryFilter);

  const isMyStore = currentStore?.id === myStore?.id;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/home')}
              style={{ marginRight: '1rem', color: '#6b7280', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer' }}
            >
              ← 뒤로
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>📦 전체 재고</h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {currentStore?.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.5rem', 
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            + 재고 추가
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* 재고 추가 폼 */}
        {showAddForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>새 재고 추가</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>카테고리 *</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value, size: ''})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>컬러 *</label>
                <input
                  type="text"
                  placeholder="예: BROWN, BLACK"
                  value={newItem.color}
                  onChange={(e) => setNewItem({...newItem, color: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>사이즈 *</label>
                <select
                  value={newItem.size}
                  onChange={(e) => setNewItem({...newItem, size: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                >
                  <option value="">선택하세요</option>
                  {SIZE_BY_CATEGORY[newItem.category].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>창고 수량 *</label>
                <input
                  type="number"
                  placeholder="창고 수량"
                  value={newItem.stockQuantity || ''}
                  onChange={(e) => setNewItem({...newItem, stockQuantity: parseInt(e.target.value) || 0})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>진열 수량 (선택)</label>
                <input
                  type="number"
                  placeholder="진열 수량"
                  value={newItem.displayQuantity || ''}
                  onChange={(e) => setNewItem({...newItem, displayQuantity: parseInt(e.target.value) || 0})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
              * 제품 ID는 자동으로 생성됩니다: {newItem.category}_{newItem.color.toUpperCase()}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleAddItem}
                disabled={isLoading}
                style={{ 
                  backgroundColor: '#3b82f6', 
                  color: 'white', 
                  padding: '0.5rem 1.5rem', 
                  borderRadius: '0.5rem', 
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                {isLoading ? '추가 중...' : '추가'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                style={{ 
                  backgroundColor: '#e5e7eb', 
                  color: '#374151', 
                  padding: '0.5rem 1.5rem', 
                  borderRadius: '0.5rem', 
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 재고 수정 모달 */}
        {showEditForm && editingItem && (
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
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111827' }}>
                재고 수정
              </h2>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  제품 ID
                </label>
                <div style={{ padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', color: '#6b7280', fontFamily: 'monospace' }}>
                  {editingItem.id}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  제품 이름
                </label>
                <input
                  type="text"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                  placeholder="제품 이름"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  창고 수량 * <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '400' }}>(자동 계산)</span>
                </label>
                <input
                  type="number"
                  value={editingItem.stockQuantity || 0}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280',
                    cursor: 'not-allowed'
                  }}
                  min="0"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  진열 수량
                </label>
                <input
                  type="number"
                  value={editingItem.displayQuantity || 0}
                  onChange={(e) => {
                    const newDisplayQty = parseInt(e.target.value) || 0;
                    const totalStock = editingItem.originalTotal || 0;
                    const newWarehouseQty = Math.max(0, totalStock - newDisplayQty);
                    setEditingItem({
                      ...editingItem, 
                      displayQuantity: newDisplayQty,
                      stockQuantity: newWarehouseQty
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                  min="0"
                  max={editingItem.originalTotal || 0}
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  총 재고: {editingItem.originalTotal || 0}개 (창고 {editingItem.stockQuantity || 0}개 + 진열 {editingItem.displayQuantity || 0}개)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleUpdateItem}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  {isLoading ? '저장 중...' : '✓ 저장'}
                </button>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingItem(null);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 카테고리 필터 */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCategoryFilter('all')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: categoryFilter === 'all' ? '#3b82f6' : '#f3f4f6',
                color: categoryFilter === 'all' ? 'white' : '#374151',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              전체 ({inventory.length})
            </button>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: categoryFilter === category ? '#3b82f6' : '#f3f4f6',
                  color: categoryFilter === category ? 'white' : '#374151',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {category} ({inventory.filter(i => i.category === category).length})
              </button>
            ))}
          </div>
        </div>

        {/* 재고 목록 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filteredInventory.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              {categoryFilter === 'all' ? '재고가 없습니다.' : `${categoryFilter} 카테고리에 재고가 없습니다.`}
            </div>
          ) : (
            filteredInventory.map((item) => (
              <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'inline-block', backgroundColor: '#eff6ff', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {item.category}
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', fontFamily: 'monospace' }}>
                    {item.id || `${item.name}_${item.color}`}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>사이즈: {item.size}</p>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>창고 수량</span>
                    <span style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold',
                      color: item.stockQuantity > 10 ? '#10b981' : item.stockQuantity > 5 ? '#f59e0b' : '#ef4444'
                    }}>
                      {item.stockQuantity}개
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>진열 수량</span>
                    <span style={{ fontSize: '1rem', fontWeight: '600', color: '#3b82f6' }}>
                      {item.displayQuantity || 0}개
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleEditClick(item)}
                  style={{
                    width: '100%',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.875rem'
                  }}
                >
                  ✏️ 수량 수정
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
