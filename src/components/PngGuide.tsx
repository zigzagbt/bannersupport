import React from 'react';

interface PngGuideProps {
  onBack: () => void;
  onHome: () => void;
}

const PngGuide: React.FC<PngGuideProps> = ({ onBack, onHome }) => {
  const steps = [
    {
      step: 1,
      title: '웹용 저장 선택',
      description: '파일 > 내보내기 > 웹용 저장 선택',
      tip: '단축키: Mac ⌘ + Shift + Option + S / Windows Ctrl + Shift + Alt + S'
    },
    {
      step: 2,
      title: '포맷 설정',
      description: '포맷: PNG-24 / 투명도 체크',
      tip: 'PNG-8이 아닌 PNG-24를 선택해야 투명도가 제대로 적용됩니다'
    }
  ];

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
            📦 PNG 저장 방법 (포토샵 기준)
          </h2>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            배경 없는 PNG 저장이 필요하신가요?
          </h3>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            {/* 포토샵 예시 이미지 및 (샘플 배너 이미지) 텍스트 삭제 */}
          </div>
          <div className="grid">
            {steps.map((step) => (
              <div key={step.step} className="card" style={{ padding: '20px' }}>
                <div className="flex" style={{ alignItems: 'center', marginBottom: '15px' }}>
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
                    fontSize: '1.1rem'
                  }}>
                    {step.step}
                  </div>
                  <h4 style={{ marginLeft: '15px', fontSize: '1.1rem', color: '#1e293b' }}>
                    {step.title}
                  </h4>
                </div>
                <p style={{ color: '#64748b', marginBottom: '10px' }}>
                  {step.description}
                </p>
                <div className="tip" style={{ fontSize: '0.9rem' }}>
                  💡 {step.tip}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            ⌨ 단축키 안내
          </h3>
          
          <div className="card">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ marginBottom: '10px', color: '#1e293b' }}>Mac</h4>
                <div style={{
                  background: '#f8fafc',
                  padding: '15px 25px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  marginBottom: '16px'
                }}>
                  ⌘ + Shift + Option + S
                </div>
                <img src="/images/mac.png" alt="Mac 단축키 예시" style={{ maxWidth: '216px', width: '100%', margin: '0 auto', display: 'block' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ marginBottom: '10px', color: '#1e293b' }}>Windows</h4>
                <div style={{
                  background: '#f8fafc',
                  padding: '15px 25px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  marginBottom: '16px'
                }}>
                  Ctrl + Shift + Alt + S
                </div>
                <img src="/images/window.png" alt="Windows 단축키 예시" style={{ maxWidth: '216px', width: '100%', margin: '0 auto', display: 'block' }} />
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '18px' }}>
            <div style={{
              display: 'inline-block',
              background: '#e0edff',
              color: '#174ea6',
              borderRadius: '14px',
              padding: '16px 28px',
              fontSize: '1.08rem',
              fontWeight: 500,
              boxShadow: '0 1px 4px #e0e7ef',
              textAlign: 'left',
              margin: '0 auto'
            }}>
              <span role="img" aria-label="bulb" style={{ marginRight: '7px' }}>💡</span>
              반드시 <b>PNG-24</b>로 저장해야 투명 배경이 유지됩니다
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <div style={{
              display: 'inline-block',
              background: '#e0edff',
              color: '#174ea6',
              borderRadius: '14px',
              padding: '14px 22px',
              fontSize: '1rem',
              fontWeight: 500,
              margin: '0 auto',
              textAlign: 'left'
            }}>
              <span role="img" aria-label="bulb" style={{ marginRight: '7px' }}>💡</span>
              저장 시 파일 확장자가 <b>.png</b>인지 꼭 확인하세요.<br/>
              '투명도(Transparency)' 체크박스가 선택되어 있는지 확인하세요.<br/>
              저장 후, 배경이 없는지 미리보기로 꼭 확인해보세요.
            </div>
          </div>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            📊 PNG vs JPG 차이점
          </h3>
          
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>PNG 저장</h4>
              <div style={{
                width: '120px',
                height: '120px',
                margin: '0 auto 15px',
                background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                position: 'relative',
                borderRadius: '8px'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80px',
                  height: '80px',
                  background: '#3b82f6',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  배너
                </div>
              </div>
              <p style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '5px' }}>✅ 투명 배경 유지</p>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>배경이 투명하게 저장되어<br/>어떤 배경에도 자연스럽게 적용</p>
            </div>
            
            <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>JPG 저장</h4>
              <div style={{
                width: '120px',
                height: '120px',
                margin: '0 auto 15px',
                background: 'white',
                borderRadius: '8px',
                position: 'relative',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80px',
                  height: '80px',
                  background: '#3b82f6',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  배너
                </div>
              </div>
              <p style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '5px' }}>❌ 흰색 배경 생김</p>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>흰색 배경이 자동으로 추가되어<br/>투명도가 완전히 사라짐</p>
            </div>
          </div>
        </div>

        <div className="warning">
          <strong>⚠️ JPG 또는 PNG-8로 저장하면 흰 배경이 생길 수 있어요.</strong><br/>
          → <button className="btn">저장 방식 비교 가이드 보기</button>
        </div>
      </div>
    </div>
  );
};

export default PngGuide; 