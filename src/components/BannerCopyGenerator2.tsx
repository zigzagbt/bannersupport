// BannerCopyGenerator2.tsx (타입스크립트 + 지그재그톤 확장 + 필터링)
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

function rgbToSimpleColor([r, g, b]: number[]): string {
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

// v2(지그재그톤) 무드/상황/명사/부사/템플릿
const moods: string[] = [
  '고요한', '무심한', '따뜻한', '말랑한', '깔끔한', '세련된', '청순한', '활기찬',
  '모던한', '부드럽게 흐르는', '투명한', '가벼운',
  '여유로운', '감도 높은', '잔잔한'
];

// 상황1, 상황2 분리
const situation1: string[] = [
  '출근', '데일리', '여행', '데이트', '주말', '소풍', '약속', '휴가', '하객룩', '홈웨어'
];
const situation2: string[] = [
  '가볍게 나가는 날', '뭐 입지 고민될 때', '편하게 멋내고 싶은 날', '기분전환'
];

const situations: string[] = [...situation1, ...situation2];

const nouns: string[] = [
  '포인트', '디테일', '컬러', '분위기', '매력', '포근함', '여유', '감성',
  '소재', '느낌', '스타일', '실루엣', '톤', '무드', '라인', '핏', '감촉', '취향', '소장가치'
];

const adjToAdv: Record<string, string> = {
  '감도 높은': '감도 높게',
  '부드럽게 흐르는': '부드럽게',
  '여유로운': '여유롭게',
  '모던한': '모던하게'
};

// v2 템플릿
const templates = [
  '{mainMood_adverb} 완성하는 {context}룩',
  '{mainMood} 무드 한가득, {subMood_adverb} 마무리',
  '{mainMood} {noun}에 {subMood} {noun2} 더하기',
  '{mainMood}와 {subMood} 사이, 오늘의 {context}',
  '{mainMood_adverb} 시작해 {subMood_adverb} 마무리',
  '{mainMood} 감성, {subMood} 무드',
  '{mainMood} {noun}과 {subMood} {noun2}의 만남',
  '{context}에 어울리는 {mainMood} 컬러감',
  '일상에 스며드는 {subMood} {noun}',
  '때로는 {mainMood_adverb}, 때로는 {subMood_adverb}',
  '오늘의 {context}룩, {mainMood} {noun}으로 완성',
];

// 유사어 사전(간단 버전)
const similarWords: string[][] = [
  ['세련된', '모던한'],
  ['가벼운', '가볍게'],
  ['감도 높은', '감도 높게'],
  ['여유로운', '여유'],
  ['따뜻한', '포근함'],
  ['깔끔한', '청순한'],
  ['분위기', '무드'],
  ['감성', '느낌'],
  ['포인트', '포인트감'],
  ['스타일', '실루엣'],
  ['감촉', '촉감']
];
function isSimilar(a: string, b: string) {
  if (a === b) return true;
  return similarWords.some(group => group.includes(a) && group.includes(b));
}

// 1. 햇살 같은 등장 확률 제한용 카운터
let sunshineCount = 0;

// 명사 앞에 올 수 없는 무드(형용사) 리스트
const forbiddenMoodNounCombos = ['부드럽게 흐르는'];

// 금지 무드/명사(어떤 상황에서도 등장 금지)
const forbiddenWordsGlobal = [
  '정제된', '정제게', '정제된 무드', '딥한', '딥하게', '딥한 무드', '정제', '딥',
  '파워풀', '파워풀한', '파워풀하게', '소장가치', '절제', '절제된', '절제되게'
];

// 금지어 대체 표현 매핑
const forbiddenWordReplacements: Record<string, string> = {
  '파워풀': '강렬한',
  '파워풀한': '강렬한',
  '파워풀하게': '강렬하게',
  '소장가치': '매력',
  '절제': '세련된',
  '절제된': '세련된',
  '절제되게': '세련되게',
  '정제': '세련된',
  '정제된': '세련된',
  '정제게': '세련되게',
  '딥한': '감각적인',
  '딥하게': '감각적으로',
  '딥한 무드': '감각적인 무드',
  '정제된 무드': '세련된 무드',
};

// 문장 자연화 보정 로직
const sanitizePhrase = (phrase: string): string => {
  // 한 문장 내 같은 단어 2번 이상 금지
  if (phrase.includes('한 스푼') || phrase.includes('두 스푼') || phrase.includes('세 스푼')) return '';
  if (phrase.includes('낙한') || phrase.includes('낙 소장가치') || phrase.includes('낙낙한 소장가치')) return '';
  if (/감성 감성|감각적인 감성|감성 감각적|감각적 감성/.test(phrase)) return '';
  // 금지어가 포함된 경우 대체 표현으로 치환
  Object.entries(forbiddenWordReplacements).forEach(([bad, good]) => {
    phrase = phrase.replace(new RegExp(bad, 'g'), good);
  });
  if (forbiddenWordsGlobal.some(w => phrase.includes(w))) return '';
  // 어색한 부사형 자동 교정
  phrase = phrase.replace(/적인하게/g, '적으로').replace(/된하게/g, '되게').replace(/한하게/g, '하게');
  const words = phrase.split(/\s+/);
  const wordSet = new Set<string>();
  for (const w of words) {
    if (wordSet.has(w)) return '';
    wordSet.add(w);
  }
  return phrase
    .replace(/[.,;:!?]/g, '')
    .replace(/하객룩/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\b(고요한|무심한|따뜻한|말랑한|깔끔한|세련된|청순한|활기찬|모던한|부드럽게 흐르는|투명한|가벼운|여유로운|감도 높은|잔잔한)\b(?=.*\1)/g, '') // 중복 무드 제거
    .replace(/\b(포인트|디테일|컬러|분위기|매력|포근함|여유|감성|소재|느낌|스타일|실루엣|톤|무드|라인|핏|감촉|취향|소장가치)\b(?=.*\1)/g, '') // 중복 명사 제거
    .replace(/\s+([은는이가을를도와의에로])/g, '$1') // 조사 앞 불필요한 공백 제거
    .replace(/([가-힣]+)\1/g, '$1') // 연속 중복 단어 제거
    .replace(/([은는이가을를도와의에로])\1+/g, '$1') // 연속된 조사 제거
    .replace(/\s+/g, ' ')
    .replace(/([가-힣]+)([은는이가을를도와의에로])\s+([가-힣]+)([은는이가을를도와의에로])/g, '$1$2 $3$4') // 조사 중복 보정
    .trim();
};

// 1. 대표 색상/톤/스타일별 태그 자동 매핑 예시
const colorToTags: Record<string, {
  style: string[];
  season: string[];
  weather: string[];
  item: string[];
  tpo: string[];
}> = {
  pastel: { style: ['미니멀', '러블리'], season: ['봄', '여름'], weather: ['맑음'], item: ['니트', '셔츠'], tpo: ['데일리', '데이트'] },
  black: { style: ['모던', '오피스룩'], season: ['겨울', '가을'], weather: ['흐림', '눈'], item: ['코트', '재킷'], tpo: ['오피스'] },
  blue: { style: ['캐주얼', '스트릿'], season: ['여름'], weather: ['맑음', '흐림'], item: ['반소매', '슬리퍼'], tpo: ['캠퍼스'] },
  brown: { style: ['빈티지', '클래식'], season: ['가을', '겨울'], weather: ['흐림', '맑음'], item: ['가디건', '니트'], tpo: ['데일리', '캠퍼스'] },
  white: { style: ['미니멀', '모던'], season: ['봄', '여름'], weather: ['맑음'], item: ['셔츠', '슬리퍼'], tpo: ['데일리', '홈웨어'] },
  red: { style: ['러블리', '캐주얼'], season: ['봄', '여름'], weather: ['맑음'], item: ['원피스', '샌들'], tpo: ['데이트', '파티룩'] },
  green: { style: ['내추럴', '빈티지'], season: ['봄', '여름'], weather: ['맑음', '흐림'], item: ['니트', '가디건'], tpo: ['소풍', '캠퍼스'] },
  purple: { style: ['클래식', '모던'], season: ['가을', '겨울'], weather: ['흐림', '눈'], item: ['코트', '니트'], tpo: ['오피스'] },
  yellow: { style: ['캐주얼', '러블리'], season: ['봄', '여름'], weather: ['맑음'], item: ['셔츠', '반소매'], tpo: ['데일리', '소풍'] },
};

// 2. 태그 후보(실제 UI에서 쓸 전체 태그)
const styleTags = ['미니멀', '모던', '스트릿', '빈티지', '캐주얼', '러블리', '클래식', '오피스룩', '내추럴'];
const fitTags = ['슬림핏', '레귤러핏', '오버핏', '루즈핏', '크롭핏', '롱핏', '세미와이드', '테이퍼드', '스트레이트'];
const seasonTags = ['봄', '여름', '가을', '겨울'];
const weatherTags = ['맑음', '흐림', '눈', '비'];
const itemTags = ['니트', '셔츠', '코트', '재킷', '반소매', '슬리퍼', '가디건', '원피스', '샌들'];
const tpoTags = ['데일리', '데이트', '파티룩', '하객룩', '캠퍼스', '휴양지', '오피스', '홈웨어', '소풍'];

// 3. 이미지 업로드 시 대표 색상/톤을 분석해 태그 자동 추천/체크
function getAutoTagsFromPalette(palette: number[][]) {
  // 가장 대표적인 색상만 사용 (palette[0])
  const rgb = palette[0] || [200, 200, 200];
  let colorKey = rgbToSimpleColor(rgb);
  if (colorKey === 'gray') colorKey = 'white'; // gray는 white로 취급
  return colorToTags[colorKey] || { style: [], season: [], weather: [], item: [], tpo: [] };
}

const EXCLUDE_AUTO_TPO = ['하객룩', '휴가', '여행'];

const darkMoodCandidates = [
  '시크한', '모던한', '세련된', '고요한', '절제된', '정제된', '당당한', '감각적인', '도시적인', '차분한', '미니멀', '클래식', '포멀한', '파워풀한', '카리스마', '에지있는', '심플한', '모던시크', '딥한', '강렬한', '에센셜한'
];

// 상황2 매핑 문구
const situation2Map: Record<string, string[]> = {
  '가볍게 나가는 날': [
    '가볍고 편안한 무드', '산뜻한 하루', '데일리로 좋은', '부담 없는 스타일', '가벼운 외출에 딱', '편안한 데일리룩', '매일 입기 좋은', '자유로운 분위기', '산뜻하게 시작하는 하루'
  ],
  '뭐 입지 고민될 때': [
    '데일리로 부담 없이', '어떤 날에도 어울리는', '고민 없는 선택', '매일 입기 좋은', '쉽게 고르는 스타일', '언제나 잘 어울리는', '매일의 고민 해결', '간편한 스타일링', '고민 없는 데일리룩'
  ],
  '편하게 멋내고 싶은 날': [
    '편안함과 멋을 동시에', '꾸안꾸 스타일', '자연스러운 멋', '편하게 멋내기', '편안한 스타일링', '내추럴한 무드', '부담 없이 멋내기', '편안한 감성', '자연스러운 데일리룩'
  ],
  '기분전환': [
    '새로운 무드', '산뜻한 변화', '기분 좋은 하루', '활기찬 분위기', '기분전환에 딱', '새로운 시작', '상쾌한 하루', '변화를 주는 스타일', '기분 좋은 변신'
  ]
};

// 상황1 매핑 문구 (여행, 소풍, 휴가, 데이트, 주말)
const situation1Map: Record<string, string[]> = {
  '여행': ['새로운 풍경을 담아', '설렘 가득한 하루', '자유로운 발걸음', '낯선 곳에서의 여유', '특별한 순간을 찾아서', '일상 밖의 감성', '새로운 경험의 시작'],
  '소풍': ['산들바람 머무는 하루', '자연을 닮은 시간', '햇살 가득한 순간', '들판을 걷는 기분', '초록빛 여유', '바람 따라 걷는 하루', '싱그러운 하루의 시작'],
  '휴가': ['한가로운 오후', '느긋한 시간의 흐름', '쉼표가 있는 하루', '여유를 만끽하는 순간', '마음이 쉬어가는 시간', '편안함이 머무는 하루', '느린 호흡의 하루'],
  '데이트': ['설렘이 머무는 순간', '두근거림이 가득한 하루', '특별한 만남의 시작', '로맨틱한 분위기', '마음이 가까워지는 시간', '미소가 번지는 하루', '따뜻한 시선이 머무는 곳'],
  '주말': ['느긋한 아침', '여유로운 오후', '한 템포 쉬어가는 시간', '일상에 스며드는 여유', '소소한 행복을 누리는 하루', '편안한 쉼의 순간', '마음이 가벼워지는 날']
};

// --- 카테고리별 템플릿/문구 ---
// 향후 toneMap['감성'], toneMap['정보'], toneMap['세일']로 확장 가능
const infoTemplates = [
  '신상 입고! 한정 수량',
  '기능성 소재로 쾌적하게',
  '매일 입기 좋은 베이직 아이템',
  '베스트셀러 재입고',
  '한정판, 지금만 만나요',
  '가볍고 편안한 착용감',
  '트렌디한 디자인, 실용성까지',
  '데일리로 딱 좋은 아이템',
  '시즌 필수템',
  '소재부터 다른 퀄리티',
  '지금 바로 만나보세요',
  '매일 입고 싶은 데일리룩',
  '활동성 UP! 기능성 소재',
  '간절기 필수템',
  '여름/겨울 신상 입고',
  '{mood} 감성의 {context} 신상',
  '{context}에 어울리는 {mood} 아이템',
  '{mood} 무드, {context}룩 완성',
  '{context} 추천 {mood} 스타일',
  // 추가 정보형 문구
  '시즌 한정 신상 공개',
  '활용도 높은 베이직템',
  '트렌디한 디자인으로 완성',
  '인기 상품 재입고',
  '다양한 컬러로 선택의 폭 UP',
  '가볍고 산뜻한 착용감',
  '스타일과 실용성 모두 잡았다',
  '데일리룩의 정석',
  '편안함과 멋을 동시에',
  '매일 새로운 스타일 제안',
  '이번 시즌 강력 추천템',
  '한정 수량, 서두르세요!',
  '다양한 스타일링 가능',
  '트렌디함을 더하다',
  '매일 입고 싶은 필수템',
  '매일매일 새로운 무드',
];
const saleTemplates = [
  '오늘만 ~50% 할인',
  '시즌오프 특가 진행중',
  '쿠폰 증정 + 무료배송',
  '한정 특가, 재고 소진 시 종료',
  '타임세일! 지금이 기회',
  '최대 70% 세일',
  '이벤트 특가',
  '전상품 무료배송',
  '단 3일! 한정 세일',
  '신상 포함 할인',
  '주말 한정 특가',
  '오늘의 특가',
  '쿠폰 다운받고 추가 할인',
  '앱 전용 특가',
  '베스트셀러 할인',
  '{mood} 무드 {context} 특가',
  '{context}룩 최대 할인',
  '{mood} 감성, {context} 세일',
  '{context} 추천 특가템',
  // 추가 세일형 문구
  '오늘만 특별 할인',
  '시즌오프 파격 세일',
  '한정 수량, 재고 소진 시 종료',
  '최대 50% 할인 찬스',
  '타임세일 진행중',
  '전상품 무료배송 이벤트',
  '베스트셀러 특가',
  '신상 포함 전상품 할인',
  '쿠폰 다운받고 추가 할인',
  '앱 전용 특가 혜택',
  '주말 한정 특가',
  '오늘의 특가템',
  '단 3일! 한정 세일',
  '인기 상품 특가',
  '시즌 필수템 할인',
  '지금이 구매 찬스!',
  '놓치면 후회할 특가',
  '특별한 가격, 특별한 혜택',
  '한정 기간 할인 이벤트',
  '지금 바로 만나보세요!',
  '특가로 만나는 베스트 아이템',
  '특별 할인, 지금 바로!',
  '이달의 특가',
  '신상도 할인 중!',
  '놓치지 마세요, 한정 특가!',
  '오늘의 초특가',
  '특가 혜택을 지금 경험하세요',
  '특별한 가격으로 만나는 기회',
  '지금이 바로 득템 찬스!',
];

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
  const [autoTags, setAutoTags] = useState<{ style: string[]; season: string[]; weather: string[]; item: string[]; tpo: string[] }>({ style: [], season: [], weather: [], item: [], tpo: [] });
  const [category, setCategory] = useState<'감성' | '정보' | '세일'>('감성');

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
    // 이미지 업로드 시 태그 자동 선택은 handleImageLoad에서 처리
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

  // 대표색상별 무드 추천 고도화
  const handleImageLoad = async () => {
    if (!imgRef.current) return;
    const colorThief = new ColorThief();
    try {
      const palette: number[][] = await colorThief.getPalette(imgRef.current, 12);
      const filteredPalette = filterSimilarColors(palette, 40).slice(0, 6);
      setPalette(filteredPalette);
      // 이미지 기반 태그 자동 선택
      const auto = getAutoTagsFromPalette(filteredPalette);
      setAutoTags(auto);
      setSelectedTags(prev => ({
        ...prev,
        style: auto.style,
        fit: auto.style,
        season: auto.season,
        // mood, situation, noun, colorTone은 그대로
        mood: [],
        situation: [],
        noun: [],
        colorTone: []
      }));
      let moodPool: { color: string, mood: string }[] = [];
      const usedMoods = new Set<string>();
      const usedNeutral = new Set<string>();
      const neutralSet = new Set(['미니멀', '모던', '유니섹스', '젠더리스', '중성적인', '매니시한']);
      filteredPalette.forEach(rgb => {
        const color = rgbToSimpleColor(rgb);
        // 어두운 컬러일 때 제외할 무드
        const darkColors = ['black', 'gray'];
        const darkExcludes = ['말랑한', '햇살 같은', '부드럽게 흐르는', '가벼운', '여유로운', '따뜻한', '포근함', '러블리', '청순한'];
        let moodsForColor = moods.filter(mood => !usedMoods.has(mood));
        if (darkColors.includes(color)) {
          moodsForColor = moodsForColor.filter(mood => !darkExcludes.includes(mood));
          // 어두운 컬러 전용 무드 추가 (중복 없이)
          darkMoodCandidates.forEach(dm => {
            if (!moodsForColor.includes(dm) && !usedMoods.has(dm)) moodsForColor.push(dm);
          });
        }
        // 중성적 무드는 한 번만 등장
        const nonNeutral = moodsForColor.filter(m => !neutralSet.has(m));
        const neutral = moodsForColor.filter(m => neutralSet.has(m));
        let selected: string[] = [];
        if (nonNeutral.length > 0) {
          selected = getRandomUnique(nonNeutral, Math.min(2, nonNeutral.length));
        }
        if (neutral.length > 0 && usedNeutral.size === 0) {
          const n = getRandomUnique(neutral, 1);
          selected = selected.concat(n);
          n.forEach(m => usedNeutral.add(m));
        }
        selected.forEach(mood => {
          if (!moodPool.find(m => m.mood === mood)) {
            moodPool.push({ color, mood });
            usedMoods.add(mood);
          }
        });
      });
      setColorMoods(moodPool);
      if (moodPool.length > 0) {
        generate(moodPool, true);
      }
    } catch (e) {
      setColorMoods([{ color: "gray", mood: "감각적인" }]);
      generate([{ color: "gray", mood: "감각적인" }], true);
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
    if (adjToAdv[adj]) return adjToAdv[adj];
    if (adj.endsWith('한')) return adj.slice(0, -1) + '하게';
    if (adj.endsWith('운')) return adj.slice(0, -1) + '게';
    if (adj.endsWith('된')) return adj.slice(0, -1) + '되게';
    if (adj.endsWith('적인')) return adj.slice(0, -2) + '적으로';
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

  // 템플릿/문구 생성 고도화
  const generate = async (moods?: {color: string, mood: string}[], isAuto = false) => {
    const safeTargetMoods: { color: string; mood: string; }[] = Array.isArray(moods)
      ? moods
      : Array.isArray(colorMoods)
        ? colorMoods
        : [];
    if (!safeTargetMoods.length) return;
    setLoading(true);
    if (!isAuto) setResult([]);
    // 대표 무드/상황/색상 pool
    const moodWords = Array.from(new Set(safeTargetMoods.map(m => m.mood)));
    const colorWords = Array.from(new Set(safeTargetMoods.map(m => m.color)));
    const userSituations = selectedTags.situation;
    // 상황1은 반드시 사용자가 체크한 경우에만 포함, 상황2는 기존대로
    const userSituation1 = userSituations.filter(s => situation1.includes(s));
    const userSituation2 = userSituations.filter(s => situation2.includes(s));
    // 상황1 매핑 적용 (여행, 소풍, 휴가, 데이트, 주말만)
    let mappedSituation1: string[] = [];
    userSituation1.forEach(sit => {
      if (situation1Map[sit]) {
        const arr = situation1Map[sit];
        if (arr && arr.length > 0) {
          const pick = arr[Math.floor(Math.random() * arr.length)];
          if (!mappedSituation1.includes(pick)) mappedSituation1.push(pick);
        }
      } else {
        mappedSituation1.push(sit); // 매핑 없는 상황1은 태그명 그대로 사용
      }
    });
    // 상황2는 매핑된 문구로 치환, 여러 개 선택 시 중복 없이 하나만 사용
    let mappedSituation2: string[] = [];
    userSituation2.forEach(sit => {
      const arr = situation2Map[sit];
      if (arr && arr.length > 0) {
        const pick = arr[Math.floor(Math.random() * arr.length)];
        if (!mappedSituation2.includes(pick)) mappedSituation2.push(pick);
      }
    });
    // contextArr/contextArr2에 반영
    const contextArr = [...mappedSituation1, ...mappedSituation2];
    // --- 카테고리별 분기 ---
    if (category === '정보') {
      // 대표 무드/상황/색상 중 하나라도 포함되도록 동적 치환
      const infoFiltered = infoTemplates
        .map(t => {
          // 대표 무드/상황/색상 중 하나라도 포함되도록 동적 치환
          const mood = moodWords[0] || '';
          const context = contextArr[0] || '';
          return t.replace('{mood}', mood).replace('{context}', context);
        })
        .filter(t => t.match(/[가-힣]/));
      setResult(getRandomUnique(infoFiltered, 3));
      setLoading(false);
      return;
    }
    if (category === '세일') {
      // 대표 무드/상황/색상 키워드가 포함된 세일 템플릿만 노출
      const saleFiltered = saleTemplates
        .map(t => {
          const mood = moodWords[0] || '';
          const context = contextArr[0] || '';
          return t.replace('{mood}', mood).replace('{context}', context);
        })
        .filter(t => t.match(/[가-힣]/));
      setResult(getRandomUnique(saleFiltered, 3));
      setLoading(false);
      return;
    }
    // 감성(기존)
    setTimeout(() => {
      let phrases: string[] = [];
      let usedCombos = new Set<string>();
      let attempts = 0;
      const onlyString = (arr: any[]) => arr.filter((v): v is string => typeof v === 'string');
      // 상황 pool에서 소풍, 여행, 하객룩, 주말 등은 사용자가 직접 선택한 경우에만 포함
      const mainMoodArr = onlyString([
        ...selectedTags.style,
        ...selectedTags.fit,
        ...safeTargetMoods.map(m => typeof m.mood === 'string' ? m.mood : ''),
        ...(Array.isArray(moods) ? moods.filter(m => typeof m === 'string') : [])
      ]);
      const subMoodArr = onlyString([
        ...selectedTags.mood,
        ...safeTargetMoods.map(m => typeof m.mood === 'string' ? m.mood : ''),
        ...(Array.isArray(moods) ? moods.filter(m => typeof m === 'string') : [])
      ]);
      const contextArr2 = onlyString([
        ...selectedTags.season.length > 1 ? [selectedTags.season[Math.floor(Math.random() * selectedTags.season.length)]] : selectedTags.season,
        ...mappedSituation1,
        ...mappedSituation2
      ]);
      const forbiddenWords = ['당한'];
      // moodList는 string만 포함해야 하므로, onlyString으로 보정
      const moodList = onlyString(Array.isArray(moods) ? moods : []);
      function hasTwoAdjectives(phrase: string) {
        let count = 0;
        for (const mood of moodList) {
          if (phrase.includes(mood)) count++;
          if (count >= 2) return true;
        }
        return false;
      }
      while (phrases.length < 3 && attempts < 200) {
        attempts++;
        const mainMood = mainMoodArr[Math.floor(Math.random() * mainMoodArr.length)] || '';
        let subMood = subMoodArr[Math.floor(Math.random() * subMoodArr.length)] || '';
        let context = contextArr2[Math.floor(Math.random() * contextArr2.length)] || '';
        const nounList = nouns;
        let noun = nounList[Math.floor(Math.random() * nounList.length)];
        let noun2 = nounList[Math.floor(Math.random() * nounList.length)];
        // 명사 앞에 올 수 없는 무드 조합 방지
        if (forbiddenMoodNounCombos.some(fb => mainMood === fb || subMood === fb)) continue;
        // 금지 무드/명사 조합 방지
        if ([mainMood, subMood, context, noun, noun2].some(w => forbiddenWordsGlobal.includes(w))) continue;
        // 모두 완전히 다르고, 유사어도 겹치지 않아야 함
        const allWords = [mainMood, subMood, context, noun, noun2];
        let isAllDistinct = true;
        for (let i = 0; i < allWords.length; ++i) {
          for (let j = i + 1; j < allWords.length; ++j) {
            if (isSimilar(allWords[i], allWords[j])) {
              isAllDistinct = false;
              break;
            }
          }
          if (!isAllDistinct) break;
        }
        if (!isAllDistinct) continue;
        if (!mainMood || !subMood || !context) continue;
        let comboKey = `${mainMood}|${subMood}|${context}|${noun}|${noun2}`;
        if (usedCombos.has(comboKey)) continue;
        usedCombos.add(comboKey);
        let allTemplates = templates;
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
        corePhrase = sanitizePhrase(corePhrase);
        // 금지어 포함 문구 제외
        if (forbiddenWords.some(word => corePhrase.includes(word))) continue;
        // 형용사 두 번 반복된 문구 제외
        if (hasTwoAdjectives(corePhrase)) continue;
        if (corePhrase.length < 8 || corePhrase.length > 32) continue;
        // 중복 문구 제외 (완전 동일한 문장만)
        if (!phrases.includes(corePhrase) && corePhrase) phrases.push(corePhrase);
      }
      // 최종적으로 완전 중복 제거
      phrases = Array.from(new Set(phrases));
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
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        {onBack && (
          <button onClick={onBack} style={{ background: '#e0e7ef', color: '#2563eb', border: 'none', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginRight: 8 }}>
            ← 뒤로가기
          </button>
        )}
        <button onClick={onHome} style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
          <span role="img" aria-label="home">🏠</span> 홈
        </button>
        <h2 style={{ marginLeft: '16px', fontSize: '1.5rem', color: '#1e293b', fontWeight: 700, cursor: 'pointer' }} onClick={onHome}>
          🖼️ 배너 이미지 문구 추천
        </h2>
      </div>
      {/* 카테고리 선택 UI - moved below 태그/무드 선택, with title */}
      <div style={{ margin: '64px 0 32px 0', textAlign: 'left' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
          🏷️ 카테고리 선택
        </div>
        <label style={{ marginRight: 32, fontSize: 20, fontWeight: 700, color: category === '감성' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}>
          <input type="radio" checked={category === '감성'} onChange={() => setCategory('감성')} style={{ transform: 'scale(1.3)', marginRight: 8 }} /> 감성
        </label>
        <label style={{ marginRight: 32, fontSize: 20, fontWeight: 700, color: category === '정보' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}>
          <input type="radio" checked={category === '정보'} onChange={() => setCategory('정보')} style={{ transform: 'scale(1.3)', marginRight: 8 }} /> 정보
        </label>
        <label style={{ fontSize: 20, fontWeight: 700, color: category === '세일' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}>
          <input type="radio" checked={category === '세일'} onChange={() => setCategory('세일')} style={{ transform: 'scale(1.3)', marginRight: 8 }} /> 세일
        </label>
      </div>
      {/* 업로드 영역 */}
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
                지그재그 스타일의 문구를 추천해드려요
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
              <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: 4, fontSize: 15 }}>
                스타일
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {styleTags.map(tag => (
                  <label key={tag} style={{ fontWeight: 500, color: '#334155', minWidth: 48, fontSize: 13, marginRight: 8, marginBottom: 2, whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={selectedTags.style.includes(tag)} onChange={() => handleTagChange('style', tag)} /> {tag}
                  </label>
                ))}
              </div>
            </div>
            {/* 2컬럼: 보조 무드(분위기)+계절+상황+핵심 명사 */}
            <div>
              <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 6, fontSize: 16 }}>보조 무드</div>
              <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4, fontSize: 15 }}>분위기</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {seasonTags.map(tag => (
                  <label key={tag} style={{ fontWeight: 500, color: '#334155', minWidth: 60, fontSize: 13 }}>
                    <input type="checkbox" checked={selectedTags.season.includes(tag)} onChange={() => handleTagChange('season', tag)} /> {tag}
                  </label>
                ))}
              </div>
              {/* 상황1 */}
              <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4, fontSize: 15, marginTop: 10 }}>상황1</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {situation1.map(t => (
                  <label key={t} style={{ fontWeight: 500, color: '#334155', minWidth: 60, fontSize: 13 }}>
                    <input type="checkbox" checked={selectedTags.situation.includes(t)} onChange={() => handleTagChange('situation', t)} /> {t}
                  </label>
                ))}
              </div>
              {/* 상황2 */}
              <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4, fontSize: 15, marginTop: 10 }}>상황2</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {situation2.map(t => (
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
            <button
              onClick={resetTags}
              style={{
                background: '#f1f5f9',
                color: '#334155',
                border: 'none',
                borderRadius: 8,
                padding: '10px 0',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                marginBottom: 10,
                minWidth: 120,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              초기화
            </button>
          </div>
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