import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseInventoryRequest, generateChatbotResponse } from '../utils/parser';
import { searchInventory, createRequest } from '../utils/api';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [currentStore, setCurrentStore] = useState(null);
  const [parsedRequest, setParsedRequest] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('currentStore');
    if (stored) {
      setCurrentStore(JSON.parse(stored));
    } else {
      alert('매장을 선택해주세요');
      navigate('/');
    }

    // 초기 환영 메시지
    setMessages([
      {
        type: 'bot',
        text: '안녕하세요! 필요한 재고를 말씀해주세요.\n예: "청바지 32인치 5개 필요해"',
        timestamp: new Date()
      }
    ]);
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type, text) => {
    setMessages(prev => [...prev, {
      type,
      text,
      timestamp: new Date()
    }]);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    addMessage('user', userMessage);
    setInputText('');
    setIsLoading(true);

    try {
      // 입력 파싱
      const parsed = parseInventoryRequest(userMessage);
      setParsedRequest(parsed);

      // 응답 생성
      const response = generateChatbotResponse(parsed);
      
      setTimeout(() => {
        addMessage('bot', response.message);
      }, 500);

      if (response.type === 'success' && parsed.isValid) {
        // 재고 검색
        const results = await searchInventory(parsed.itemName);
        
        // 현재 매장 제외
        const filteredResults = results.filter(r => r.storeId !== currentStore?.id);
        
        setTimeout(() => {
          if (filteredResults.length > 0) {
            setSearchResults(filteredResults);
            addMessage('bot', `${filteredResults.length}개의 매장에서 재고를 찾았습니다!`);
          } else {
            addMessage('bot', '죄송합니다. 해당 재고를 보유한 매장을 찾을 수 없습니다.');
            setSearchResults(null);
          }
        }, 1000);
      }
    } catch (error) {
      addMessage('bot', '오류가 발생했습니다. 다시 시도해주세요.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestToStore = async (result) => {
    if (!parsedRequest || !currentStore) return;

    setIsLoading(true);
    try {
      const requestData = {
        fromStoreId: currentStore.id,
        toStoreId: result.storeId,
        item: parsedRequest.itemName,
        quantity: parsedRequest.quantity
      };

      const response = await createRequest(requestData);
      
      addMessage('bot', `✅ ${result.storeName}에 재고 요청을 보냈습니다!${response.emailSent ? ' (이메일 발송 완료)' : ''}`);
      setSearchResults(null);
      setParsedRequest(null);

      setTimeout(() => {
        addMessage('bot', '다른 재고가 필요하시면 말씀해주세요!');
      }, 1000);
    } catch (error) {
      addMessage('bot', '요청 처리 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            ← 뒤로
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">재고 요청 챗봇</h1>
            <p className="text-sm text-gray-600">{currentStore?.name}</p>
          </div>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* 검색 결과 카드 */}
          {searchResults && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{result.storeName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {result.item.name} {result.item.size}
                      </p>
                      <p className="text-sm text-gray-500">
                        보유 수량: <span className="font-semibold text-green-600">{result.item.quantity}개</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleRequestToStore(result)}
                      disabled={isLoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      요청하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="필요한 재고를 입력하세요 (예: 청바지 32인치 5개)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
