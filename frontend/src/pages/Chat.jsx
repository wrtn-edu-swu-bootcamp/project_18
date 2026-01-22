import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStores } from '../utils/api';

const API_BASE = 'http://localhost:3001/api';

const CATEGORIES = [
  { id: 'OUTERWEAR', label: 'OUTERWEAR', emoji: '🧥' },
  { id: 'KNITWEAR', label: 'KNITWEAR', emoji: '🧶' },
  { id: 'T-SHIRT', label: 'T-SHIRT', emoji: '👕' },
  { id: 'BLOUSE', label: 'BLOUSE', emoji: '👚' },
  { id: 'DRESS&SKIRT', label: 'DRESS&SKIRT', emoji: '👗' },
  { id: 'PANTS', label: 'PANTS', emoji: '👖' },
  { id: 'ACC', label: 'ACC', emoji: '👜' }
];

const QUANTITY_OPTIONS = [
  { value: 1, label: '1개' },
  { value: 2, label: '2개' },
  { value: 3, label: '3개' },
  { value: 4, label: '4개' },
  { value: 5, label: '5개 이상' }
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [myStore, setMyStore] = useState(null);
  const [adminName, setAdminName] = useState('');
  const [allStores, setAllStores] = useState([]);
  const [currentStep, setCurrentStep] = useState('category'); // category, color, quantity, result, confirm
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [availableColors, setAvailableColors] = useState([]);
  const [selectedQuantity, setSelectedQuantity] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequest, setPendingRequest] = useState(null);
  const messagesEndRef = useRef(null);
  const isInitialized = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    async function initializeChat() {
      const storedId = localStorage.getItem('myStore');
      const storedAdminName = localStorage.getItem('adminName');
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
        
        setMyStore(store);
        setAdminName(storedAdminName || 'admin1');
        setAllStores(stores);
        addBotMessage(`안녕하세요 😊 ${store.name} 재고봇입니다.\n필요한 재고 정보를 알려주세요!`);
        showCategoryButtons();
      } catch (error) {
        console.error('매장 정보 로드 실패:', error);
        navigate('/');
      }
    }
    
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function addBotMessage(text, buttons = null) {
    setMessages(prev => [...prev, { sender: 'bot', text, buttons }]);
  }

  function addUserMessage(text) {
    setMessages(prev => [...prev, { sender: 'user', text }]);
  }

  function showCategoryButtons() {
    addBotMessage(
      '👇 아래 카테고리 중 하나를 선택해주세요:',
      { type: 'category', options: CATEGORIES }
    );
  }

  async function handleCategorySelect(category) {
    setSelectedCategory(category);
    addUserMessage(`${category.emoji} ${category.label}`);
    addBotMessage('🔍 제품 컬러 확인 중...');
    
    // 모든 매장에서 해당 카테고리의 컬러 찾기
    const colorsSet = new Set();
    
    try {
      for (const store of allStores) {
        if (store.id === myStore.id) continue;
        
        const response = await fetch(`${API_BASE}/stores/${store.id}/inventory`);
        const inventory = await response.json();
        
        inventory.forEach(item => {
          if (item.category === category.id && item.stockQuantity > 0) {
            // ID에서 컬러 추출 (예: OUTERWEAR_BROWN -> BROWN)
            const parts = item.id ? item.id.split('_') : [];
            if (parts.length > 1) {
              colorsSet.add(parts[parts.length - 1]);
            } else if (item.color) {
              colorsSet.add(item.color.toUpperCase());
            }
          }
        });
      }
      
      const colors = Array.from(colorsSet).sort();
      
      if (colors.length === 0) {
        addBotMessage('😢 죄송합니다. 재고가 있는 컬러가 없습니다.', {
          type: 'restart',
          options: [{ label: '다시 검색하기', action: 'restart' }]
        });
        return;
      }
      
      if (colors.length === 1) {
        // 컬러가 하나뿐이면 자동 선택
        setSelectedColor(colors[0]);
        addBotMessage(`🎨 제품 컬러: ${colors[0]}\n\n🔢 몇 개 필요하신가요?`, { 
          type: 'quantity', 
          options: QUANTITY_OPTIONS 
        });
        setCurrentStep('quantity');
      } else {
        // 여러 컬러가 있으면 선택하도록
        setAvailableColors(colors);
        addBotMessage(`🎨 제품 컬러를 선택해주세요:`, { 
          type: 'color', 
          options: colors.map(color => ({ id: color, label: color }))
        });
        setCurrentStep('color');
      }
    } catch (error) {
      console.error('컬러 조회 실패:', error);
      addBotMessage('❌ 컬러 조회 중 오류가 발생했습니다.');
    }
  }

  function handleColorSelect(color) {
    setSelectedColor(color);
    addUserMessage(`🎨 ${color}`);
    addBotMessage('🔢 몇 개 필요하신가요?', { type: 'quantity', options: QUANTITY_OPTIONS });
    setCurrentStep('quantity');
  }

  async function handleQuantitySelect(quantity) {
    setSelectedQuantity(quantity);
    addUserMessage(`${quantity}개`);
    addBotMessage('🔍 재고를 검색 중입니다...');
    
    await searchInventory(selectedCategory.id, selectedColor, quantity);
  }

  async function searchInventory(category, color, quantity) {
    try {
      const allInventory = await Promise.all(
        allStores.map(async (store) => {
          if (store.id === myStore.id) return null; // 내 매장 제외
          
          const response = await fetch(`${API_BASE}/stores/${store.id}/inventory`);
          const inventory = await response.json();
          
          // 카테고리와 컬러로 필터링
          const categoryItems = inventory.filter(item => {
            if (item.category !== category) return false;
            
            // ID에서 컬러 확인 (예: OUTERWEAR_BROWN)
            const itemColor = item.id ? item.id.split('_').pop() : item.color?.toUpperCase();
            return itemColor === color;
          });
          
          const totalStock = categoryItems.reduce((sum, item) => sum + (item.stockQuantity || 0), 0);
          const totalDisplay = categoryItems.reduce((sum, item) => sum + (item.displayQuantity || 0), 0);
          const warehouseStock = totalStock - totalDisplay;
          
          return {
            store,
            items: categoryItems,
            totalStock,
            totalDisplay,
            warehouseStock
          };
        })
      );

      const validStores = allInventory.filter(s => s && s.totalStock >= quantity);
      setSearchResults(validStores);

      if (validStores.length === 0) {
        // 다른 컬러의 같은 카테고리 제품 찾기
        const alternativeProducts = await Promise.all(
          allStores.filter(s => s.id !== myStore.id).map(async (store) => {
            try {
              const response = await fetch(`${API_BASE}/stores/${store.id}/inventory`);
              const inventory = await response.json();
              
              // 같은 카테고리의 다른 컬러 제품
              const categoryItems = inventory.filter(item => item.category === category);
              
              // 컬러별로 그룹화
              const colorGroups = {};
              categoryItems.forEach(item => {
                const itemColor = item.id ? item.id.split('_').pop() : item.color?.toUpperCase();
                if (itemColor && itemColor !== color) {
                  if (!colorGroups[itemColor]) {
                    colorGroups[itemColor] = {
                      color: itemColor,
                      storeName: store.name,
                      totalStock: 0
                    };
                  }
                  colorGroups[itemColor].totalStock += (item.stockQuantity || 0) + (item.displayQuantity || 0);
                }
              });
              
              return Object.values(colorGroups).filter(g => g.totalStock >= quantity);
            } catch (error) {
              return [];
            }
          })
        );
        
        const alternatives = alternativeProducts.flat().filter(Boolean);
        
        if (alternatives.length > 0) {
          let altText = `😢 죄송합니다.\n${color} 컬러는 ${quantity}개 이상 재고가 없습니다.\n\n`;
          altText += `💡 다른 컬러 제품을 추천드릴까요?\n\n`;
          
          alternatives.slice(0, 5).forEach(alt => {
            altText += `• ${category} ${alt.color} - ${alt.storeName} (${alt.totalStock}개)\n`;
          });
          
          addBotMessage(altText, {
            type: 'restart',
            options: [{ label: '다시 검색하기', action: 'restart' }]
          });
        } else {
          addBotMessage(`😢 죄송합니다.\n${quantity}개 이상 재고가 있는 매장이 없습니다.`, {
            type: 'restart',
            options: [{ label: '다시 검색하기', action: 'restart' }]
          });
        }
        return;
      }

      let resultText = `🔎 현재 ${quantity}개 이상 재고가 있는 매장은 다음과 같습니다:\n\n`;
      validStores.forEach(({ store, totalStock, warehouseStock, totalDisplay }) => {
        resultText += `• ${store.name}: ${totalStock}개\n`;
        if (warehouseStock > 0 && totalDisplay > 0) {
          resultText += `  └ ${warehouseStock}개 창고 / ${totalDisplay}개 진열 상품\n`;
        } else if (warehouseStock === totalStock) {
          resultText += `  └ 모두 창고 보관\n`;
        } else if (totalDisplay === totalStock) {
          resultText += `  └ 전부 진열 상품\n`;
        }
      });

      const hasDisplayItems = validStores.some(s => s.totalDisplay > 0);
      
      if (hasDisplayItems) {
        resultText += `\n⚠️ 안내드릴게요!\n\n🧼 진열 상품은 검수가 필요합니다.`;
        
        addBotMessage(resultText, {
          type: 'storeSelect',
          options: validStores.map(s => ({
            store: s.store,
            totalStock: s.totalStock,
            warehouseStock: s.warehouseStock,
            totalDisplay: s.totalDisplay
          }))
        });
      } else {
        addBotMessage(resultText, {
          type: 'storeSelect',
          options: validStores.map(s => ({
            store: s.store,
            totalStock: s.totalStock,
            warehouseStock: s.warehouseStock,
            totalDisplay: s.totalDisplay
          }))
        });
      }

      setCurrentStep('result');
    } catch (error) {
      console.error('재고 검색 실패:', error);
      addBotMessage('❌ 재고 검색 중 오류가 발생했습니다.');
    }
  }

  function handleStoreSelect(storeData) {
    addUserMessage(`${storeData.store.name} 선택`);
    
    if (storeData.totalDisplay > 0) {
      addBotMessage(
        `📦 ${storeData.store.name}에서 ${selectedQuantity}개 발송 요청하시겠어요?\n\n⚠️ 이 매장은 ${storeData.totalDisplay}개의 진열 상품이 포함되어 있습니다.`,
        {
          type: 'confirm',
          options: [
            { label: '✅ 검수 후 보내주세요', action: 'confirm-inspection', storeData },
            { label: '🔄 다른 매장으로 요청', action: 'back', storeData },
            { label: '❌ 취소', action: 'cancel' }
          ]
        }
      );
    } else {
      addBotMessage(
        `📦 ${storeData.store.name}에서 ${selectedQuantity}개 발송 요청하시겠어요?\n\n✨ 모두 창고 보관 재고입니다.`,
        {
          type: 'confirm',
          options: [
            { label: '✅ 발송 요청하기', action: 'confirm', storeData },
            { label: '🔄 다른 매장으로 요청', action: 'back', storeData },
            { label: '❌ 취소', action: 'cancel' }
          ]
        }
      );
    }
    
    setCurrentStep('confirm');
  }

  async function handleConfirm(storeData, needsInspection = false) {
    addUserMessage(needsInspection ? '✅ 검수 후 보내주세요' : '✅ 발송 요청하기');
    addBotMessage('📧 발송 요청 중...');

    try {
      const requestData = {
        fromStoreId: storeData.store.id,  // 재고를 보내는 매장 (잠실점)
        fromStoreName: storeData.store.name,
        toStoreId: myStore.id,  // 재고를 받는 매장 (노원점)
        toStoreName: myStore.name,
        item: `${selectedCategory.label}_${selectedColor}`,
        quantity: selectedQuantity,
        requesterName: '사용자',
        adminName: adminName,  // 로그인한 관리자
        status: 'requested',
        needsInspection: needsInspection,
        note: needsInspection ? '진열 상품 포함 - 검수 필요' : ''
      };

      const response = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        addBotMessage(
          `✅ ${storeData.store.name}에 재고 요청이 완료되었습니다!\n\n• 제품: ${selectedCategory.label}_${selectedColor}\n• 수량: ${selectedQuantity}개${needsInspection ? '\n• 특이사항: 진열 상품 검수 필요' : ''}\n\n📨 입고 대기 페이지에서 확인하실 수 있습니다.`,
          {
            type: 'finish',
            options: [
              { label: '🏠 홈으로', action: 'home' },
              { label: '🔄 새로 검색하기', action: 'restart' }
            ]
          }
        );
        
        // 초기화
        setSelectedCategory(null);
        setSelectedColor(null);
        setAvailableColors([]);
        setSelectedQuantity(null);
        setSearchResults([]);
        setCurrentStep('category');
      } else {
        throw new Error('요청 실패');
      }
    } catch (error) {
      console.error('발송 요청 실패:', error);
      addBotMessage('❌ 발송 요청에 실패했습니다. 다시 시도해주세요.', {
        type: 'restart',
        options: [{ label: '다시 시도', action: 'restart' }]
      });
    }
  }

  function handleButtonClick(action, data) {
    if (action === 'restart') {
      setSelectedCategory(null);
      setSelectedColor(null);
      setAvailableColors([]);
      setSelectedQuantity(null);
      setSearchResults([]);
      setCurrentStep('category');
      addBotMessage('다시 시작합니다! 😊\n필요한 재고 정보를 알려주세요!');
      showCategoryButtons();
    } else if (action === 'cancel') {
      addUserMessage('❌ 취소');
      addBotMessage('취소되었습니다.', {
        type: 'restart',
        options: [{ label: '🔄 새로 검색하기', action: 'restart' }]
      });
    } else if (action === 'back') {
      addUserMessage('🔄 다른 매장으로 요청');
      
      // 현재 선택한 매장 제외 (data가 있는 경우)
      let availableStores = searchResults;
      if (data && data.store) {
        availableStores = searchResults.filter(s => s.store.id !== data.store.id);
      }
      
      if (availableStores.length === 0) {
        addBotMessage(
          '😢 죄송합니다.\n다른 재고가 있는 매장이 없습니다.',
          {
            type: 'restart',
            options: [
              { label: '🔄 새로 검색하기', action: 'restart' },
              { label: '🏠 홈으로', action: 'home' }
            ]
          }
        );
      } else if (availableStores.length === 1) {
        // 선택지가 하나뿐이면 안내와 함께 표시
        addBotMessage('다른 재고가 있는 매장은 아래 한 곳입니다:', {
          type: 'storeSelect',
          options: availableStores.map(s => ({
            store: s.store,
            totalStock: s.totalStock,
            warehouseStock: s.warehouseStock,
            totalDisplay: s.totalDisplay
          }))
        });
      } else {
        addBotMessage('다른 매장을 선택해주세요:', {
          type: 'storeSelect',
          options: availableStores.map(s => ({
            store: s.store,
            totalStock: s.totalStock,
            warehouseStock: s.warehouseStock,
            totalDisplay: s.totalDisplay
          }))
        });
      }
    } else if (action === 'confirm') {
      handleConfirm(data, false);
    } else if (action === 'confirm-inspection') {
      handleConfirm(data, true);
    } else if (action === 'home') {
      navigate('/home');
    }
  }

  function handleTextInput() {
    if (!input.trim()) return;
    
    addUserMessage(input);
    addBotMessage('죄송합니다. 버튼을 선택해주세요! 😊');
    setInput('');
  }

  return (
    <div style={{ height: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flexShrink: 0 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/home')}
            style={{ marginRight: '1rem', color: '#6b7280', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer' }}
          >
            ← 뒤로
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>🤖 재고봇</h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{myStore?.name} - 대화형 재고 요청</p>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div style={{ 
        flex: 1, 
        maxWidth: '1200px', 
        width: '100%',
        margin: '0 auto', 
        padding: '1.5rem 1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            style={{ 
              display: 'flex', 
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              width: '100%'
            }}
          >
            <div style={{
              maxWidth: '75%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {/* 메시지 버블 */}
              <div style={{
                padding: '1rem 1.25rem',
                borderRadius: msg.sender === 'user' ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem',
                backgroundColor: msg.sender === 'user' ? '#3b82f6' : 'white',
                color: msg.sender === 'user' ? 'white' : '#111827',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.95rem',
                lineHeight: '1.6'
              }}>
                {msg.text}
              </div>

              {/* 버튼들 */}
              {msg.buttons && msg.buttons.type === 'category' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {msg.buttons.options.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.75rem',
                        border: '2px solid #e5e7eb',
                        backgroundColor: 'white',
                        color: '#374151',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.backgroundColor = '#eff6ff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = 'white';
                      }}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              )}

              {msg.buttons && msg.buttons.type === 'color' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {msg.buttons.options.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handleColorSelect(color.id)}
                      style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '0.75rem',
                        border: '2px solid #e5e7eb',
                        backgroundColor: 'white',
                        color: '#374151',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        minWidth: '90px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#ec4899';
                        e.target.style.backgroundColor = '#fdf2f8';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = 'white';
                      }}
                    >
                      🎨 {color.label}
                    </button>
                  ))}
                </div>
              )}

              {msg.buttons && msg.buttons.type === 'quantity' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {msg.buttons.options.map((qty) => (
                    <button
                      key={qty.value}
                      onClick={() => handleQuantitySelect(qty.value)}
                      style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '0.75rem',
                        border: '2px solid #e5e7eb',
                        backgroundColor: 'white',
                        color: '#374151',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        minWidth: '70px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.backgroundColor = '#eff6ff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = 'white';
                      }}
                    >
                      {qty.label}
                    </button>
                  ))}
                </div>
              )}

              {msg.buttons && msg.buttons.type === 'storeSelect' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {msg.buttons.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleStoreSelect(opt)}
                      style={{
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        border: '2px solid #e5e7eb',
                        backgroundColor: 'white',
                        color: '#374151',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.backgroundColor = '#eff6ff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = 'white';
                      }}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        {opt.store.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        총 {opt.totalStock}개 | 창고 {opt.warehouseStock}개 | 진열 {opt.totalDisplay}개
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {msg.buttons && msg.buttons.type === 'confirm' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {msg.buttons.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleButtonClick(opt.action, opt.storeData || opt)}
                      style={{
                        padding: '0.875rem 1.25rem',
                        borderRadius: '0.75rem',
                        border: '2px solid',
                        borderColor: opt.action.includes('confirm') ? '#10b981' : opt.action === 'cancel' ? '#ef4444' : '#6b7280',
                        backgroundColor: 'white',
                        color: opt.action.includes('confirm') ? '#10b981' : opt.action === 'cancel' ? '#ef4444' : '#6b7280',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = opt.action.includes('confirm') ? '#10b981' : opt.action === 'cancel' ? '#ef4444' : '#6b7280';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'white';
                        e.target.style.color = opt.action.includes('confirm') ? '#10b981' : opt.action === 'cancel' ? '#ef4444' : '#6b7280';
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {msg.buttons && (msg.buttons.type === 'restart' || msg.buttons.type === 'finish') && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {msg.buttons.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleButtonClick(opt.action)}
                      style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '0.75rem',
                        border: '2px solid #3b82f6',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#3b82f6';
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div style={{ 
        backgroundColor: 'white', 
        borderTop: '1px solid #e5e7eb',
        padding: '1.25rem',
        flexShrink: 0
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTextInput();
              }
            }}
            placeholder="메시지를 입력하거나 위의 버튼을 선택해주세요..."
            rows={3}
            style={{
              flex: 1,
              padding: '1rem 1.25rem',
              border: '2px solid #d1d5db',
              borderRadius: '0.75rem',
              fontSize: '1rem',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: '1.5'
            }}
          />
          <button
            onClick={handleTextInput}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '1rem 2rem',
              height: '100%',
              minHeight: '80px',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
            }}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
