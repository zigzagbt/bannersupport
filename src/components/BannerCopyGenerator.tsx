import React, { useState, useRef, DragEvent } from "react";
// @ts-ignore
import ColorThief from "color-thief-browser";

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
    "시크한", "모던한", "고급스러운", "세련된", "강렬한", "중후한", "감각적인", "차분한"
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
};
const templates = [
  // 두 줄이 자연스럽게 이어지는 감성형 템플릿
  '{situation} {adjTail}로 시작해,\n{adjTail2}로 하루를 완성해요',
  '{adjTail}로 물든 오늘,\n{situation} {adjTail2}로 마무리',
  '{adjTail} 감성 가득 담아,\n{situation} {adjTail2}로 포인트!',
  '{situation} {adjTail}와 함께,\n{adjTail2}로 특별함을 더해요',
  '{adjTail}로 채운 하루,\n{situation} {adjTail2}로 기억해요',
  '{situation} {adjTail}로 물들고,\n{adjTail2}로 감성을 더해요',
  '{adjTail}와 {adjTail2}의 조화,\n{situation}에 어울리는 무드',
  '{situation} {adjTail}로 설레임을,\n{adjTail2}로 감각을 더해요',
  '{adjTail}로 시작하는 하루,\n{situation} {adjTail2}로 완성',
  '{situation} {adjTail}로 분위기 업,\n{adjTail2}로 감성 한 스푼',
];
function makeAdjTailPhrase(adj: string) {
  const tails = adjTails[adj] || [];
  if (tails.length === 0) return adj;
  const tail = tails[Math.floor(Math.random() * tails.length)];
  if (adj.endsWith('한') || adj.endsWith('적인')) {
    return `${adj} ${tail}`;
  }
  return `${adj}${tail}`;
}
function generateConnectedPhrase(mood1: string, mood2: string): string {
  // 두 무드(형용사)로 꼬리 조합, 상황 랜덤, 템플릿 랜덤
  const adjTail1 = makeAdjTailPhrase(mood1);
  const adjTail2 = makeAdjTailPhrase(mood2);
  const situation = situations[Math.floor(Math.random() * situations.length)];
  const template = templates[Math.floor(Math.random() * templates.length)];
  let phrase = template
    .replace(/\{adjTail\}/g, adjTail1)
    .replace(/\{adjTail2\}/g, adjTail2)
    .replace(/\{situation\}/g, situation);
  // 필터링: 반복, 어색한 꼬리, 단어만 오는 문장 등
  if (
    /([가-힣]+한)\1/.test(phrase) ||
    phrase.includes('하게하게') ||
    phrase.includes('적인하게') ||
    phrase.includes('소프트한 느낌') ||
    phrase.includes('실용적인하게')
  ) {
    return generateConnectedPhrase(mood1, mood2); // 재귀로 다시 생성
  }
  return phrase;
}

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
const seasons = ['여름', '간절기', '올시즌', '한여름', '고온용', '봄', '가을', '겨울'];
const styles = ['미니멀', '프렌치', '걸리시', '유니섹스', '베이직', '스트릿', '페미닌', '모던', '클래식'];
const moods = ['고요한', '무심한', '따뜻한', '쿨한', '말랑한', '깔끔한', '세련된', '청순한', '활기찬', '차분한', '성숙한', '경쾌한', '우아한'];
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

interface BannerCopyGeneratorProps {
  onHome: () => void;
  onBack?: () => void;
}

const BannerCopyGenerator: React.FC<BannerCopyGeneratorProps> = ({ onHome, onBack }) => {
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
  }>({ style: [], fit: [], mood: [], season: [], situation: [], colorTone: [] });

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
  };

  // 이미지에서 대표색상 4개 추출 후 각각 2~3개 무드 매핑 (중복 없이 전체 pool 생성)
  const handleImageLoad = async () => {
    if (!imgRef.current) return;
    const colorThief = new ColorThief();
    try {
      const palette: [number, number, number][] = await colorThief.getPalette(imgRef.current, 5);
      let moodPool: { color: string, mood: string }[] = [];
      let autoMoods: string[] = [];
      let autoStyles: string[] = [];
      let autoFits: string[] = [];
      let autoSeasons: string[] = [];
      palette.slice(0, 4).forEach(rgb => {
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
    return toRoot(adj) + '하게';
  }
  // 명사로 변환 (예: '따뜻한' -> '따뜻함')
  function toNoun(adj: string) {
    return toRoot(adj) + '함';
  }

  // 주요/보조/맥락 태그 기반 템플릿
  const smartTemplates = [
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
    // --- 버전 2 템플릿 ---
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

  // 조사 랜덤 선택 함수
  function randomJosa(word: string, josaGroup: string) {
    if (josaGroup === '(와/과/으랑/랑)') {
      const hasBatchim = word && word[word.length - 1].charCodeAt(0) - 44032 % 28 !== 0;
      const candidates = hasBatchim ? ['과', '으랑'] : ['와', '랑'];
      return candidates[Math.floor(Math.random() * candidates.length)];
    } else if (josaGroup === '(로/으로)') {
      const lastChar = word && word[word.length - 1];
      const code = lastChar ? lastChar.charCodeAt(0) - 44032 : 0;
      const jong = code % 28;
      if (jong === 0 || lastChar === 'ㄹ') return '로';
      return Math.random() < 0.5 ? '로' : '으로';
    }
    return '';
  }

  // ~한 뒤 명사 후보
  const hanNounCandidates = ['하루', '무드', '결', '스푼'];

  // ~한 → ~함 변환 (예외 처리)
  function hanToHamSmart(phrase: string) {
    // 1. ~한 + (명사|조사) 패턴은 변환하지 않음
    // 2. 그 외에는 ~함으로 변환
    // 조사 후보
    const josa = ['로', '으로', '에', '와', '과', '랑', '으랑', '까지', '만큼', '처럼', '보다', '부터', '까지', '밖에', '조차', '마저', '마다', '께', '께서', '에서', '에게', '한테', '더러', '밖에', '조차', '마저', '마다', '께', '께서', '에서', '에게', '한테', '더러'];
    // 명사 후보
    const noun = ['하루', '무드', '결', '스푼', '분위기', '포인트', '감성', '시간', '컬러'];
    // 정규식: ~한 + (명사|조사)
    return phrase.replace(/([가-힣]+)한(\s*)([가-힣]+|[a-zA-Z]+)/g, (m, adj, space, next) => {
      if (noun.includes(next) || josa.includes(next)) {
        return adj + '한' + space + next;
      }
      // 그 외에는 ~함
      return adj + '함' + space + next;
    }).replace(/([가-힣]+)한(?![\s가-힣a-zA-Z])/g, (m, adj) => adj + '함');
  }

  // (로/으로) 조사 앞 ~함 명사화
  function fixHamBeforeJosa(phrase: string) {
    // ~함(으)로, ~함로 등 패턴을 찾아 ~한 무드로 등으로 변경
    return phrase.replace(/([가-힣]+)함(로|으로)/g, (m, adj, josa) => {
      const noun = hanNounCandidates[Math.floor(Math.random() * hanNounCandidates.length)];
      return adj + '한 ' + noun + josa;
    });
  }

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
        // 템플릿 랜덤 선택
        let template = smartTemplates[Math.floor(Math.random() * smartTemplates.length)];
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
        // 핵심 문구의 글자수만으로 필터링
        const maxLen = copyType === 'mypage' ? 26 : 18;
        const plain = corePhrase.replace(/\n/g, '');
        if (plain.length <= maxLen && plain.length >= 10) {
          if (!phrases.includes(corePhrase)) phrases.push(corePhrase);
        }
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
    setSelectedTags({ style: [], fit: [], mood: [], season: [], situation: [], colorTone: [] });
  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: "32px auto", background: '#fff', boxShadow: '0 2px 16px #e0e7ef', borderRadius: 18, padding: 32 }}>
      <div className="flex" style={{ alignItems: 'center', marginBottom: '20px' }}>
        {onBack && (
          <button className="btn btn-secondary" onClick={onBack}>
            ← 뒤로가기
          </button>
        )}
        <button className="btn-home" onClick={onHome}>
          🏠 홈
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 0, color: '#1e293b', textAlign: 'center', marginLeft: 20 }}>
          🖼️ 배너 이미지 문구 생성기 <span style={{ fontSize: 15, color: '#3b82f6', fontWeight: 500 }}>(무료버전)</span>
        </h1>
      </div>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive ? '2px solid #3b82f6' : '2px dashed #cbd5e1',
          borderRadius: 14,
          background: dragActive ? '#e0e7ef' : '#f8fafc',
          padding: 32,
          textAlign: 'center',
          marginBottom: 18,
          cursor: 'pointer',
          transition: 'background 0.2s, border 0.2s',
        }}
        onClick={() => document.getElementById('banner-img-upload')?.click()}
      >
        <input
          id="banner-img-upload"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
        <div style={{ color: '#64748b', fontSize: 16, marginBottom: 8 }}>
          이미지를 <b>드래그</b>하거나 <b>클릭</b>해서 업로드하세요
        </div>
        <div style={{ fontSize: 32, marginBottom: 4 }}>⬆️</div>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>
          (JPG, PNG 등 지원, 최대 1장)
        </div>
      </div>
      {previewUrl && (
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <img
            ref={imgRef}
            src={previewUrl}
            alt="preview"
            crossOrigin="anonymous"
            onLoad={handleImageLoad}
            style={{ borderRadius: 12, boxShadow: "0 2px 8px #e0e7ef", maxWidth: "100%", maxHeight: 220, margin: '0 auto', display: 'block' }}
          />
        </div>
      )}
      {colorMoods.length > 0 && (
        <div style={{ marginBottom: 12, color: '#64748b', fontSize: 15, textAlign: 'center' }}>
          {colorMoods.map((cm, i) => (
            <div key={i}>
              대표 색상 {i+1}: <b>{cm.color}</b> / 추출 무드: <b>{cm.mood}</b>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginBottom: 18, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>배너 태그 선택</div>
          <button onClick={resetTags} style={{ background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>초기화</button>
        </div>
        {/* 주요 무드(스타일/핏) */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, minWidth: 180, flex: 1 }}>
            <div style={{ fontWeight: 500, color: '#3b82f6', marginBottom: 6 }}>주요 무드(스타일)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {styles.map(t => (
                <label key={t} style={{ marginRight: 8, fontWeight: 500, color: '#334155', minWidth: 70 }}>
                  <input type="checkbox" checked={selectedTags.style.includes(t)} onChange={() => handleTagChange('style', t)} /> {t}
                </label>
              ))}
            </div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, minWidth: 180, flex: 1 }}>
            <div style={{ fontWeight: 500, color: '#3b82f6', marginBottom: 6 }}>주요 무드(핏)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {fits.map(t => (
                <label key={t} style={{ marginRight: 8, fontWeight: 500, color: '#334155', minWidth: 70 }}>
                  <input type="checkbox" checked={selectedTags.fit.includes(t)} onChange={() => handleTagChange('fit', t)} /> {t}
                </label>
              ))}
            </div>
          </div>
        </div>
        {/* 보조 분위기 */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 500, color: '#3b82f6', marginBottom: 6 }}>보조 분위기</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {moods.map(t => (
              <label key={t} style={{ marginRight: 8, fontWeight: 500, color: '#334155', minWidth: 70 }}>
                <input type="checkbox" checked={selectedTags.mood.includes(t)} onChange={() => handleTagChange('mood', t)} /> {t}
              </label>
            ))}
          </div>
        </div>
        {/* 착용 맥락(계절/상황) */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, minWidth: 180, flex: 1 }}>
            <div style={{ fontWeight: 500, color: '#3b82f6', marginBottom: 6 }}>계절</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {seasons.map(t => (
                <label key={t} style={{ marginRight: 8, fontWeight: 500, color: '#334155', minWidth: 70 }}>
                  <input type="checkbox" checked={selectedTags.season.includes(t)} onChange={() => handleTagChange('season', t)} /> {t}
                </label>
              ))}
            </div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, minWidth: 180, flex: 1 }}>
            <div style={{ fontWeight: 500, color: '#3b82f6', marginBottom: 6 }}>상황</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {situations.map(t => (
                <label key={t} style={{ marginRight: 8, fontWeight: 500, color: '#334155', minWidth: 70 }}>
                  <input type="checkbox" checked={selectedTags.situation.includes(t)} onChange={() => handleTagChange('situation', t)} /> {t}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, minWidth: 180, flex: 1 }}>
          <div style={{ fontWeight: 500, color: '#3b82f6', marginBottom: 6 }}>핵심 명사</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {nouns.map(t => (
              <label key={t} style={{ marginRight: 8, fontWeight: 500, color: '#334155', minWidth: 70 }}>
                <input type="checkbox" checked={false} onChange={() => {}} /> {t}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", margin: "16px 0", justifyContent: 'center' }}>
        <label style={{ fontWeight: 500, color: '#1e293b' }}>
          <input
            type="radio"
            checked={copyType === "mypage"}
            onChange={() => setCopyType("mypage")}
            style={{ marginRight: 6 }}
          />
          마이페이지 배너 (13자×2줄)
        </label>
        <label style={{ fontWeight: 500, color: '#1e293b' }}>
          <input
            type="radio"
            checked={copyType === "ribbon"}
            onChange={() => setCopyType("ribbon")}
            style={{ marginRight: 6 }}
          />
          띠배너 (18자 1줄)
        </label>
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
          padding: "12px 32px",
          fontSize: 16,
          border: "none",
          cursor: loading || !image || !colorMoods.length ? "not-allowed" : "pointer",
          marginBottom: 18,
          width: '100%'
        }}
      >
        {loading ? "문구 생성 중..." : "새로운 문구 추천받기"}
      </button>
      {loading && (
        <div style={{ textAlign: "center", margin: "16px 0", color: "#64748b" }}>
          문구 생성 중입니다... 잠시만 기다려주세요.
        </div>
      )}
      {result.length > 0 && (
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 18, marginTop: 10 }}>
          {result.map((line, i) => (
            <div key={i} className="card" style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 6px #e0e7ef', marginBottom: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ whiteSpace: "pre-line", fontSize: 15, color: '#1e293b', fontWeight: 500 }}>{line}</div>
              <button className="btn btn-secondary" style={{ fontSize: '0.95rem', padding: '6px 14px', borderRadius: 7, background: '#e0e7ef', color: '#2563eb', fontWeight: 600, border: 'none', cursor: 'pointer' }} onClick={() => copyToClipboard(line)}>
                복사
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCopyGenerator; 