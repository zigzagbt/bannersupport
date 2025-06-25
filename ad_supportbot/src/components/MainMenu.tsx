import React from 'react';
import { MenuItem } from '../App';

interface MainMenuProps {
  onMenuSelect: (menu: MenuItem) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onMenuSelect }) => {
  const menuItems = [
    {
      id: 'color' as MenuItem,
      title: '배경 컬러 추천받기',
      description: '제품 이미지에서 자연스러운 배경 컬러를 추출해보세요',
      icon: '🎨'
    },
    {
      id: 'text-color' as MenuItem,
      title: '텍스트 색상 고르기',
      description: '배경에 맞는 텍스트 색상을 선택하는 방법을 알려드려요',
      icon: '⚫⚪'
    },
    {
      id: 'phrase' as MenuItem,
      title: '잘 먹히는 문구 추천받기',
      description: '효과적인 배너 문구를 카테고리별로 추천해드려요',
      icon: '📣'
    },
    {
      id: 'png' as MenuItem,
      title: 'PNG 저장 방법 보기',
      description: '포토샵에서 투명 배경 PNG로 저장하는 방법',
      icon: '📦'
    },
    {
      id: 'template' as MenuItem,
      title: '배너 PSD 템플릿 다운로드',
      description: 'ZIGZAG 배너 제작용 PSD 템플릿을 다운로드하세요',
      icon: '🎁'
    },
    {
      id: 'full-guide' as MenuItem,
      title: '전체 가이드 한눈에 보기',
      description: '배너 제작에 필요한 모든 정보를 한 번에 확인하세요',
      icon: '📚'
    }
  ];

  return (
    <div>
      <div className="card text-center mb-16">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#1e293b' }}>
          궁금한 항목을 선택해주세요 👇
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '15px' }}>
          각 항목을 클릭하면 자세한 가이드를 확인할 수 있어요
        </p>
        <div className="tip" style={{ 
          background: '#dbeafe',
          color: '#1e40af',
          border: '1px solid #bfdbfe',
          margin: '0'
        }}>
          <strong>💬 챗봇 도우미가 준비되어 있어요!</strong><br/>
          오른쪽 하단의 💬 버튼을 클릭하면 궁금한 점을 바로 물어볼 수 있습니다
        </div>
      </div>

      <div className="grid">
        {menuItems.map((item, index) => (
          <div 
            key={item.id}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => onMenuSelect(item.id)}
          >
            <div className="flex" style={{ alignItems: 'flex-start', gap: '15px' }}>
              <div style={{ fontSize: '1.8rem' }}>{item.icon}</div>
              <div>
                <h3 style={{ 
                  fontSize: '1.1rem', 
                  marginBottom: '8px', 
                  color: '#1e293b',
                  fontWeight: '600'
                }}>
                  {index + 1}. {item.title}
                </h3>
                <p style={{ 
                  color: '#64748b', 
                  lineHeight: '1.5',
                  fontSize: '0.9rem'
                }}>
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainMenu; 