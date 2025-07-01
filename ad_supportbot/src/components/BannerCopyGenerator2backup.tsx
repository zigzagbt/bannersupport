// BannerCopyGenerator2.tsx (타입스크립트 + 지그재그톤 확장)
import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import ColorThief from "color-thief-browser";

// --- Helper Functions ---
function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function getLuminance(r: number, g: number, b: number) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}
function getContrast(rgb1: number[], rgb2: number[]) {
  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// --- v2(지그재그톤) 무드/상황/명사/부사/템플릿 ---
const zigzagMoods: string[] = [
  '고요한', '무심한', '따뜻한', '말랑한', '깔끔한', '세련된', '청순한', '활기찬',
  '도시적인', '툭 던진', '낙낙한', '햇살 같은', '부드럽게 흐르는', '쨍한', '투명한', '가벼운',
  '여유로운', '살짝 힘 뺀', '말 안 해도 아는', '잔잔한', '감도 높은', '잔향 같은'
];
const zigzagSituations: string[] = [
  '출근', '데일리', '여행', '데이트', '주말', '소풍', '약속', '휴가', '파티', '캠퍼스', '하객룩', '홈웨어',
  '기분전환', '가볍게 나가는 날', '뭐 입지 고민될 때', '편하게 멋내고 싶은 날'
];
const zigzagNouns = [
  '실루엣', '컬러감', '포인트', '디테일', '라인', '핏', '무드', '스타일', '여운', '결', '톤', '감촉',
  '포인트감', '바람결', '느낌', '취향', '무늬', '소재', '스며듦', '빛감'
];
const zigzagAdjToAdv: Record<string, string> = {
  "툭 던진": "툭 던지듯",
  "햇살 같은": "햇살처럼",
  "말 안 해도 아는": "말 안 해도 아는 느낌으로",
  "낙낙한": "낙낙하게",
  "살짝 힘 뺀": "살짝 힘 빼고",
  "감도 높은": "감도 높게",
  "부드럽게 흐르는": "부드럽게",
  "여유로운": "여유롭게",
  "잔향 같은": "잔향처럼"
};
const zigzagTemplates = [
  '{mainMood_adverb} 완성하는 {context}룩',
  '{mainMood} 무드 한가득, {subMood_adverb} 마무리',
  '{mainMood} {noun}에 {subMood} {noun2} 더하기',
  '{mainMood}와 {subMood} 사이, 오늘의 {context}',
  '{mainMood_adverb} 시작해 {subMood_adverb} 마무리',
  '{mainMood} 감성, {subMood} 무드',
  '{mainMood} 한 스푼, {subMood} 두 스푼',
  '{mainMood} {noun}과 {subMood} {noun2}의 만남',
  '{context}에 어울리는 {mainMood} 컬러감',
  '일상에 스며드는 {subMood} {noun}',
  '때로는 {mainMood_adverb}, 때로는 {subMood_adverb}',
  '오늘의 {context}룩, {mainMood} {noun}으로 완성',
];

// --- 타입 인터페이스 정의 ---
interface BannerCopyGeneratorProps {
  onHome: () => void;
  onBack?: () => void;
  onNavigate?: (guide: string) => void;
}

interface MoodItem {
  color: string;
  mood: string;
}

interface SelectedTags {
  style: string[];
  fit: string[];
  mood: string[];
  season: string[];
  situation: string[];
  colorTone: string[];
  noun: string[];
}

// --- 컴포넌트 정의 (이하 생략 / 기존 로직과 호환 유지) ---
const BannerCopyGenerator2: React.FC<BannerCopyGeneratorProps> = ({ onHome, onBack, onNavigate }) => {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copyType, setCopyType] = useState<"mypage" | "ribbon">("mypage");
  const [result, setResult] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [colorMoods, setColorMoods] = useState<{color: string, mood: string}[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedTags, setSelectedTags] = useState<{
    style: string[];
    fit: string[];
    mood: string[];
    season: string[];
    situation: string[];
    colorTone: string[];
    noun: string[];
  }>({ style: [], fit: [], mood: [], season: [], situation: [], colorTone: [], noun: [] });
  const [palette, setPalette] = useState<number[][]>([]);
  const [selectedBgColor, setSelectedBgColor] = useState<number[] | null>(null);

  // 드래그&드롭 핸들러
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
  };
  const handleUploadFile = (file: File) => {
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult([]);
    setColorMoods([]);
    setPalette([]);
    setSelectedBgColor(null);
    resetTags();
  };

  function colorDistance(a: number[], b: number[]) {
    return Math.sqrt(
      Math.pow(a[0] - b[0], 2) +
      Math.pow(a[1] - b[1], 2) +
      Math.pow(a[2] - b[2], 2)
    );
  }
  function filterSimilarColors(palette: number[][], threshold = 40) {
    const result: number[][] = [];
    palette.forEach(color => {
      if (!result.some(existing => colorDistance(existing, color) < threshold)) {
        result.push(color);
      }
    });
    return result;
  }

  // 이미지에서 대표색상 12개 추출 후 유사색 제거(6개만 사용), 각각 2~3개 무드 매핑 (중복 없이 전체 pool 생성)
  const handleImageLoad = async () => {
    if (!imgRef.current) return;
    const colorThief = new ColorThief();
    try {
      const palette: number[][] = await colorThief.getPalette(imgRef.current, 12);
      const filteredPalette = filterSimilarColors(palette, 40).slice(0, 6);
      setPalette(filteredPalette);
      let moodPool: { color: string, mood: string }[] = [];
      let autoMoods: string[] = [];
      let autoStyles: string[] = [];
      let autoFits: string[] = [];
      let autoSeasons: string[] = [];
      filteredPalette.forEach(rgb => {
        // v2: 색상별 무드 추천은 zigzagMoods에서 랜덤 추출
        const moods = zigzagMoods;
        const n = Math.min(3, moods.length);
        const selected = getRandomUnique(moods, n);
        selected.forEach(mood => {
          if (!moodPool.find(m => m.mood === mood)) {
            moodPool.push({ color: '', mood });
          }
          if (!autoMoods.includes(mood)) autoMoods.push(mood);
        });
      });
      setColorMoods(moodPool);
      setSelectedTags(prev => ({
        ...prev,
        mood: Array.from(new Set([...prev.mood, ...autoMoods])).slice(0, 2),
        style: Array.from(new Set([...prev.style, ...autoStyles])).slice(0, 2),
        fit: Array.from(new Set([...prev.fit, ...autoFits])).slice(0, 2),
        season: Array.from(new Set([...prev.season, ...autoSeasons])).slice(0, 1),
      }));
      if (moodPool.length > 0) {
        generate(moodPool, true);
      }
    } catch (e) {
      setColorMoods([{ color: "gray", mood: zigzagMoods[0] }]);
      generate([{ color: "gray", mood: zigzagMoods[0] }], true);
    }
  };

  const handleTagChange = (type: keyof typeof selectedTags, value: string) => {
    setSelectedTags(prev => {
      const arr = prev[type];
      return {
        ...prev,
        [type]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      };
    });
  };

  function toAdverb(adj: string) {
    if (zigzagAdjToAdv[adj]) return zigzagAdjToAdv[adj];
    if (adj.endsWith('한')) return adj.slice(0, -1) + '하게';
    if (adj.endsWith('운')) return adj.slice(0, -1) + '게';
    if (adj.endsWith('된')) return adj.slice(0, -1) + '게';
    return adj + '하게';
  }
  function toRoot(adj: string) {
    if (adj.endsWith('한')) return adj.slice(0, -1);
    return adj;
  }
  function toNoun(adj: string) {
    return toRoot(adj) + '함';
  }
  function fixHanRo(phrase: string) {
    return phrase.replace(/([가-힣]+)한(로|으로)/g, (m, adj, josa) => {
      if (Math.random() < 0.5) {
        return adj + '하게';
      } else {
        const noun = hanNounCandidates[Math.floor(Math.random() * hanNounCandidates.length)];
        return adj + '한 ' + noun + josa;
      }
    });
  }
  const hanNounCandidates = ['하루', '무드', '결', '스푼'];

  const getRandomUnique = <T,>(arr: T[], n: number) => {
    const shuffled = arr.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  };

  // 대표색상 무드 + 태그 조합으로 문구 생성 (v2 스타일)
  const generate = async (moods?: {color: string, mood: string}[], isAuto = false) => {
    const targetMoods: {color: string, mood: string}[] = Array.isArray(moods) ? moods : (Array.isArray(colorMoods) ? colorMoods : []);
    if (!targetMoods.length) return;
    setLoading(true);
    if (!isAuto) setResult([]);
    setTimeout(() => {
      let phrases: string[] = [];
      let usedCombos = new Set<string>();
      let attempts = 0;
      const safeTargetMoods = Array.isArray(targetMoods) ? targetMoods : [];
      const onlyString = (arr: any[]) => arr.filter((v): v is string => typeof v === 'string');
      const mainMoodArr = onlyString([...selectedTags.style, ...selectedTags.fit, ...safeTargetMoods.map(m => m.mood), ...zigzagMoods]);
      const subMoodArr = onlyString([...selectedTags.mood, ...safeTargetMoods.map(m => m.mood), ...zigzagMoods]);
      const contextArr = onlyString([...selectedTags.season, ...selectedTags.situation, ...zigzagSituations]);
      while (phrases.length < 3 && attempts < 100) {
        attempts++;
        const mainMood = mainMoodArr[Math.floor(Math.random() * mainMoodArr.length)] || '';
        let subMood = subMoodArr[Math.floor(Math.random() * subMoodArr.length)] || '';
        let context = contextArr[Math.floor(Math.random() * contextArr.length)] || '';
        if (typeof mainMood !== 'string' || typeof subMood !== 'string' || typeof context !== 'string') continue;
        const nounList = zigzagNouns;
        const noun = nounList[Math.floor(Math.random() * nounList.length)];
        const noun2 = nounList[Math.floor(Math.random() * nounList.length)];
        if (mainMood === subMood || mainMood === context || subMood === context) continue;
        let comboKey = `${mainMood}|${subMood}|${context}`;
        let retry = 0;
        while (usedCombos.has(comboKey) && retry < 10) {
          subMood = subMoodArr[Math.floor(Math.random() * subMoodArr.length)] || '';
          context = contextArr[Math.floor(Math.random() * contextArr.length)] || '';
          if (mainMood === subMood || mainMood === context || subMood === context) continue;
          comboKey = `${mainMood}|${subMood}|${context}`;
          retry++;
        }
        if (usedCombos.has(comboKey)) continue;
        usedCombos.add(comboKey);
        let allTemplates = zigzagTemplates;
        if (!context) {
          const filteredTemplates = allTemplates.filter(t => !t.includes('{context}'));
          if (filteredTemplates.length > 0) {
            allTemplates = filteredTemplates;
          } else {
            context = '데일리';
          }
        }
        let template = allTemplates[Math.floor(Math.random() * allTemplates.length)];
        let corePhrase = template
          .replace('{mainMood_adverb}', toAdverb(mainMood))
          .replace('{mainMood_noun}', toNoun(mainMood))
          .replace('{mainMood_root}', toRoot(mainMood))
          .replace('{mainMood}', mainMood)
          .replace('{subMood_adverb}', toAdverb(subMood))
          .replace('{subMood_noun}', toNoun(subMood))
          .replace('{subMood_root}', toRoot(subMood))
          .replace('{subMood}', subMood)
          .replace('{context}', context)
          .replace('{noun}', noun)
          .replace('{noun2}', noun2);
        corePhrase = fixHanRo(corePhrase);
        if (!phrases.includes(corePhrase)) phrases.push(corePhrase);
      }
      setResult(phrases);
      setLoading(false);
    }, 600);
  };

  const copyToClipboard = (text: string) => {
    const corePhrase = text.includes('\n') ? text.split('\n').slice(1).join('\n') : text;
    navigator.clipboard.writeText(corePhrase.replace(/\n/g, ' '));
    alert('클립보드에 복사되었습니다!');
  };

  const resetTags = () => {
    setSelectedTags({ style: [], fit: [], mood: [], season: [], situation: [], colorTone: [], noun: [] });
  };

  const renderContrastPreview = () => {
    if (!selectedBgColor) return null;
    const contrastWhite = getContrast(selectedBgColor, [255, 255, 255]);
    const contrastBlack = getContrast(selectedBgColor, [0, 0, 0]);
    const recommendedColor = contrastWhite > contrastBlack ? "화이트" : "블랙";
    const recommendedContrast = Math.max(contrastWhite, contrastBlack);
    const recommendedColorHex = recommendedColor === '화이트' ? '#ffffff' : '#000000';
    const oppositeColorHex = recommendedColor === '화이트' ? '#000000' : '#ffffff';
    const text1 = "이렇게 보여집니다! ";
    const text2 = "텍스트가 잘 보이나요?";
    return (
        <div style={{
            background: `rgb(${selectedBgColor.join(',')})`,
            borderRadius: '12px',
            padding: '20px',
            marginTop: '24px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
            <p style={{
                fontSize: '18px',
                fontWeight: 600,
                margin: '0 0 24px 0'
            }}>
                <span style={{ color: recommendedColorHex }}>{text1}</span>
                <span style={{ color: oppositeColorHex }}>{text2}</span>
            </p>
            <div style={{
                background: '#fff',
                opacity: 0.8,
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#334155',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    fontWeight: 500
                }}>
                    <span style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 1px #94a3b8',
                        marginRight: '8px',
                        verticalAlign: 'middle'
                    }} />
                    추천: <b>{recommendedColor === '화이트' ? '화이트(흰색)' : '블랙(검정)'}</b> 권장
                </div>
                <div style={{
                    background: '#e0e7ef',
                    color: '#3b82f6',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '14px'
                }}>
                    Contrast Ratio: {recommendedContrast.toFixed(2)}
                </div>
            </div>
        </div>
    );
  }

  const renderPalette = () => {
    if (palette.length === 0) return null;
    return (
        <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>🎨 추출된 배경색 후보 (추천 텍스트 색상)</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {palette.map((color, i) => {
                    const contrastWhite = getContrast(color, [255, 255, 255]);
                    const contrastBlack = getContrast(color, [0, 0, 0]);
                    const recommended = contrastWhite > contrastBlack ? 'W' : 'B';
                    const hex = rgbToHex(color[0], color[1], color[2]);
                    return (
                        <div key={i} onClick={() => setSelectedBgColor(color)} style={{
                            width: 'calc(16.666% - 10px)',
                            cursor: 'pointer',
                            border: selectedBgColor && selectedBgColor.join(',') === color.join(',') ? '3px solid #3b82f6' : '1px solid #e2e8f0',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease',
                            transform: selectedBgColor && selectedBgColor.join(',') === color.join(',') ? 'scale(1.05)' : 'scale(1)'
                        }}>
                            <div style={{
                                height: '80px',
                                backgroundColor: `rgb(${color.join(',')})`,
                                position: 'relative'
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    background: 'rgba(255,255,255,0.8)',
                                    color: '#334155',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }}>
                                    {recommended}
                                </span>
                            </div>
                            <div style={{ padding: '8px', background: '#f8fafc', fontSize: '13px', textAlign: 'center', fontWeight: 500, color: '#475569' }}>
                                {hex}
                            </div>
                        </div>
                    );
                })}
            </div>
            {renderContrastPreview()}
        </div>
    )
  }

  return (
    <div className="card" style={{ maxWidth: 847, margin: "32px auto", background: '#fff', boxShadow: '0 2px 12px #e0e7ef', borderRadius: 16, padding: '28px' }}>
      <div className="flex" style={{ alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={onHome} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
          <span role="img" aria-label="home">🏠</span> 홈
        </button>
        <h2 style={{ marginLeft: '16px', fontSize: '1.5rem', color: '#1e293b', fontWeight: 700 }}>
          🖼️ 배너 이미지 문구 추천 v2
        </h2>
      </div>
      {/* 업로드 영역: 타이틀 바로 아래 */}
      <div className="mb-20">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
          🖼️ 이미지 문구 추출하기 (지그재그톤)
        </h3>
        <div
          className="card"
          style={{ textAlign: 'center', padding: '30px', border: dragActive ? '2px dashed #3b82f6' : undefined, background: dragActive ? '#f0f6ff' : undefined }}
          onDrop={handleDrop}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
        >
          <input
            id="banner-img-upload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          {!previewUrl ? (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📁</div>
              <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>이미지 업로드</h4>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>
                이미지를 클릭하거나, 이 영역에 드래그해서 업로드할 수 있어요
              </p>
              <button 
                className="btn" 
                onClick={() => document.getElementById('banner-img-upload')?.click()}
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
                ref={imgRef}
                src={previewUrl}
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
                onLoad={handleImageLoad}
              />
              <button 
                className="btn" 
                onClick={() => { setImage(null); setPreviewUrl(null); setPalette([]); setColorMoods([]); setSelectedBgColor(null); }}
                style={{ marginRight: '10px' }}
              >
                이미지 다시 선택하기
              </button>
            </div>
          )}
        </div>
      </div>

      {colorMoods.length > 0 && (
          <div style={{ marginTop: '24px' }}>
              <hr style={{border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 24px 0'}} />
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                    추출 무드: {Array.from(new Set(colorMoods.map(cm => cm.mood))).join(', ')}
                  </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 32,
                marginBottom: 16
              }}>
                {/* 1컬럼: 주요 무드(스타일)+주요 무드(핏) */}
                <div>
                  <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: 6, fontSize: 16 }}>주요 무드</div>
                  <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: 4, fontSize: 15 }}>스타일</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {zigzagMoods.map(t => (
                      <label key={t} style={{ fontWeight: 500, color: '#334155', minWidth: 48, fontSize: 13, marginRight: 8, marginBottom: 2, whiteSpace: 'nowrap' }}>
                        <input type="checkbox" checked={selectedTags.style.includes(t)} onChange={() => handleTagChange('style', t)} /> {t}
                      </label>
                    ))}
                  </div>
                  <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: 4, fontSize: 15, marginTop: 10 }}>핏</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {zigzagMoods.map(t => (
                      <label key={t} style={{ fontWeight: 500, color: '#334155', minWidth: 48, fontSize: 13, marginRight: 8, marginBottom: 2, whiteSpace: 'nowrap' }}>
                        <input type="checkbox" checked={selectedTags.fit.includes(t)} onChange={() => handleTagChange('fit', t)} /> {t}
                      </label>
                    ))}
                  </div>
                </div>
                {/* 2컬럼: 보조 무드(분위기)+계절+상황+핵심 명사 */}
                <div>
                  <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 6, fontSize: 16 }}>보조 무드</div>
                  <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4, fontSize: 15 }}>분위기</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {zigzagMoods.map(t => (
                      <label key={t} style={{ fontWeight: 500, color: '#334155', minWidth: 48, fontSize: 13, marginRight: 8, marginBottom: 2, whiteSpace: 'nowrap' }}>
                        <input type="checkbox" checked={selectedTags.mood.includes(t)} onChange={() => handleTagChange('mood', t)} /> {t}
                      </label>
                    ))}
                  </div>
                  <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4, fontSize: 15, marginTop: 10 }}>계절</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {['여름', '간절기', '올시즌', '한여름', '봄', '가을', '겨울'].map(t => (
                      <label key={t} style={{ fontWeight: 500, color: '#334155', minWidth: 60, fontSize: 13 }}>
                        <input type="checkbox" checked={selectedTags.season.includes(t)} onChange={() => handleTagChange('season', t)} /> {t}
                      </label>
                    ))}
                  </div>
                  <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4, fontSize: 15, marginTop: 10 }}>상황</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {zigzagSituations.map(t => (
                      <label key={t} style={{ fontWeight: 500, color: '#334155', minWidth: 60, fontSize: 13 }}>
                        <input type="checkbox" checked={selectedTags.situation.includes(t)} onChange={() => handleTagChange('situation', t)} /> {t}
                      </label>
                    ))}
                  </div>
                  <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4, fontSize: 15, marginTop: 10 }}>핵심 명사</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {zigzagNouns.map(t => (
                      <label key={t} style={{ fontWeight: 500, color: '#334155', minWidth: 60, fontSize: 13 }}>
                        <input type="checkbox" checked={selectedTags.noun.includes(t)} onChange={() => handleTagChange('noun', t)} /> {t}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 8 }}>
                <label style={{ fontWeight: 500, color: '#1e293b', fontSize: 14 }}>
                  <input
                    type="radio"
                    checked={copyType === "mypage"}
                    onChange={() => setCopyType("mypage")}
                    style={{ marginRight: 4 }}
                  />
                  마이페이지 (26자)
                </label>
                <label style={{ fontWeight: 500, color: '#1e293b', fontSize: 14 }}>
                  <input
                    type="radio"
                    checked={copyType === "ribbon"}
                    onChange={() => setCopyType("ribbon")}
                    style={{ marginRight: 4 }}
                  />
                  띠배너 (18자)
                </label>
                <button onClick={resetTags} style={{ background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 500, cursor: 'pointer', fontSize: 13, marginLeft: 8 }}>초기화</button>
              </div>
              <button
                onClick={() => generate()}
                disabled={loading || !image || !colorMoods.length}
                className="btn"
                style={{
                  background: "#3b82f6",
                  color: "white",
                  fontWeight: 600,
                  borderRadius: 8,
                  padding: "10px 0",
                  fontSize: 15,
                  border: "none",
                  cursor: loading || !image || !colorMoods.length ? "not-allowed" : "pointer",
                  marginBottom: 10,
                  width: '100%'
                }}
              >
                {loading ? "문구 생성 중..." : "새로운 문구 추천받기"}
              </button>
              {loading && (
                <div style={{ textAlign: "center", margin: "10px 0", color: "#64748b", fontSize: 13 }}>
                  문구 생성 중입니다... 잠시만 기다려주세요.
                </div>
              )}
              {result.length > 0 && (
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 10, marginTop: 6, maxHeight: 220, overflowY: 'auto' }}>
                  {result.map((line, i) => (
                    <div key={i} className="card" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #e0e7ef', marginBottom: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ whiteSpace: "pre-line", fontSize: 14, color: '#1e293b', fontWeight: 500 }}>{line}</div>
                      <button className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '5px 10px', borderRadius: 6, background: '#e0e7ef', color: '#2563eb', fontWeight: 600, border: 'none', cursor: 'pointer' }} onClick={() => copyToClipboard(line)}>
                        복사
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
      )}
    </div>
  );
};

export default BannerCopyGenerator2; 