import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-20" style={{ padding: '60px 0' }}>
      <h1 style={{ 
        fontSize: '2.2rem', 
        fontWeight: '800', 
        color: '#1e293b', 
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <img src="/images/logo.png" alt="ZIGZAG 로고" style={{ height: '30px', objectFit: 'contain' }} />
        <span>배너 제작 도우미</span>
      </h1>
      <p style={{ 
        fontSize: '1.1rem', 
        color: '#475569', 
        fontWeight: '400',
      }}>
        효율이 좋은 배너를 만드는 꿀팁을 안내해드려요!
      </p>
    </header>
  );
};

export default Header; 