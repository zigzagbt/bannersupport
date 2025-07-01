import React, { useState } from 'react';
import FooterNav from './FooterNav';

interface TextColorGuideProps {
  onBack: () => void;
  onHome: () => void;
  initialBackgroundColor?: string;
  palette?: string[];
  setBackgroundColor?: (color: string) => void;
}

// contrast 계산 함수 추가
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  if (h.length === 3) {
    return [
      ((bigint >> 8) & 0xf) * 17,
      ((bigint >> 4) & 0xf) * 17,
      (bigint & 0xf) * 17
    ];
  }
  return [
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    bigint & 255
  ];
}
function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}
function contrast(rgb1: number[], rgb2: number[]) {
  const lum1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// 색상(H), 채도(S), 명도(V) 구하기
function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, v };
}

const TextColorGuide: React.FC<TextColorGuideProps> = ({ onBack, onHome, initialBackgroundColor = '#f9f6f1', palette, setBackgroundColor }) => {
  // 배경색 상태를 prop에서 관리
  const backgroundColor = initialBackgroundColor;
  const [textColor, setTextColor] = useState('#222222');

  // 블랙/화이트 각각의 contrast ratio 계산
  const blackContrast = contrast(hexToRgb(backgroundColor), hexToRgb('#222222'));
  const whiteContrast = contrast(hexToRgb(backgroundColor), hexToRgb('#FFFFFF'));
  const bgRgb = hexToRgb(backgroundColor);
  const bgLuminance = luminance(bgRgb[0], bgRgb[1], bgRgb[2]);
  const bgHsv = rgbToHsv(bgRgb[0], bgRgb[1], bgRgb[2]);
  let recommendation = '';
  let recommendedColor = '';
  let strongWarning = false;

  // 1. contrast ratio 4.5 이상이면 모두 사용 가능
  if (blackContrast >= 4.5 && whiteContrast >= 4.5) {
    recommendation = '블랙/화이트 모두 사용 가능';
    recommendedColor = '';
  } else if (Math.abs(blackContrast - whiteContrast) <= 0.5) {
    // 2. contrast ratio 차이 0.5 이하이면 둘 다 테스트 안내
    recommendation = '블랙/화이트 모두 테스트해보세요';
    recommendedColor = '';
  } else if (bgLuminance >= 0.7 && bgHsv.s > 0.5 && whiteContrast > blackContrast) {
    // 3. 밝고 채도 높은 컬러에서 화이트 우선
    recommendation = '화이트(흰색) 권장';
    recommendedColor = 'white';
    if (whiteContrast < 4.5) strongWarning = true;
  } else if (bgLuminance < 0.3 && bgHsv.s > 0.5 && blackContrast > whiteContrast) {
    // 4. 어둡고 채도 높은 컬러에서 블랙 우선
    recommendation = '블랙(검정) 권장';
    recommendedColor = 'black';
    if (blackContrast < 4.5) strongWarning = true;
  } else if (blackContrast > whiteContrast) {
    // 5. 그 외에는 contrast ratio가 더 높은 쪽 추천
    recommendation = '블랙(검정) 권장';
    recommendedColor = 'black';
    if (blackContrast < 4.5) strongWarning = true;
  } else {
    recommendation = '화이트(흰색) 권장';
    recommendedColor = 'white';
    if (whiteContrast < 4.5) strongWarning = true;
  }

  let showContrastWarning = false;
  if (!strongWarning && ((recommendedColor === 'black' && blackContrast < 4.5) || (recommendedColor === 'white' && whiteContrast < 4.5))) {
    showContrastWarning = true;
  }

  const contrastExamples = [
    { bg: '#f9f6f1', text: '#222222', ratio: '4.5:1', recommendation: '검정색 사용 권장' },
    { bg: '#1e3a8a', text: '#ffffff', ratio: '12.6:1', recommendation: '흰색 사용 가능' },
    { bg: '#fce7f3', text: '#222222', ratio: '3.8:1', recommendation: '검정색 사용 권장' },
    { bg: '#000000', text: '#ffffff', ratio: '21:1', recommendation: '흰색 사용 가능' },
    { bg: '#ffffff', text: '#222222', ratio: '15.6:1', recommendation: '검정색 사용 가능' },
    { bg: '#f3f4f6', text: '#222222', ratio: '13.2:1', recommendation: '검정색 사용 가능' }
  ];

  // 추천 컬러 스타일 계산
  const getRecommendationStyle = () => {
    if (recommendedColor === 'black') {
      return {
        background: 'rgba(34,34,34,0.6)',
        color: '#fff',
        borderRadius: '10px',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center' as const,
        fontWeight: 700,
        fontSize: '1.1rem',
        marginTop: '18px',
        gap: '10px'
      };
    } else if (recommendedColor === 'white') {
      return {
        background: 'rgba(255,255,255,0.6)',
        color: '#222',
        borderRadius: '10px',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center' as const,
        fontWeight: 700,
        fontSize: '1.1rem',
        marginTop: '18px',
        gap: '10px',
        border: '1px solid #e5e7eb'
      };
    }
    return {};
  };
  const getCircleStyle = () => {
    if (recommendedColor === 'black') {
      return {
        width: '18px', height: '18px', borderRadius: '50%', background: '#222', display: 'inline-block', border: '1.5px solid #fff'
      };
    } else if (recommendedColor === 'white') {
      return {
        width: '18px', height: '18px', borderRadius: '50%', background: '#fff', display: 'inline-block', border: '1.5px solid #222'
      };
    }
    return {};
  };

  return (
    <div>
      <div className="card">
        <div className="flex" style={{ alignItems: 'center', marginBottom: '20px' }}>
          {onBack && (
            <button onClick={onBack} style={{ background: '#e0e7ef', color: '#2563eb', border: 'none', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginRight: 8 }}>
              ← 뒤로가기
            </button>
          )}
          <button className="btn-home" onClick={onHome}>
            🏠 홈
          </button>
          <h2 style={{ marginLeft: '20px', fontSize: '1.6rem', color: '#1e293b' }}>
            ⚫⚪ 텍스트 색상 고르기
          </h2>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            실시간 컬러 테스트
          </h3>
          
          <div className="tip" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', background: '#e6f0ff', padding: '24px', borderRadius: '18px', fontWeight: 700, fontSize: '1.25rem', color: '#2563eb' }}>
            <span style={{ marginRight: '12px' }}>선택된 배경색:</span>
            <span style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              background: backgroundColor,
              borderRadius: '7px',
              border: '2px solid #e5e7eb',
              marginRight: '10px',
              verticalAlign: 'middle'
            }}></span>
            <span style={{ color: '#2563eb', fontWeight: 500, fontSize: '1.5rem', marginRight: '18px' }}>{backgroundColor}</span>
            <button 
              className="btn" 
              style={{ 
                marginLeft: 'auto',
                fontSize: '1.15rem',
                padding: '12px 32px',
                fontWeight: 600
              }}
              onClick={onBack}
            >
              ← 이미지 선택하고 컬러 추천받기
            </button>
          </div>
          
          <div className="grid">
            <div className="card">
              <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>배경색 선택</h4>
              <input 
                type="color" 
                value={backgroundColor}
                onChange={(e) => setBackgroundColor && setBackgroundColor(e.target.value)}
                style={{ width: '100px', height: '50px', border: 'none', borderRadius: '8px' }}
              />
              <div className="color-code mt-20">{backgroundColor}</div>
            </div>
            
            <div className="card">
              <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>텍스트색 선택</h4>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '10px' }}>
                <button
                  onClick={() => setTextColor('#222222')}
                  style={{
                    background: textColor === '#222222' ? '#222222' : '#f3f4f6',
                    color: textColor === '#222222' ? '#fff' : '#222',
                    border: textColor === '#222222' ? '2px solid #222' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '10px 22px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  블랙
                </button>
                <button
                  onClick={() => setTextColor('#FFFFFF')}
                  style={{
                    background: textColor === '#FFFFFF' ? '#fff' : '#f3f4f6',
                    color: textColor === '#FFFFFF' ? '#222' : '#222',
                    border: textColor === '#FFFFFF' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '10px 22px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  화이트
                </button>
              </div>
              <div className="color-code mt-20">{textColor}</div>
            </div>
          </div>

          <h4 style={{ fontSize: '1.1rem', marginBottom: '15px', marginTop: '30px', color: '#1e293b' }}>텍스트 컬러 미리보기</h4>
          {(() => {
            const blackBox = (
              <div style={{
                backgroundColor: backgroundColor,
                color: '#000000',
                padding: '30px 20px',
                textAlign: 'center',
                borderRadius: '8px',
                border: recommendedColor === 'black' ? '4px solid #22c55e' : '1px solid #e2e8f0',
                position: 'relative',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '150px',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '10px', right: '10px',
                  background: 'rgba(255, 255, 255, 0.8)', color: '#333',
                  padding: '3px 8px', borderRadius: '6px',
                  fontSize: '0.85rem', fontWeight: '600'
                }}>
                  대비 {blackContrast.toFixed(2)}
                </div>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0' }}>
                  이렇게 보여집니다
                </p>
                {recommendedColor === 'black' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '10px', left: '10px',
                    background: '#22c55e', color: '#fff',
                    padding: '3px 8px', borderRadius: '6px',
                    fontSize: '0.85rem', fontWeight: '600'
                  }}>
                    추천컬러
                  </div>
                )}
              </div>
            );

            const whiteBox = (
              <div style={{
                backgroundColor: backgroundColor,
                color: '#FFFFFF',
                padding: '30px 20px',
                textAlign: 'center',
                borderRadius: '8px',
                border: recommendedColor === 'white' ? '4px solid #22c55e' : '1px solid #e2e8f0',
                position: 'relative',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '150px',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '10px', right: '10px',
                  background: 'rgba(0, 0, 0, 0.6)', color: '#fff',
                  padding: '3px 8px', borderRadius: '6px',
                  fontSize: '0.85rem', fontWeight: '600'
                }}>
                  대비 {whiteContrast.toFixed(2)}
                </div>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0' }}>
                  이렇게 보여집니다
                </p>
                {recommendedColor === 'white' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '10px', left: '10px',
                    background: '#22c55e', color: '#fff',
                    padding: '3px 8px', borderRadius: '6px',
                    fontSize: '0.85rem', fontWeight: '600'
                  }}>
                    추천컬러
                  </div>
                )}
              </div>
            );

            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                {blackBox}
                {whiteBox}
              </div>
            )
          })()}
        </div>
      </div>
      <FooterNav onHome={onHome} onBack={onBack} />
    </div>
  );
};

export default TextColorGuide; 