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
  const guideCheckboxRef = useRef<HTMLInputElement>(null);

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
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
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

  // When switching to custom mode, automatically turn off guides
  // When switching away from custom mode, automatically turn guides back on
  useEffect(() => {
    if (gradientMode === 'custom') {
      setShowGuides(false);
      setShowTextRecommendation(false);
      setEyedropperMode(true); // 커스텀 모드 선택 시 기본값은 스포이드 선택
    } else {
      // 커스텀 모드가 아닐 때는 가이드 다시 켜기 및 스포이드 모드 끄기
      setShowGuides(true);
      setShowTextRecommendation(true);
      setEyedropperMode(false); // 커스텀 모드가 아닐 때는 스포이드 모드 비활성화
    }
  }, [gradientMode]);

  // 이미지 위치나 크기가 변경될 때마다 텍스트 컬러 추천 업데이트
  useEffect(() => {
    if (showTextRecommendation && imageUrl && naturalSize) {
      updateTextColorRecommendation();
    }
  }, [showTextRecommendation, imageUrl, naturalSize, pan.x, pan.y, scale, mode, updateTextColorRecommendation, gradientEnabled, gradientMode, pickedColor, gradientAlpha, recommendedOverlay]);

  // 가이드 체크박스 indeterminate 상태 설정
  useEffect(() => {
    if (guideCheckboxRef.current) {
      const hasAny = showGuides || showTextRecommendation;
      const hasAll = showGuides && showTextRecommendation;
      guideCheckboxRef.current.indeterminate = hasAny && !hasAll;
    }
  }, [showGuides, showTextRecommendation]);


  const handleImageMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!eyedropperMode || !imageUrl || !naturalSize || gradientMode !== 'custom') {
      setPreviewColor(null);
      setPreviewPosition(null);
      return;
    }
    
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 이미지 영역 내부인지 확인
    const imgRect = computeDrawRect();
    if (!imgRect) return;
    
    if (x < imgRect.dx || x > imgRect.dx + imgRect.dw || 
        y < imgRect.dy || y > imgRect.dy + imgRect.dh) {
      setPreviewColor(null);
      setPreviewPosition(null);
      return;
    }
    
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
      setPreviewColor(color);
      setPreviewPosition({ x: e.clientX, y: e.clientY });
    };
    img.src = imageUrl;
  }, [eyedropperMode, imageUrl, naturalSize, computeDrawRect, FRAME_W, FRAME_H, gradientMode]);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!eyedropperMode || !imageUrl || !naturalSize || gradientMode !== 'custom') return;
    e.preventDefault();
    e.stopPropagation();
    
    if (previewColor) {
      setPickedColor(previewColor);
      updateTextColorRecommendation();
      // 스포이드 모드는 유지하여 계속 색상 선택 가능
    }
  }, [eyedropperMode, imageUrl, naturalSize, previewColor, updateTextColorRecommendation, gradientMode]);

  

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
      const newImageUrl = ev.target?.result as string;
      // 같은 이미지를 다시 올려도 로드되도록 먼저 null로 설정
      setImageUrl(null);
      setNaturalSize(null);
      // 다음 틱에서 새 이미지 URL 설정
      setTimeout(() => {
        resetForNewImage();
        setImageUrl(newImageUrl);
      }, 0);
    };
    reader.readAsDataURL(file);
    // 같은 파일을 다시 선택할 수 있도록 input value 초기화
    e.target.value = '';
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
      const newImageUrl = ev.target?.result as string;
      // 같은 이미지를 다시 올려도 로드되도록 먼저 null로 설정
      setImageUrl(null);
      setNaturalSize(null);
      // 다음 틱에서 새 이미지 URL 설정
      setTimeout(() => {
        resetForNewImage();
        setImageUrl(newImageUrl);
      }, 0);
    };
    reader.readAsDataURL(file);
  };

  const beginDrag = (clientX: number, clientY: number) => {
    setDragging(true);
    dragStartRef.current = { x: clientX - pan.x, y: clientY - pan.y };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!dragging || !dragStartRef.current || !naturalSize) return;
    const newX = clientX - dragStartRef.current.x;
    const newY = clientY - dragStartRef.current.y;
    
    setPan({ x: newX, y: newY });
  };

  const endDrag = () => {
    if (!dragging || !naturalSize) {
      setDragging(false);
      dragStartRef.current = null;
      return;
    }
    
    // 스냅 기능: 이미지 좌우/하단 끝이 경계에 가까우면 자동 정렬
    const SNAP_THRESHOLD = 15; // 좌우 스냅 임계값 (px)
    const SNAP_THRESHOLD_BOTTOM = 10; // 하단 스냅 임계값 (px)
    const imgWidth = naturalSize.w * scale;
    const imgHeight = naturalSize.h * scale;
    const imgLeft = pan.x;
    const imgRight = pan.x + imgWidth;
    const imgBottom = pan.y + imgHeight;
    
    let snappedX = pan.x;
    let snappedY = pan.y;
    
    // 좌측 스냅: 이미지 왼쪽 끝이 x=0에 가까우면 스냅
    if (Math.abs(imgLeft) < SNAP_THRESHOLD) {
      snappedX = 0;
    }
    // 우측 스냅: 이미지 오른쪽 끝이 FRAME_W에 가까우면 스냅
    else if (Math.abs(imgRight - FRAME_W) < SNAP_THRESHOLD) {
      snappedX = FRAME_W - imgWidth;
    }
    
    // 하단 스냅: 이미지 아래쪽 끝이 FRAME_H에 가까우면 스냅
    if (Math.abs(imgBottom - FRAME_H) < SNAP_THRESHOLD_BOTTOM) {
      snappedY = FRAME_H - imgHeight;
    }
    
    if (snappedX !== pan.x || snappedY !== pan.y) {
      setPan({ x: snappedX, y: snappedY });
    }
    
    setDragging(false);
    dragStartRef.current = null;
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

    // Draw background in neon green to reveal empty areas/misplacement clearly
    ctx.fillStyle = '#39ff14';
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
          {!imageUrl && (
            <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>이미지 업로드</h3>
          )}
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              cursor: imageUrl ? 'default' : 'pointer',
              backgroundColor: '#f8fafc',
              position: 'relative'
            }}
            onClick={() => { if (!imageUrl) fileInputRef.current?.click(); }}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            {imageUrl && naturalSize ? (
              <div style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div
                    ref={frameRef}
                    style={{
                      width: FRAME_W,
                      height: FRAME_H,
                      borderRadius: 16,
                      overflow: 'hidden',
                      position: 'relative',
                      background: '#39ff14',
                      boxShadow: 'inset 0 0 0 1px #e2e8f0',
                      touchAction: 'none',
                      cursor: (eyedropperMode && gradientMode === 'custom')
                        ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'%23000\'%3E%3Cpath d=\'M20.71 5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-3.12 3.12-1.93-1.91-1.41 1.41 1.42 1.42L3 16.25V21h4.75l8.92-8.92 1.42 1.42 1.41-1.41-1.92-1.92 3.12-3.12c.4-.4.4-1.03.01-1.42zM6.92 19L5 17.08l8.06-8.06 1.92 1.92L6.92 19z\'/%3E%3C/svg%3E") 12 12, crosshair' 
                        : (mode === 'crop' ? 'grab' : 'default')
                    }}
                    onMouseDown={(e) => { if (mode === 'crop' && !eyedropperMode) beginDrag(e.clientX, e.clientY); }}
                    onMouseMove={(e) => { 
                      if (eyedropperMode && gradientMode === 'custom') {
                        handleImageMove(e);
                      } else if (mode === 'crop') {
                        moveDrag(e.clientX, e.clientY);
                      }
                    }}
                    onMouseUp={endDrag}
                    onMouseLeave={(e) => { 
                      endDrag();
                      if (eyedropperMode && gradientMode === 'custom') {
                        setPreviewColor(null);
                        setPreviewPosition(null);
                      }
                    }}
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
                  
                  {/* 스포이드 색상 미리보기 */}
                  {eyedropperMode && gradientMode === 'custom' && previewColor && previewPosition && (
                    <div
                      style={{
                        position: 'fixed',
                        left: previewPosition.x + 20,
                        top: previewPosition.y - 40,
                        background: '#fff',
                        border: '2px solid #3b82f6',
                        borderRadius: 8,
                        padding: '8px 12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        pointerEvents: 'none'
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 4,
                          background: previewColor,
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{previewColor}</span>
                        <span style={{ fontSize: 10, color: '#64748b' }}>클릭하여 선택</span>
                      </div>
                    </div>
                  )}
                  {/* 문구 고정 영역 (예시) */}
                  {/* 삭제 요청: 하단 반투명 박스 제거 */}
                </div>
                {/* 이미지 교체 안내 - 이미지 하단 */}
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: 8 }}>
                  <span style={{ 
                    fontSize: 12, 
                    color: '#64748b'
                  }}>
                    📁 이미지를 끌어다 놓으면 교체됩니다
                  </span>
                </div>
                </div>
                {/* 컨트롤 영역 - 그룹화된 레이아웃 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '44px 0 12px 0', flex: 1, minWidth: 300, maxWidth: 400 }}>
                  {/* 첫 번째 줄: 이미지 조작 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#475569', fontSize: 12, fontWeight: 600, marginRight: 4 }}>표시 방식</span>
                      <button
                        className="btn"
                        onClick={() => setMode('crop')}
                        style={{ padding: '6px 12px', background: mode === 'crop' ? '#3b82f6' : '#e5e7eb', color: mode === 'crop' ? '#fff' : '#111', borderRadius: 6, fontSize: 13, fontWeight: 500 }}
                      >
                        Crop
                      </button>
                      <button
                        className="btn"
                        onClick={() => setMode('fit')}
                        style={{ padding: '6px 12px', background: mode === 'fit' ? '#3b82f6' : '#e5e7eb', color: mode === 'fit' ? '#fff' : '#111', borderRadius: 6, fontSize: 13, fontWeight: 500 }}
                      >
                        Fit
                      </button>
                    </div>
                    {mode === 'crop' && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#475569', fontSize: 12, fontWeight: 600, marginRight: 4 }}>확대/축소</span>
                        <button className="btn" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => {
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
                          style={{ width: 120 }}
                        />
                        <button className="btn" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => {
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
                          style={{ padding: '6px 12px', fontSize: 12, marginLeft: 4 }}
                        >
                          초기화
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 두 번째 줄: 그라데이션 설정 (자동/수동 섹션) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={gradientEnabled} onChange={(e) => setGradientEnabled(e.target.checked)} style={{ cursor: 'pointer' }} />
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>상단 그라데이션</span>
                    </label>
                    {gradientEnabled && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                        {/* 자동 섹션 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: 8 }}>자동</span>
                          <button
                            className="btn"
                            onClick={() => setGradientMode('auto')}
                            style={{ padding: '6px 12px', background: gradientMode === 'auto' ? '#3b82f6' : '#e5e7eb', color: gradientMode === 'auto' ? '#fff' : '#111', borderRadius: 6, fontSize: 13, fontWeight: 500 }}
                          >Auto</button>
                        </div>
                        {/* 수동 섹션 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: 8 }}>수동</span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button 
                              className="btn" 
                              onClick={() => setGradientMode('black')} 
                              style={{ padding: '6px 12px', background: gradientMode === 'black' ? '#3b82f6' : '#e5e7eb', color: gradientMode === 'black' ? '#fff' : '#111', borderRadius: 6, fontSize: 13, fontWeight: 500 }}
                            >Black</button>
                            <button 
                              className="btn" 
                              onClick={() => setGradientMode('white')} 
                              style={{ padding: '6px 12px', background: gradientMode === 'white' ? '#3b82f6' : '#e5e7eb', color: gradientMode === 'white' ? '#fff' : '#111', borderRadius: 6, fontSize: 13, fontWeight: 500 }}
                            >White</button>
                            <button 
                              className="btn" 
                              onClick={() => setGradientMode('custom')} 
                              style={{ padding: '6px 12px', background: gradientMode === 'custom' ? '#3b82f6' : '#e5e7eb', color: gradientMode === 'custom' ? '#fff' : '#111', borderRadius: 6, fontSize: 13, fontWeight: 500 }}
                            >Custom</button>
                          </div>
                        </div>
                        {/* 커스텀 모드 옵션 */}
                        {gradientMode === 'custom' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', paddingTop: 8 }}>
                            {/* 선택 방식 및 선택된 색상 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 20px', background: '#ffffff', borderRadius: 6, border: '1px solid #e2e8f0', alignItems: 'flex-start' }}>
                              {/* 선택 방식 버튼 */}
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                                <span style={{ color: '#475569', fontSize: 12, fontWeight: 600, marginRight: 4, minWidth: 100, textAlign: 'left' }}>컬러 선택 방식</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    onClick={() => setEyedropperMode(true)}
                                    style={{ 
                                      padding: '6px 12px', 
                                      background: eyedropperMode ? '#3b82f6' : '#e5e7eb', 
                                      color: eyedropperMode ? '#fff' : '#111', 
                                      borderRadius: 6, 
                                      fontSize: 13, 
                                      fontWeight: 500,
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    스포이드 선택
                                  </button>
                                  <button
                                    onClick={() => setEyedropperMode(false)}
                                    style={{ 
                                      padding: '6px 12px', 
                                      background: !eyedropperMode ? '#3b82f6' : '#e5e7eb', 
                                      color: !eyedropperMode ? '#fff' : '#111', 
                                      borderRadius: 6, 
                                      fontSize: 13, 
                                      fontWeight: 500,
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    직접 선택
                                  </button>
                                </div>
                              </div>
                              {/* 스포이드 on/off 토글 */}
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                                <span style={{ color: '#475569', fontSize: 12, fontWeight: 600, marginRight: 4, minWidth: 100, textAlign: 'left' }}>스포이드</span>
                                <button
                                  onClick={() => setEyedropperMode(!eyedropperMode)}
                                  style={{ 
                                    padding: '6px 12px', 
                                    background: eyedropperMode ? '#3b82f6' : '#e5e7eb', 
                                    color: eyedropperMode ? '#fff' : '#111', 
                                    borderRadius: 6, 
                                    fontSize: 13, 
                                    fontWeight: 500,
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {eyedropperMode ? 'ON' : 'OFF'}
                                </button>
                                {eyedropperMode && (
                                  <span style={{ color: '#ef4444', fontSize: 11 }}>
                                    사진 위치 수정이 불가
                                  </span>
                                )}
                              </div>
                              {/* 직접 선택 UI */}
                              {!eyedropperMode && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                                  <span style={{ color: '#475569', fontSize: 12, fontWeight: 600, marginRight: 4, minWidth: 100, textAlign: 'left' }}>선택된 색상</span>
                                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                      type="color"
                                      value={(pickedColor.startsWith('#') ? pickedColor : '#000000')}
                                      onChange={(e) => setPickedColor(e.target.value)}
                                      title="그라데이션 색상 직접 선택"
                                      style={{ width: 40, height: 32, padding: 0, border: '2px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}
                                    />
                                    <span style={{ color: '#64748b', fontSize: 11 }}>색상 선택기를 클릭하여 직접 선택</span>
                                  </div>
                                </div>
                              )}
                              {/* 스포이드 선택 UI */}
                              {eyedropperMode && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                                  <span style={{ color: '#475569', fontSize: 12, fontWeight: 600, marginRight: 4, minWidth: 100, textAlign: 'left' }}>선택된 색상</span>
                                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {pickedColor !== 'rgba(0,0,0,0)' ? (
                                      <>
                                        <div
                                          style={{ 
                                            width: 32, 
                                            height: 32, 
                                            borderRadius: 6, 
                                            border: '2px solid #cbd5e1', 
                                            background: pickedColor,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                          }}
                                          title="스포이드로 선택한 색상"
                                        />
                                        <span style={{ color: '#64748b', fontSize: 11 }}>이미지에서 스포이드로 선택한 색상</span>
                                      </>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontSize: 11 }}>이미지에서 색상을 클릭하여 선택하세요</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: '#ffffff', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                              <span style={{ color: '#475569', fontSize: 12, fontWeight: 600, marginRight: 4, minWidth: 50 }}>투명도</span>
                              <input 
                                type="range" 
                                min={0} 
                                max={1} 
                                step={0.05} 
                                value={gradientAlpha} 
                                onChange={(e) => setGradientAlpha(parseFloat(e.target.value))}
                                style={{ width: 120 }}
                              />
                              <span style={{ color: '#64748b', fontSize: 12, minWidth: 35 }}>{(gradientAlpha * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        )}
                        {/* 블랙/화이트 모드 투명도 */}
                        {(gradientMode === 'black' || gradientMode === 'white') && (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: '#ffffff', borderRadius: 6, border: '1px solid #e2e8f0', width: '100%' }}>
                            <span style={{ color: '#475569', fontSize: 12, fontWeight: 600, marginRight: 4, minWidth: 50 }}>투명도</span>
                            <input 
                              type="range" 
                              min={0} 
                              max={1} 
                              step={0.05} 
                              value={gradientAlpha} 
                              onChange={(e) => setGradientAlpha(parseFloat(e.target.value))}
                              style={{ width: 120 }}
                            />
                            <span style={{ color: '#64748b', fontSize: 12, minWidth: 35 }}>{(gradientAlpha * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>


                  {/* 네 번째 줄: 가이드 그룹 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        ref={guideCheckboxRef}
                        checked={showGuides || showTextRecommendation}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          if (newValue) {
                            // 상위를 켜면 하위 둘 다 켜기
                            setShowGuides(true);
                            setShowTextRecommendation(true);
                          } else {
                            // 상위를 끄면 하위 둘 다 끄기
                            setShowGuides(false);
                            setShowTextRecommendation(false);
                          }
                        }} 
                        style={{ cursor: 'pointer' }} 
                      />
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>가이드</span>
                    </label>
                    {(showGuides || showTextRecommendation) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 28 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={showGuides} 
                            onChange={(e) => setShowGuides(e.target.checked)} 
                            style={{ cursor: 'pointer' }} 
                          />
                          <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>가이드 표시</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={showTextRecommendation} 
                            onChange={(e) => setShowTextRecommendation(e.target.checked)} 
                            style={{ cursor: 'pointer' }} 
                          />
                          <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>텍스트 컬러 추천</span>
                        </label>
                      </div>
                    )}
                  </div>
                  {/* 내보내기 버튼 */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                    <button className="btn" onClick={resetAll} style={{ 
                      padding: '14px 24px',
                      background: '#f1f5f9',
                      color: '#64748b',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontWeight: 500,
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}>
                      전체 초기화
                    </button>
                    <button className="btn" onClick={exportPng} style={{ 
                      padding: '14px 24px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
                    }}>
                      이미지 내보내기
                    </button>
                  </div>
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


