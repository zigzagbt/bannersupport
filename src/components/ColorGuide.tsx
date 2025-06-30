import React, { useRef, DragEvent } from 'react';
import ColorThief from 'color-thief-browser';

interface ColorGuideProps {
  onBack: () => void;
  onHome: () => void;
  onNextStep: (color: string, palette: string[]) => void;
  palette: string[];
  setPalette: (palette: string[]) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
}

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

const ColorGuide: React.FC<ColorGuideProps> = ({ onBack, onHome, onNextStep, palette, setPalette, selectedColor, setSelectedColor }) => {
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // 이미지 업로드 처리 (input)
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);
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
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);
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
      setPalette(hexPalette);
      if (hexPalette.length > 0) setSelectedColor(hexPalette[0]);
    } catch (e) {
      setPalette([]);
    }
  };

  // 복사 버튼 클릭 핸들러
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedColor);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {}
  };

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
            🎨 배경 컬러 추천받기
          </h2>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            📸 이미지에서 대표 컬러 8개 추출하기
          </h3>
          <div
            className="card"
            style={{ textAlign: 'center', padding: '30px', border: dragActive ? '2px dashed #3b82f6' : undefined, background: dragActive ? '#f0f6ff' : undefined }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {!uploadedImage ? (
              <div>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📁</div>
                <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>이미지 업로드</h4>
                <p style={{ color: '#64748b', marginBottom: '20px' }}>
                  이미지를 클릭하거나, 이 영역에 드래그해서 업로드할 수 있어요
                </p>
                <button 
                  className="btn" 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    fontSize: '1.1rem', 
                    padding: '12px 24px',
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
                    maxWidth: 220,
                    maxHeight: 220,
                    borderRadius: '16px',
                    marginBottom: '12px',
                    boxShadow: '0 2px 12px #e5e7eb',
                    objectFit: 'cover',
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}
                  crossOrigin="anonymous"
                  onLoad={handleImageLoaded}
                />
                {palette.length > 0 && (
                  <div style={{ margin: '18px 0 10px 0', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#334155', fontSize: '1rem' }}>추천 컬러 팔레트</span><br/>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', justifyContent: 'center', alignItems: 'center', margin: '12px 0' }}>
                      {palette.map((color, idx) => (
                        <div
                          key={color}
                          style={{
                            width: '40px',
                            height: '40px',
                            background: color,
                            borderRadius: '8px',
                            border: selectedColor === color ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onClick={() => setSelectedColor(color)}
                          title={color}
                        >
                          {selectedColor === color && (
                            <span style={{
                              display: 'inline-block',
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: '#fff',
                              border: '2px solid #3b82f6',
                              boxShadow: '0 1px 4px #e0e7ef',
                            }} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ color: '#64748b', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span>{selectedColor}</span>
                      <button
                        onClick={handleCopy}
                        style={{
                          border: 'none',
                          background: '#e0e7ef',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.95rem',
                          color: '#334155',
                          cursor: 'pointer',
                          marginLeft: '2px',
                          fontWeight: 600
                        }}
                        title="복사"
                      >
                        {copied ? '복사됨!' : '복사'}
                      </button>
                    </div>
                  </div>
                )}
                <button 
                  className="btn" 
                  onClick={() => {
                    setUploadedImage(null);
                    setPalette([]);
                  }}
                  style={{ marginRight: '10px' }}
                >
                  이미지 선택하고 컬러 추천받기
                </button>
                <button
                  className="btn"
                  style={{ marginLeft: '10px', background: '#3b82f6', color: 'white', fontWeight: 600 }}
                  onClick={() => onNextStep(selectedColor, palette)}
                >
                  다음 단계: 텍스트 컬러 선택하기 →
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-20">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
            🎨 커스텀 컬러 선택
          </h3>
          <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
            <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>직접 컬러 선택하기</h4>
            <input 
              type="color" 
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              style={{ 
                width: '100px', 
                height: '60px', 
                border: 'none', 
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            />
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              background: selectedColor, 
              borderRadius: '8px',
              color: selectedColor === '#ffffff' ? '#000' : '#fff',
              fontWeight: 'bold'
            }}>
              선택된 컬러: {selectedColor}
            </div>
          </div>
        </div>

        <div className="warning">
          <strong>💡 팁:</strong><br/>
          • 이미지를 업로드하면 대표 컬러 8개가 자동으로 추출됩니다<br/>
          • 원하는 컬러를 클릭해서 선택할 수 있습니다<br/>
          • 필요하다면 아래에서 직접 컬러를 선택할 수 있습니다<br/>
          • 색상 선택 후 다음 단계로 넘어가면 텍스트 컬러를 추천받을 수 있습니다
        </div>
      </div>
    </div>
  );
};

export default ColorGuide; 