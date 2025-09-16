// SearchBannerGenerator.tsx - Version 3
// Features:
// - 375x48 preview banner with fixed size (no ratio calculation)
// - 13px font size, 600 font weight for preview text
// - 100x48 image area in preview
// - No border-radius in preview
// - Transparent image (nukki cut) validation - only allows transparent background images
// - Manual text color selection (black/white) with toggle
// - Emoji filtering in banner text
// - Image aspect ratio validation (298:144 or 312:132)
// - Automatic text color recommendation based on background contrast
// - Download functionality with 1125x144 canvas

import React, { useState, useRef, DragEvent } from 'react';
import ColorThief from 'color-thief-browser';

interface SearchBannerGeneratorProps {
  onHome: () => void;
  onBack: () => void;
}

const SearchBannerGenerator: React.FC<SearchBannerGeneratorProps> = ({ onHome, onBack }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#f9f6f1');
  const [textColor, setTextColor] = useState<string>('#222222');
  const [bannerText, setBannerText] = useState<string>('광고 문구를 입력해주세요.');
  const [customTextColor, setCustomTextColor] = useState<boolean>(false);
  const [backgroundPalette, setBackgroundPalette] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PALETTE_COUNT = 8;

  // 컴포넌트 마운트 시 기본 미리보기 생성
  React.useEffect(() => {
    generateDefaultBanner();
  }, []);

  // 배경색, 텍스트 색상, 텍스트 내용이 변경될 때마다 미리보기 업데이트
  React.useEffect(() => {
    if (!uploadedImage) {
      generateDefaultBanner();
    }
  }, [backgroundColor, textColor, bannerText, uploadedImage]);

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

  // 누끼컷(투명 배경) 판별 함수
  const checkTransparentImage = (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(false);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let transparentPixels = 0;
        let totalPixels = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3]; // 알파 채널
          if (alpha < 128) { // 반투명 이상을 투명으로 간주
            transparentPixels++;
          }
        }
        
        const transparentRatio = transparentPixels / totalPixels;
        resolve(transparentRatio > 0.1); // 10% 이상 투명 픽셀이 있으면 누끼컷으로 판단
      };
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  };

  

  // 이미지 업로드 처리 (input)
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        const img = new Image();
        img.onload = async () => {
          const ratio = img.width / img.height;
          const targetRatio1 = 298 / 144; // 약 2.07:1
          const targetRatio2 = 312 / 132; // 약 2.36:1
          const tolerance = 0.3; // 허용 오차
          
          if (Math.abs(ratio - targetRatio1) <= tolerance || Math.abs(ratio - targetRatio2) <= tolerance) {
            // 누끼컷 판별 실행
            const isTransparent = await checkTransparentImage(imageUrl);
            if (isTransparent) {
              setUploadedImage(imageUrl);
            } else {
              alert('누끼컷(투명 배경) 이미지만 업로드 가능합니다. 투명 배경이 있는 PNG 이미지를 업로드해주세요.');
            }
          } else {
            alert('이미지 비율이 맞지 않습니다. 298:144 또는 312:132 비율의 이미지를 업로드해주세요.');
          }
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  // 드래그 앤 드롭 업로드
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        const img = new Image();
        img.onload = async () => {
          const ratio = img.width / img.height;
          const targetRatio1 = 298 / 144; // 약 2.07:1
          const targetRatio2 = 312 / 132; // 약 2.36:1
          const tolerance = 0.3; // 허용 오차
          
          if (Math.abs(ratio - targetRatio1) <= tolerance || Math.abs(ratio - targetRatio2) <= tolerance) {
            // 누끼컷 판별 실행
            const isTransparent = await checkTransparentImage(imageUrl);
            if (isTransparent) {
              setUploadedImage(imageUrl);
            } else {
              alert('누끼컷(투명 배경) 이미지만 업로드 가능합니다. 투명 배경이 있는 PNG 이미지를 업로드해주세요.');
            }
          } else {
            alert('이미지 비율이 맞지 않습니다. 298:144 또는 312:132 비율의 이미지를 업로드해주세요.');
          }
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  // 이미지 onLoad에서 팔레트 8개 추출 + 유사색 필터링
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    try {
      const colorThief = new ColorThief();
      let paletteArr: [number, number, number][] = colorThief.getPalette(img, PALETTE_COUNT * 2);
      paletteArr = filterSimilarColors(paletteArr, 40).slice(0, PALETTE_COUNT);
      const hexPalette = paletteArr.map(([r, g, b]: [number, number, number]) =>
        '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
      );
      setBackgroundPalette(hexPalette);
      if (hexPalette.length > 0) setBackgroundColor(hexPalette[0]);
    } catch (e) {
      setBackgroundPalette([]);
    }
  };



  // contrast 계산 함수들
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

  // 블랙/화이트 각각의 contrast ratio 계산
  const blackContrast = contrast(hexToRgb(backgroundColor), hexToRgb('#222222'));
  const whiteContrast = contrast(hexToRgb(backgroundColor), hexToRgb('#FFFFFF'));
  
  // 배경색에 따른 자동 텍스트 컬러 계산
  const autoTextColor = blackContrast > whiteContrast ? '#222222' : '#FFFFFF';

  const generateDefaultBanner = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정 (검색 띠배너 비율)
    canvas.width = 800;
    canvas.height = 200;

    // 배경 그리기
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 기본 이미지 플레이스홀더 그리기 (왼쪽에 원형)
    const imageSize = 150;
    const imageX = 25;
    const imageY = (canvas.height - imageSize) / 2;
    
    // 원형 플레이스홀더 그리기
    ctx.save();
    ctx.beginPath();
    ctx.arc(imageX + imageSize/2, imageY + imageSize/2, imageSize/2, 0, 2 * Math.PI);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 플레이스홀더 아이콘 그리기
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📷', imageX + imageSize/2, imageY + imageSize/2 + 15);

    // 텍스트 그리기
    ctx.fillStyle = textColor;
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'left';
    
    const textX = imageX + imageSize + 30;
    const textY = canvas.height / 2 + 10;
    
    // 텍스트 줄바꿈 처리
    const maxWidth = canvas.width - textX - 25;
    const words = bannerText.split(' ');
    let line = '';
    let y = textY - 20;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, textX, y);
        line = words[n] + ' ';
        y += 30;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, textX, y);
  };



  const downloadBanner = () => {
    // 캔버스 생성
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1125:144 비율로 캔버스 크기 설정
    canvas.width = 1125;
    canvas.height = 144;

    // 배경 그리기 (미리보기와 동일한 스타일)
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 패딩 계산 (미리보기의 15px 패딩)
    const padding = 15;
    const gap = 15; // 미리보기의 gap

    // 이미지 크기 (298x144)
    const imageWidth = 298;
    const imageHeight = 144;
    
    // 이미지 위치 (오른쪽 끝, 20px 여백)
    const imageX = canvas.width - imageWidth - 20;
    const imageY = 0;



    // 텍스트 그리기 (가이드에 맞게)
    ctx.fillStyle = customTextColor ? textColor : autoTextColor;
    ctx.font = '500 40px Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif'; // 가이드에 맞는 폰트
    ctx.textAlign = 'left'; // 가이드에 맞는 정렬
    
    const textX = 60; // 가이드에 맞는 좌측 여백
    const textY = canvas.height / 2 + 13; // vertical middle 정렬 (상단 여백 추가)
    
    // 텍스트 내용
    const textContent = bannerText || '바로 이렇게';
    
    // 텍스트 그리기 (가이드에 맞게 - 단일 라인)
    ctx.fillText(textContent, textX, textY);

    // 이미지 그리기 (298x144 영역, 가운데 크롭)
    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        // 이미지 비율 계산
        const imgRatio = img.width / img.height;
        const targetRatio = imageWidth / imageHeight;
        
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        
        // 가운데 크롭 계산
        if (imgRatio > targetRatio) {
          // 이미지가 더 넓음 - 가로를 크롭
          sourceWidth = img.height * targetRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // 이미지가 더 높음 - 세로를 크롭
          sourceHeight = img.width / targetRatio;
          sourceY = (img.height - sourceHeight) / 2;
        }
        
        // 이미지를 298x144 영역에 가운데 크롭으로 그리기
        ctx.drawImage(
          img, 
          sourceX, sourceY, sourceWidth, sourceHeight,  // 소스 영역
          imageX, imageY, imageWidth, imageHeight       // 타겟 영역
        );
        
        // 다운로드 실행
        const link = document.createElement('a');
        link.download = 'search-banner.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
      };
      img.src = uploadedImage;
    } else {
      // 이미지가 없으면 플레이스홀더 그리기
      // 플레이스홀더 배경
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(imageX, imageY, imageWidth, imageHeight);
      
      // 플레이스홀더 테두리
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(imageX, imageY, imageWidth, imageHeight);
      
      // 플레이스홀더 아이콘
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏔️', imageX + imageWidth/2, imageY + imageHeight/2 + 8);
      
      // 다운로드 실행
      const link = document.createElement('a');
      link.download = 'search-banner.jpg';
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    }
  };

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
            🔍 검색 띠배너 생성기
          </h2>
        </div>

                {/* 메인 레이아웃 - 좌우 분할 */}
        <div className="card">
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* 왼쪽: 이미지 업로드 + 가이드 */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              {/* 이미지 업로드 */}
              <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
                📸 이미지 업로드
              </h3>
              <div
                style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  border: dragActive ? '2px dashed #3b82f6' : '2px dashed #e5e7eb',
                  borderRadius: '12px',
                  background: dragActive ? '#f0f6ff' : '#fafafa',
                  transition: 'all 0.2s ease',
                  marginBottom: '20px'
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                {!uploadedImage ? (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>📷</div>
                    <p style={{ color: '#64748b', marginBottom: '15px', fontSize: '0.9rem' }}>
                      이미지를 클릭하거나, 이 영역에 드래그해서 업로드할 수 있어요
                    </p>
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      marginBottom: '15px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                        <strong>권장 사이즈:</strong> 312 × 132px
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                        <strong>파일 형식:</strong> PNG만 지원
                      </div>
                    </div>
                    <button 
                      className="btn" 
                      onClick={() => fileInputRef.current?.click()}
                      style={{ 
                        fontSize: '1rem', 
                        padding: '10px 20px',
                        background: '#3b82f6',
                        color: 'white'
                      }}
                    >
                      이미지 선택하기
                    </button>
                  </div>
                ) : (
                  <div>
                    <img
                      src={uploadedImage}
                      alt="업로드 이미지"
                      style={{
                        maxWidth: 180,
                        maxHeight: 180,
                        borderRadius: '12px',
                        marginBottom: '10px',
                        boxShadow: '0 2px 8px #e5e7eb',
                        objectFit: 'cover',
                        display: 'block',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                      }}
                      crossOrigin="anonymous"
                      onLoad={handleImageLoaded}
                    />
                    <button 
                      className="btn" 
                      onClick={() => {
                        setUploadedImage(null);
                        setBackgroundPalette([]);
                      }}
                      style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                    >
                      다른 이미지 선택
                    </button>
                  </div>
                )}
              </div>
              
              {/* 이미지 가이드 */}
              <h4 style={{ marginBottom: '10px', color: '#64748b', fontSize: '1rem' }}>이미지 가이드</h4>
              <div style={{ 
                background: '#f8fafc', 
                padding: '12px', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>
                    🎭 모델 컷:
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    모델의 머리 부분이 잘려보이지 않는 것을 권장해요.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>
                    📦 상품 컷:
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    해당 상품이 명확하게 보여야 해요.
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 미리보기 + 컬러 선택 + 광고 문구 */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              {uploadedImage && (
                <>
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
                marginBottom: '10px'
              }}>
                {/* 광고 문구 영역 */}
                <div style={{ 
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  minHeight: '24px',
                  width: 'calc(100% - 110px)',
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
                
                {/* 이미지 영역 */}
                <div style={{ 
                  width: '100px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  marginRight: '6px'
                }}>
                  {uploadedImage ? (
                    <img
                      src={uploadedImage}
                      alt="업로드 이미지"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '1.5rem', opacity: 0.5 }}>🏔️</div>
                  )}
                </div>
              </div>
              

              
              {/* 텍스트 컬러 자동 추천 */}
              {backgroundPalette.length > 0 && (
                <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#374151', textAlign: 'left' }}>
                  텍스트 컬러 자동 추천: {blackContrast > whiteContrast ? '블랙' : '화이트'} (대비 {Math.max(blackContrast, whiteContrast).toFixed(2)}:1)
                </div>
              )}
              

              
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
                {/* 배경색 선택 */}
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#64748b', fontSize: '0.9rem' }}>배경색 선택</h4>
                  {backgroundPalette.length > 0 ? (
                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        {backgroundPalette.map((color, idx) => (
                          <div
                            key={color}
                            style={{
                              width: '35px',
                              height: '35px',
                              background: color,
                              borderRadius: '6px',
                              border: backgroundColor === color ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxSizing: 'border-box',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onClick={() => setBackgroundColor(color)}
                            title={color}
                          >
                            {backgroundColor === color && (
                              <span style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: '#fff',
                                border: '2px solid #3b82f6',
                                boxShadow: '0 1px 4px #e0e7ef',
                              }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '20px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '2px dashed #e2e8f0'
                    }}>
                      <div style={{ fontSize: '1rem', marginBottom: '5px', opacity: 0.5 }}>🎨</div>
                      <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        이미지를 업로드하면<br/>추천 컬러 팔레트가 나타납니다
                      </p>
                    </div>
                  )}
                </div>

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

                </>
              )}
            </div>
          </div>
        </div>



        {/* JPG 다운로드 버튼 */}
        <div className="card" style={{ textAlign: 'center' }}>
          <button
            onClick={downloadBanner}
            disabled={!uploadedImage}
            style={{
              padding: '15px 30px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: uploadedImage ? 'pointer' : 'not-allowed',
              opacity: uploadedImage ? 1 : 0.6,
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

export default SearchBannerGenerator; 