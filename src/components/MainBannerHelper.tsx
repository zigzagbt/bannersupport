import React, { useEffect, useRef, useState, useCallback } from 'react';
import FooterNav from './FooterNav';
import { incrementUsage, incrementExport, getStats, startSession, endSession } from '../utils/usageStats';

interface MainBannerHelperProps {
  onHome: () => void;
  onBack: () => void;
}

// 메인배너 도우미: 343×343 프리뷰, 1029×1029 export
const MainBannerHelper: React.FC<MainBannerHelperProps> = ({ onHome, onBack }) => {
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

  // Target & preview frame: 343×343 square, 1029×1029 export (3x)
  const TARGET_W = 1029;
  const TARGET_H = 1029;
  const ASPECT = 1; // square
  const FRAME_W = 343; // preview width
  const FRAME_H = 343; // preview height (square)
  
  // Gradient area dimensions (375×277 ratio)
  const GRADIENT_AREA_W = 375;
  const GRADIENT_AREA_H = 277;
  const GRADIENT_AREA_ASPECT = GRADIENT_AREA_H / GRADIENT_AREA_W; // ~0.7387
  const MIN_SCALE = 0.05;
  const MAX_SCALE = 8;

  // Top gradient image state
  const [gradientEnabled, setGradientEnabled] = useState<boolean>(true);
  const [gradientAlpha, setGradientAlpha] = useState<number>(0.24);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showBottomGradient, setShowBottomGradient] = useState<boolean>(true);
  const [stats, setStats] = useState(getStats('main-banner'));
  const sessionIdRef = useRef<string | null>(null);

  // 세션 추적: 컴포넌트 마운트 시 세션 시작
  useEffect(() => {
    sessionIdRef.current = startSession('main-banner');
    return () => {
      // 언마운트 시 세션 종료
      if (sessionIdRef.current) {
        endSession(sessionIdRef.current);
      }
    };
  }, []);

  // 통계 업데이트
  useEffect(() => {
    setStats(getStats('main-banner'));
  }, [imageUrl]); // 이미지가 변경될 때마다 통계 업데이트

  // Reset UI/state when a new image is selected
  const resetForNewImage = useCallback(() => {
    setGradientAlpha(0.24);
    setScale(1);
    setPan({ x: 0, y: 0 });
    setNaturalSize(null);
  }, []);


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
        // 사용 통계 증가
        incrementUsage('main-banner');
        setStats(getStats('main-banner')); // 통계 즉시 업데이트
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
        // 사용 통계 증가
        incrementUsage('main-banner');
        setStats(getStats('main-banner')); // 통계 즉시 업데이트
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
    setGradientAlpha(0.24);
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

    // draw top gradient image (dimright.png)
    if (gradientEnabled) {
      const topGradientImg = new Image();
      await new Promise<void>((resolve, reject) => {
        topGradientImg.onload = () => resolve();
        topGradientImg.onerror = () => reject();
        topGradientImg.src = '/images/dimright.png';
      });
      // 343x117 크기의 그라데이션 영역 (우측 상단)
      const gradWidth = 343 * scaleFactor; // 343px scaled
      const gradHeight = 117 * scaleFactor; // 117px scaled
      const gradX = TARGET_W - gradWidth; // 우측 상단 모서리
      const gradY = 0; // 상단
      
      // 이미지 투명도 적용
      ctx.globalAlpha = gradientAlpha;
      ctx.drawImage(topGradientImg, gradX, gradY, gradWidth, gradHeight);
      ctx.globalAlpha = 1;
    }

    // 로고 이미지 그리기 (가이드와 로고 체크박스가 켜져 있을 때만)
    if (showGuides && showLogo) {
      const logoImg = new Image();
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject();
        logoImg.src = '/images/zigzagpot.png';
      });
      // 고품질 이미지 렌더링 설정
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const logoWidth = 76.67 * scaleFactor;
      const logoHeight = 23 * scaleFactor;
      const logoX = Math.round(TARGET_W - (18 * scaleFactor) - logoWidth);
      const logoY = Math.round(20 * scaleFactor);
      // 정수 좌표로 그려서 더 선명하게
      ctx.drawImage(logoImg, logoX, logoY, Math.round(logoWidth), Math.round(logoHeight));
    }

    // 하단 그라데이션 이미지 그리기 (가이드와 하단 그라데이션 체크박스가 켜져 있을 때만)
    if (showGuides && showBottomGradient) {
      const bottomGradientImg = new Image();
      await new Promise<void>((resolve, reject) => {
        bottomGradientImg.onload = () => resolve();
        bottomGradientImg.onerror = () => reject();
        bottomGradientImg.src = '/images/dimwinter.png';
      });
      // 하단에 붙이기 위해 이미지 높이를 계산
      const gradientHeight = (bottomGradientImg.height / bottomGradientImg.width) * TARGET_W;
      const gradientY = TARGET_H - gradientHeight;
      ctx.drawImage(bottomGradientImg, 0, gradientY, TARGET_W, gradientHeight);
    }

    const link = document.createElement('a');
    link.download = 'main-banner-1029x1029.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    // Export 통계 증가
    incrementExport('main-banner');
    setStats(getStats('main-banner')); // 통계 즉시 업데이트
  };

  // 접근 권한 체크
  const isAuthorized = () => {
    return localStorage.getItem('isAuthorized') === 'true';
    // 로컬에서도 비밀번호 요청하도록 localhost 체크 제거
  };

  // 권한이 없으면 접근 거부 메시지 표시
  if (!isAuthorized()) {
    return (
      <div className="container">
        <div className="card text-center mb-8">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#1e293b' }}>
            접근 권한이 없습니다
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            이 페이지는 운영자만 접근할 수 있습니다.
          </p>
        </div>
        <FooterNav onHome={onHome} onBack={onBack} />
      </div>
    );
  }

  // 기기 비율 가정: 1080x1920 기준. Safe Zone은 예시 비율.
  // 실제 비율과 안전 영역은 이후 사용자가 구체 제원 제공 시 조정 예정.
  return (
    <div className="container">
      <div className="card text-center mb-8">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#1e293b' }}>
          메인배너 도우미
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          직잭팟 전용 메인배너 이미지
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
                      cursor: mode === 'crop' ? 'grab' : 'default'
                    }}
                    onMouseDown={(e) => { if (mode === 'crop') beginDrag(e.clientX, e.clientY); }}
                    onMouseMove={(e) => { if (mode === 'crop') moveDrag(e.clientX, e.clientY); }}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                    onTouchStart={(e) => { if (mode === 'crop') beginDrag(e.touches[0].clientX, e.touches[0].clientY); }}
                    onTouchMove={(e) => { if (mode === 'crop') moveDrag(e.touches[0].clientX, e.touches[0].clientY); }}
                    onTouchEnd={endDrag}
                  >
                  <img
                    src={imageUrl}
                    alt="main-banner"
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
                  {gradientEnabled && (
                    <img
                      src="/images/dimright.png"
                      alt="상단 그라데이션"
                      style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: 343, // 343px
                        height: 117, // 117px
                        opacity: gradientAlpha
                      }}
                    />
                  )}
                  {/* 로고 - 가이드와 로고 체크박스가 켜져 있을 때만 표시 */}
                  {showGuides && showLogo && (
                    <img
                      src="/images/zigzagpot.png"
                      alt="지재파 굿즈"
                      style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        right: 18,
                        top: 20,
                        width: 76.67,
                        height: 23,
                        zIndex: 10,
                        imageRendering: 'auto',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                        WebkitTransform: 'translateZ(0)'
                      } as React.CSSProperties}
                    />
                  )}
                  {/* 하단 그라데이션 - 가이드와 하단 그라데이션 체크박스가 켜져 있을 때만 표시 */}
                  {showGuides && showBottomGradient && (
                    <img
                      src="/images/dimwinter.png"
                      alt="하단 그라데이션"
                      style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: 'auto',
                        zIndex: 10
                      }}
                    />
                  )}
                  {/* 문구 고정 영역 (예시) */}
                  {/* 삭제 요청: 하단 반투명 박스 제거 */}
                </div>
                {/* 이미지 교체 안내 - 이미지 하단 */}
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
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

                  {/* 두 번째 줄: 상단 그라데이션 설정 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={gradientEnabled} onChange={(e) => setGradientEnabled(e.target.checked)} style={{ cursor: 'pointer' }} />
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>상단 그라데이션</span>
                    </label>
                    {gradientEnabled && (
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


                  {/* 네 번째 줄: 가이드 그룹 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={showGuides} 
                        onChange={(e) => setShowGuides(e.target.checked)} 
                        style={{ cursor: 'pointer' }} 
                      />
                      <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>가이드</span>
                    </label>
                    {showGuides && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 28 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={showLogo} 
                            onChange={(e) => setShowLogo(e.target.checked)} 
                            style={{ cursor: 'pointer' }} 
                          />
                          <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>직잭팟 로고</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={showBottomGradient} 
                            onChange={(e) => setShowBottomGradient(e.target.checked)} 
                            style={{ cursor: 'pointer' }} 
                          />
                          <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>하단 그라데이션</span>
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

export default MainBannerHelper;


