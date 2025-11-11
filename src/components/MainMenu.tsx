import React, { useState } from 'react';
import { MenuItem } from '../App';

interface MainMenuProps {
  onMenuSelect: (menu: MenuItem) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onMenuSelect }) => {
  const [isAuthorizedState, setIsAuthorizedState] = useState(false);

  // 접근 권한 체크
  const isAuthorized = () => {
    return localStorage.getItem('isAuthorized') === 'true';
  };

  // 권한 상태 확인 및 업데이트
  React.useEffect(() => {
    const checkAuth = () => {
      setIsAuthorizedState(isAuthorized());
    };
    checkAuth();
    // localStorage 변경 감지
    const interval = setInterval(checkAuth, 100);
    return () => clearInterval(interval);
  }, []);

  const baseMenuItems = [
    {
      id: 'color' as MenuItem,
      title: '배경 컬러 추천받기',
      description: '제품 이미지에서 자연스러운 배경 컬러를 추출해보세요',
      icon: '🎨',
      requiresAuth: false
    },
    {
      id: 'text-color' as MenuItem,
      title: '텍스트 색상 고르기',
      description: '배경에 맞는 텍스트 색상을 선택하는 방법을 알려드려요',
      icon: '⚫⚪',
      requiresAuth: false
    },
    // {
    //   id: 'banner-image-phrase' as MenuItem,
    //   title: '배너 이미지 문구 추천',
    //   description: '배너 이미지에 어울리는 감각적인 문구를 추천해드려요',
    //   icon: '🖼️'
    // },
    // 3번은 백로그로 이동
    {
      id: 'png' as MenuItem,
      title: 'PNG 저장 방법 보기',
      description: '포토샵에서 투명 배경 PNG로 저장하는 방법',
      icon: '📦',
      requiresAuth: false
    },
    // 4번은 백로그로 이동
    {
      id: 'splash-helper' as MenuItem,
      title: '스플래시 도우미',
      description: '이미지 업로드 후 Safe Zone 적합 여부 확인',
      icon: '🖼️',
      requiresAuth: false
    },
    {
      id: 'main-banner-helper' as MenuItem,
      title: '메인배너 도우미',
      description: '직잭팟 전용 메인배너 이미지',
      icon: '🎯',
      requiresAuth: false
    }
  ];

  // 관리자 메뉴 (권한이 있을 때만 표시)
  const adminMenuItems = [
    {
      id: 'usage-stats' as MenuItem,
      title: '관리자 전용 (사용 통계)',
      description: '스플래시와 메인배너 도우미 사용 현황',
      icon: '📊',
      requiresAuth: true
    }
  ];

  // 권한이 있으면 관리자 메뉴 추가
  const menuItems = isAuthorizedState 
    ? [...baseMenuItems, ...adminMenuItems]
    : baseMenuItems;

  // 백로그 메뉴 추가 (권한이 있는 경우만)
  const finalMenuItems = isAuthorizedState
    ? [...menuItems, {
        id: 'backlog' as MenuItem,
        title: '관리자 전용 (백로그)',
        description: '작업 중인 기능들을 확인하세요',
        icon: '📋',
        requiresAuth: false
      }]
    : menuItems;

  // 메뉴 클릭 핸들러
  const handleMenuClick = (item: typeof baseMenuItems[0] | typeof adminMenuItems[0]) => {
    onMenuSelect(item.id);
  };

  return (
    <div>
      <div className="card text-center mb-16">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#1e293b' }}>
          궁금한 항목을 선택해주세요 👇
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '15px' }}>
          각 항목을 클릭하면 자세한 가이드를 확인할 수 있어요
        </p>
      </div>

      <div className="grid">
        {finalMenuItems.map((item, index) => {
          // 모든 메뉴 항목을 표시하되, 번호는 순서대로
          const displayIndex = index + 1;
          
          return (
            <div 
              key={item.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => handleMenuClick(item)}
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
                    {displayIndex}. {item.title}
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
          );
        })}
      </div>
    </div>
  );
};

export default MainMenu; 