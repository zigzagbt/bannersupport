import React from 'react';

interface TemplateGuideProps {
  onBack: () => void;
  onHome: () => void;
}

const TemplateGuide: React.FC<TemplateGuideProps> = ({ onBack, onHome }) => {
  return (
    <div>
      <div className="card">
        <div className="flex" style={{ alignItems: 'center', marginBottom: '20px' }}>
          {/* <button className="btn btn-secondary" onClick={onBack}>
            ← 뒤로가기
          </button> */}
          <button className="btn-home" onClick={onHome}>
            🏠 홈
          </button>
          <h2 style={{ marginLeft: '20px', fontSize: '1.6rem', color: '#1e293b' }}>
            🎁 배너 PSD 템플릿 다운로드
          </h2>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            ZIGZAG 배너 제작용 PSD 템플릿을 다운로드해보세요!
          </h3>
          
          <div className="card" style={{ 
            background: '#3b82f6',
            color: 'white',
            textAlign: 'center',
            padding: '40px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎨</div>
            <h4 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>
              ZIGZAG 배너 제작 템플릿
            </h4>
            <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
              셀러를 위한 맞춤형 배너 템플릿으로 빠르고 쉽게 제작하세요
            </p>
          </div>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            📋 사용 방법
          </h3>
          
          <div className="card">
            <div className="grid">
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  background: '#3b82f6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  marginBottom: '15px'
                }}>
                  1
                </div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#1e293b' }}>
                  템플릿 다운로드
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  위의 다운로드 링크에서 PSD 파일을 다운로드하세요
                </p>
              </div>
              
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  background: '#3b82f6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  marginBottom: '15px'
                }}>
                  2
                </div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#1e293b' }}>
                  포토샵에서 열기
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  포토샵에서 다운로드한 PSD 파일을 열어주세요
                </p>
              </div>
              
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  background: '#3b82f6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  marginBottom: '15px'
                }}>
                  3
                </div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#1e293b' }}>
                  내용 수정
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  텍스트와 이미지를 원하는 내용으로 수정하세요
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="tip">
          <strong>💡 템플릿 사용 팁:</strong><br/>
          • 레이어 구조를 유지하면서 편집하세요<br/>
          • 가이드라인을 참고하여 여백을 지켜주세요<br/>
          • 텍스트는 가독성을 위해 적절한 크기로 조정하세요
        </div>
      </div>
    </div>
  );
};

export default TemplateGuide; 