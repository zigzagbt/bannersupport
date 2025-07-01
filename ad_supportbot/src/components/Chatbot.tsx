import React, { useState, useRef, useEffect } from 'react';
import { MenuItem } from '../App';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  action?: {
    type: 'navigate';
    menu: MenuItem;
  };
}

interface ChatbotProps {
  onNavigate?: (menu: MenuItem) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '안녕하세요! 🎨 배너 제작 도우미입니다. 궁금한 점이 있으시면 언제든 물어보세요!\n\n예시 질문:\n• "배경 컬러 추천해주세요"\n• "텍스트 색상 가이드 알려주세요"\n• "효과적인 문구 추천해주세요"',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // 봇 응답 생성
    setTimeout(() => {
      const botResponse = generateBotResponse(inputValue);
      setMessages(prev => [...prev, botResponse]);
      
      // 메뉴 이동이 필요한 경우
      if (botResponse.action && onNavigate) {
        setTimeout(() => {
          onNavigate(botResponse.action!.menu);
          setIsOpen(false);
        }, 1500);
      }
    }, 1000);
  };

  const generateBotResponse = (userInput: string): Message => {
    const input = userInput.toLowerCase();
    
    // 배경 컬러 관련
    if (input.includes('배경') || input.includes('색상') || input.includes('컬러')) {
      return {
        id: Date.now() + 1,
        text: '배경 컬러를 고르실 때는 제품 이미지에서 자연스러운 색상을 추출하는 것이 좋아요! 🎨\n\n1. https://imagecolorpicker.com 에서 이미지 업로드\n2. 톤온톤(밝기 차) vs 톤인톤(채도 차) 중 선택\n3. 추천 컬러 팔레트 활용\n\n더 자세한 내용을 보시려면 "배경 컬러 추천받기" 메뉴로 이동해드릴게요!',
        isUser: false,
        timestamp: new Date(),
        action: {
          type: 'navigate',
          menu: 'color'
        }
      };
    }
    
    // 텍스트 색상 관련
    if (input.includes('텍스트') || input.includes('글자') || input.includes('대비')) {
      return {
        id: Date.now() + 1,
        text: '텍스트 색상은 배경과의 대비가 중요해요! ⚫⚪\n\n📐 기준:\n• 배경 대비 2.15 이하 → 검정색 사용 권장\n• 2.15 이상 → 흰색도 사용 가능\n\nhttps://accessible-colors.com 에서 대비 비율을 계산해보세요!\n\n실시간 테스트를 위해 "텍스트 색상 고르기" 메뉴로 이동해드릴게요!',
        isUser: false,
        timestamp: new Date(),
        action: {
          type: 'navigate',
          menu: 'text-color'
        }
      };
    }
    
    // 문구 관련
    if (input.includes('문구') || input.includes('글귀') || input.includes('카피')) {
      return {
        id: Date.now() + 1,
        text: '효과적인 문구를 찾고 계시는군요! 🖼️\n\n배너 이미지에 어울리는 감각적인 문구를 추천해드릴게요!\n\n"배너 이미지 문구 추천" 메뉴로 이동해서 다양한 문구를 확인해보세요!',
        isUser: false,
        timestamp: new Date(),
        action: {
          type: 'navigate',
          menu: 'banner-image-phrase'
        }
      };
    }
    
    // PNG 저장 관련
    if (input.includes('png') || input.includes('저장') || input.includes('투명')) {
      return {
        id: Date.now() + 1,
        text: 'PNG 저장 방법을 알려드릴게요! 📦\n\n포토샵 단계:\n1. 배경 레이어 숨기기\n2. 파일 > 내보내기 > 웹용 저장\n3. PNG-24 선택, 투명도 체크\n\n단축키: Mac ⌘+Shift+Option+S\n\n"PNG 저장 방법 보기" 메뉴로 이동해서 더 자세한 내용을 확인하세요!',
        isUser: false,
        timestamp: new Date(),
        action: {
          type: 'navigate',
          menu: 'png'
        }
      };
    }
    
    // 템플릿 관련
    if (input.includes('템플릿') || input.includes('psd') || input.includes('파일')) {
      return {
        id: Date.now() + 1,
        text: 'PSD 템플릿을 찾고 계시는군요! 🎁\n\nZIGZAG 배너 제작용 PSD 템플릿을 제공합니다:\n• 배경 컬러 샘플\n• 여백/텍스트 영역 가이드\n• 예시 문구 삽입 텍스트\n\n"배너 PSD 템플릿 다운로드" 메뉴로 이동해서 다운로드하세요!',
        isUser: false,
        timestamp: new Date(),
        action: {
          type: 'navigate',
          menu: 'template'
        }
      };
    }
    
    // 크기 관련
    if (input.includes('크기') || input.includes('사이즈') || input.includes('비율')) {
      return {
        id: Date.now() + 1,
        text: '배너 크기 궁금하시군요! 📏\n\nZIGZAG 권장 크기:\n• 1200x400px (3:1 비율)\n• 모바일 최적화 고려\n• 파일 크기 500KB 이하\n\n"전체 가이드 한눈에 보기" 메뉴로 이동해서 더 많은 정보를 확인하세요!',
        isUser: false,
        timestamp: new Date(),
        action: {
          type: 'navigate',
          menu: 'full-guide'
        }
      };
    }
    
    // 폰트 관련
    if (input.includes('폰트') || input.includes('글꼴') || input.includes('타이포')) {
      return {
        id: Date.now() + 1,
        text: '폰트 추천해드릴게요! ✍️\n\n추천 폰트:\n• Noto Sans KR\n• 나눔고딕\n• 프리텐다드\n• Pretendard\n\n가독성이 좋은 산세리프 폰트를 사용하시는 것을 추천합니다!\n\n더 자세한 정보는 "전체 가이드 한눈에 보기" 메뉴에서 확인하세요!',
        isUser: false,
        timestamp: new Date(),
        action: {
          type: 'navigate',
          menu: 'full-guide'
        }
      };
    }
    
    // 일반적인 질문
    if (input.includes('안녕') || input.includes('hello') || input.includes('hi')) {
      return {
        id: Date.now() + 1,
        text: '안녕하세요! 👋 배너 제작에 도움이 필요하시면 언제든 물어보세요!\n\n배경 컬러, 텍스트 색상, 문구 추천, PNG 저장 등 모든 것에 대해 답변해드릴 수 있어요!',
        isUser: false,
        timestamp: new Date()
      };
    }
    
    if (input.includes('도움') || input.includes('help') || input.includes('어떻게')) {
      return {
        id: Date.now() + 1,
        text: '도움이 필요하시군요! 💡\n\n다음과 같은 질문을 해보세요:\n• "배경 컬러 어떻게 고르나요?"\n• "텍스트 색상 추천해주세요"\n• "효과적인 문구 알려주세요"\n• "PNG 저장 방법 알려주세요"\n• "배너 크기는 어떻게 정하나요?"\n\n또는 메인 메뉴에서 원하는 항목을 선택하셔도 됩니다!',
        isUser: false,
        timestamp: new Date()
      };
    }
    
    // 기본 응답
    return {
      id: Date.now() + 1,
      text: '죄송해요, 질문을 정확히 이해하지 못했어요. 😅\n\n다시 한 번 질문해주시거나, 다음과 같이 물어보세요:\n• "배경 컬러 추천해주세요"\n• "텍스트 색상 가이드 알려주세요"\n• "효과적인 문구 추천해주세요"\n• "PNG 저장 방법 알려주세요"\n\n또는 메인 메뉴에서 원하는 항목을 선택하시면 더 자세한 정보를 확인할 수 있어요!',
      isUser: false,
      timestamp: new Date()
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        className="chatbot-minimized"
        onClick={() => setIsOpen(true)}
        title="챗봇 열기"
      >
        💬
      </button>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header" onClick={() => setIsOpen(false)}>
        <h3>🎨 배너 제작 도우미</h3>
        <button className="chatbot-toggle">−</button>
      </div>
      
      <div className="chatbot-body">
        <div className="chatbot-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.isUser ? 'user' : 'bot'}`}>
              <div className="message-avatar">
                {message.isUser ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                {message.text.split('\n').map((line, index) => (
                  <div key={index}>
                    {line}
                    {index < message.text.split('\n').length - 1 && <br />}
                  </div>
                ))}
                {message.action && (
                  <div style={{ 
                    marginTop: '10px', 
                    fontSize: '12px', 
                    opacity: 0.8,
                    fontStyle: 'italic'
                  }}>
                    잠시 후 해당 메뉴로 이동합니다...
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chatbot-input">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="궁금한 점을 물어보세요..."
          />
          <button onClick={handleSendMessage}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot; 