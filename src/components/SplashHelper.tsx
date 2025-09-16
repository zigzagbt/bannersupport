import React, { useEffect, useRef, useState, useCallback } from 'react';
import Header from './Header';
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
  const [pickedColor, setPickedColor] = useState<string>('rgba(0,0,0,0)');
  const [eyedropperMode, setEyedropperMode] = useState<boolean>(false);
  const [showGuides, setShowGuides] = useState<boolean>(true);

  const toRgbaWithAlpha = (input: string, alpha: number) => {
    if (input.startsWith('rgba')) {
      const nums = input.match(/\d+\.\d+|\d+/g);
      if (nums && nums.length >= 3) return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`;
    }
    if (input.startsWith('rgb')) {
      const nums = input.match(/\d+\.\d+|\d+/g);
      if (nums && nums.length >= 3) return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`;
    }
    return input;
  };

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

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
      setEyedropperMode(false);
    };
    img.src = imageUrl;
  }, [eyedropperMode, imageUrl, naturalSize, computeDrawRect, FRAME_W, FRAME_H]);

  

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
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
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
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportPng = async () => {
    if (!imageUrl || !naturalSize) return;
    const canvas = document.createElement('canvas');
    canvas.width = TARGET_W;
    canvas.height = TARGET_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background (optional gray for empty areas)
    ctx.fillStyle = '#000';
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
    if (gradientEnabled && pickedColor !== 'rgba(0,0,0,0)') {
      // Gradient area: 15% + 155px (5px longer)
      const baseHeight = Math.round(TARGET_H * 0.15); // 15% of canvas height
      const extraHeight = Math.round(155 * (TARGET_H / FRAME_H)); // 155px scaled to target size (5px longer)
      const gradWidth = TARGET_W; // Full width
      const gradHeight = baseHeight + extraHeight; // 15% + 155px
      
      const grad = ctx.createLinearGradient(0, 0, 0, gradHeight);
      const base = pickedColor;
      const colorTop = toRgbaWithAlpha(base, 1);
      const colorTransparent = toRgbaWithAlpha(base, 0);
      
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
      <Header />

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
            onDragOver={(e) => { if (!imageUrl) onDragOver(e); }}
            onDrop={(e) => { if (!imageUrl) onDrop(e); }}
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
                    background: '#e5e7eb',
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
                  {gradientEnabled && pickedColor !== 'rgba(0,0,0,0)' && (
                    <div
                      style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0, // Start from top (y=0)
                        height: Math.round(FRAME_H * 0.15) + 155, // 15% + 155px (5px longer)
                        background: `linear-gradient(180deg, ${toRgbaWithAlpha(pickedColor, 1)} 0%, ${toRgbaWithAlpha(pickedColor, 1)} 65.34%, ${toRgbaWithAlpha(pickedColor, 0)} 100%)`
                      }}
                    />
                  )}
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
                  
                  {/* 사진 가이드선 (y=160px) */}
                  {showGuides && (
                    <>
                      {/* 가이드선 위쪽에 문구 표시 */}
                      <div
                        style={{
                          pointerEvents: 'none',
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 90,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div
                          style={{
                            background: 'rgba(0, 0, 0, 0.8)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: 6,
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            lineHeight: '1.2'
                          }}
                        >
                          사진 상단이 짧을 경우, 가이드선 이상으로 위치해주세요.<br/>
                          그래야 배경 그라데이션이 자연스럽게 연결됩니다.
                        </div>
                      </div>
                      
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, marginRight: 10 }}>
                    <input type="checkbox" checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} /> 가이드 표시
                  </label>
                  {gradientEnabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 10 }}>
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
                        {eyedropperMode ? '색상선택 중...' : '색상선택'}
                      </button>
                      {pickedColor !== 'rgba(0,0,0,0)' && (
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


