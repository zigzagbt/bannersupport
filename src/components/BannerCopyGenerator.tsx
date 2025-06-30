import React, { useState, useRef, DragEvent } from "react";
// @ts-ignore
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

// 간단한 색상 → 무드 매핑
const colorToMood: Record<string, string[]> = {
  red: [
    "열정적인", "강렬한", "에너지 넘치는", "활기찬", "따스한", "화려한", "따뜻한", "생동감 있는"
  ],
  orange: [
    "따뜻한", "밝은", "생기있는", "명랑한", "활기찬", "경쾌한", "풍성한", "따스한"
  ],
  yellow: [
    "화사한", "경쾌한", "기분 좋은", "밝은", "산뜻한", "희망찬", "명랑한", "생기있는"
  ],
  green: [
    "싱그러운", "자연스러운", "상쾌한", "청량한", "신선한", "평화로운", "맑은", "생기있는"
  ],
  blue: [
    "차분한", "청량한", "시원한", "맑은", "신비로운", "청명한", "평온한", "상쾌한"
  ],
  purple: [
    "감각적인", "신비로운", "트렌디한", "몽환적인", "우아한", "고급스러운", "로맨틱한", "세련된"
  ],
  pink: [
    "사랑스러운", "귀여운", "로맨틱한", "달콤한", "상큼한", "감미로운", "따뜻한", "몽환적인"
  ],
  brown: [
    "빈티지한", "내추럴한", "포근한", "따뜻한", "차분한", "안정적인", "고요한", "자연스러운"
  ],
  black: [
    "시크한", "모던한", "고급스러운", "세련된", "강렬한", "당당한", "감각적인", "차분한"
  ],
  gray: [
    "깔끔한", "미니멀한", "세련된", "모던한", "중성적인", "차분한", "심플한", "고요한"
  ],
  white: [
    "깨끗한", "심플한", "맑은", "순수한", "청명한", "깔끔한", "밝은", "미니멀한"
  ],
};

// 무드 → 문구 추천 템플릿
const moodToCopy: Record<string, string[]> = {
  "따뜻한": ["따뜻한 하루, 감성 가득 담아", "따뜻한 무드로 완성하는 배너"],
  "밝은": ["밝은 에너지로 시작하는 하루", "밝은 무드로 기분 전환"],
  "화사한": ["화사한 컬러로 포인트!", "화사하게 물드는 순간"],
  "싱그러운": ["싱그러운 감성 가득", "싱그러운 하루의 시작"],
  "차분한": ["차분한 분위기로 완성", "차분하게 물드는 하루"],
  "감각적인": ["감각적인 컬러 조합", "감각적인 무드 연출"],
  "사랑스러운": ["사랑스러운 하루에 딱", "사랑스러운 감성 가득"],
  "빈티지한": ["빈티지한 무드로 포인트", "빈티지 감성 배너"],
  "시크한": ["시크한 무드 연출", "시크하게 완성하는 배너"],
  "깔끔한": ["깔끔한 디자인의 정석", "깔끔하게 마무리되는 하루"],
  "깨끗한": ["깨끗한 감성으로 시작", "깨끗하게 완성하는 배너"],
  "에너지 넘치는": ["에너지 넘치는 하루!", "에너지 가득한 무드"],
  "청량한": ["청량한 여름 감성", "청량하게 표현된 색감"],
  "로맨틱한": ["로맨틱한 하루의 시작", "로맨틱한 감성 가득"],
  "내추럴한": ["내추럴한 무드로 완성", "내추럴한 감성 배너"],
  "고급스러운": ["고급스러운 분위기 연출", "고급스러운 감성 가득"],
  "트렌디한": ["트렌디한 컬러로 포인트!", "트렌디한 무드 연출"],
  "미니멀한": ["미니멀한 감성 배너", "미니멀하게 완성하는 하루"],
  "포근한": ["포근한 감성 가득", "포근하게 감싸주는 무드"],
  "상쾌한": ["상쾌한 하루의 시작", "상쾌하게 물드는 배너"],
  "경쾌한": ["경쾌한 무드로 기분 전환", "경쾌하게 완성하는 하루"],
  "생기있는": ["생기있는 하루의 시작", "생기 가득한 무드"],
  "심플한": ["심플한 감성 배너", "심플하게 완성하는 하루"],
  "맑은": ["맑은 감성으로 시작", "맑게 물드는 하루"],
};

// --- 감성 꼬리/상황/템플릿 로직 (PhraseGuide에서 가져옴) ---
const adjTails: Record<string, string[]> = {
  '따뜻한': ['하루', '느낌', '무드', '감성', '스타일', '하루의 시작', '분위기', '계절'],
  '포근한': ['느낌', '하루', '감성', '분위기', '무드', '스타일'],
  '말랑한': ['촉감', '느낌', '감성', '하루', '분위기'],
  '단정한': ['룩', '하루', '분위기', '스타일', '실루엣'],
  '시크한': ['무드', '실루엣', '분위기', '룩', '스타일'],
  '여유로운': ['하루', '분위기', '느낌', '감성', '시간'],
  '부드러운': ['촉감', '느낌', '분위기', '감성', '착용감'],
  '빈티지한': ['감성', '무드', '스타일', '분위기'],
  '감각적인': ['컬러', '하루', '분위기', '감성', '스타일'],
  '차분한': ['느낌', '분위기', '하루', '감성', '무드'],
  '스포티한': ['룩', '무드', '스타일', '감성'],
  '톡톡한': ['포인트', '느낌', '감성', '무드'],
  '유연한': ['실루엣', '느낌', '분위기', '감성'],
  '가벼운': ['착용감', '느낌', '하루', '분위기'],
  '내추럴한': ['무드', '분위기', '감성', '스타일'],
  '도톰한': ['촉감', '느낌', '감성', '분위기'],
  '날렵한': ['실루엣', '분위기', '무드'],
  '세련된': ['실루엣', '분위기', '무드', '룩', '감성', '스타일'],
  '소프트한': ['느낌', '감성', '분위기', '착용감'],
  '모던한': ['무드', '분위기', '스타일', '감성'],
  '트렌디한': ['룩', '감성', '분위기', '스타일'],
  '깔끔한': ['룩', '분위기', '스타일', '감성'],
  '귀여운': ['포인트', '분위기', '감성', '룩'],
  '클래식한': ['무드', '분위기', '스타일', '감성'],
  '로맨틱한': ['무드', '분위기', '감성', '하루'],
  '활동적인': ['하루', '룩', '분위기', '감성'],
  '실용적인': ['룩', '감성', '분위기', '스타일'],
  '사랑스러운': ['분위기', '감성', '하루', '포인트'],
  '힙한': ['무드', '룩', '감성', '분위기'],
  '청량한': ['느낌', '하루', '분위기', '감성'],
  '꾸안꾸': ['감성', '스타일', '분위기', '룩'],
  '데일리필수': ['아이템', '룩', '스타일'],
  '데일리픽': ['아이템', '룩', '스타일'],
  // --- 중성적/힙한 무드 추가 ---
  '담백한': ['무드', '스타일', '느낌', '컬러'],
  '정돈된': ['실루엣', '스타일', '룩', '분위기'],
  '매니시한': ['룩', '무드', '스타일', '실루엣'],
  '간결한': ['디자인', '실루엣', '라인', '스타일'],
  '절제된': ['아름다움', '디테일', '감성', '컬러'],
  '엣지있는': ['포인트', '디테일', '스타일', '룩'],
  '유니크한': ['디자인', '무드', '감성', '아이템'],
  '자유로운': ['분위기', '감성', '스타일', '하루'],
  '개성있는': ['스타일', '룩', '포인트', '디테일'],
  '보이시한': ['매력', '무드', '스타일', '룩'],
};

function rgbToSimpleColor([r, g, b]: number[]): string {
  // 간단한 색상 분류 (red, orange, yellow, green, blue, purple, pink, brown, black, gray, white)
  if (r > 200 && g < 100 && b < 100) return "red";
  if (r > 200 && g > 120 && b < 80) return "orange";
  if (r > 200 && g > 200 && b < 100) return "yellow";
  if (g > 150 && r < 120 && b < 120) return "green";
  if (b > 180 && r < 120 && g < 180) return "blue";
  if (r > 150 && b > 150 && g < 120) return "purple";
  if (r > 200 && g < 150 && b > 180) return "pink";
  if (r > 100 && g > 70 && b < 50) return "brown";
  if (r < 60 && g < 60 && b < 60) return "black";
  if (r > 200 && g > 200 && b > 200) return "white";
  if (r > 150 && g > 150 && b > 150) return "gray";
  return "gray";
}

const getRandomUnique = <T,>(arr: T[], n: number) => {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

// 세분화 무드/스타일 태그 목록
const colorTones = ['뉴트럴', '모노톤', '비비드', '파스텔'];
const fits = ['루즈핏', '슬림핏', '크롭', '롱', '플레어', '와이드', '오버사이즈'];
const seasons = ['여름', '간절기', '올시즌', '한여름', '봄', '가을', '겨울'];
const styles = ['미니멀', '프렌치', '걸리시', '베이직', '스트릿', '페미닌', '모던', '클래식', '매니시한', '유니크한', '도회적인', '보이시한', '젠더리스'];
const moods = ['고요한', '무심한', '따뜻한', '쿨한', '말랑한', '깔끔한', '세련된', '청순한', '활기찬', '차분한', '성숙한', '경쾌한', '우아한', '담백한', '정돈된', '간결한', '절제된', '엣지있는', '자유로운', '시크한', '스포티한', '개성있는', '매트한', '글로시한', '코지한', '탄탄한', '여리여리한', '소장가치 있는', '감도높은', '청키한', '정제된', '기품있는', '정갈한', '클린한', '퓨어한', '보이시한'];
const situations = ['출근', '데일리', '여행', '데이트', '주말', '소풍', '약속', '휴가', '파티', '캠퍼스', '하객룩', '홈웨어'];
const nouns = ['실루엣', '텍스처', '컬러감', '포인트', '디테일', '라인', '핏', '무드', '스타일'];

// 색상 기반 주요 무드/계절 추천 룰
const colorToStyle: Record<string, string[]> = {
  white: ['미니멀'],
  gray: ['미니멀', '유니섹스'],
  black: ['미니멀', '유니섹스'],
  blue: ['프렌치', '유니섹스'],
  pink: ['걸리시'],
  brown: ['베이직'],
  yellow: ['베이직'],
  orange: ['베이직'],
  green: ['프렌치'],
  purple: ['프렌치'],
  red: ['베이직'],
};
const colorToFit: Record<string, string[]> = {
  white: ['루즈핏'],
  gray: ['루즈핏'],
  black: ['루즈핏'],
  blue: ['슬림핏'],
  pink: ['크롭'],
  brown: ['롱'],
  yellow: ['플레어'],
  orange: ['플레어'],
  green: ['슬림핏'],
  purple: ['크롭'],
  red: ['롱'],
};
const colorToSeason: Record<string, string[]> = {
  white: ['여름'],
  gray: ['간절기'],
  black: ['간절기'],
  blue: ['여름'],
  pink: ['여름'],
  brown: ['올시즌'],
  yellow: ['여름'],
  orange: ['여름'],
  green: ['여름'],
  purple: ['여름'],
  red: ['여름'],
};

// 1. 부사 변환 사전 추가
const adjToAdv: Record<string, string> = {
  "고급스러운": "고급스럽게",
  "세련된": "세련되게",
  "시크한": "시크하게",
  "사랑스러운": "사랑스럽게",
  "따뜻한": "따뜻하게",
  "밝은": "밝게",
  "차분한": "차분하게",
  "감각적인": "감각적으로",
  "로맨틱한": "로맨틱하게",
  "빈티지한": "빈티지하게",
  "내추럴한": "내추럴하게",
  "모던한": "모던하게",
  "심플한": "심플하게",
  "청량한": "청량하게",
  "경쾌한": "경쾌하게",
  "활기찬": "활기차게",
  "우아한": "우아하게",
  "트렌디한": "트렌디하게",
  "포근한": "포근하게",
  "상쾌한": "상쾌하게",
  "맑은": "맑게",
  "귀여운": "귀엽게",
  // --- 중성적/힙한 무드 추가 ---
  "담백한": "담백하게",
  "정돈된": "정돈되게",
  "매니시한": "매니시하게",
  "간결한": "간결하게",
  "절제된": "절제되게",
  "엣지있는": "엣지있게",
  "유니크한": "유니크하게",
  "자유로운": "자유롭게",
  "개성있는": "개성있게",
  "스포티한": "스포티하게",
  // --- 추가 확장 ---
  "매트한": "매트하게",
  "글로시한": "글로시하게",
  "코지한": "코지하게",
  "탄탄한": "탄탄하게",
  "여리여리한": "여리여리하게",
  "도회적인": "도회적으로",
  "소장가치 있는": "소장가치 있게",
  "감도높은": "감도높게",
  "청키한": "청키하게",
  "정제된": "정제되게",
  "기품있는": "기품있게",
  // --- 미니멀 확장 ---
  "정갈한": "정갈하게",
  "클린한": "클린하게",
  "퓨어한": "퓨어하게",
  // --- 중성적인 표현 확장 ---
  "보이시한": "보이시하게",
  // ... 필요시 추가
};

interface BannerCopyGeneratorProps {
  onHome: () => void;
  onBack?: () => void;
  onNavigate?: (guide: string) => void;
}

const BannerCopyGenerator: React.FC<BannerCopyGeneratorProps> = ({ onHome, onBack, onNavigate }) => {
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

  // --- 템플릿 분리 ---
  const mypageTemplates = [
    // 마이페이지용 한 문장(26자 이내) 템플릿
    '{mainMood_adverb} 완성하는 {context} 룩',
    '{mainMood}인 듯 시작되는 {context} 룩',
    '{mainMood} 무드 그대로, {subMood}인 듯',
    '{mainMood} 무드 한가득, 끝까지 {subMood_adverb}',
    '{mainMood_adverb} 마무리, {subMood_noun} 가득',
    '{mainMood} 그리고 {subMood}',
    '{mainMood} {noun}과 {subMood} {noun2}의 만남',
    '{context}에 어울리는 {mainMood} 컬러감',
    '일상에 스며드는 {subMood} {noun}',
    '때로는 {mainMood_adverb}, 때로는 {subMood_adverb}',
    '{mainMood} 한 스푼, {subMood} 두 스푼',
    '가장 {mainMood_adverb} 빛나는 순간, {context}을 위한 {noun}',
    '오직 {context}에서만, {mainMood} {noun}',
    '{mainMood}와 {subMood} 사이, 완벽한 {noun}',
    '매일 입고 싶은 {mainMood} {noun}',
    '오늘의 {context}룩, {mainMood} {noun}으로 완성',
    // 추가 예시
    '{mainMood} 감성 가득, {subMood}로 완성',
    '{mainMood}로 시작해 {subMood}로 마무리',
    '{mainMood}와 {subMood}, 오늘의 무드',
    '{mainMood} 한 스푼, {subMood} 두 스푼',
  ];
  const ribbonTemplates = [
    // 띠배너용 한 문장(18자 이내) 템플릿
    '{mainMood_adverb} 마무리, {subMood_noun} 가득',
    '{mainMood_root}에 {subMood_root} 감성을 더한',
    '{mainMood_adverb} 완성하는 {context} 룩',
    '{mainMood}인 듯 시작되는 {context} 룩',
    '{mainMood} 무드 그대로, {subMood}인 듯',
    '{mainMood} 무드 한가득, 끝까지 {subMood_adverb}',
    '살짝 {mainMood_adverb}라도, {subMood} 감성도 OK',
    '{mainMood}인 듯 감각적인, {subMood_noun}과 감각미',
    '시작은 {mainMood_adverb}, 마무리는 {subMood_adverb}',
    '{mainMood} 그리고 {subMood}',
    '{mainMood} {noun}과 {subMood} {noun2}의 만남',
    '{context}에 어울리는 {mainMood} 컬러감',
    '일상에 스며드는 {subMood} {noun}',
    '때로는 {mainMood_adverb}, 때로는 {subMood_adverb}',
    '{mainMood} 한 스푼, {subMood} 두 스푼',
    '가장 {mainMood_adverb} 빛나는 순간, {context}을 위한 {noun}',
    '오직 {context}에서만, {mainMood} {noun}',
    '{mainMood}와 {subMood} 사이, 완벽한 {noun}',
    '매일 입고 싶은 {mainMood} {noun}',
    '오늘의 {context}룩, {mainMood} {noun}으로 완성',
  ];

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
    resetTags(); // 이미지 업로드 시 체크박스 초기화
  };

  // --- 파일 상단에 filterSimilarColors 함수 추가 (ColorGuide.tsx 참고) ---
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
      const palette: number[][] = await colorThief.getPalette(imgRef.current, 12); // 12개 추출
      const filteredPalette = filterSimilarColors(palette, 40).slice(0, 6); // 유사색 제거 후 6개만 사용
      setPalette(filteredPalette);
      let moodPool: { color: string, mood: string }[] = [];
      let autoMoods: string[] = [];
      let autoStyles: string[] = [];
      let autoFits: string[] = [];
      let autoSeasons: string[] = [];
      filteredPalette.forEach(rgb => {
        const color = rgbToSimpleColor(rgb);
        const moods = colorToMood[color] || ["감각적인"];
        // 한 색상에서 2~3개 무드 랜덤 추출 (중복 방지)
        const n = Math.min(3, moods.length);
        const selected = getRandomUnique(moods, n);
        selected.forEach(mood => {
          if (!moodPool.find(m => m.mood === mood)) {
            moodPool.push({ color, mood });
          }
          if (!autoMoods.includes(mood)) autoMoods.push(mood);
        });
        // 스타일/핏/계절 추천값 누적
        (colorToStyle[color] || []).forEach(s => { if (!autoStyles.includes(s)) autoStyles.push(s); });
        (colorToFit[color] || []).forEach(f => { if (!autoFits.includes(f)) autoFits.push(f); });
        (colorToSeason[color] || []).forEach(se => { if (!autoSeasons.includes(se)) autoSeasons.push(se); });
      });
      setColorMoods(moodPool);
      // 자동 태그 추천: 기존 선택값과 합쳐 중복 없이 반영
      setSelectedTags(prev => ({
        ...prev,
        mood: Array.from(new Set([...prev.mood, ...autoMoods])).slice(0, 2),
        style: Array.from(new Set([...prev.style, ...autoStyles])).slice(0, 2),
        fit: Array.from(new Set([...prev.fit, ...autoFits])).slice(0, 2),
        season: Array.from(new Set([...prev.season, ...autoSeasons])).slice(0, 1),
      }));
      // 이미지 로드 시 자동으로 3개 문구 생성
      if (moodPool.length > 0) {
        generate(moodPool, true);
      }
    } catch (e) {
      setColorMoods([{ color: "gray", mood: "감각적인" }]);
      generate([{ color: "gray", mood: "감각적인" }], true);
    }
  };

  // 태그 선택 핸들러
  const handleTagChange = (type: keyof typeof selectedTags, value: string) => {
    setSelectedTags(prev => {
      const arr = prev[type];
      return {
        ...prev,
        [type]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      };
    });
  };

  // --- 단어 형태 변환 헬퍼 ---
  // 형용사 어근 추출 (예: '따뜻한' -> '따뜻')
  function toRoot(adj: string) {
    if (adj.endsWith('한')) return adj.slice(0, -1);
    return adj;
  }
  // 부사로 변환 (예: '따뜻한' -> '따뜻하게')
  function toAdverb(adj: string) {
    if (adjToAdv[adj]) return adjToAdv[adj];
    // '한'으로 끝나는 경우
    if (adj.endsWith('한')) return adj.slice(0, -1) + '하게';
    // '운'으로 끝나는 경우
    if (adj.endsWith('운')) return adj.slice(0, -1) + '게';
    // '된'으로 끝나는 경우
    if (adj.endsWith('된')) return adj.slice(0, -1) + '게';
    // 기타: 그냥 '하게' 붙이기
    return adj + '하게';
  }
  // 명사로 변환 (예: '따뜻한' -> '따뜻함')
  function toNoun(adj: string) {
    return toRoot(adj) + '함';
  }

  // ~한로/한으로 → ~하게 또는 ~한 무드로 보정
  function fixHanRo(phrase: string) {
    return phrase.replace(/([가-힣]+)한(로|으로)/g, (m, adj, josa) => {
      // 50% 확률로 부사형, 50% 확률로 명사+로
      if (Math.random() < 0.5) {
        return adj + '하게';
      } else {
        const noun = hanNounCandidates[Math.floor(Math.random() * hanNounCandidates.length)];
        return adj + '한 ' + noun + josa;
      }
    });
  }
  const hanNounCandidates = ['하루', '무드', '결', '스푼'];

  // 대표색상 무드 + 태그 조합으로 문구 생성 (타입별 글자수 제한 필터 추가)
  const generate = async (moods?: {color: string, mood: string}[], isAuto = false) => {
    const targetMoods = moods || colorMoods;
    if (!targetMoods.length) return;
    setLoading(true);
    if (!isAuto) setResult([]);
    setTimeout(() => {
      let phrases: string[] = [];
      let usedCombos = new Set<string>();
      let attempts = 0;
      // 태그 pool 준비
      const mainMoodArr = [...selectedTags.style, ...selectedTags.fit, ...targetMoods.map(m => m.mood)];
      const subMoodArr = [...selectedTags.mood, ...targetMoods.map(m => m.mood)];
      const contextArr = [...selectedTags.season, ...selectedTags.situation];
      // 최대한 다양한 조합으로 3개 생성
      while (phrases.length < 3 && attempts < 100) {
        attempts++;
        // 주요/보조/맥락 pool에서 랜덤 추출 (중복 조합 방지)
        const mainMood = mainMoodArr[Math.floor(Math.random() * mainMoodArr.length)] || '';
        let subMood = subMoodArr[Math.floor(Math.random() * subMoodArr.length)] || '';
        let context = contextArr[Math.floor(Math.random() * contextArr.length)] || '';
        // 명사 랜덤 선택
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const noun2 = nouns[Math.floor(Math.random() * nouns.length)];
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
        // --- 템플릿 랜덤 선택 (마이페이지는 26자, 띠배너는 18자) ---
        let allTemplates = copyType === 'mypage'
          ? mypageTemplates
          : ribbonTemplates;

        // context가 비어있을 경우, context를 사용하는 템플릿 제외
        if (!context) {
          const filteredTemplates = allTemplates.filter(t => !t.includes('{context}'));
          // 만약 필터링 후 사용 가능한 템플릿이 있다면 그것을 사용, 없다면 '데일리'를 기본값으로 사용
          if (filteredTemplates.length > 0) {
            allTemplates = filteredTemplates;
          } else {
            context = '데일리';
          }
        }

        let template = allTemplates[Math.floor(Math.random() * allTemplates.length)];
        // --- 단어 형태 변환 후 템플릿 치환 ---
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
        // --- 어색한 ~한로/한으로 보정 ---
        corePhrase = fixHanRo(corePhrase);
        // --- 길이 체크 ---
        if (copyType === 'mypage') {
          if (corePhrase.replace(/\s/g, '').length > 26) continue;
        } else {
          if (corePhrase.replace(/\s/g, '').length > 18 || corePhrase.replace(/\s/g, '').length < 10) continue;
        }
        if (!phrases.includes(corePhrase)) phrases.push(corePhrase);
      }
      setResult(phrases);
      setLoading(false);
    }, 600);
  };

  // 복사 버튼 (태그 제외하고 복사)
  const copyToClipboard = (text: string) => {
    const corePhrase = text.includes('\n') ? text.split('\n').slice(1).join('\n') : text;
    navigator.clipboard.writeText(corePhrase.replace(/\n/g, ' '));
    alert('클립보드에 복사되었습니다!');
  };

  // 태그 전체 초기화 함수
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
          🖼️ 배너 이미지 문구 추천
        </h2>
      </div>
      {/* 업로드 영역: 타이틀 바로 아래 */}
      <div className="mb-20">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>
          🖼️ 이미지 문구 추출하기
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
                    {styles.map(t => (
                      <label key={t} style={{ fontWeight: 500, color: '#334155', minWidth: 48, fontSize: 13, marginRight: 8, marginBottom: 2, whiteSpace: 'nowrap' }}>
                        <input type="checkbox" checked={selectedTags.style.includes(t)} onChange={() => handleTagChange('style', t)} /> {t}
                      </label>
                    ))}
                  </div>
                  <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: 4, fontSize: 15, marginTop: 10 }}>핏</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {fits.map(t => (
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
                    {moods.map(t => (
                      <label key={t} style={{ fontWeight: 500, color: '#334155', minWidth: 48, fontSize: 13, marginRight: 8, marginBottom: 2, whiteSpace: 'nowrap' }}>
                        <input type="checkbox" checked={selectedTags.mood.includes(t)} onChange={() => handleTagChange('mood', t)} /> {t}
                      </label>
                    ))}
                  </div>
                  <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4, fontSize: 15, marginTop: 10 }}>계절</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {seasons.map(t => (
                      <label key={t} style={{ fontWeight: 500, color: '#334155', minWidth: 60, fontSize: 13 }}>
                        <input type="checkbox" checked={selectedTags.season.includes(t)} onChange={() => handleTagChange('season', t)} /> {t}
                      </label>
                    ))}
                  </div>
                  <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4, fontSize: 15, marginTop: 10 }}>상황</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {situations.map(t => (
                      <label key={t} style={{ fontWeight: 500, color: '#334155', minWidth: 60, fontSize: 13 }}>
                        <input type="checkbox" checked={selectedTags.situation.includes(t)} onChange={() => handleTagChange('situation', t)} /> {t}
                      </label>
                    ))}
                  </div>
                  <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4, fontSize: 15, marginTop: 10 }}>핵심 명사</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {nouns.map(t => (
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

export default BannerCopyGenerator; 