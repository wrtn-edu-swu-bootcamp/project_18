import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoreInventory, addInventoryItem, updateInventoryQuantity } from '../utils/api';

export default function CurrentInventory() {
  const [inventory, setInventory] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', size: '', quantity: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('currentStore');
    if (stored) {
      const store = JSON.parse(stored);
      setCurrentStore(store);
      loadInventory(store.id);
    } else {
      navigate('/');
    }
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
    if (!newItem.name || !newItem.size || newItem.quantity <= 0) {
      alert('모든 필드를 입력해주세요');
      return;
    }

    setIsLoading(true);
    try {
      await addInventoryItem(currentStore.id, newItem);
      await loadInventory(currentStore.id);
      setNewItem({ name: '', size: '', quantity: 0 });
      setShowAddForm(false);
    } catch (error) {
      console.error('재고 추가 실패:', error);
      alert('재고 추가에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateQuantity(itemId, newQuantity) {
    if (newQuantity < 0) return;

    try {
      await updateInventoryQuantity(currentStore.id, itemId, newQuantity);
      await loadInventory(currentStore.id);
    } catch (error) {
      console.error('수량 업데이트 실패:', error);
      alert('수량 업데이트에 실패했습니다');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              ← 뒤로
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">현재 재고</h1>
              <p className="text-sm text-gray-600">{currentStore?.name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            + 재고 추가
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 재고 추가 폼 */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">새 재고 추가</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="상품명 (예: 청바지)"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="사이즈 (예: 32인치)"
                value={newItem.size}
                onChange={(e) => setNewItem({...newItem, size: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="수량"
                value={newItem.quantity || ''}
                onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddItem}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                추가
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 재고 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              재고가 없습니다. 재고를 추가해보세요!
            </div>
          ) : (
            inventory.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.size}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.quantity > 10 ? 'bg-green-100 text-green-800' :
                    item.quantity > 5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.quantity}개
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
