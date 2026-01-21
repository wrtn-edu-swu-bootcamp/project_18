// 챗봇 입력 파싱 함수
export function parseInventoryRequest(text) {
  // 수량 추출 (숫자 찾기)
  const quantityMatch = text.match(/(\d+)\s*(개|장|벌)?/);
  const quantity = quantityMatch ? parseInt(quantityMatch[1]) : null;
  
  // 사이즈 추출
  let size = null;
  const sizePatterns = [
    /(\d+)\s*인치/,
    /([SML]|XL|XXL)\s*사이즈?/i,
    /사이즈\s*([SML]|XL|XXL)/i,
    /([SML]|XL|XXL)$/i
  ];
  
  for (const pattern of sizePatterns) {
    const match = text.match(pattern);
    if (match) {
      size = match[1];
      break;
    }
  }
  
  // 상품명 추출 (키워드 기반)
  let itemName = '';
  
  // 일반적인 의류 키워드
  const keywords = ['청바지', '바지', '티셔츠', '셔츠', '재킷', '코트', '점퍼', '가디건', '후드', '니트', '맨투맨', '원피스', '치마', '스웨터'];
  
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      itemName = keyword;
      break;
    }
  }
  
  // 사이즈가 있으면 상품명에 포함
  if (size) {
    itemName = itemName ? `${itemName} ${size}${size.match(/\d+/) ? '인치' : ''}` : '';
  }
  
  return {
    itemName,
    size,
    quantity,
    isValid: itemName && quantity
  };
}

// 챗봇 응답 생성
export function generateChatbotResponse(parsed) {
  if (!parsed.isValid) {
    return {
      type: 'error',
      message: '상품명이나 수량을 찾을 수 없습니다. 다시 입력해주세요. (예: "청바지 32인치 5개 필요해")'
    };
  }
  
  return {
    type: 'success',
    message: `${parsed.itemName}를 ${parsed.quantity}개 찾고 계시군요! 재고를 검색 중입니다...`
  };
}
