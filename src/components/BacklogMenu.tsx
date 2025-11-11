import React from 'react';
import { MenuItem } from '../App';
import FooterNav from './FooterNav';

interface BacklogMenuProps {
  onHome: () => void;
  onBack: () => void;
  onMenuSelect?: (menu: MenuItem) => void;
}

const BacklogMenu: React.FC<BacklogMenuProps> = ({ onHome, onBack, onMenuSelect }) => {
  // 접근 권한 체크 - 나만 접근 가능
  const isAuthorized = () => {
    const authorizedUser = process.env.REACT_APP_AUTHORIZED_USER || 'admin';
    const currentUser = localStorage.getItem('user') || 'guest';
    
    return currentUser === authorizedUser || 
           localStorage.getItem('isAuthorized') === 'true' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname.includes('127.0.0.1');
  };

  if (!isAuthorized()) {
    return (
      <div className="container">
        <div className="card text-center mb-8">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#1e293b' }}>
            접근 권한이 없습니다
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            이 페이지는 관리자만 접근할 수 있습니다.
          </p>
        </div>
        <FooterNav onHome={onHome} onBack={onBack} />
      </div>
    );
  }

  const backlogItems = [
    {
      id: 'banner-image-phrase-v2' as MenuItem,
      title: '배너 이미지 문구 추천',
      description: '지그재그 스타일의 문구를 추천해드려요',
      icon: '✨'
    },
    {
      id: 'search-banner' as MenuItem,
      title: '검색 띠배너 생성',
      description: '이미지 업로드로 자동 배경색 추출 + 텍스트 입력 + JPG 다운로드',
      icon: '🔍'
    },
    {
      id: 'banner-color-checker' as MenuItem,
      title: '배너 컬러 확인',
      description: '배너 이미지 색상 분석 + 텍스트 가독성 테스트 + 접근성 검사',
      icon: '🎨'
    },
    {
      id: 'template' as MenuItem,
      title: '배너 PSD 템플릿 다운로드 (작업중)',
      description: 'ZIGZAG 배너 제작용 PSD 템플릿을 다운로드하세요',
      icon: '🎁'
    },
    {
      id: 'full-guide' as MenuItem,
      title: '전체 가이드 한눈에 보기 (작업중)',
      description: '배너 제작에 필요한 모든 정보를 한 번에 확인하세요',
      icon: '📚'
    }
  ];

  const handleItemClick = (itemId: MenuItem) => {
    if (onMenuSelect) {
      onMenuSelect(itemId);
    }
  };

  return (
    <div className="container">
      <div className="card text-center mb-8">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#1e293b' }}>
          📋 관리자 전용 (백로그)
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          작업 중인 기능들을 확인하세요
        </p>
      </div>

      <div className="grid">
        {backlogItems.map((item, index) => (
          <div 
            key={item.id}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => handleItemClick(item.id)}
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

      <FooterNav onHome={onHome} onBack={onBack} />
    </div>
  );
};

export default BacklogMenu;

