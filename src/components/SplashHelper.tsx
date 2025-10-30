import React, { useEffect, useRef, useState, useCallback } from 'react';
import FooterNav from './FooterNav';

interface SplashHelperProps {
  onHome: () => void;
  onBack: () => void;
}

// 초기 스캐폴드: 업로드 + Safe Zone 오버레이만 표시 (내용은 비움)
const SplashHelper: React.FC<SplashHelperProps> = ({ onHome, onBack }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Pan/Zoom state (crop by moving/scaling image under fixed frame)
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  type FitMode = 'crop' | 'fit';
  const [mode, setMode] = useState<FitMode>('crop');

  // Target & preview frame with exact 1125×2436 aspect ratio (constants)
  const TARGET_W = 1125;
  const TARGET_H = 2436;
  const ASPECT = TARGET_H / TARGET_W; // ~2.1648
  const FRAME_W = 270; // preview width
  const FRAME_H = Math.round(FRAME_W * ASPECT); // exact aspect ratio height
  
  // Gradient area dimensions (375×277 ratio)
  const GRADIENT_AREA_W = 375;
  const GRADIENT_AREA_H = 277;
  const GRADIENT_AREA_ASPECT = GRADIENT_AREA_H / GRADIENT_AREA_W; // ~0.7387
  const MIN_SCALE = 0.05;
  const MAX_SCALE = 8;
  const SAFE_TOP_BASE = Math.round(FRAME_H * 0.25);
  const SAFE_BOTTOM_BASE = Math.round(FRAME_H * 0.2917);
  const SAFE_SHIFT = 34; // shift guide area down; adjusted to move 16px up
  const EXTRA_BOTTOM = 60; // expand safe zone downward by ~60px (원복)
  const SAFE_TOP = SAFE_TOP_BASE + SAFE_SHIFT;
  const SAFE_BOTTOM = Math.max(0, SAFE_BOTTOM_BASE - SAFE_SHIFT - EXTRA_BOTTOM);

  // Gradient overlay state
  const [gradientEnabled, setGradientEnabled] = useState<boolean>(true);
  // Gradient configuration
  type GradientMode = 'auto' | 'black' | 'white' | 'custom';
  const [gradientMode, setGradientMode] = useState<GradientMode>('auto');
  const [gradientAlpha, setGradientAlpha] = useState<number>(0.4);
  const [pickedColor, setPickedColor] = useState<string>('rgba(0,0,0,0)'); // used when custom
  const [eyedropperMode, setEyedropperMode] = useState<boolean>(false);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [recommendedTextColor, setRecommendedTextColor] = useState<string>('#000000');
  const [showTextRecommendation, setShowTextRecommendation] = useState<boolean>(true);
  const [recommendedOverlay, setRecommendedOverlay] = useState<'black' | 'white'>('black');
  // Contrast state
  

  // Human readable label for recommended text color
  const recommendedTextLabel = recommendedTextColor === '#000000' ? '블랙' : '화이트';

  const toRgbaWithAlpha = (input: string, alpha: number) => {
    if (input.startsWith('rgba')) {
      const nums = input.match(/\d+\.\d+|\d+/g);
      if (nums && nums.length >= 3) return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`;
    }
    if (input.startsWith('rgb')) {
      const nums = input.match(/\d+\.\d+|\d+/g);
      if (nums && nums.length >= 3) return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`;
    }
    if (input.startsWith('#')) {
      const hex = input.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return input;
  };
  // Reset UI/state when a new image is selected
  const resetForNewImage = useCallback(() => {
    setPickedColor('rgba(0,0,0,0)');
    setEyedropperMode(false);
    setGradientMode('auto');
    setGradientAlpha(0.4);
    setRecommendedTextColor('#000000');
    setRecommendedOverlay('black');
    setScale(1);
    setPan({ x: 0, y: 0 });
    setNaturalSize(null);
  }, []);


  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  // WCAG contrast helpers
  const srgbToLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const relativeLuminance = (r: number, g: number, b: number) => {
    const R = srgbToLinear(r);
    const G = srgbToLinear(g);
    const B = srgbToLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  const contrastRatio = (l1: number, l2: number) => {
    const L1 = Math.max(l1, l2);
    const L2 = Math.min(l1, l2);
    return (L1 + 0.05) / (L2 + 0.05);
  };

  // Color helpers removed; only black/white recommendation remains

  // 배경색에 따른 텍스트 색상 추천 함수
  const getRecommendedTextColor = useCallback((backgroundColor: string) => {
    // RGB 값을 추출
    const rgbMatch = backgroundColor.match(/\d+/g);
    if (!rgbMatch || rgbMatch.length < 3) return '#000000';
    
    const r = parseInt(rgbMatch[0]);
    const g = parseInt(rgbMatch[1]);
    const b = parseInt(rgbMatch[2]);
    
    // 밝기 계산 (0-255)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 밝기가 128보다 크면 검은색, 작으면 흰색 추천
    return brightness > 128 ? '#000000' : '#ffffff';
  }, []);

  const computeDrawRect = useCallback(() => {
    if (!naturalSize) return null;
    if (mode === 'fit') {
      const scaleFit = Math.min(FRAME_W / naturalSize.w, FRAME_H / naturalSize.h);
      const dw = naturalSize.w * scaleFit;
      const dh = naturalSize.h * scaleFit;
      const dx = (FRAME_W - dw) / 2;
      const dy = (FRAME_H - dh) / 2;
      return { dx, dy, dw, dh };
    }
    return { dx: pan.x, dy: pan.y, dw: naturalSize.w * scale, dh: naturalSize.h * scale };
  }, [FRAME_W, FRAME_H, mode, naturalSize, pan.x, pan.y, scale]);

  // 실시간으로 텍스트 컬러 추천 업데이트
  const updateTextColorRecommendation = useCallback(() => {
    if (!showTextRecommendation) return;
    if (!imageUrl || !naturalSize) return;
    
    const tmp = document.createElement('canvas');
    tmp.width = FRAME_W;
    tmp.height = FRAME_H;
    const tctx = tmp.getContext('2d');
    if (!tctx) return;
    
    const img = new Image();
    img.onload = () => {
      tctx.imageSmoothingQuality = 'high';
      tctx.clearRect(0, 0, FRAME_W, FRAME_H);
      
      const imgRect = computeDrawRect();
      if (!imgRect) return;
      
      tctx.drawImage(img, 0, 0, naturalSize.w, naturalSize.h, imgRect.dx, imgRect.dy, imgRect.dw, imgRect.dh);

      // Apply gradient overlay onto the temp canvas if enabled so contrast reflects current background
      if (gradientEnabled) {
        let baseColor: string;
        if (gradientMode === 'black') baseColor = '#000000';
        else if (gradientMode === 'white') baseColor = '#ffffff';
        else if (gradientMode === 'auto') baseColor = (recommendedOverlay === 'black' ? '#000000' : '#ffffff');
        else baseColor = pickedColor === 'rgba(0,0,0,0)' ? '#000000' : pickedColor;

        const gradHeight = Math.round(FRAME_H * 0.15) + 155; // match preview
        const grad = tctx.createLinearGradient(0, 0, 0, gradHeight);
        const colorTop = toRgbaWithAlpha(baseColor, gradientAlpha);
        const colorTransparent = toRgbaWithAlpha(baseColor, 0);
        grad.addColorStop(0, colorTop);
        grad.addColorStop(0.6534, colorTop);
        grad.addColorStop(1, colorTransparent);
        tctx.fillStyle = grad as any;
        tctx.fillRect(0, 0, FRAME_W, gradHeight);
      }
      
      // y0~160 영역의 평균 배경색 계산하여 텍스트 색상 추천
      const sampleHeight = Math.min(160, FRAME_H);
      const sampleData = tctx.getImageData(0, 0, FRAME_W, sampleHeight).data;
      let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;
      
      for (let i = 0; i < sampleData.length; i += 4) {
        totalR += sampleData[i];
        totalG += sampleData[i + 1];
        totalB += sampleData[i + 2];
        pixelCount++;
      }
      
      if (pixelCount > 0) {
        const avgR = Math.round(totalR / pixelCount);
        const avgG = Math.round(totalG / pixelCount);
        const avgB = Math.round(totalB / pixelCount);
        // WCAG-based contrast to black/white
        const L = relativeLuminance(avgR, avgG, avgB);
        const cBlack = contrastRatio(L, 0);
        const cWhite = contrastRatio(L, 1);
        // Prefer higher; if close, bias to white
        // Ambiguous zone tolerance: raise epsilon to prefer white text a bit more
        const epsilon = 0.6;
        let recommendedColor = cWhite >= cBlack - epsilon ? '#ffffff' : '#000000';
        if (cBlack > cWhite + epsilon) recommendedColor = '#000000';
        setRecommendedTextColor(recommendedColor);
        const overlayTone = recommendedColor === '#000000' ? 'white' : 'black';
        setRecommendedOverlay(overlayTone);
        // Contrast value no longer displayed; UI hints removed
      }
    };
    img.src = imageUrl;
  }, [showTextRecommendation, imageUrl, naturalSize, computeDrawRect, FRAME_W, FRAME_H, getRecommendedTextColor, gradientEnabled, gradientMode, pickedColor, gradientAlpha, recommendedOverlay]);

  // When switching presets (Auto/Black/White), ALWAYS reset opacity to preset default (0.4).
  // Custom inherits the current preset opacity.
  useEffect(() => {
    if (gradientMode === 'auto' || gradientMode === 'black' || gradientMode === 'white') {
      setGradientAlpha(0.4);
    }
  }, [gradientMode]);

  // 이미지 위치나 크기가 변경될 때마다 텍스트 컬러 추천 업데이트
  useEffect(() => {
    if (showTextRecommendation && imageUrl && naturalSize) {
      updateTextColorRecommendation();
    }
  }, [showTextRecommendation, imageUrl, naturalSize, pan.x, pan.y, scale, mode, updateTextColorRecommendation, gradientEnabled, gradientMode, pickedColor, gradientAlpha, recommendedOverlay]);


  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!eyedropperMode || !imageUrl || !naturalSize) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 이미지 영역 내부인지 확인
    const imgRect = computeDrawRect();
    if (!imgRect) return;
    
    if (x < imgRect.dx || x > imgRect.dx + imgRect.dw || 
        y < imgRect.dy || y > imgRect.dy + imgRect.dh) return;
    
    // 캔버스에서 색상 추출
    const tmp = document.createElement('canvas');
    tmp.width = FRAME_W;
    tmp.height = FRAME_H;
    const tctx = tmp.getContext('2d');
    if (!tctx) return;
    
    const img = new Image();
    img.onload = () => {
      tctx.imageSmoothingQuality = 'high';
      tctx.clearRect(0, 0, FRAME_W, FRAME_H);
      tctx.drawImage(img, 0, 0, naturalSize.w, naturalSize.h, imgRect.dx, imgRect.dy, imgRect.dw, imgRect.dh);
      
      const data = tctx.getImageData(x, y, 1, 1).data;
      const color = `rgba(${data[0]}, ${data[1]}, ${data[2]}, 1)`;
      setPickedColor(color);
      
      // 텍스트 컬러 추천 업데이트
      updateTextColorRecommendation();
      setEyedropperMode(false);
    };
    img.src = imageUrl;
  }, [eyedropperMode, imageUrl, naturalSize, computeDrawRect, FRAME_W, FRAME_H, updateTextColorRecommendation]);

  

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      const size = { w: img.naturalWidth, h: img.naturalHeight };
      setNaturalSize(size);
      const coverScale = Math.max(FRAME_W / size.w, FRAME_H / size.h);
      if (mode === 'crop') {
        setScale(coverScale);
        const newPanX = (FRAME_W - size.w * coverScale) / 2;
        const newPanY = (FRAME_H - size.h * coverScale) / 2;
        
        setPan({ x: newPanX, y: newPanY });
      } else {
        setScale(1);
        setPan({ x: 0, y: 0 });
      }
    };
    img.src = imageUrl;
  }, [imageUrl, mode, FRAME_W, FRAME_H]);


  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      resetForNewImage();
      setImageUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      resetForNewImage();
      setImageUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const beginDrag = (clientX: number, clientY: number) => {
    setDragging(true);
    dragStartRef.current = { x: clientX - pan.x, y: clientY - pan.y };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!dragging || !dragStartRef.current) return;
    const newX = clientX - dragStartRef.current.x;
    const newY = clientY - dragStartRef.current.y;
    
    setPan({ x: newX, y: newY });
  };

  const endDrag = () => {
    setDragging(false);
    dragStartRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!naturalSize || mode === 'fit') return;
    e.preventDefault();
    // Support both scroll and pinch-zoom (ctrlKey often set on mac pinch)
    const direction = e.deltaY;
    const factor = direction < 0 ? 1.1 : 0.9;
    setScale((prev) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev * factor));
      if (newScale === prev) return prev;
      // center-based zoom: keep frame center fixed
      const cx = FRAME_W / 2;
      const cy = FRAME_H / 2;
      const ux = (cx - pan.x) / prev;
      const uy = (cy - pan.y) / prev;
      const newPanX = cx - ux * newScale;
      const newPanY = cy - uy * newScale;
      
      setPan({ x: newPanX, y: newPanY });
      return newScale;
    });
  };

  const resetAll = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setImageUrl(null);
    setNaturalSize(null);
    setPickedColor('rgba(0,0,0,0)');
    setEyedropperMode(false);
    setRecommendedTextColor('#000000');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportPng = async () => {
    if (!imageUrl || !naturalSize) return;
    const canvas = document.createElement('canvas');
    canvas.width = TARGET_W;
    canvas.height = TARGET_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background in vivid red to reveal empty areas/misplacement clearly
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, TARGET_W, TARGET_H);

    // Map preview transforms to canvas space
    const scaleFactor = TARGET_W / FRAME_W; // same ratio used for height by design

    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = imageUrl;
    });

    let dw: number;
    let dh: number;
    let dx: number;
    let dy: number;

    if (mode === 'fit') {
      const scaleFit = Math.min(FRAME_W / naturalSize.w, FRAME_H / naturalSize.h);
      dw = naturalSize.w * scaleFit * scaleFactor;
      dh = naturalSize.h * scaleFit * scaleFactor;
      dx = ((FRAME_W - naturalSize.w * scaleFit) / 2) * scaleFactor;
      dy = ((FRAME_H - naturalSize.h * scaleFit) / 2) * scaleFactor;
    } else {
      dw = naturalSize.w * scale * scaleFactor;
      dh = naturalSize.h * scale * scaleFactor;
      dx = pan.x * scaleFactor;
      dy = pan.y * scaleFactor;
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, naturalSize.w, naturalSize.h, dx, dy, dw, dh);

    // draw gradient overlay with design-specified values
    if (gradientEnabled) {
      // Gradient area: 15% + 155px (5px longer)
      const baseHeight = Math.round(TARGET_H * 0.15); // 15% of canvas height
      const extraHeight = Math.round(155 * (TARGET_H / FRAME_H)); // 155px scaled to target size (5px longer)
      const gradWidth = TARGET_W; // Full width
      const gradHeight = baseHeight + extraHeight; // 15% + 155px
      
      const grad = ctx.createLinearGradient(0, 0, 0, gradHeight);
      let baseColor: string;
      if (gradientMode === 'black') baseColor = '#000000';
      else if (gradientMode === 'white') baseColor = '#ffffff';
      else if (gradientMode === 'auto') baseColor = recommendedOverlay === 'black' ? '#000000' : '#ffffff';
      else baseColor = pickedColor === 'rgba(0,0,0,0)' ? '#000000' : pickedColor;
      const colorTop = toRgbaWithAlpha(baseColor, gradientAlpha);
      const colorTransparent = toRgbaWithAlpha(baseColor, 0);
      
      // Apply design gradient stops: 65.34% where it becomes transparent
      grad.addColorStop(0, colorTop);
      grad.addColorStop(0.6534, colorTop); // Keep solid color until 65.34%
      grad.addColorStop(1, colorTransparent); // Fully transparent at 100%
      
      ctx.fillStyle = grad as any;
      ctx.fillRect(0, 0, gradWidth, gradHeight);
    }

    const link = document.createElement('a');
    link.download = 'splash-1125x2436.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 기기 비율 가정: 1080x1920 기준. Safe Zone은 예시 비율.
  // 실제 비율과 안전 영역은 이후 사용자가 구체 제원 제공 시 조정 예정.
  return (
    <div className="container">
      <div className="card text-center mb-8">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#1e293b' }}>
          📱 스플래시 도우미
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          스플래시 이미지를 업로드해 Safe Zone 적합 여부를 확인해보세요
        </p>
      </div>

      <div className="grid">
        <div className="card">
          <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>이미지 업로드</h3>
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              cursor: imageUrl ? 'default' : 'pointer',
              backgroundColor: '#f8fafc'
            }}
            onClick={() => { if (!imageUrl) fileInputRef.current?.click(); }}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            {imageUrl && naturalSize ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div
                  ref={frameRef}
                  style={{
                    width: FRAME_W,
                    height: FRAME_H,
                    borderRadius: 16,
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#ff0000',
                    boxShadow: 'inset 0 0 0 1px #e2e8f0',
                    touchAction: 'none',
                    cursor: eyedropperMode ? 'crosshair' : (mode === 'crop' ? 'grab' : 'default')
                  }}
                  onMouseDown={(e) => { if (mode === 'crop' && !eyedropperMode) beginDrag(e.clientX, e.clientY); }}
                  onMouseMove={(e) => { if (mode === 'crop' && !eyedropperMode) moveDrag(e.clientX, e.clientY); }}
                  onMouseUp={endDrag}
                  onMouseLeave={endDrag}
                  onWheel={onWheel}
                  onTouchStart={(e) => { if (mode === 'crop' && !eyedropperMode) beginDrag(e.touches[0].clientX, e.touches[0].clientY); }}
                  onTouchMove={(e) => { if (mode === 'crop' && !eyedropperMode) moveDrag(e.touches[0].clientX, e.touches[0].clientY); }}
                  onTouchEnd={endDrag}
                  onClick={handleImageClick}
                >
                  <img
                    src={imageUrl}
                    alt="splash"
                    draggable={false}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      transform: mode === 'fit'
                        ? (() => {
                            const scaleFit = Math.min(FRAME_W / naturalSize.w, FRAME_H / naturalSize.h);
                            const cx = (FRAME_W - naturalSize.w * scaleFit) / 2;
                            const cy = (FRAME_H - naturalSize.h * scaleFit) / 2;
                            return `translate(${cx}px, ${cy}px) scale(${scaleFit})`;
                          })()
                        : `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                      transformOrigin: 'top left',
                      userSelect: 'none',
                      width: naturalSize.w,
                      height: naturalSize.h
                    }}
                  />
                  {gradientEnabled && (() => {
                    let baseColor: string;
                    if (gradientMode === 'black') baseColor = '#000000';
                    else if (gradientMode === 'white') baseColor = '#ffffff';
                    else if (gradientMode === 'auto') baseColor = recommendedOverlay === 'black' ? '#000000' : '#ffffff';
                    else baseColor = pickedColor === 'rgba(0,0,0,0)' ? '#000000' : pickedColor;
                    const opaque = toRgbaWithAlpha(baseColor, gradientAlpha);
                    const transparent = toRgbaWithAlpha(baseColor, 0);
                    return (
                    <div
                      style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0, // Start from top (y=0)
                        height: Math.round(FRAME_H * 0.15) + 155, // 15% + 155px (5px longer)
                        background: `linear-gradient(180deg, ${opaque} 0%, ${opaque} 65.34%, ${transparent} 100%)`
                      }}
                    />
                    );
                  })()}
                  {/* Safe Zone overlay */}
                  {showGuides && (
                    <div
                      style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        left: 16,
                        right: 16,
                        top: SAFE_TOP,
                        bottom: SAFE_BOTTOM,
                        border: '2px dashed #60a5fa',
                        background: 'rgba(96,165,250,0.12)'
                      }}
                    />
                  )}
                  
                  {/* 테스트 문구 표시 */}
                  {imageUrl && showTextRecommendation && (
                    <div
                      style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 90,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div
                        style={{
                          color: recommendedTextColor,
                          fontSize: '16px',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          padding: '4px 12px',
                          borderRadius: 6,
                          lineHeight: '1.3'
                        }}
                      >
                        스플래시 텍스트 컬러를
                        <br/>
                        {`{${recommendedTextLabel}} 으로 설정해 주세요`}
                      </div>
                    </div>
                  )}

                  {/* 사진 가이드선 (y=160px) */}
                  {showGuides && (
                    <>
                      {/* 사진 가이드선 */}
                      <div
                        style={{
                          pointerEvents: 'none',
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 160,
                          height: 0,
                          borderTop: '2px dashed #ff4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div
                          style={{
                            background: 'rgba(255, 68, 68, 0.9)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: '10px',
                            fontWeight: 'bold',
                            marginTop: '-10px'
                          }}
                        >
                          사진 가이드선
                        </div>
                      </div>
                    </>
                  )}
                  {/* 문구 고정 영역 (예시) */}
                  {/* 삭제 요청: 하단 반투명 박스 제거 */}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginRight: 10 }}>
                    <label style={{ color: '#64748b', fontSize: 12 }}>표시 방식</label>
                    <button
                      className="btn"
                      onClick={() => setMode('crop')}
                      style={{ padding: '6px 10px', background: mode === 'crop' ? '#3b82f6' : '#e5e7eb', color: mode === 'crop' ? '#fff' : '#111', borderRadius: 6 }}
                    >
                      Crop
                    </button>
                    <button
                      className="btn"
                      onClick={() => setMode('fit')}
                      style={{ padding: '6px 10px', background: mode === 'fit' ? '#3b82f6' : '#e5e7eb', color: mode === 'fit' ? '#fff' : '#111', borderRadius: 6 }}
                    >
                      Fit
                    </button>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, marginRight: 10 }}>
                    <input type="checkbox" checked={gradientEnabled} onChange={(e) => setGradientEnabled(e.target.checked)} /> 상단 그라데이션
                  </label>
                  {gradientEnabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 10 }}>
                      <span style={{ color: '#64748b', fontSize: 12 }}>프리셋</span>
                      <button
                        className="btn"
                        onClick={() => setGradientMode('auto')}
                        style={{ padding: '6px 10px', background: gradientMode === 'auto' ? '#3b82f6' : '#e5e7eb', color: gradientMode === 'auto' ? '#fff' : '#111', borderRadius: 6 }}
                      >Auto</button>
                      <button className="btn" onClick={() => setGradientMode('black')} style={{ padding: '6px 10px', background: gradientMode === 'black' ? '#3b82f6' : '#e5e7eb', color: gradientMode === 'black' ? '#fff' : '#111', borderRadius: 6 }}>Black</button>
                      <button className="btn" onClick={() => setGradientMode('white')} style={{ padding: '6px 10px', background: gradientMode === 'white' ? '#3b82f6' : '#e5e7eb', color: gradientMode === 'white' ? '#fff' : '#111', borderRadius: 6 }}>White</button>
                      <button className="btn" onClick={() => setGradientMode('custom')} style={{ padding: '6px 10px', background: gradientMode === 'custom' ? '#3b82f6' : '#e5e7eb', color: gradientMode === 'custom' ? '#fff' : '#111', borderRadius: 6 }}>Custom</button>
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, marginRight: 10 }}>
                    <input type="checkbox" checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} /> 가이드 표시
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, marginRight: 10 }}>
                    <input type="checkbox" checked={showTextRecommendation} onChange={(e) => setShowTextRecommendation(e.target.checked)} /> 텍스트 컬러 추천
                  </label>
                  {gradientEnabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 10 }}>
                      {gradientMode === 'custom' && (
                        <>
                          <input
                            type="color"
                            value={(pickedColor.startsWith('#') ? pickedColor : '#000000')}
                            onChange={(e) => setPickedColor(e.target.value)}
                            title="그라데이션 색상"
                            style={{ width: 28, height: 22, padding: 0, border: '1px solid #e5e7eb', borderRadius: 4 }}
                          />
                          <span style={{ color: '#64748b', fontSize: 12 }}>투명도</span>
                          <input type="range" min={0} max={1} step={0.05} value={gradientAlpha} onChange={(e) => setGradientAlpha(parseFloat(e.target.value))} />
                          <button
                            className="btn"
                            onClick={() => setEyedropperMode(!eyedropperMode)}
                            style={{ 
                              padding: '6px 12px', 
                              background: eyedropperMode ? '#3b82f6' : '#e5e7eb', 
                              color: eyedropperMode ? '#fff' : '#111',
                              fontSize: '12px',
                              borderRadius: 4,
                              fontWeight: 'bold'
                            }}
                            title="스포이드로 색상 선택"
                          >
                            {eyedropperMode ? '색상선택 중...' : '스포이드'}
                          </button>
                        </>
                      )}
                      {gradientMode === 'custom' && pickedColor !== 'rgba(0,0,0,0)' && (
                        <div
                          style={{ 
                            width: 22, 
                            height: 22, 
                            borderRadius: 4, 
                            border: '1px solid #e5e7eb', 
                            background: pickedColor
                          }}
                          title="선택된 색상"
                        />
                      )}
                    </div>
                  )}
       
                  {mode === 'crop' && (
                    <>
                      <label style={{ color: '#64748b', fontSize: 12 }}>확대/축소</label>
                      <input
                        type="range"
                        min={MIN_SCALE}
                        max={MAX_SCALE}
                        step={0.01}
                        value={scale}
                        onChange={(e) => {
                          const next = parseFloat(e.target.value);
                          if (!naturalSize) { setScale(next); return; }
                          const prev = scale;
                          const cx = FRAME_W / 2;
                          const cy = FRAME_H / 2;
                          const ux = (cx - pan.x) / prev;
                          const uy = (cy - pan.y) / prev;
                          const newPanX = cx - ux * next;
                          const newPanY = cy - uy * next;
                          
                          setPan({ x: newPanX, y: newPanY });
                          setScale(next);
                        }}
                      />
                      <button className="btn" style={{ padding: '6px 10px' }} onClick={() => {
                        if (!naturalSize) return;
                        const next = Math.min(MAX_SCALE, scale * 1.1);
                        const prev = scale;
                        const cx = FRAME_W / 2; const cy = FRAME_H / 2;
                        const ux = (cx - pan.x) / prev; const uy = (cy - pan.y) / prev;
                        const newPanX = cx - ux * next;
                        const newPanY = cy - uy * next;
                        
                        setPan({ x: newPanX, y: newPanY });
                        setScale(next);
                      }}>+</button>
                      <button className="btn" style={{ padding: '6px 10px' }} onClick={() => {
                        if (!naturalSize) return;
                        const next = Math.max(MIN_SCALE, scale / 1.1);
                        const prev = scale;
                        const cx = FRAME_W / 2; const cy = FRAME_H / 2;
                        const ux = (cx - pan.x) / prev; const uy = (cy - pan.y) / prev;
                        const newPanX = cx - ux * next;
                        const newPanY = cy - uy * next;
                        
                        setPan({ x: newPanX, y: newPanY });
                        setScale(next);
                      }}>-</button>
                      <button
                        className="btn"
                        onClick={() => {
                          if (!naturalSize) return;
                          const coverScale = Math.max(FRAME_W / naturalSize.w, FRAME_H / naturalSize.h);
                          setScale(coverScale);
                          const newPanX = (FRAME_W - naturalSize.w * coverScale) / 2;
                          const newPanY = (FRAME_H - naturalSize.h * coverScale) / 2;
                          
                          setPan({ x: newPanX, y: newPanY });
                        }}
                        style={{ padding: '8px 12px' }}
                      >
                        위치/배율 초기화
                      </button>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn" onClick={exportPng} style={{ padding: '10px 16px' }}>
                    1125×2436 PNG 내보내기
                  </button>
                  <button className="btn" onClick={resetAll} style={{ padding: '10px 16px' }}>
                    전체 초기화
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📁</div>
                <p style={{ color: '#64748b' }}>클릭하거나 이미지를 끌어다 놓아 업로드하세요</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <FooterNav onHome={onHome} onBack={onBack} />
    </div>
  );
};

export default SplashHelper;


