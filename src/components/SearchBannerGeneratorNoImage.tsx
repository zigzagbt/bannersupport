// SearchBannerGeneratorNoImage.tsx - Version 1
// Features:
// - 375x48 preview banner with fixed size (no ratio calculation)
// - 13px font size, 600 font weight for preview text
// - No image upload functionality
// - Manual text color selection (black/white) with toggle
// - Emoji filtering in banner text
// - Download functionality with 1125x144 canvas

import React, { useState, useRef } from 'react';

interface SearchBannerGeneratorNoImageProps {
  onHome: () => void;
  onBack: () => void;
}

const SearchBannerGeneratorNoImage: React.FC<SearchBannerGeneratorNoImageProps> = ({ onHome, onBack }) => {
  const [backgroundColor, setBackgroundColor] = useState<string>('#f9f6f1');
  const [textColor, setTextColor] = useState<string>('#222222');
  const [bannerText, setBannerText] = useState<string>('광고 문구를 입력해주세요.');
  const [customTextColor, setCustomTextColor] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 컴포넌트 마운트 시 기본 미리보기 생성
  React.useEffect(() => {
    generateDefaultBanner();
  }, []);

  // 배경색, 텍스트 색상, 텍스트 내용이 변경될 때마다 미리보기 업데이트
  React.useEffect(() => {
    generateDefaultBanner();
  }, [backgroundColor, textColor, bannerText, customTextColor]);

  const generateDefaultBanner = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = 375;
    canvas.height = 48;

    // 배경색 그리기
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 텍스트 그리기
    ctx.fillStyle = customTextColor ? textColor : (getContrastRatio(backgroundColor, '#000000') > getContrastRatio(backgroundColor, '#ffffff') ? '#000000' : '#ffffff');
    ctx.font = '600 13px Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // 텍스트 위치 계산
    const textX = 16; // 왼쪽 여백
    const textY = canvas.height / 2;

    // 텍스트 그리기
    ctx.fillText(bannerText || '바로 이렇게', textX, textY);
  };

  const getContrastRatio = (bgColor: string, textColor: string): number => {
    const getLuminance = (color: string): number => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      const [rs, gs, bs] = [r, g, b].map(c => {
        if (c <= 0.03928) return c / 12.92;
        return Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(bgColor);
    const l2 = getLuminance(textColor);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const downloadBanner = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 다운로드용 캔버스 크기 (1125x144)
    canvas.width = 1125;
    canvas.height = 144;

    // 배경색 그리기
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 텍스트 그리기
    ctx.fillStyle = customTextColor ? textColor : (getContrastRatio(backgroundColor, '#000000') > getContrastRatio(backgroundColor, '#ffffff') ? '#000000' : '#ffffff');
    ctx.font = '600 39px Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // 텍스트 위치 계산
    const textX = 48; // 왼쪽 여백
    const textY = canvas.height / 2;

    // 텍스트 그리기
    ctx.fillText(bannerText || '바로 이렇게', textX, textY);

    // 다운로드 실행
    const link = document.createElement('a');
    link.download = 'search-banner-no-image.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  const autoTextColor = getContrastRatio(backgroundColor, '#000000') > getContrastRatio(backgroundColor, '#ffffff') ? '#000000' : '#ffffff';

  return (
    <div>
      <div className="card">
        <div className="flex" style={{ alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={onBack} style={{ background: '#e0e7ef', color: '#2563eb', border: 'none', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginRight: 8 }}>
            ← 뒤로가기
          </button>
          <button className="btn-home" onClick={onHome}>
            🏠 홈
          </button>
          <h2 style={{ marginLeft: '20px', fontSize: '1.6rem', color: '#1e293b' }}>
            🔍 검색 띠배너 생성기 (이미지 없음)
          </h2>
        </div>

        {/* 메인 레이아웃 - 좌우 분할 */}
        <div className="card">
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* 왼쪽: 미리보기 + 컬러 선택 */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              {/* 미리보기 */}
              <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
                👀 미리보기
              </h3>
              <div style={{ 
                width: '375px', 
                height: '48px', 
                background: backgroundColor,
                padding: '6px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '20px'
              }}>
                {/* 광고 문구 영역 */}
                <div style={{ 
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  minHeight: '24px',
                  width: '100%',
                  marginLeft: '10px'
                }}>
                  <span style={{ 
                    color: customTextColor ? textColor : autoTextColor, 
                    fontSize: '13px', 
                    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
                    fontWeight: '600',
                    textAlign: 'left',
                    lineHeight: '1.2'
                  }}>
                    {bannerText || '바로 이렇게'}
                  </span>
                </div>
              </div>

              {/* 텍스트 컬러 자동 추천 */}
              <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#374151', textAlign: 'left' }}>
                텍스트 컬러 자동 추천: {getContrastRatio(backgroundColor, '#000000') > getContrastRatio(backgroundColor, '#ffffff') ? '블랙' : '화이트'} (대비 {Math.max(getContrastRatio(backgroundColor, '#000000'), getContrastRatio(backgroundColor, '#ffffff')).toFixed(2)}:1)
              </div>

              {/* 텍스트 컬러 선택 버튼 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => setCustomTextColor(!customTextColor)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    background: customTextColor ? '#3b82f6' : '#f1f5f9',
                    color: customTextColor ? 'white' : '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {customTextColor ? '자동으로 텍스트 컬러 지정' : '직접 텍스트 컬러 지정'}
                </button>
                {customTextColor && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => setTextColor('#000000')}
                      style={{
                        width: '24px',
                        height: '24px',
                        background: '#000000',
                        border: textColor === '#000000' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="블랙"
                    />
                    <button
                      onClick={() => setTextColor('#ffffff')}
                      style={{
                        width: '24px',
                        height: '24px',
                        background: '#ffffff',
                        border: textColor === '#ffffff' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="화이트"
                    />
                  </div>
                )}
              </div>

              {/* 컬러 선택하기 */}
              <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
                🎨 컬러 선택하기
              </h3>
              
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {/* 직접 컬러 선택하기 */}
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#64748b', fontSize: '0.9rem' }}>직접 컬러 선택하기</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        padding: 0
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '3px', fontSize: '0.9rem' }}>
                        선택된 배경색: {backgroundColor}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        원하는 색상을 직접 선택할 수 있어요
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 광고 문구 */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              {/* 광고 문구 */}
              <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
                ✏️ 광고 문구 *
              </h3>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={bannerText}
                  onChange={(e) => {
                    const newText = e.target.value;
                    // 이모지 제거 (유니코드 이모지 범위 필터링)
                    const filteredText = newText.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
                    
                    if (filteredText.length <= 18) {
                      setBannerText(filteredText);
                    }
                  }}
                  placeholder="바로 이렇게"
                  maxLength={18}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
                <div style={{ 
                  position: 'absolute', 
                  bottom: '8px', 
                  right: '8px', 
                  fontSize: '0.8rem', 
                  color: bannerText.length >= 18 ? '#ef4444' : '#64748b',
                  fontWeight: bannerText.length >= 18 ? 'bold' : 'normal'
                }}>
                  {bannerText.length}/18
                </div>
              </div>

              {/* 가이드 */}
              <div style={{ 
                background: '#f8fafc', 
                padding: '12px', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginTop: '20px'
              }}>
                <h4 style={{ marginBottom: '10px', color: '#64748b', fontSize: '0.9rem' }}>💡 사용 가이드</h4>
                <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5' }}>
                  <div style={{ marginBottom: '8px' }}>
                    • <strong>텍스트 길이:</strong> 최대 18자까지 입력 가능해요
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    • <strong>이모지:</strong> 자동으로 제거됩니다
                  </div>
                  <div>
                    • <strong>색상:</strong> 배경색과 텍스트 색상을 자유롭게 선택하세요
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* JPG 다운로드 버튼 */}
        <div className="card" style={{ textAlign: 'center' }}>
          <button
            onClick={downloadBanner}
            style={{
              padding: '15px 30px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}
          >
            JPG 다운로드
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBannerGeneratorNoImage; 