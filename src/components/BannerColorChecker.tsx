import React, { useState, useRef } from 'react';
import ColorThief from 'color-thief-browser';
import Header from './Header';
import FooterNav from './FooterNav';

interface BannerColorCheckerProps {
  onHome: () => void;
  onBack: () => void;
}

const BannerColorChecker: React.FC<BannerColorCheckerProps> = ({ onHome, onBack }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [backgroundPalette, setBackgroundPalette] = useState<string[]>([]);
  const [textPalette, setTextPalette] = useState<string[]>([]);
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState<string>('#f9f6f1');
  const [selectedTextColor, setSelectedTextColor] = useState<string>('#000000');
  const [contrastRatio, setContrastRatio] = useState<number>(0);
  const [accessibilityLevel, setAccessibilityLevel] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PALETTE_COUNT = 8;

  function colorDistance(a: [number, number, number], b: [number, number, number]) {
    return Math.sqrt(
      Math.pow(a[0] - b[0], 2) +
      Math.pow(a[1] - b[1], 2) +
      Math.pow(a[2] - b[2], 2)
    );
  }

  function filterSimilarColors(palette: [number, number, number][], threshold = 40) {
    const result: [number, number, number][] = [];
    palette.forEach(color => {
      if (!result.some(existing => colorDistance(existing, color) < threshold)) {
        result.push(color);
      }
    });
    return result;
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);
        extractColorsFromImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractColorsFromImage = (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        let paletteArr: [number, number, number][] = colorThief.getPalette(img, PALETTE_COUNT * 2);
        paletteArr = filterSimilarColors(paletteArr, 40).slice(0, PALETTE_COUNT);
        
        // 배경색 팔레트 (밝은 색상들)
        const brightColors = paletteArr
          .map(([r, g, b]) => ({ color: [r, g, b] as [number, number, number], brightness: (r * 299 + g * 587 + b * 114) / 1000 }))
          .sort((a, b) => b.brightness - a.brightness)
          .slice(0, 4)
          .map(item => `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`);
        
        // 텍스트 색상 팔레트 (어두운 색상들)
        const darkColors = paletteArr
          .map(([r, g, b]) => ({ color: [r, g, b] as [number, number, number], brightness: (r * 299 + g * 587 + b * 114) / 1000 }))
          .sort((a, b) => a.brightness - b.brightness)
          .slice(0, 4)
          .map(item => `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`);
        
        // 대비가 좋은 텍스트 색상들 추가
        const contrastColors = brightColors.map(bgColor => getContrastColor(bgColor));
        
        setBackgroundPalette(brightColors);
        setTextPalette([...darkColors, ...contrastColors.slice(0, 4)]);
        
        // 기본값 설정
        if (brightColors.length > 0) setSelectedBackgroundColor(brightColors[0]);
        if (contrastColors.length > 0) setSelectedTextColor(contrastColors[0]);
        
        // 대비율 계산
        calculateContrastRatio(brightColors[0], contrastColors[0]);
        
      } catch (error) {
        console.error('색상 추출 실패:', error);
        setBackgroundPalette([]);
        setTextPalette([]);
      }
    };
    img.src = imageUrl;
  };

  const getContrastColor = (backgroundColor: string) => {
    const rgb = backgroundColor.match(/\d+/g);
    if (rgb) {
      const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
      return brightness > 128 ? '#000000' : '#ffffff';
    }
    return '#000000';
  };

  const calculateContrastRatio = (bgColor: string, textColor: string) => {
    const bgRgb = bgColor.match(/\d+/g);
    const textRgb = textColor.match(/\d+/g);
    
    if (bgRgb && textRgb) {
      const bgLuminance = calculateLuminance(parseInt(bgRgb[0]), parseInt(bgRgb[1]), parseInt(bgRgb[2]));
      const textLuminance = calculateLuminance(parseInt(textRgb[0]), parseInt(textRgb[1]), parseInt(textRgb[2]));
      
      const ratio = (Math.max(bgLuminance, textLuminance) + 0.05) / (Math.min(bgLuminance, textLuminance) + 0.05);
      setContrastRatio(ratio);
      
      // 접근성 레벨 설정
      if (ratio >= 7) {
        setAccessibilityLevel('AAA (최고)');
      } else if (ratio >= 4.5) {
        setAccessibilityLevel('AA (우수)');
      } else if (ratio >= 3) {
        setAccessibilityLevel('A (양호)');
      } else {
        setAccessibilityLevel('부족');
      }
    }
  };

  const calculateLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const handleBackgroundColorChange = (color: string) => {
    setSelectedBackgroundColor(color);
    calculateContrastRatio(color, selectedTextColor);
  };

  const handleTextColorChange = (color: string) => {
    setSelectedTextColor(color);
    calculateContrastRatio(selectedBackgroundColor, color);
  };

  return (
    <div className="container">
      <Header />
      
      <div className="card text-center mb-8">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#1e293b' }}>
          🎨 배너 컬러 확인기
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          배너 이미지의 색상을 분석하고 텍스트 가독성을 확인해보세요
        </p>
      </div>

      <div className="grid">
        {/* 이미지 업로드 섹션 */}
        <div className="card">
          <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>📸 배너 이미지 업로드</h3>
          <div 
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#f8fafc'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadedImage ? (
              <img 
                src={uploadedImage} 
                alt="업로드된 배너" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px', 
                  borderRadius: '8px' 
                }} 
              />
            ) : (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📁</div>
                <p style={{ color: '#64748b' }}>클릭하여 배너 이미지를 선택하세요</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* 색상 분석 섹션 */}
        <div className="card">
          <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>🔍 색상 분석 결과</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', color: '#64748b', fontWeight: '600' }}>
              추천 배경색
            </label>
            {backgroundPalette.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {backgroundPalette.map((color, idx) => (
                  <div
                    key={color}
                    style={{
                      width: '50px',
                      height: '50px',
                      background: color,
                      borderRadius: '8px',
                      border: selectedBackgroundColor === color ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => handleBackgroundColorChange(color)}
                    title={color}
                  >
                    {selectedBackgroundColor === color && (
                      <span style={{ color: '#3b82f6', fontSize: '1.2rem', fontWeight: 'bold' }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#64748b', 
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1'
              }}>
                이미지를 업로드하면 배경색 팔레트가 나타납니다
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', color: '#64748b', fontWeight: '600' }}>
              추천 텍스트 색상
            </label>
            {textPalette.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {textPalette.map((color, idx) => (
                  <div
                    key={color}
                    style={{
                      width: '50px',
                      height: '50px',
                      background: color,
                      borderRadius: '8px',
                      border: selectedTextColor === color ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => handleTextColorChange(color)}
                    title={color}
                  >
                    {selectedTextColor === color && (
                      <span style={{ 
                        color: getContrastColor(color) === '#ffffff' ? '#ffffff' : '#000000', 
                        fontSize: '1.2rem', 
                        fontWeight: 'bold' 
                      }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#64748b', 
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1'
              }}>
                이미지를 업로드하면 텍스트 색상 팔레트가 나타납니다
              </div>
            )}
          </div>
        </div>

        {/* 가독성 테스트 섹션 */}
        <div className="card">
          <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>📖 가독성 테스트</h3>
          
          <div style={{ 
            padding: '20px', 
            backgroundColor: selectedBackgroundColor, 
            borderRadius: '8px',
            marginBottom: '15px',
            minHeight: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <p style={{ 
              color: selectedTextColor, 
              fontSize: '18px', 
              fontWeight: 'bold',
              textAlign: 'center',
              margin: 0
            }}>
              이 텍스트가 잘 보이나요?<br/>
              Can you read this text clearly?
            </p>
          </div>

          {/* 대비율 정보 */}
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ marginBottom: '10px', color: '#1e293b', fontSize: '0.9rem' }}>
              📊 대비율 분석
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>대비율:</span>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e293b' }}>
                {contrastRatio.toFixed(2)}:1
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>접근성 레벨:</span>
              <span style={{ 
                fontSize: '0.9rem', 
                fontWeight: 'bold',
                color: accessibilityLevel.includes('AAA') ? '#10b981' : 
                       accessibilityLevel.includes('AA') ? '#3b82f6' : 
                       accessibilityLevel.includes('A') ? '#f59e0b' : '#ef4444'
              }}>
                {accessibilityLevel}
              </span>
            </div>
          </div>

          {/* 접근성 가이드 */}
          <div style={{ 
            marginTop: '15px',
            padding: '15px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <h4 style={{ marginBottom: '8px', color: '#0c4a6e', fontSize: '0.9rem' }}>
              ℹ️ 접근성 가이드
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px', 
              fontSize: '0.8rem', 
              color: '#0c4a6e',
              lineHeight: '1.4'
            }}>
              <li><strong>AAA (최고):</strong> 7:1 이상 - 모든 사용자에게 최적</li>
              <li><strong>AA (우수):</strong> 4.5:1 이상 - 대부분의 사용자에게 적합</li>
              <li><strong>A (양호):</strong> 3:1 이상 - 기본적인 가독성 확보</li>
              <li><strong>부족:</strong> 3:1 미만 - 개선 필요</li>
            </ul>
          </div>
        </div>
      </div>

      <FooterNav onHome={onHome} onBack={onBack} />
    </div>
  );
};

export default BannerColorChecker; 